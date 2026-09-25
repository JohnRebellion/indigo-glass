import { test, expect } from '@playwright/test';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* /desktop/<id>/ — each page claims to render a desktop layer's specimens
 * from the stock file (left) and the shipped file (right). Enforced here:
 *   1. it renders without page errors;
 *   2. coverage — every setting/selector in the shipped files is rendered, or
 *      the page lists why not (the footer says "All N ...");
 *   3. roles — every role bound to a token equals that token's hex in the
 *      Sage Ink lane (the cross-layer consistency check);
 *   4. contrast — every text/background pair the page declares meets its floor;
 *   5. the lanes differ, and the Both / Stock / Sage Ink toggle shows exactly
 *      the lanes it names;
 *   6. nothing runs past the viewport.
 * Surfaces are discovered from src/lib/desktop/<id>/index.ts, the same glob
 * the registry uses (Playwright's loader cannot import the ?raw modules). */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'desktop');
const IDS = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ROOT, d.name, 'index.ts')))
  .map((d) => d.name)
  .sort();

test('index lists every surface', async ({ page }) => {
  await page.goto('/desktop/');
  for (const id of IDS) await expect(page.getByTestId(`surface-row-${id}`)).toBeVisible();
  expect(IDS.length).toBeGreaterThan(0);
});

for (const id of IDS) {
  test(`${id}: renders, covers its files, roles match tokens, contrast holds`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/desktop/${id}/`);
    const root = page.getByTestId(`desktop-page-${id}`);
    await expect(root).toBeVisible();

    const missing = page.getByTestId('coverage-missing');
    if (await missing.count()) {
      expect(await missing.locator('li').allInnerTexts(), 'shipped settings with no rendered specimen').toEqual([]);
    }
    await expect(page.getByTestId('coverage-ok')).toBeVisible();

    const roles = JSON.parse((await root.getAttribute('data-roles')) ?? '[]') as { role: string; got: string; want?: string; ok: boolean | null }[];
    expect(roles.length, 'a surface declares at least one role').toBeGreaterThan(0);
    expect(roles.filter((r) => r.ok === false).map((r) => `${r.role}: ${r.got} want ${r.want}`), 'roles off the token palette').toEqual([]);

    const pairs = JSON.parse((await root.getAttribute('data-contrast')) ?? '[]') as { name: string; ratio: number; min: number; ok: boolean }[];
    expect(pairs.filter((p) => !p.ok).map((p) => `${p.name}: ${p.ratio} < ${p.min}`), 'contrast below floor').toEqual([]);

    const stockStyle = await page.locator('[data-lane="stock"]').first().getAttribute('style');
    const oursStyle = await page.locator('[data-lane="ours"]').first().getAttribute('style');
    expect(stockStyle, 'stock and ours lanes are parsed from different files').not.toEqual(oursStyle);

    await page.getByTestId('view-stock').click();
    expect(await page.locator('[data-lane="ours"]').count()).toBe(0);
    await page.getByTestId('view-ours').click();
    expect(await page.locator('[data-lane="stock"]').count()).toBe(0);
    await page.getByTestId('view-split').click();
    expect(await page.locator('[data-lane="stock"]').count()).toBe(await page.locator('[data-lane="ours"]').count());

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'page wider than the viewport').toBeLessThanOrEqual(0);
    expect(errors, 'no page errors').toEqual([]);
  });
}
