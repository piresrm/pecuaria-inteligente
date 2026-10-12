import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const directory = resolve(import.meta.dirname, '../../apps/web/dist');
const manifest = JSON.parse(await readFile(resolve(directory, '.vite/manifest.json'), 'utf8'));
const entry = Object.keys(manifest).find((key) => manifest[key].isEntry);
const chart = Object.keys(manifest).find((key) => key.endsWith('/chart/HistoryChart.tsx'));
if (!entry || !chart) throw new Error('Entradas essencial/gráfico ausentes no manifesto Vite.');
function assets(key, visited = new Set()) {
  if (visited.has(key)) return new Set();
  visited.add(key);
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Chunk ausente: ${key}`);
  return new Set([
    chunk.file,
    ...(chunk.css ?? []),
    ...(chunk.assets ?? []),
    ...(chunk.imports ?? []).flatMap((dependency) => [...assets(dependency, visited)]),
  ]);
}
async function sizes(files) {
  return Promise.all(
    [...files].sort().map(async (file) => {
      const bytes = await readFile(resolve(directory, file));
      const compressed = /\.(?:js|css|html)$/u.test(file) ? gzipSync(bytes).length : bytes.length;
      return { file, bytes: bytes.length, transferredBytes: compressed };
    }),
  );
}
const essentialFiles = assets(entry);
essentialFiles.add('index.html');
const chartFiles = new Set([...assets(chart)].filter((file) => !essentialFiles.has(file)));
const essential = await sizes(essentialFiles);
const chartAdditional = await sizes(chartFiles);
const total = (files) => files.reduce((sum, file) => sum + file.transferredBytes, 0);
const result = {
  compression: 'gzip (Node zlib default)',
  essential: { files: essential, bytes: total(essential), limitBytes: 100 * 1024 },
  chartAdditional: { files: chartAdditional, bytes: total(chartAdditional), limitBytes: 60 * 1024 },
};
console.log(JSON.stringify(result, null, 2));
if (
  result.essential.bytes > result.essential.limitBytes ||
  result.chartAdditional.bytes > result.chartAdditional.limitBytes
)
  process.exitCode = 1;
