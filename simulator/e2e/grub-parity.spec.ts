import { test, expect } from '@playwright/test';

// Parity capture: render the GRUB surface at the real boot resolution (1920x1080,
// the GOP mode the theme is designed for) and write a PNG to /tmp for eyeball
// comparison against an actual boot photo. This is the ground-truth check that
// share/grub-theme/theme.txt renders WITHOUT label overlap before we deploy it
// to /boot. Not a diff assertion — a visual artifact for parity review.
test('grub parity @1920x1080', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/grub/');
  await page.waitForLoadState('networkidle');
  // give font/canvas rendering a beat to settle
  await page.waitForTimeout(800);
  // Capture ONLY the rendered grub canvas (the ground-truth raster), not the
  // surrounding editor chrome. This is what actually maps 1:1 to a boot photo.
  const canvas = page.locator('canvas').first();
  await canvas.waitFor({ state: 'visible' });
  await canvas.screenshot({ path: '/tmp/grub-parity-sim.png' });
  if (errors.length) console.log('[grub pageerrors]', errors.join(' | '));
  expect(errors, 'no page errors while rendering grub').toEqual([]);
});
