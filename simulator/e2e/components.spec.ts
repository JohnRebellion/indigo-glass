import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* /components/<id>/ — each page draws one UI component in every layer,
 * stock beside Sage Ink, and judges the Sage Ink paints (probe.ts). Enforced:
 *   1. every page renders without page errors and finishes measuring;
 *   2. no slot is `fail`: each is ok/observed, or a declared known gap,
 *      exception or skip — and those carry a reason;
 *   3. a declared known gap / exception still fails (stale entries are
 *      errors: a fixed slot must have its entry removed);
 *   4. every contrast pair either meets its floor or involves a declared slot;
 *   5. every layer lists each component in `components` or `absent`;
 *   6. the Both / Stock / Sage Ink toggle shows exactly the lanes it names;
 *   7. nothing runs past the viewport.
 * Component ids come from catalogue.ts, read as text (Playwright's loader
 * cannot import the $lib modules). */
const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'components');
const IDS = [...readFileSync(join(LIB, 'catalogue.ts'), 'utf8').matchAll(/^    id: '([a-z-]+)',$/gm)].map((m) => m[1]);
const LAYER_DIRS = readdirSync(join(LIB, 'layers'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(LIB, 'layers', d.name, 'index.ts')))
  .map((d) => d.name);

type Cell = { slot: string; verdict: string; why: string; ours: string | null };
type Result = { layer: string; cells: Cell[]; contrast: { name: string; slots: [string, string]; ratio: number | null; min: number; ok: boolean | null }[] };

test('catalogue and layers are discovered', () => {
  expect(IDS.length).toBeGreaterThanOrEqual(8);
  expect(LAYER_DIRS.length).toBeGreaterThan(0);
});

test('index maps every component to every layer', async ({ page }) => {
  await page.goto('/components/');
  for (const id of IDS) await expect(page.getByTestId(`component-row-${id}`)).toBeVisible();
  const cols = await page.locator('[data-testid="component-map"] thead th').count();
  expect(cols - 1, 'one column per layer').toBe(LAYER_DIRS.length);
  /* An absent component must say why. */
  const blanks = await page.locator('[data-testid="component-map"] td.no').evaluateAll((tds) =>
    tds.filter((td) => !td.querySelector('.sub')?.textContent?.trim()).length);
  expect(blanks, 'absent components without a reason').toBe(0);
});

for (const id of IDS) {
  test(`${id}: renders, every Sage Ink slot passes or is declared`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/components/${id}/`);
    const root = page.getByTestId(`component-page-${id}`);
    await expect(root).toHaveAttribute('data-ready', 'true', { timeout: 15_000 });
    const results = JSON.parse((await root.getAttribute('data-results')) ?? '[]') as Result[];
    expect(results.length, 'at least one layer draws it').toBeGreaterThan(0);

    const cells = results.flatMap((r) => r.cells.map((c) => ({ ...c, layer: r.layer })));
    expect(cells.filter((c) => c.verdict === 'fail').map((c) => `${c.layer}.${c.slot}: ${c.why}`), 'undeclared failures').toEqual([]);
    for (const c of cells.filter((x) => ['known', 'exception', 'skip'].includes(x.verdict)))
      expect(c.why.length, `${c.layer}.${c.slot} ${c.verdict} needs a reason`).toBeGreaterThan(10);

    /* Stale declarations: the notes list every declared slot; each must
       still be non-ok in the matrix. */
    for (const r of results) {
      const notes = page.getByTestId(`layer-${r.layer}`);
      for (const kind of ['gap', 'exc'] as const) {
        const slots = await notes.locator(`.lnotes p.${kind} code`).allInnerTexts();
        for (const s of slots) {
          const v = r.cells.find((c) => c.slot === s)?.verdict;
          expect(v, `${r.layer}.${s} is declared a ${kind === 'gap' ? 'known gap' : 'exception'} but is ${v}`).toBe(kind === 'gap' ? 'known' : 'exception');
        }
      }
    }

    /* A pair below its floor (or unmeasurable) is allowed only when one of
       its two slots is itself declared — the page already shows it red. */
    const declared = new Set(cells.filter((c) => !['ok', 'observed'].includes(c.verdict)).map((c) => `${c.layer}.${c.slot}`));
    const badPairs = results.flatMap((r) => r.contrast.filter((p) => p.ok !== true).map((p) => ({ layer: r.layer, ...p })));
    expect(
      badPairs.filter((p) => !p.slots.some((s) => declared.has(`${p.layer}.${s}`))).map((p) => `${p.layer} ${p.name}: ${p.ratio ?? 'unmeasured'} < ${p.min}`),
      'contrast below floor with no declared slot'
    ).toEqual([]);

    const layerCount = results.length;
    expect(await page.locator('.lane-root[data-lane="stock"]').count()).toBe(layerCount);
    await page.getByTestId('view-stock').click();
    expect(await page.locator('.lane-root[data-lane="ours"]').count()).toBe(0);
    await page.getByTestId('view-ours').click();
    expect(await page.locator('.lane-root[data-lane="stock"]').count()).toBe(0);
    await page.getByTestId('view-split').click();
    expect(await page.locator('.lane-root[data-lane="ours"]').count()).toBe(layerCount);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'page runs past the viewport').toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}
