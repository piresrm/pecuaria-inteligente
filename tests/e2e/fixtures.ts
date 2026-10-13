import { test as base, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
export const test = base.extend({
  context: async ({ playwright, browser, browserName, baseURL }, use) => {
    const profile = await mkdtemp(join(tmpdir(), 'pecuaria-profile-'));
    if (browserName === 'firefox') {
      execFileSync('certutil', ['-N', '--empty-password', '-d', `sql:${profile}`]);
      execFileSync('certutil', [
        '-A',
        '-d',
        `sql:${profile}`,
        '-n',
        'Pecuaria teste',
        '-t',
        'C,,',
        '-i',
        '/trust/root.crt',
      ]);
    }
    const context = await playwright[browserName].launchPersistentContext(profile, {
      ...(baseURL === undefined ? {} : { baseURL }),
      headless: true,
    });
    console.info(`Motor ${browserName}: ${browser.version()}`);
    try {
      await use(context);
    } finally {
      await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  },
});
export { expect };
