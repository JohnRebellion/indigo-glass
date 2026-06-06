import { test, expect } from '@playwright/test';

const surfaces = [
  { path: '/',                    name: 'overview' },
  { path: '/browser/',            name: 'browser' },
  { path: '/vscode/',             name: 'vscode' },
  { path: '/vscode/claude-code/', name: 'claude-code' },
  { path: '/grub/',               name: 'grub' }
];

test.describe('per-surface visual snapshots', () => {
  for (const s of surfaces) {
    test(`snapshot ${s.name}`, async ({ page }) => {
      page.on('pageerror', (e) => {
        // surface to playwright report; not a hard fail
        // eslint-disable-next-line no-console
        console.log(`[pageerror ${s.name}]`, e.message);
      });
      await page.goto(s.path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`${s.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.02
      });
    });
  }
});
