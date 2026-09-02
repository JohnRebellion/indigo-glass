/* Read the *live* computed value of a CSS custom property.
 *
 * The styling specimens label every swatch with its resolved value rather
 * than a hand-typed hex. That means the page cannot drift from
 * tokens/out/css-vars.css the way a hand-maintained table would — the exact
 * failure mode `scripts/check-palette-drift.sh --parity` exists to catch
 * elsewhere in this repo. If codegen changes a token, this page relabels
 * itself on the next load.
 *
 * Values resolve against `document.documentElement` by default; pass a scope
 * element to read a property redefined on `.nb-root`.
 */
export function readVar(name: string, scope?: Element | null): string {
  const el = scope ?? document.documentElement;
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export interface Rgba { r: number; g: number; b: number; a: number }

/** sRGB relative luminance, per WCAG 2.x. */
function luminance({ r, g, b }: Rgba): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/**
 * Resolve ANY CSS colour to sRGB 0-255 by painting one pixel.
 *
 * `getComputedStyle(el).color` is not usable for this: Chrome preserves the
 * authored colour space, so an `oklch()` token round-trips as `oklch(...)`
 * and a naive numeric parse reads L/C/H as if they were R/G/B (which is
 * exactly how this page first shipped `#07080A` mislabelled as `#000106`).
 * A canvas always hands back sRGB regardless of the input notation.
 */
export function toRgba(cssValue: string): Rgba | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, 1, 1);
  // Seed with a known value: an unparseable fillStyle is silently ignored,
  // so without this a bad token would report the previous colour.
  ctx.fillStyle = '#ff00ff';
  ctx.fillStyle = cssValue;
  const serialised = ctx.fillStyle;
  if (serialised === '#ff00ff' && !/ff00ff|magenta/i.test(cssValue)) return null;

  // Chrome serialises fillStyle back as sRGB `#rrggbb` or `rgba(r, g, b, a)`.
  // Prefer it over a painted pixel: getImageData unpremultiplies, which cost
  // the translucent --overlay token a unit of red (#07080A read as #08080A).
  if (typeof serialised === 'string') {
    const hex = /^#([0-9a-f]{6})$/i.exec(serialised);
    if (hex) {
      const n = parseInt(hex[1], 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    }
    const fn = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i.exec(serialised);
    if (fn) {
      return { r: +fn[1], g: +fn[2], b: +fn[3], a: fn[4] === undefined ? 1 : +fn[4] };
    }
  }

  // Fallback for any notation the canvas normalises to something unexpected.
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b, a: a / 255 };
}

/** `#RRGGBB` for a resolved colour, or the input if it cannot be parsed. */
export function toHex(cssValue: string): string {
  const c = toRgba(cssValue);
  if (!c) return cssValue;
  const hex = [c.r, c.g, c.b]
    .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
    .join('');
  return ('#' + hex + (c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '')).toUpperCase();
}

/**
 * WCAG 2.x contrast ratio between two CSS colours. Alpha is ignored — every
 * pairing rated on this page is opaque-on-opaque, and the one translucent
 * token (--overlay) is deliberately rated `null`.
 */
export function contrast(fg: string, bg: string): number | null {
  const a = toRgba(fg);
  const b = toRgba(bg);
  if (!a || !b || a.a < 1 || b.a < 1) return null;
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
