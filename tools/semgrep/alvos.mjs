import { spawnSync } from 'node:child_process';

const extensions = /\.(?:cjs|js|jsx|mjs|ts|tsx|yaml|yml)$/i;
const roots = ['.github/workflows', 'apps', 'infra', 'packages', 'tests', 'tools'];
const rootConfigs = new Set(['eslint.config.mjs', 'vitest.config.ts', 'playwright.config.ts']);

export function listScanTargets(root) {
  const result = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`git ls-files falhou: ${result.stderr}`);
  const targets = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((path) => {
      if (
        !roots.some((directory) => path === directory || path.startsWith(`${directory}/`)) &&
        !rootConfigs.has(path)
      )
        return false;
      if (
        /(?:^|\/)(?:node_modules|dist|generated|artifacts|coverage|\.cache|\.local|\.git|\.worktrees|worktrees)(?:\/|$)/.test(
          path,
        )
      )
        return false;
      const filename = path.slice(path.lastIndexOf('/') + 1);
      return extensions.test(filename) || /^Dockerfile(?:\..+)?$/i.test(filename);
    })
    .sort();
  if (!targets.length) throw new Error('inventário de alvos Semgrep vazio');
  return targets;
}

export const isScanTarget = (path) =>
  extensions.test(path.slice(path.lastIndexOf('/') + 1)) ||
  /^Dockerfile(?:\..+)?$/i.test(path.slice(path.lastIndexOf('/') + 1));
