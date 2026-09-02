import { test, expect } from '@playwright/test';
import { ROSTER } from '../src/lib/nb/roster';

/* The /neobrutalism/ page claims to cover every component in the reference.
 * That claim is only worth something if it is enforced: without this test,
 * the reference gains a component, the page silently falls behind, and the
 * coverage list keeps asserting completeness it no longer has. */
test.describe('neobrutalism implementation page', () => {
  test('renders a specimen for every component in the roster', async ({ page }) => {
    await page.goto('/neobrutalism/');
    await page.waitForLoadState('networkidle');

    const ids = await page.$$eval('[data-testid^="spec-"]', (els) =>
      els.map((e) => e.getAttribute('data-testid')!.replace(/^spec-/, ''))
    );
    expect(ids.length).toBeGreaterThan(0);

    // A specimen may cover several components ("label + form", "sonner /
    // toast"), so match on the parts of its label, not the whole string.
    const covered = new Set<string>();
    for (const id of ids) {
      covered.add(id);
      for (const part of id.split(/[\s/+]+/)) if (part) covered.add(part);
    }

    const missing = ROSTER.filter((c) => !covered.has(c));
    expect(missing, `no specimen for: ${missing.join(', ')}`).toEqual([]);
  });

  test('resolves live token values rather than hardcoded labels', async ({ page }) => {
    await page.goto('/neobrutalism/');
    await page.waitForLoadState('networkidle');

    // Regression guard for the oklch-parsed-as-rgb bug: the labels are read
    // back from the DOM at runtime, so a broken resolver shows a wrong hex
    // rather than failing loudly.
    const row = page.locator('.tk tbody tr', { hasText: '--main' }).first();
    await expect(row).toContainText('#A6C9A6');

    const base = page.locator('.tk tbody tr', { hasText: '--background' }).first();
    await expect(base).toContainText('#07080A');
  });

  /* B3 — the specimen grid must stay inspectable.
   *
   * Gemini predicted layout overflow on composite components as the first
   * thing to break, and it had already happened once during construction:
   * `grid-column: span 99` on a `repeat(auto-fill, ...)` grid makes the grid
   * materialise 99 tracks, which pushed every table hundreds of pixels past
   * the viewport. Nothing caught it but a screenshot. */
  test('no specimen overflows the page horizontally', async ({ page }) => {
    await page.goto('/neobrutalism/');
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      const limit = document.documentElement.clientWidth;
      const bad: { sel: string; right: number }[] = [];
      for (const el of document.querySelectorAll('section[id], .sect-grid, [data-testid^="spec-"]')) {
        const r = el.getBoundingClientRect();
        // 1px of slack for sub-pixel layout rounding.
        if (r.right > limit + 1) {
          bad.push({
            sel: el.getAttribute('data-testid') ?? el.id ?? el.className,
            right: Math.round(r.right)
          });
        }
      }
      return { limit, bad };
    });

    expect(
      overflow.bad,
      `viewport is ${overflow.limit}px; these extend past it: ` +
        overflow.bad.map((b) => `${b.sel}@${b.right}px`).join(', ')
    ).toEqual([]);

    // The document itself must not scroll sideways either.
    const scroll = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      c: document.documentElement.clientWidth
    }));
    expect(scroll.w).toBeLessThanOrEqual(scroll.c + 1);
  });

  test('every overlay is rendered open and in flow', async ({ page }) => {
    await page.goto('/neobrutalism/');
    await page.waitForLoadState('networkidle');

    // A `position: fixed` overlay would be captured once, on top of whatever
    // happened to be under it, instead of in its own labelled cell.
    const fixed = await page.$$eval(
      '.nb-dialog, .nb-sheet, .nb-popover, .nb-tooltip, .nb-hovercard, .nb-menu, .nb-toast',
      (els) => els.filter((e) => getComputedStyle(e).position === 'fixed').length
    );
    expect(fixed).toBe(0);
  });
});
