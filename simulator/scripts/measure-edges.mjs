/* Measure whether every component actually has a visible edge.
 *
 * Sage Ink's material is "colour-as-elevation": a 2px stroke and a hard offset
 * shadow. This asks the only question that matters about that claim — for a
 * component with no shadow, is there anything to see the boundary by? A
 * component whose fill matches the page AND whose stroke does not separate
 * from its fill has no silhouette at all, however correct its CSS is.
 *
 * Two traps this script exists to avoid, both of which produced wrong numbers
 * during the 2026-09-02 cross-model audit before being caught:
 *   1. getComputedStyle returns oklch() for oklch-authored values and rgb()
 *      for hex-authored ones. A numeric regex silently mixes colour spaces.
 *      Canvas fillStyle does NOT normalise oklch in Chromium either — it
 *      round-trips it. Only a painted pixel is reliably sRGB.
 *   2. outline-width computes to 3px ("medium") even when outline-style is
 *      none, so gating on width alone admits every element on the page.
 *
 * This duplicates src/lib/nb/measureEdges.ts on purpose: the script runs
 * against the exported single-file HTML, which has no JavaScript, so it cannot
 * import the module. Keep the two in step.
 *
 * Usage (from simulator/): node scripts/measure-edges.mjs [--json]
 */
import { chromium } from 'playwright';

const FILE = new URL('../screenshots/neobrutalism/indigo-glass-simulator-neobrutalism.html', import.meta.url).href;
const JSON_OUT = process.argv.includes('--json');
/* Below this, two adjacent fields are not reliably distinguishable at normal
   workstation viewing distance. WCAG 2.1 SC 1.4.11 asks 3:1 for boundaries
   that identify a component; 1.5 is the far weaker "can you see it at all". */
const FLOOR = 1.5;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1560, height: 1200 } });
await page.goto(FILE, { waitUntil: 'networkidle' });

const rows = await page.evaluate((floor) => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });

  const srgb = (v) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#ff00ff';
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const lum = (v) => {
    const c = srgb(v);
    if (c[3] === 0) return null;
    const f = (x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const la = lum(a), lb = lum(b);
    if (la === null || lb === null) return null;
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const pageBg = getComputedStyle(document.querySelector('.nb-root')).getPropertyValue('--background');
  const seen = new Set();
  const out = [];

  for (const el of document.querySelectorAll('[class*="nb-"]')) {
    for (const cls of el.classList) {
      if (!cls.startsWith('nb-') || seen.has(cls)) continue;
      seen.add(cls);
      const cs = getComputedStyle(el);
      const hasBorder = cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) >= 2;
      const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
      if (!hasBorder && !hasOutline) continue;
      if (cs.boxShadow !== 'none') continue;   // a shadow supplies the silhouette

      const stroke = hasBorder ? cs.borderTopColor : cs.outlineColor;
      // A transparent element shows its nearest OPAQUE ANCESTOR, not the page.
      const effectiveFill = (node) => {
        let n = node.parentElement;
        while (n) {
          const bg = getComputedStyle(n).backgroundColor;
          if (lum(bg) !== null) return bg;
          n = n.parentElement;
        }
        return pageBg;
      };
      const fill = lum(cs.backgroundColor) !== null ? cs.backgroundColor : effectiveFill(el);
      const fillVsPage = ratio(fill, pageBg);
      const strokeVsFill = ratio(stroke, fill);
      if (fillVsPage === null || strokeVsFill === null) continue;
      out.push({ cls, fillVsPage, strokeVsFill, invisible: fillVsPage < floor && strokeVsFill < floor });
    }
  }
  return out.sort((a, b) => Math.max(a.fillVsPage, a.strokeVsFill) - Math.max(b.fillVsPage, b.strokeVsFill));
}, FLOOR);

await browser.close();

if (JSON_OUT) {
  console.log(JSON.stringify(rows, null, 1));
} else {
  const bad = rows.filter((r) => r.invisible);
  console.log('component'.padEnd(30) + 'fill vs page   stroke vs fill');
  for (const r of rows) {
    console.log(
      (r.invisible ? '! ' : '  ') + r.cls.padEnd(28) +
      r.fillVsPage.toFixed(2).padStart(6) + ':1' +
      r.strokeVsFill.toFixed(2).padStart(12) + ':1'
    );
  }
  console.log(`\n${bad.length} of ${rows.length} shadowless bordered components have no perceptible edge (both < ${FLOOR}:1).`);
}
process.exit(0);
