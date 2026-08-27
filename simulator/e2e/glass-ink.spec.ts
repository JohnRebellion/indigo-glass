import { test, expect } from '@playwright/test';

/**
 * Glass & Ink — material comparison snapshots.
 *
 * Guards the merge proposal's governing invariant: an ink object never blurs
 * and always casts a hard shadow; a glass object always blurs and never casts
 * one. If either drifts, the whole system reads as two themes bolted together.
 */
test.describe('glass & ink', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/glass-ink/');
    await page.waitForLoadState('networkidle');
  });

  test('ink variant renders', async ({ page }) => {
    const pane = page.getByTestId('glass-ink-ink');
    await expect(pane).toBeVisible();
    await expect(pane).toHaveScreenshot('glass-ink-ink.png', { maxDiffPixelRatio: 0.01 });
  });

  test('glass variant renders', async ({ page }) => {
    const pane = page.getByTestId('glass-ink-glass');
    await expect(pane).toBeVisible();
    await expect(pane).toHaveScreenshot('glass-ink-glass.png', { maxDiffPixelRatio: 0.01 });
  });

  test('ink objects are opaque, square and hard-shadowed', async ({ page }) => {
    const card = page.getByTestId('glass-ink-ink').locator('.gi-card').first();
    const style = await card.evaluate((el) => {
      const c = getComputedStyle(el);
      return {
        backdrop: c.backdropFilter || (c as unknown as Record<string, string>).webkitBackdropFilter,
        radius: c.borderTopLeftRadius,
        shadow: c.boxShadow
      };
    });
    expect(style.backdrop).toBe('none');
    expect(style.radius).toBe('0px');
    // hard offset: no blur radius component, sage colour
    expect(style.shadow).toContain('4px 4px 0px 0px');
  });

  test('glass objects blur, round, and cast no hard shadow', async ({ page }) => {
    const card = page.getByTestId('glass-ink-glass').locator('.gi-card').first();
    const style = await card.evaluate((el) => {
      const c = getComputedStyle(el);
      return {
        backdrop: c.backdropFilter || (c as unknown as Record<string, string>).webkitBackdropFilter,
        radius: c.borderTopLeftRadius,
        shadow: c.boxShadow
      };
    });
    expect(style.backdrop).toContain('blur');
    expect(style.radius).toBe('12px');
    expect(style.shadow).not.toContain('4px 4px 0px 0px');
  });

  test('side-by-side comparison', async ({ page }) => {
    await expect(page.locator('.gi-compare')).toHaveScreenshot('glass-ink-compare.png', {
      maxDiffPixelRatio: 0.01
    });
  });
});
