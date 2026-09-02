// Ink panel renderer — replaces the deleted liquid-glass renderer (backdrop
// blur, tint film, specular highlight, noise grain) with Sage Ink's material:
// opaque flat fill, colour-as-elevation, and a hard offset shadow with zero
// blur. No sampling of the canvas behind the panel is needed any more since
// the fill is opaque, not a frosted read-through of the background.

export interface InkPanelOpts {
  radius?: number;
  /** Opaque RGB fill. Was a 4-tuple RGBA tint over a blurred backdrop; ink
   * has no backdrop to tint, so only the RGB survives — alpha is dropped
   * rather than simulated, matching "colour communicates state, not
   * translucency" elsewhere in this system. */
  fill?: [number, number, number];
  /** Uniform 4-side border colour. Was borderTopColor/borderBottomColor (a
   * two-tone bevel simulating a light source) — a skeuomorphic/glass
   * technique, not the neobrutalism.dev reference's border-border, which is
   * pure black on every side regardless of the panel's own fill colour. */
  borderColor?: string;
  borderWidth?: number;
  /** Hard offset shadow (8px, zero blur) — matches --ig-shadow-ink. Was
   * `outerShadow`, a soft drop shadow. */
  shadow?: boolean;
}

const DEFAULTS: Required<InkPanelOpts> = {
  radius: 0,
  fill: [18, 18, 22],
  // border_strong. Was '#000000', which is 1.08:1 on this page and not
  // visible — the same non-implementation corrected across every other layer
  // on 2026-09-02.
  borderColor: '#5E5E60',
  borderWidth: 2,
  shadow: true
};

/** [shadow].ink offset. Was 8 — the 2026-08-28 doubling, reverted the same
 *  day everywhere except the hand-maintained layers. */
const INK_OFFSET = 4;

/** Relative luminance of an sRGB triple, for choosing the shadow tone. */
function luminance([r, g, b]: readonly [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/**
 * Draw an ink panel: opaque flat fill + hard offset shadow. Unlike the
 * liquid-glass renderer this replaces, it does not need to be called after
 * the background is drawn — there's nothing to sample.
 */
export function drawInkPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: InkPanelOpts = {}
) {
  const o = { ...DEFAULTS, ...opts };
  ctx.save();

  if (o.shadow) {
    // Light fill -> base-coloured shadow; dark fill -> sage. Black on a dark
    // panel measured 1.05:1 and was doing nothing. 0.179 is the luminance at
    // which black and white contrast equally.
    const fillIsLight = luminance(o.fill as readonly [number, number, number]) > 0.179;
    ctx.fillStyle = fillIsLight ? 'rgba(7,8,10,0.9)' : 'rgba(137,168,137,0.9)';
    roundRectPath(ctx, x + INK_OFFSET, y + INK_OFFSET, w, h, o.radius);
    ctx.fill();
  }

  const [r, g, b] = o.fill;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  roundRectPath(ctx, x, y, w, h, o.radius);
  ctx.fill();

  if (o.borderWidth > 0) {
    ctx.save();
    roundRectPath(ctx, x + o.borderWidth / 2, y + o.borderWidth / 2, w - o.borderWidth, h - o.borderWidth, o.radius);
    ctx.lineWidth = o.borderWidth;
    ctx.strokeStyle = o.borderColor;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}
