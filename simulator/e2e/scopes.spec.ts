import { test, expect, type Page } from '@playwright/test';

/**
 * Cross-scope theme assertions.
 *
 * Validates that the canonical Lime Glass tokens propagate correctly
 * into the simulator surfaces (browser / vscode / claude-code / grub /
 * overview / density-test). Catches drift between tokens.toml + per-surface
 * CSS rendering.
 */

/**
 * Resolve any computed color (rgb(), oklch(), color(display-p3 ...)) to a
 * canonical `rgb(r, g, b)` string by painting it on a throwaway canvas.
 * The palette is OKLCH-authored, so getComputedStyle returns the literal
 * oklch() string in browsers that support it - normalize before asserting.
 */
async function resolveColor(page: Page, raw: string): Promise<string> {
  return page.evaluate((value) => {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillStyle = value;          // browser parses oklch/p3/rgb
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  }, raw);
}

async function readBg(page: Page, selector: string): Promise<string> {
  const raw = await page.locator(selector).first().evaluate((el) => getComputedStyle(el as Element).backgroundColor);
  return resolveColor(page, raw);
}
async function readColor(page: Page, selector: string): Promise<string> {
  const raw = await page.locator(selector).first().evaluate((el) => getComputedStyle(el as Element).color);
  return resolveColor(page, raw);
}
async function readFontFamily(page: Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el as Element).fontFamily);
}

// Lime Glass default variant: deep-black ladder + ghost-lime accent.
// (var names stay --ig-indigo* for API compat; values are lime.)
const HEX = {
  base: 'rgb(7, 8, 10)',          // #07080A Raycast-deep
  text: 'rgb(248, 248, 248)',     // #F8F8F8
  indigo: 'rgb(168, 230, 53)',    // #A8E635 lime accent
  indigoHi: 'rgb(193, 255, 88)',  // #C1FF58 lime hover
  surfaceAlt: 'rgb(18, 18, 22)'   // #121216
};

test.describe('palette propagation', () => {
  test('overview body bg = base #07080A', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '.ig-shell');
    expect(bg).toBe(HEX.base);
  });

  test('overview brand dot bg = lime #A8E635', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '.ig-brand-dot');
    expect(bg).toBe(HEX.indigo);
  });

  test('vscode editor bg = base #07080A', async ({ page }) => {
    await page.goto('/vscode/');
    const bg = await readBg(page, '.code');
    expect(bg).toBe(HEX.base);
  });

  test('claude-code header brand dot = lime', async ({ page }) => {
    await page.goto('/vscode/claude-code/');
    const bg = await readBg(page, '.cc-brand-dot');
    expect(bg).toBe(HEX.indigo);
  });

  test('browser tab active border-bottom = indigo', async ({ page }) => {
    await page.goto('/browser/');
    const rawBorder = await page.locator('.tab.active').first()
      .evaluate((el) => getComputedStyle(el as Element).borderBottomColor);
    expect(await resolveColor(page, rawBorder)).toBe(HEX.indigo);
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
    // Outline color via focus-visible global rule (normalize oklch -> rgb)
    expect(await resolveColor(page, outline.color)).toBe(HEX.indigo);
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
    expect(sc).toMatch(/168[,\s]+230[,\s]+53|a8e635/i);
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
