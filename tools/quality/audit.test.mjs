import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateAudit, findingFingerprint } from './audit.mjs';

let directory;
afterEach(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = undefined;
});
async function fixture({
  raw = {
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
    vulnerabilities: {},
  },
  exceptions = [],
  date = '2026-10-11',
} = {}) {
  directory = await mkdtemp(join(tmpdir(), 'pi-audit-'));
  const rawPath = join(directory, 'npm-audit.json');
  const exceptionsPath = join(directory, 'excecoes.json');
  await writeFile(rawPath, typeof raw === 'string' ? raw : JSON.stringify(raw));
  await writeFile(exceptionsPath, JSON.stringify(exceptions));
  return { rawPath, exceptionsPath, date };
}
const finding = (overrides = {}) => ({
  name: 'sample-package',
  severity: 'high',
  isDirect: false,
  via: [
    {
      source: 123,
      name: 'sample-package',
      dependency: 'sample-package',
      title: 'GHSA-test-0000-0000',
      url: 'https://example.test/advisory',
      range: '<1.0.0',
    },
  ],
  effects: [],
  range: '<1.0.0',
  nodes: [{ name: 'sample-package', version: '0.9.0', path: 'node_modules/sample-package' }],
  ...overrides,
});
const report = (vulnerabilities) => ({
  metadata: { vulnerabilities },
  vulnerabilities: vulnerabilities.total ? { 'sample-package': finding() } : {},
});

describe('evaluateAudit', () => {
  it('rejeita JSON bruto inválido', async () => {
    const paths = await fixture({ raw: '{' });
    assert.throws(() => evaluateAudit(paths), /JSON/i);
  });
  it('rejeita ausência de inventário de vulnerabilidades', async () => {
    const paths = await fixture({ raw: { metadata: {} } });
    assert.throws(() => evaluateAudit(paths), /inventário/i);
  });
  it('rejeita inventário inconsistente entre metadados e achados', async () => {
    const paths = await fixture({
      raw: {
        metadata: {
          vulnerabilities: { high: 0, critical: 0, moderate: 0, low: 0, info: 0, total: 0 },
        },
        vulnerabilities: { 'sample-package': finding() },
      },
    });
    assert.throws(() => evaluateAudit(paths), /inconsistente/i);
  });
  it('bloqueia achado alto não previsto', async () => {
    const paths = await fixture({
      raw: report({ high: 1, critical: 0, moderate: 0, low: 0, info: 0, total: 1 }),
    });
    assert.throws(() => evaluateAudit(paths), /sem exceção/i);
  });
  it('aceita exceção exata vigente e rejeita trecho alterado', async () => {
    const raw = report({ high: 1, critical: 0, moderate: 0, low: 0, info: 0, total: 1 });
    const rawFinding = {
      advisory: 'GHSA-test-0000-0000',
      packageName: 'sample-package',
      version: '0.9.0',
      path: 'node_modules/sample-package',
      title: 'GHSA-test-0000-0000',
      url: 'https://example.test/advisory',
      range: '<1.0.0',
      severity: 'high',
    };
    const good = {
      id: 'GHSA-test-0000-0000',
      pacote: 'sample-package',
      versao: '0.9.0',
      caminho: 'node_modules/sample-package',
      motivo: 'Avaliação de alcance registrada.',
      evidencia: 'https://example.test/evidence',
      revisor: 'equipe',
      expiraEm: '2026-12-01',
      sha256Trecho: findingFingerprint(rawFinding),
    };
    const paths = await fixture({ raw, exceptions: [good] });
    assert.equal(evaluateAudit(paths).aprovado, true);
    await writeFile(
      paths.exceptionsPath,
      JSON.stringify([{ ...good, sha256Trecho: '0'.repeat(64) }]),
    );
    assert.throws(() => evaluateAudit(paths), /diverge/i);
  });
  it('rejeita exceção vencida', async () => {
    const paths = await fixture({
      raw: report({ high: 1, critical: 0, moderate: 0, low: 0, info: 0, total: 1 }),
      date: '2026-10-11',
      exceptions: [
        {
          id: 'GHSA-test-0000-0000',
          pacote: 'sample-package',
          versao: '0.9.0',
          caminho: 'node_modules/sample-package',
          motivo: 'motivo',
          evidencia: 'evidencia',
          revisor: 'equipe',
          expiraEm: '2026-10-10',
          sha256Trecho: '3b5d5c3712955042212316173ccf37be8003c6f81be2b000b172e58e2c5c6d8c',
        },
      ],
    });
    assert.throws(() => evaluateAudit(paths), /vencida/i);
  });
  it('preserva e rejeita código bruto não zero mesmo com JSON sem achados', async () => {
    const paths = await fixture();
    assert.throws(() => evaluateAudit({ ...paths, rawExitCode: 1 }), /código bruto/i);
  });
});
