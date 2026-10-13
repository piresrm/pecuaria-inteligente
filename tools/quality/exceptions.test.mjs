import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateAudit, findingFingerprint as auditFingerprint } from './audit.mjs';
import { classifyExceptions, readExceptionGroups } from './exceptions.mjs';
import { evaluateSemgrep, findingFingerprint as semgrepFingerprint } from '../semgrep/avaliar.mjs';

let directory;
afterEach(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = undefined;
});

const auditException = {
  id: 'GHSA-test-0000-0000',
  pacote: 'sample-package',
  versao: '1.0.0',
  caminho: 'node_modules/sample-package',
  motivo: 'motivo',
  evidencia: 'evidencia',
  revisor: 'equipe',
  expiraEm: '2026-12-01',
  sha256Trecho: 'a'.repeat(64),
};
const semgrepException = {
  regraId: 'pi-test-rule',
  caminho: 'apps/test.ts',
  sha256Trecho: 'b'.repeat(64),
  motivo: 'motivo',
  evidencia: 'evidencia',
  revisor: 'equipe',
  expiraEm: '2026-12-01',
};

async function writeGlobal(entries) {
  directory = await mkdtemp(join(tmpdir(), 'pi-exceptions-'));
  const exceptionsPath = join(directory, 'excecoes.json');
  await writeFile(exceptionsPath, JSON.stringify(entries));
  return { directory, exceptionsPath };
}

describe('exceções globais', () => {
  it('separa a lista mista conforme os dois schemas aprovados', () => {
    assert.deepEqual(classifyExceptions([auditException, semgrepException]), {
      audit: [auditException],
      semgrep: [semgrepException],
    });
  });

  it('rejeita entrada ambígua ou sem schema conhecido', () => {
    assert.throws(
      () => classifyExceptions([{ ...auditException, regraId: 'pi-test-rule' }]),
      /ambígua/i,
    );
    assert.throws(() => classifyExceptions([{ observacao: 'ignorada?' }]), /discriminador/i);
  });

  it('rejeita campos extras e registros incompletos em qualquer grupo', () => {
    assert.throws(
      () => classifyExceptions([{ ...auditException, ignorado: true }]),
      /campos não permitidos/i,
    );
    const incompleta = { ...semgrepException };
    delete incompleta.regraId;
    assert.throws(() => classifyExceptions([incompleta]), /discriminador/i);
    assert.throws(
      () => classifyExceptions([{ ...auditException, evidencia: '' }]),
      /campos obrigatórios/i,
    );
    assert.throws(
      () => classifyExceptions([{ ...auditException, expiraEm: '2026-02-31' }]),
      /data de expiração/i,
    );
  });

  it('cada avaliador aplica somente sua exceção numa lista global mista válida', async () => {
    const auditFinding = {
      advisory: 'GHSA-test-0000-0000',
      packageName: 'sample-package',
      version: '1.0.0',
      path: 'node_modules/sample-package',
      title: 'GHSA-test-0000-0000',
      url: 'https://example.test/advisory',
      range: '<2.0.0',
      severity: 'high',
    };
    const auditExceptionWithFingerprint = {
      ...auditException,
      sha256Trecho: auditFingerprint(auditFinding),
    };
    const semgrepFinding = {
      check_id: 'pi-test-rule',
      path: '/src/apps/test.ts',
      start: { line: 2 },
      extra: { lines: 'unsafe();' },
    };
    const semgrepExceptionWithFingerprint = {
      ...semgrepException,
      sha256Trecho: semgrepFingerprint(semgrepFinding),
    };
    const { directory, exceptionsPath } = await writeGlobal([
      auditExceptionWithFingerprint,
      semgrepExceptionWithFingerprint,
    ]);

    const auditRawPath = join(directory, 'npm-audit.json');
    await writeFile(
      auditRawPath,
      JSON.stringify({
        metadata: {
          vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 },
        },
        vulnerabilities: {
          'sample-package': {
            name: 'sample-package',
            severity: 'high',
            isDirect: false,
            via: [
              {
                source: 123,
                title: 'GHSA-test-0000-0000',
                url: 'https://example.test/advisory',
                range: '<2.0.0',
              },
            ],
            nodes: [
              {
                name: 'sample-package',
                version: '1.0.0',
                path: 'node_modules/sample-package',
              },
            ],
          },
        },
      }),
    );
    assert.equal(evaluateAudit({ rawPath: auditRawPath, exceptionsPath }).excecoesAplicadas, 1);

    const semgrepRawPath = join(directory, 'semgrep.json');
    await writeFile(
      semgrepRawPath,
      JSON.stringify({
        results: [semgrepFinding],
        errors: [],
        paths: { scanned: ['/src/apps/test.ts'] },
      }),
    );
    const exceptions = readExceptionGroups(exceptionsPath).semgrep;
    assert.equal(exceptions.length, 1);
    assert.equal(
      evaluateSemgrep({
        rawPath: semgrepRawPath,
        expectedTargets: ['apps/test.ts'],
        exceptions,
        rawExitCode: 1,
      }).excecoesAplicadas,
      1,
    );
    const unexpectedRawPath = join(directory, 'semgrep-achado-extra.json');
    await writeFile(
      unexpectedRawPath,
      JSON.stringify({
        results: [semgrepFinding, { ...semgrepFinding, check_id: 'pi-unexpected-rule' }],
        errors: [],
        paths: { scanned: ['/src/apps/test.ts'] },
      }),
    );
    assert.throws(
      () =>
        evaluateSemgrep({
          rawPath: unexpectedRawPath,
          expectedTargets: ['apps/test.ts'],
          exceptions,
          rawExitCode: 1,
        }),
      /sem exceção válida/i,
    );
  });
});
