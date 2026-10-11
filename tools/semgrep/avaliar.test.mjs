import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateSemgrep, findingFingerprint, verifyPinnedContent } from './avaliar.mjs';

const directory = await mkdtemp(join(tmpdir(), 'pi-semgrep-audit-'));
after(async () => rm(directory, { recursive: true, force: true }));
const result = {
  check_id: 'pi-test-rule',
  path: '/src/apps/test.ts',
  start: { line: 2 },
  extra: { lines: 'unsafe();' },
};
async function report({ results = [], scanned = ['/src/apps/test.ts'], errors = [] } = {}) {
  const path = join(directory, `${Math.random()}.json`);
  await writeFile(path, JSON.stringify({ results, paths: { scanned }, errors }));
  return path;
}

describe('evaluateSemgrep', () => {
  it('rejeita JSON bruto inválido', async () => {
    const path = join(directory, 'invalid.json');
    await writeFile(path, '{');
    assert.throws(
      () => evaluateSemgrep({ rawPath: path, expectedTargets: [] }),
      /JSON Semgrep inválido/i,
    );
  });
  it('rejeita alvo ignorado ou ausente do inventário analisado', async () => {
    const rawPath = await report({ scanned: [] });
    assert.throws(
      () => evaluateSemgrep({ rawPath, expectedTargets: ['apps/test.ts'] }),
      /ignorados/i,
    );
  });
  it('rejeita hash fixado divergente', () => {
    assert.throws(
      () => verifyPinnedContent(Buffer.from('rule: true'), '0'.repeat(64)),
      /hash divergente/i,
    );
  });
  it('rejeita achado sem exceção prevista', async () => {
    const rawPath = await report({ results: [result] });
    assert.throws(
      () => evaluateSemgrep({ rawPath, expectedTargets: ['apps/test.ts'], rawExitCode: 1 }),
      /sem exceção válida/i,
    );
  });
  it('rejeita código de execução bruto não zero mesmo com JSON vazio', async () => {
    const rawPath = await report({ scanned: [] });
    assert.throws(
      () => evaluateSemgrep({ rawPath, expectedTargets: [], rawExitCode: 2 }),
      /código bruto de execução/i,
    );
  });
  it('aceita apenas exceção válida e vinculada ao trecho exato', async () => {
    const rawPath = await report({ results: [result] });
    const exception = {
      regraId: 'pi-test-rule',
      caminho: 'apps/test.ts',
      sha256Trecho: findingFingerprint(result),
      motivo: 'revisão delimitada',
      evidencia: 'documento',
      revisor: 'equipe',
      expiraEm: '2026-12-01',
    };
    assert.equal(
      evaluateSemgrep({
        rawPath,
        expectedTargets: ['apps/test.ts'],
        exceptions: [exception],
        rawExitCode: 1,
      }).excecoesAplicadas,
      1,
    );
    assert.throws(
      () =>
        evaluateSemgrep({
          rawPath,
          expectedTargets: ['apps/test.ts'],
          exceptions: [
            { ...exception, sha256Trecho: createHash('sha256').update('changed').digest('hex') },
          ],
          rawExitCode: 1,
        }),
      /hash da exceção/i,
    );
  });
});
