/* Does every component actually have a visible edge?
 *
 * Shared by the on-page self-audit section and scripts/measure-edges.mjs, so
 * the number printed on the page is produced by the same code that produces
 * the number in the terminal.
 *
 * Two traps, both of which produced wrong answers during the 2026-09-02
 * cross-model audit before being caught:
 *   1. getComputedStyle returns oklch() for oklch-authored values and rgb()
 *      for hex-authored ones, so a numeric parse mixes colour spaces. Canvas
 *      fillStyle does NOT normalise oklch() in Chromium either — it
 *      round-trips it. Only a painted pixel is reliably sRGB.
 *   2. outline-width computes to 3px ("medium") even when outline-style is
 *      none, so gating on width alone admits every element on the page.
 */
export interface EdgeRow {
  cls: string;
  fillVsPage: number;
  strokeVsFill: number;
  invisible: boolean;
}

/* Below this, two adjacent fields are not reliably distinguishable at normal
   workstation viewing distance. WCAG 2.1 SC 1.4.11 asks 3:1 of a boundary
   that identifies a component; this is the far weaker "is it there at all". */
export const EDGE_FLOOR = 1.5;

function srgb(ctx: CanvasRenderingContext2D, value: string): [number, number, number, number] {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#ff00ff';
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2], d[3] / 255];
}

function luminance(ctx: CanvasRenderingContext2D, value: string): number | null {
  const c = srgb(ctx, value);
  if (c[3] === 0) return null;
  const f = (x: number) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}

/** The fill a transparent element actually shows: nearest opaque ancestor. */
function effectiveFill(el: Element, ctx: CanvasRenderingContext2D, fallback: string): string {
  let n = el.parentElement;
  while (n) {
    const bg = getComputedStyle(n).backgroundColor;
    if (luminance(ctx, bg) !== null) return bg;
    n = n.parentElement;
  }
  return fallback;
}

export function measureEdges(root: ParentNode = document): EdgeRow[] {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  const ratio = (a: string, b: string): number | null => {
    const la = luminance(ctx, a);
    const lb = luminance(ctx, b);
    if (la === null || lb === null) return null;
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const scope = root.querySelector('.nb-root');
  if (!scope) return [];
  const pageBg = getComputedStyle(scope).getPropertyValue('--background');

  const seen = new Set<string>();
  const out: EdgeRow[] = [];

  for (const el of root.querySelectorAll('[class*="nb-"]')) {
    for (const cls of el.classList) {
      if (!cls.startsWith('nb-') || seen.has(cls)) continue;
      seen.add(cls);
      const cs = getComputedStyle(el);
      const hasBorder = cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) >= 2;
      const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
      if (!hasBorder && !hasOutline) continue;
      if (cs.boxShadow !== 'none') continue; // the shadow supplies the silhouette

      const stroke = hasBorder ? cs.borderTopColor : cs.outlineColor;
      // A transparent element shows its nearest OPAQUE ANCESTOR, not the page.
      // Falling back to the page mis-rated .nb-select-item — it inherits the
      // accent fill from .nb-select-content, so its black border is 11.53:1,
      // and against the page it looked like 1.05:1.
      const fill = luminance(ctx, cs.backgroundColor) !== null
        ? cs.backgroundColor
        : effectiveFill(el, ctx, pageBg);
      const fillVsPage = ratio(fill, pageBg);
      const strokeVsFill = ratio(stroke, fill);
      if (fillVsPage === null || strokeVsFill === null) continue;

      out.push({
        cls,
        fillVsPage,
        strokeVsFill,
        invisible: fillVsPage < EDGE_FLOOR && strokeVsFill < EDGE_FLOOR
      });
    }
  }
  return out.sort(
    (a, b) => Math.max(a.fillVsPage, a.strokeVsFill) - Math.max(b.fillVsPage, b.strokeVsFill)
  );
}
