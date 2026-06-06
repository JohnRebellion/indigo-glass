import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Real-site Stylus regression test.
 *
 * Loads facebook.com login (no auth required) twice:
 *   1. Stock - no overrides. Capture computed padding/margin/font for
 *      key elements.
 *   2. With our Stylus universal CSS injected via page.addStyleTag.
 *      Compare to stock.
 *
 * Goal: verify Stylus universal doesn't collapse FB native spacing
 *       (which the recent v0.1.12 fix removed button/input/li rules).
 *       Also verify font-family swap doesn't cause vertical drift.
 *
 * Skipped on CI by default (network-dependent + FB may rate-limit).
 */

const STYLUS_PATH = resolve(__dirname, '../../browser/stylus/indigo-glass.user.css');
let stylusCss: string;
try {
  stylusCss = readFileSync(STYLUS_PATH, 'utf8');
} catch {
  stylusCss = '';
}

const STYLUS_NETWORK = process.env.IG_NETWORK_TESTS === '1';

type Metrics = {
  padding: string;
  margin: string;
  fontFamily: string;
  height: number;
  width: number;
};

async function readMetrics(page: Page, selector: string): Promise<Metrics | null> {
  return page.locator(selector).first().evaluate((el) => {
    if (!el) return null;
    const r = (el as Element).getBoundingClientRect();
    const s = getComputedStyle(el as Element);
    return {
      padding: s.padding,
      margin: s.margin,
      fontFamily: s.fontFamily,
      height: Math.round(r.height),
      width: Math.round(r.width)
    };
  }).catch(() => null);
}

test.describe('Facebook real-site regression', () => {
  test.skip(!STYLUS_NETWORK, 'Network-dependent. Run with IG_NETWORK_TESTS=1');

  test('stock FB login: capture native metrics', async ({ page }) => {
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000); // let SPA settle

    const emailInput = await readMetrics(page, 'input[name="email"], input[type="email"], input#email');
    const loginButton = await readMetrics(page, 'button[name="login"], button[type="submit"], button[data-testid*="login"], [role="button"]:has-text("Log in"), [role="button"]:has-text("Log In")');

    console.log('STOCK FB metrics:', JSON.stringify({ emailInput, loginButton }, null, 2));

    // Native FB metrics - we'll assert these are unchanged after stylus injection
    expect(emailInput).not.toBeNull();
    expect(loginButton).not.toBeNull();
  });

  test('FB w/ Stylus universal: padding/margin unchanged', async ({ page }) => {
    // Stock load
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const stockInput = await readMetrics(page, 'input[name="email"], input[type="email"], input#email');
    const stockBtn = await readMetrics(page, 'button[name="login"], button[type="submit"], button[data-testid*="login"], [role="button"]:has-text("Log in"), [role="button"]:has-text("Log In")');

    // Inject Stylus CSS
    await page.addStyleTag({ content: stylusCss });
    await page.waitForTimeout(500);

    const styledInput = await readMetrics(page, 'input[name="email"], input[type="email"], input#email');
    const styledBtn = await readMetrics(page, 'button[name="login"], button[type="submit"], button[data-testid*="login"], [role="button"]:has-text("Log in"), [role="button"]:has-text("Log In")');

    console.log('STOCK:', JSON.stringify({ stockInput, stockBtn }));
    console.log('STYLED:', JSON.stringify({ styledInput, styledBtn }));

    // Padding + margin should be IDENTICAL — Stylus v0.1.12 only swaps
    // font-family, never padding/margin
    expect(styledInput?.padding).toBe(stockInput?.padding);
    expect(styledInput?.margin).toBe(stockInput?.margin);
    expect(styledBtn?.padding).toBe(stockBtn?.padding);
    expect(styledBtn?.margin).toBe(stockBtn?.margin);

    // Width should be unchanged (no horizontal drift)
    expect(Math.abs((styledInput?.width ?? 0) - (stockInput?.width ?? 0))).toBeLessThan(2);

    // Height MAY drift by a few px due to font-family swap changing line-height.
    // Tolerance: ±4px. Anything larger means Carlito metrics are too different.
    expect(Math.abs((styledInput?.height ?? 0) - (stockInput?.height ?? 0))).toBeLessThanOrEqual(4);
    expect(Math.abs((styledBtn?.height ?? 0) - (stockBtn?.height ?? 0))).toBeLessThanOrEqual(4);
  });

  test('FB w/ Stylus + density opt-in: same result (density not auto-applied)', async ({ page }) => {
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const stockInput = await readMetrics(page, 'input[name="email"], input[type="email"], input#email');

    // Inject Stylus CSS - density.css opt-in rules require .ig-density-on
    // which we are NOT adding. So nothing should change padding-wise.
    await page.addStyleTag({ content: stylusCss });
    await page.waitForTimeout(500);

    const styledInput = await readMetrics(page, 'input[name="email"], input[type="email"], input#email');

    expect(styledInput?.padding).toBe(stockInput?.padding);
    expect(styledInput?.margin).toBe(stockInput?.margin);
  });

  test('FB snapshot: stock vs styled side-by-side', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2500);

    await page.screenshot({ path: 'test-results/fb-stock.png', fullPage: false });

    await page.addStyleTag({ content: stylusCss });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/fb-styled.png', fullPage: false });

    console.log('Compare: test-results/fb-stock.png vs test-results/fb-styled.png');
  });
});
