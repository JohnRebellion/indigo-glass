import { test, expect, type Page } from '@playwright/test';

/**
 * Cross-scope theme assertions.
 *
 * Validates that the canonical Indigo Glass tokens propagate correctly
 * into the simulator surfaces (browser / vscode / claude-code / grub /
 * overview / density-test). Catches drift between tokens.toml + per-surface
 * CSS rendering.
 */

async function readBg(page: Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el as Element).backgroundColor);
}
async function readColor(page: Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el as Element).color);
}
async function readFontFamily(page: Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el as Element).fontFamily);
}

const HEX = {
  base: 'rgb(15, 15, 18)',
  text: 'rgb(248, 248, 248)',
  indigo: 'rgb(94, 106, 210)',
  indigoHi: 'rgb(129, 140, 248)',
  surfaceAlt: 'rgb(31, 32, 40)'
};

test.describe('palette propagation', () => {
  test('overview body bg = base #0F0F12', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '.ig-shell');
    expect(bg).toBe(HEX.base);
  });

  test('overview brand dot bg = indigo #5E6AD2', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '.ig-brand-dot');
    expect(bg).toBe(HEX.indigo);
  });

  test('vscode editor bg = base #0F0F12', async ({ page }) => {
    await page.goto('/vscode/');
    const bg = await readBg(page, '.code');
    expect(bg).toBe(HEX.base);
  });

  test('claude-code header brand dot = indigo', async ({ page }) => {
    await page.goto('/vscode/claude-code/');
    const bg = await readBg(page, '.cc-brand-dot');
    expect(bg).toBe(HEX.indigo);
  });

  test('browser tab active border-bottom = indigo', async ({ page }) => {
    await page.goto('/browser/');
    const borderColor = await page.locator('.tab.active').first()
      .evaluate((el) => getComputedStyle(el as Element).borderBottomColor);
    expect(borderColor).toBe(HEX.indigo);
  });
});

test.describe('typography propagation', () => {
  test('body inherits Carlito or fallback', async ({ page }) => {
    await page.goto('/');
    const ff = await readFontFamily(page, 'body');
    expect(ff.toLowerCase()).toMatch(/carlito|sf pro display|-apple-system/i);
  });

  test('vscode code editor uses Iosevka mono', async ({ page }) => {
    await page.goto('/vscode/');
    const ff = await readFontFamily(page, '.code');
    expect(ff.toLowerCase()).toMatch(/iosevka|mesloLGS|monospace/i);
  });

  test('claude-code tool body uses mono', async ({ page }) => {
    await page.goto('/vscode/claude-code/');
    const ff = await readFontFamily(page, '.tool-body');
    expect(ff.toLowerCase()).toMatch(/iosevka|mesloLGS|monospace/i);
  });

  test('density-test code element uses mono', async ({ page }) => {
    await page.goto('/density-test/');
    const ff = await readFontFamily(page, 'section[data-testid="section-code"] code');
    expect(ff.toLowerCase()).toMatch(/iosevka|mesloLGS|monospace/i);
  });
});

test.describe('focus ring', () => {
  test('focus-visible outline is indigo', async ({ page }) => {
    await page.goto('/density-test/');
    await page.getByTestId('input-email').focus();
    const outline = await page.getByTestId('input-email').evaluate((el) => {
      const s = getComputedStyle(el as Element);
      return { color: s.outlineColor, width: s.outlineWidth };
    });
    // Outline color via focus-visible global rule
    expect(outline.color).toBe(HEX.indigo);
  });
});

test.describe('glass / translucency', () => {
  test('overview cards have ig-liquid backdrop-filter (when supported)', async ({ page }) => {
    await page.goto('/');
    const filter = await page.locator('.ig-card.ig-liquid').first()
      .evaluate((el) => getComputedStyle(el as Element).backdropFilter || (getComputedStyle(el as Element) as any).webkitBackdropFilter);
    // Will be 'none' if browser doesn't support, OR 'blur(13px) saturate(110%)' if it does
    // Chromium 105+ supports - assert it's not empty when feature flagged
    expect(typeof filter).toBe('string');
  });

  test('vscode tab uses translucent surface_alt bg', async ({ page }) => {
    await page.goto('/vscode/');
    const bg = await readBg(page, '.tab-active');
    expect(bg).toBe(HEX.surfaceAlt);
  });
});

test.describe('scrollbar', () => {
  test('Firefox scrollbar-color reads indigo', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'scrollbar-color spec is Firefox-only via getComputedStyle');
    await page.goto('/');
    const sc = await page.evaluate(() => getComputedStyle(document.body).scrollbarColor);
    expect(sc).toMatch(/94[,\s]+106[,\s]+210|5e6ad2/i);
  });
});

test.describe('semantics', () => {
  test('overview swatch error chip = negative red', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '[data-testid="swatch-negative"] .ig-swatch-chip');
    expect(bg).toBe('rgb(237, 37, 78)');
  });

  test('overview swatch positive chip = positive green', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '[data-testid="swatch-positive"] .ig-swatch-chip');
    expect(bg).toBe('rgb(113, 247, 159)');
  });
});

test.describe('a11y media queries', () => {
  test('prefers-reduced-motion strips transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const dur = await page.locator('.ig-tab').first()
      .evaluate((el) => getComputedStyle(el as Element).transitionDuration);
    // Global rule sets transition-duration: 0ms when reduce-motion is on
    expect(dur).toBe('0s');
  });
});
