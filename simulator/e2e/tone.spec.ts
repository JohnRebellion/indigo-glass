import { test, expect } from '@playwright/test';

/* Border and shadow must be the higher-contrast choice for where they land.
 *
 * neobrutalism.dev paints both pure black because its canvas is light. Sage
 * Ink lifts both because its canvas is not — but Sage Ink has light surfaces
 * of its own (accent, amber, positive fills), and on those the reference is
 * right again. nb-surfaces.css encodes that as two hand-maintained selector
 * lists, and a hand-maintained list goes stale the moment a component is
 * added. This re-derives the correct answer per element and fails if the
 * painted value is not it, so the lists cannot drift silently.
 *
 * The two properties flip under different conditions and are checked
 * separately:
 *   shadow — must separate from the element's OWN FILL, because a shadow
 *            reads as a displaced copy of the object it belongs to
 *   border — painted at the element's own edge between fill and backdrop;
 *            must survive BOTH, so it flips only when both are light
 */

/* Relative luminance at which black and white contrast equally:
   (L + 0.05)^2 = 0.05 * 1.05  ->  L = 0.179. Not a taste threshold. */
const LIGHT = 0.179;

test.describe('tone context', () => {
  test('every shadow separates from the fill that casts it', async ({ page }) => {
    await page.goto('/neobrutalism/');
    await page.waitForLoadState('networkidle');

    const bad = await page.evaluate((LIGHT) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 1;
      const ctx = cv.getContext('2d', { willReadFrequently: true })!;
      // getImageData, not fillStyle: Chromium round-trips oklch() through
      // fillStyle unchanged, so only a painted pixel is reliably sRGB.
      const px = (v: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#ff00ff';
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255] as const;
      };
      const lum = (v: string) => {
        const c = px(v);
        if (c[3] === 0) return null;
        const f = (x: number) => {
          const s = x / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
      };
      const cr = (a: string, b: string) => {
        const la = lum(a)!, lb = lum(b)!;
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };
      const backdrop = (el: Element) => {
        let n = el.parentElement;
        while (n) {
          const bg = getComputedStyle(n).backgroundColor;
          if (lum(bg) !== null) return bg;
          n = n.parentElement;
        }
        return null;
      };

      const out: string[] = [];
      const seen = new Set<string>();
      for (const el of document.querySelectorAll('[class*="nb-"]')) {
        const cs = getComputedStyle(el);
        if (cs.boxShadow === 'none') continue;
        const key = [...el.classList].filter((c) => c.startsWith('nb-')).join('.');
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const col = cs.boxShadow.match(/(rgba?\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]{3,8})/i);
        if (!col) continue;
        // A collapsed press shadow (0 0 0 0) has no visible colour.
        if (/(^|\s)0px 0px 0px 0px/.test(cs.boxShadow)) continue;

        // The fill that casts the shadow — inherited from the backdrop when
        // the element has none of its own.
        const own = lum(cs.backgroundColor);
        const bd = backdrop(el);
        const fill = own === null ? bd : cs.backgroundColor;
        if (!fill) continue;

        const painted = cr(col[0], fill);
        const fillIsLight = lum(fill)! > LIGHT;
        const correct = fillIsLight
          ? getComputedStyle(document.querySelector('.nb-root')!).getPropertyValue('--background').trim()
          : '#89A889';
        const alternative = cr(correct, fill);
        if (alternative > painted + 0.5) {
          out.push(
            `${key}: shadow ${col[0]} on ${fillIsLight ? 'LIGHT' : 'dark'} fill ${fill} ` +
            `= ${painted.toFixed(2)}:1, but the other tone would be ${alternative.toFixed(2)}:1`
          );
        }
      }
      return out;
    }, LIGHT);

    expect(bad, `${bad.length} shadow(s) on the wrong tone:\n  ${bad.join('\n  ')}`).toEqual([]);
  });

  test('every border survives against both its fill and its backdrop', async ({ page }) => {
    await page.goto('/neobrutalism/');
    await page.waitForLoadState('networkidle');

    const bad = await page.evaluate((LIGHT) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 1;
      const ctx = cv.getContext('2d', { willReadFrequently: true })!;
      const px = (v: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#ff00ff';
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255] as const;
      };
      const lum = (v: string) => {
        const c = px(v);
        if (c[3] === 0) return null;
        const f = (x: number) => {
          const s = x / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
      };
      const cr = (a: string, b: string) => {
        const la = lum(a)!, lb = lum(b)!;
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };
      const backdrop = (el: Element) => {
        let n = el.parentElement;
        while (n) {
          const bg = getComputedStyle(n).backgroundColor;
          if (lum(bg) !== null) return bg;
          n = n.parentElement;
        }
        return null;
      };

      const NEUTRAL = getComputedStyle(document.documentElement)
        .getPropertyValue('--ig-border-strong').trim();
      const out: string[] = [];
      const seen = new Set<string>();

      for (const el of document.querySelectorAll('[class*="nb-"]')) {
        const cs = getComputedStyle(el);
        if (cs.borderTopStyle === 'none' || parseFloat(cs.borderTopWidth) < 2) continue;
        if (lum(cs.borderTopColor) === null) continue; // transparent until a state fires
        const key = [...el.classList].filter((c) => c.startsWith('nb-')).join('.');
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const bd = backdrop(el);
        if (!bd) continue;

        const fill = lum(cs.backgroundColor) === null ? bd : cs.backgroundColor;
        // Worst case: a border is only as good as its weaker side.
        const worst = (c: string) => Math.min(cr(c, fill), cr(c, bd));
        const painted = worst(cs.borderTopColor);
        const bothLight = lum(fill)! > LIGHT && lum(bd)! > LIGHT;
        const alternative = worst(bothLight ? '#000000' : NEUTRAL);
        if (alternative > painted + 0.5) {
          out.push(
            `${key}: border ${cs.borderTopColor} scores ${painted.toFixed(2)}:1 worst-case ` +
            `(fill ${fill}, backdrop ${bd}); ${bothLight ? 'black' : NEUTRAL} would be ${alternative.toFixed(2)}:1`
          );
        }
      }
      return out;
    }, LIGHT);

    expect(bad, `${bad.length} border(s) on the wrong tone:\n  ${bad.join('\n  ')}`).toEqual([]);
  });
});
