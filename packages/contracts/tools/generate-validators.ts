import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import standalone from 'ajv/dist/standalone/index.js';
import { createAjv } from '../src/compiler.js';
import { contractSchema, definitions } from '../src/schemas.js';

const require = createRequire(import.meta.url);
const ajv = createAjv({ source: true, esm: true, lines: true });
ajv.addSchema(contractSchema);
const mapping = Object.fromEntries(
  Object.keys(definitions).map((name) => [name, `${contractSchema.$id}#/definitions/${name}`]),
);
let generated = standalone.default(ajv, mapping);

// Ajv emite auxiliares puros em CommonJS. Incorporá-los elimina dependências
// de execução no browser sem trocar os formatos completos por aproximações próprias.
const helpers = [
  {
    expression: 'require("ajv-formats/dist/formats").fullFormats',
    module: 'ajv-formats/dist/formats.js',
    symbol: 'fullFormats',
    exportName: 'fullFormats',
    license: 'ajv-formats/LICENSE',
  },
  {
    expression: 'require("ajv/dist/runtime/equal").default',
    module: 'fast-deep-equal/index.js',
    symbol: 'equalHelper',
    exportName: 'default',
    license: 'fast-deep-equal/LICENSE',
  },
  {
    expression: 'require("ajv/dist/runtime/ucs2length").default',
    module: 'ajv/dist/runtime/ucs2length.js',
    symbol: 'ucs2lengthHelper',
    exportName: 'default',
    license: 'ajv/LICENSE',
  },
];
let prelude = '// @ts-nocheck\n// Gerado por tools/generate-validators.ts. Não editar.\n';
for (const helper of helpers) {
  if (!generated.includes(helper.expression)) continue;
  const source = (await readFile(require.resolve(helper.module), 'utf8'))
    .replace(/^\/\/# sourceMappingURL=.*$/gm, '')
    .replace(/^ucs2length\.code = .*$/gm, '')
    .replace('module.exports =', 'exports.default =');
  if (/\brequire\s*\(|\bimport\s|\bmodule\./u.test(source))
    throw new Error(`Auxiliar deixou de ser autocontido: ${helper.module}`);
  const license = await readFile(require.resolve(helper.license), 'utf8');
  prelude += `/* ${helper.module}\n${license} */\nconst ${helper.symbol} = (() => { const exports = {};\n${source}\nreturn exports.${helper.exportName}; })();\n`;
  generated = generated.replaceAll(helper.expression, helper.symbol);
}
if (/\brequire\s*\(|\beval\s*\(|\bnew Function\s*\(/u.test(generated))
  throw new Error('Validador gerado contém dependência dinâmica inesperada');
const directory = join(dirname(import.meta.dirname), 'src/generated');
await mkdir(directory, { recursive: true });
await writeFile(join(directory, 'validators.ts'), prelude + generated + '\n');
console.log(`Gerados ${Object.keys(definitions).length} validadores Draft 7 autocontidos.`);
