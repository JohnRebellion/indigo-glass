import { test, expect, type Page } from '@playwright/test';

/**
 * Cross-scope theme assertions.
 *
 * Validates that the canonical Sage Ink tokens propagate correctly
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

// Sage Ink default variant: deep-black ladder + muted-sage accent.
// (var names stay --ig-indigo* for API compat; values are sage - the
// --ig-indigo/--ig-lime/--ig-violet aliases all resolve to whatever the
// active variant's accent triple is, per codegen's brand-alias behaviour.)
const HEX = {
  base: 'rgb(7, 8, 10)',          // #07080A Raycast-deep
  text: 'rgb(248, 248, 248)',     // #F8F8F8
  indigo: 'rgb(166, 201, 166)',   // #A6C9A6 sage accent
  indigoHi: 'rgb(192, 227, 192)', // #C0E3C0 sage hover
  positive: 'rgb(63, 250, 187)',  // #3FFABB (nudged +12.5deg off sage's hue)
  surfaceAlt: 'rgb(18, 18, 22)'   // #121216
};

test.describe('palette propagation', () => {
  test('overview body bg = base #07080A', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '.ig-shell');
    expect(bg).toBe(HEX.base);
  });

  test('overview brand dot bg = sage #A6C9A6', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '.ig-brand-dot');
    expect(bg).toBe(HEX.indigo);
  });

  test('vscode editor bg = base #07080A', async ({ page }) => {
    await page.goto('/vscode/');
    const bg = await readBg(page, '.code');
    expect(bg).toBe(HEX.base);
  });

  test('claude-code header brand dot = sage', async ({ page }) => {
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

test.describe('ink material (Sage Ink v4 - no glass, chrome included)', () => {
  test('overview cards are ink: no backdrop-filter, opaque fill, hard shadow', async ({ page }) => {
    await page.goto('/');
    const card = await page.locator('.ig-card').first().evaluate((el) => {
      const s = getComputedStyle(el as Element);
      return {
        backdrop: s.backdropFilter || (s as unknown as Record<string, string>).webkitBackdropFilter,
        radius: s.borderRadius,
        shadow: s.boxShadow
      };
    });
    expect(card.backdrop === 'none' || card.backdrop === '').toBe(true);
    expect(card.radius).toBe('0px');
    expect(card.shadow).not.toBe('none');
  });

  test('vscode tab uses opaque surface_alt bg', async ({ page }) => {
    await page.goto('/vscode/');
    const bg = await readBg(page, '.tab-active');
    expect(bg).toBe(HEX.surfaceAlt);
  });
});

test.describe('scrollbar', () => {
  test('Firefox scrollbar-color reads sage', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'scrollbar-color spec is Firefox-only via getComputedStyle');
    await page.goto('/');
    const sc = await page.evaluate(() => getComputedStyle(document.body).scrollbarColor);
    expect(sc).toMatch(/166[,\s]+201[,\s]+166|a6c9a6/i);
  });
});

test.describe('semantics', () => {
  test('overview swatch error chip = negative red', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '[data-testid="swatch-negative"] .ig-swatch-chip');
    expect(bg).toBe('rgb(237, 37, 78)');
  });

  test('overview swatch positive chip = positive green (hue nudged off sage)', async ({ page }) => {
    await page.goto('/');
    const bg = await readBg(page, '[data-testid="swatch-positive"] .ig-swatch-chip');
    expect(bg).toBe(HEX.positive);
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
