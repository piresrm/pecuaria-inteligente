import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createContext, Script } from 'node:vm';
import ts from 'typescript';
import { expect, test } from 'vitest';
import resumo from '../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json' with { type: 'json' };

// Executa o grafo real em um contexto sem Node e sem compilação dinâmica.
function loadBrowser() {
  const context = createContext({}, { codeGeneration: { strings: false, wasm: false } });
  const cache = new Map<string, Record<string, unknown>>();
  function load(path: string): Record<string, unknown> {
    const previous = cache.get(path);
    if (previous) return previous;
    const exports: Record<string, unknown> = {};
    cache.set(path, exports);
    const source = readFileSync(path, 'utf8');
    const js = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const factory = new Script(`(function(exports, require) { ${js}\n})`, {
      filename: path,
    }).runInContext(context) as (
      exports: Record<string, unknown>,
      require: (name: string) => Record<string, unknown>,
    ) => void;
    factory(exports, (name) => {
      if (!name.startsWith('.')) throw new Error(`Dependência externa no browser: ${name}`);
      return load(resolve(dirname(path), name.replace(/\.js$/u, '.ts')));
    });
    return exports;
  }
  const api = load(
    resolve(import.meta.dirname, 'browser.ts'),
  ) as unknown as typeof import('./browser.js');
  function input(value: unknown): unknown {
    context.input = JSON.stringify(value);
    return new Script('JSON.parse(input)').runInContext(context) as unknown;
  }
  return { api, input };
}

test('browser valida e serializa sem Node, TypeBox ou compilação dinâmica', () => {
  const { api, input } = loadBrowser();
  const value = input(resumo);
  expect(api.validators.Resumo(value)).toBe(true);
  expect(() => api.assertResumo(value)).not.toThrow();
  expect(api.canonicalJson(input({ b: 1, a: 'à' }))).toBe('{"a":"à","b":1}');
  expect(() => api.assertResumo(input({ ...resumo, desconhecido: true }))).toThrow();
});
