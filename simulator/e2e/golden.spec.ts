import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/* B2 — a persisted baseline that does NOT share a failure domain with the page.
 *
 * The page resolves and prints its own token values at runtime. That is good
 * for freshness and bad for evidence: if the resolver, the colour conversion
 * or the cascade is wrong, the specimen and the label it is judged by are
 * wrong together, and the audit endorses the regression. (Raised by GPT in the
 * 2026-09-02 cross-model audit; demonstrated three times the same afternoon by
 * a measurement script that reproduced the exact bug it was written to check.)
 *
 * This guard deliberately does the dumbest possible thing: it stores raw
 * getComputedStyle strings and compares them as strings. No colour conversion,
 * no canvas, no arithmetic — nothing that can be wrong in the same way the
 * page can be wrong. It cannot tell you a value is *good*; it can only tell
 * you it *changed*, which is the one thing the page cannot tell you itself.
 *
 * Regenerate deliberately after an intended change:
 *   UPDATE_GOLDEN=1 npx playwright test e2e/golden.spec.ts
 * and review the diff — an unreviewed regeneration defeats the entire guard.
 */
const GOLDEN = join(process.cwd(), 'e2e/golden/computed-styles.json');

const PROPS = [
  'background-color', 'color', 'border-top-width', 'border-top-style',
  'border-top-color', 'border-top-left-radius', 'box-shadow', 'font-size',
  'font-weight', 'padding-top', 'padding-left', 'height', 'opacity'
] as const;

test('computed styles match the reviewed baseline', async ({ page }) => {
  await page.goto('/neobrutalism/');
  await page.waitForLoadState('networkidle');
  // .nb-skeleton animates opacity, which is one of the captured properties —
  // without this the baseline is a coin flip.
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });

  const actual = await page.evaluate((props) => {
    const seen = new Set<string>();
    const out: Record<string, Record<string, string>> = {};
    for (const el of document.querySelectorAll('[class*="nb-"]')) {
      for (const cls of el.classList) {
        if (!cls.startsWith('nb-') || seen.has(cls)) continue;
        seen.add(cls);
        const cs = getComputedStyle(el);
        out[cls] = Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
      }
    }
    return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
  }, PROPS as unknown as string[]);

  if (process.env.UPDATE_GOLDEN || !existsSync(GOLDEN)) {
    writeFileSync(GOLDEN, JSON.stringify(actual, null, 1) + '\n');
    test.info().annotations.push({ type: 'golden', description: 'baseline written — review the diff' });
    return;
  }

  const golden: typeof actual = JSON.parse(readFileSync(GOLDEN, 'utf8'));

  // Report the whole drift at once rather than dying on the first key: a token
  // change moves dozens of properties, and one-at-a-time is unreadable.
  const drift: string[] = [];
  for (const [cls, props] of Object.entries(golden)) {
    if (!(cls in actual)) { drift.push(`${cls}: MISSING from page`); continue; }
    for (const [prop, want] of Object.entries(props)) {
      const got = actual[cls][prop];
      if (got !== want) drift.push(`${cls} { ${prop}: ${got} }  expected: ${want}`);
    }
  }
  for (const cls of Object.keys(actual)) {
    if (!(cls in golden)) drift.push(`${cls}: NEW, not in baseline`);
  }

  expect(drift, `${drift.length} computed-style drift(s):\n  ${drift.slice(0, 40).join('\n  ')}`).toEqual([]);
});
