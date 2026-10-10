import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
const raiz = new URL('../../../', import.meta.url);
const script = new URL('tools/quality/check-data.mjs', raiz);
const executar = (dir?: string) =>
  execFileSync(process.execPath, [script.pathname, ...(dir ? [dir] : [])], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
function adulterar(
  arquivo: string,
  mudar: (texto: string) => string,
  mensagem: string,
  atualizarHash = true,
) {
  const dir = mkdtempSync(join(tmpdir(), 'pecuaria-base-teste-'));
  try {
    cpSync(new URL('data/demonstrativa/v0.1/', raiz), dir, { recursive: true });
    const texto = mudar(readFileSync(join(dir, arquivo), 'utf8'));
    writeFileSync(join(dir, arquivo), texto);
    if (atualizarHash) {
      const sumas = readFileSync(join(dir, 'SHA256SUMS'), 'utf8')
        .split('\n')
        .map((linha) =>
          linha.endsWith(`  ${arquivo}`)
            ? `${createHash('sha256').update(texto).digest('hex')}  ${arquivo}`
            : linha,
        )
        .join('\n');
      writeFileSync(join(dir, 'SHA256SUMS'), sumas);
    }
    expect(() => executar(dir)).toThrow(mensagem);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
it('confere seis hashes, receita integral, calendário, território e nove cenários originais', () => {
  expect(executar()).toContain('4146 preços; 94 lacunas; 246 municípios; 9 cenários; 6 hashes');
});
it('rejeita alteração sem novo hash', () =>
  adulterar('precos.csv', (t) => t.replace('3417.59', '3417.58'), 'SHA-256', false));
it('rejeita receita divergente mesmo com hash atualizado', () =>
  adulterar('precos.csv', (t) => t.replace('3417.59', '3417.58'), 'Receita'));
it('rejeita resultado de cenário divergente mesmo com hash atualizado', () =>
  adulterar('cenarios.json', (t) => t.replace('3368.75', '3368.74'), 'Cenário'));
it('rejeita código municipal repetido mesmo com hash atualizado', () =>
  adulterar('regioes.json', (t) => t.replace('5201405', '5200050'), 'Municípios'));
