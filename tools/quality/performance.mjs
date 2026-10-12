import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const webDist = resolve(import.meta.dirname, '../../apps/web/dist');
const essentialLimit = 100 * 1024;
const chartLimit = 60 * 1024;

function total(files) {
  return files.reduce((sum, item) => sum + item.transferredBytes, 0);
}

export function summarizePerformance({ revision, bundle, timings = [], api = null }) {
  const budget = (bytes, limit) => ({
    bytes,
    limitBytes: limit,
    status: bytes <= limit ? 'pass' : 'fail',
  });
  return {
    revision,
    budgets: {
      essential: budget(bundle.essentialBytes, essentialLimit),
      chartAdditional: budget(bundle.chartAdditionalBytes, chartLimit),
    },
    acceptance: {
      performance: timings.length
        ? { status: 'measured', runs: timings }
        : { status: 'unmeasured' },
      api: api ? { status: 'measured', ...api } : { status: 'unmeasured' },
    },
  };
}

function filesFor(manifest, key, visited = new Set()) {
  if (visited.has(key)) return new Set();
  visited.add(key);
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Chunk ausente: ${key}`);
  return new Set([
    chunk.file,
    ...(chunk.css ?? []),
    ...(chunk.assets ?? []),
    ...(chunk.imports ?? []).flatMap((item) => [...filesFor(manifest, item, visited)]),
  ]);
}

async function sizes(files) {
  return Promise.all(
    [...files].sort().map(async (file) => {
      const bytes = await readFile(resolve(webDist, file));
      const transferredBytes = /\.(?:js|css|html)$/u.test(file)
        ? gzipSync(bytes).length
        : bytes.length;
      return { file, bytes: bytes.length, transferredBytes };
    }),
  );
}

export async function measureBundle() {
  const manifest = JSON.parse(await readFile(resolve(webDist, '.vite/manifest.json'), 'utf8'));
  const entry = Object.keys(manifest).find((key) => manifest[key].isEntry);
  const chart = Object.keys(manifest).find((key) => key.endsWith('/chart/HistoryChart.tsx'));
  if (!entry || !chart) throw new Error('Entradas essencial/gráfico ausentes no manifesto Vite.');
  const essentialFiles = filesFor(manifest, entry);
  essentialFiles.add('index.html');
  const chartFiles = new Set(
    [...filesFor(manifest, chart)].filter((file) => !essentialFiles.has(file)),
  );
  const essential = await sizes(essentialFiles);
  const chartAdditional = await sizes(chartFiles);
  return {
    essentialFiles: essential,
    chartFiles: chartAdditional,
    essentialBytes: total(essential),
    chartAdditionalBytes: total(chartAdditional),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = summarizePerformance({
    revision: process.env.GIT_REVISION ?? 'unknown',
    bundle: await measureBundle(),
  });
  await mkdir(resolve(import.meta.dirname, '../../artifacts'), { recursive: true });
  await writeFile(
    resolve(import.meta.dirname, '../../artifacts/performance-v0.1.json'),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  if (Object.values(result.budgets).some((item) => item.status === 'fail')) process.exitCode = 1;
}
