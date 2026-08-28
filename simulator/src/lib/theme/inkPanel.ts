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
  borderTopColor?: string;
  borderBottomColor?: string;
  borderWidth?: number;
  /** Hard offset shadow (8px, zero blur) — matches --ig-shadow-ink. Was
   * `outerShadow`, a soft drop shadow. */
  shadow?: boolean;
}

const DEFAULTS: Required<InkPanelOpts> = {
  radius: 0,
  fill: [18, 18, 22],
  borderTopColor: 'rgba(255,255,255,0.10)',
  borderBottomColor: 'rgba(0,0,0,0.55)',
  borderWidth: 1,
  shadow: true
};

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
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    roundRectPath(ctx, x + 8, y + 8, w, h, o.radius);
    ctx.fill();
  }

  const [r, g, b] = o.fill;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  roundRectPath(ctx, x, y, w, h, o.radius);
  ctx.fill();

  if (o.borderWidth > 0) {
    ctx.save();
    roundRectPath(ctx, x, y, w, h, o.radius);
    ctx.clip();
    ctx.lineWidth = o.borderWidth;
    ctx.strokeStyle = o.borderTopColor;
    ctx.beginPath();
    ctx.moveTo(x, y + o.borderWidth / 2);
    ctx.lineTo(x + w, y + o.borderWidth / 2);
    ctx.stroke();
    ctx.strokeStyle = o.borderBottomColor;
    ctx.beginPath();
    ctx.moveTo(x, y + h - o.borderWidth / 2);
    ctx.lineTo(x + w, y + h - o.borderWidth / 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}
