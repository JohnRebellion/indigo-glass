// Liquid-glass renderer.
// Replaces flat 9-slice panels with a real frosted glass effect by:
//   1. Sampling the rendered bg region under the target rect
//   2. Heavy gaussian blur via ctx.filter
//   3. Tinted overlay (palette-driven)
//   4. Subtle noise grain
//   5. Top specular highlight (light gradient on top 30% inside)
//   6. Edge lighting: bright top-inset stroke + dark bottom-inset stroke
//   7. Outer drop shadow for floating depth
//
// Inspired by Apple Liquid Glass + KDE Plasma frosted dropdown semantics.

export interface LiquidGlassOpts {
  radius?: number;
  tint?: [number, number, number, number]; // RGBA 0-1 alpha
  blurPx?: number;
  borderTopColor?: string;
  borderBottomColor?: string;
  borderWidth?: number;
  specularStrength?: number; // 0-1
  noiseStrength?: number; // 0-1
  outerShadow?: boolean;
  /** If true, skip all internal gradient layers (specular, sharp highlight, bottom shadow). Flat frosted look. */
  flat?: boolean;
  /**
   * Apple-style internal glow mode (no hard borders). Tint becomes a radial fade
   * from center; subtle 1-px specular at very top; no bottom shadow stroke.
   */
  glow?: boolean;
  /**
   * If provided, this canvas is sampled for the backdrop blur instead of the
   * destination canvas. Use this for stacked glass (e.g. pill ON TOP of panel)
   * so the pill samples the original bg, not the panel's frosted output.
   */
  sourceCanvas?: HTMLCanvasElement | null;
}

const DEFAULTS: Required<Omit<LiquidGlassOpts, 'sourceCanvas'>> & {
  sourceCanvas?: HTMLCanvasElement | null;
} = {
  radius: 18,
  tint: [31, 32, 40, 0.42],
  blurPx: 36,
  borderTopColor: 'rgba(255,255,255,0.34)',
  borderBottomColor: 'rgba(0,0,0,0.55)',
  borderWidth: 1,
  specularStrength: 0.18,
  noiseStrength: 0.04,
  outerShadow: true,
  flat: false,
  glow: false,
  sourceCanvas: null
};

/**
 * Draw a liquid-glass panel.
 * Reads pixels under (x,y,w,h) on the same canvas, so this MUST be called AFTER
 * background + any underlying layers are drawn.
 */
export function drawLiquidGlass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: LiquidGlassOpts = {}
): void {
  const o = { ...DEFAULTS, ...opts };

  // 1. Capture underlying bg — prefer external source canvas for stacked glass
  const src = o.sourceCanvas ?? ctx.canvas;
  const dx = Math.max(0, Math.floor(x));
  const dy = Math.max(0, Math.floor(y));
  const dw = Math.min(src.width - dx, Math.ceil(w));
  const dh = Math.min(src.height - dy, Math.ceil(h));
  if (dw <= 0 || dh <= 0) return;

  // Pad blur source by 3x blurPx so blur sampling has neighbors and edges
  // don't fade to transparent within the slice we will draw.
  const pad = Math.ceil(o.blurPx * 3);
  const srcX = Math.max(0, dx - pad);
  const srcY = Math.max(0, dy - pad);
  const srcW = Math.min(src.width - srcX, dw + pad * 2);
  const srcH = Math.min(src.height - srcY, dh + pad * 2);

  // Offscreen canvas for blur sample
  const off = document.createElement('canvas');
  off.width = srcW;
  off.height = srcH;
  const offCtx = off.getContext('2d');
  if (!offCtx) return;

  // 2. Apply blur via canvas filter while drawing source onto offscreen
  offCtx.filter = `blur(${o.blurPx}px)`;
  offCtx.drawImage(src, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
  offCtx.filter = 'none';

  // 3. Outer drop shadow — draws a near-transparent fill so the SHADOW renders
  //    outside while the panel area stays empty for the blurred bg pass.
  ctx.save();
  if (o.outerShadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 56;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.01)'; // near-transparent: shadow only
    roundedRectPath(ctx, x, y, w, h, o.radius);
    ctx.fill();
    ctx.restore();
  }

  // 4. Clip to rounded rect for glass body
  ctx.beginPath();
  roundedRectPath(ctx, x, y, w, h, o.radius);
  ctx.clip();

  // 5. Paint blurred bg slice
  const offSrcX = dx - srcX;
  const offSrcY = dy - srcY;
  ctx.drawImage(off, offSrcX, offSrcY, dw, dh, x, y, w, h);

  // 6. Tint overlay
  if (o.glow) {
    // Radial glow: brightest at center, fades to half-alpha at edges.
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.max(w, h) / 1.4;
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const a = o.tint[3];
    radial.addColorStop(0, `rgba(${o.tint[0]}, ${o.tint[1]}, ${o.tint[2]}, ${a})`);
    radial.addColorStop(1, `rgba(${o.tint[0]}, ${o.tint[1]}, ${o.tint[2]}, ${a * 0.35})`);
    ctx.fillStyle = radial;
    ctx.fillRect(x, y, w, h);
  } else {
    ctx.fillStyle = `rgba(${o.tint[0]}, ${o.tint[1]}, ${o.tint[2]}, ${o.tint[3]})`;
    ctx.fillRect(x, y, w, h);
  }

  // Flat mode: skip all gradient layers
  if (o.flat) {
    if (o.noiseStrength > 0) drawNoise(ctx, x, y, w, h, o.noiseStrength);
    ctx.restore();
    drawBorder(ctx, x, y, w, h, o);
    return;
  }

  // Glow mode: skip border + bottom shadow; just thin top specular highlight
  if (o.glow) {
    const sharpH = Math.max(2, h * 0.08);
    const sharpGrad = ctx.createLinearGradient(x, y, x, y + sharpH);
    sharpGrad.addColorStop(0, `rgba(255,255,255,${Math.min(0.85, o.specularStrength)})`);
    sharpGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sharpGrad;
    ctx.fillRect(x + o.radius * 0.5, y, w - o.radius, sharpH);
    if (o.noiseStrength > 0) drawNoise(ctx, x, y, w, h, o.noiseStrength);
    ctx.restore();
    // No border in glow mode — internal glow communicates state
    return;
  }

  // 7. Top specular highlight — broad fade from top
  const grad = ctx.createLinearGradient(x, y, x, y + h * 0.5);
  grad.addColorStop(0, `rgba(255,255,255,${o.specularStrength * 0.7})`);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h * 0.5);

  // 7b. Sharp inner highlight strip just inside top border (Apple liquid signature)
  const sharpH = Math.max(2, h * 0.025);
  const sharpGrad = ctx.createLinearGradient(x, y + 1, x, y + 1 + sharpH);
  sharpGrad.addColorStop(0, `rgba(255,255,255,${Math.min(1, o.specularStrength * 2.2)})`);
  sharpGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sharpGrad;
  ctx.fillRect(x + o.radius * 0.6, y + 1, w - o.radius * 1.2, sharpH);

  // 7c. Bottom edge faint glow (light bouncing off glass underside)
  const botGrad = ctx.createLinearGradient(x, y + h - h * 0.08, x, y + h);
  botGrad.addColorStop(0, 'rgba(255,255,255,0)');
  botGrad.addColorStop(1, `rgba(255,255,255,${o.specularStrength * 0.25})`);
  ctx.fillStyle = botGrad;
  ctx.fillRect(x, y + h - h * 0.08, w, h * 0.08);

  // 8. Bottom inner shadow (subtle)
  const grad2 = ctx.createLinearGradient(x, y + h * 0.6, x, y + h);
  grad2.addColorStop(0, 'rgba(0,0,0,0)');
  grad2.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = grad2;
  ctx.fillRect(x, y + h * 0.6, w, h * 0.4);

  // 9. Noise grain
  if (o.noiseStrength > 0) {
    drawNoise(ctx, x, y, w, h, o.noiseStrength);
  }

  ctx.restore();

  drawBorder(ctx, x, y, w, h, o);
}

function drawBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  o: Required<Omit<LiquidGlassOpts, 'sourceCanvas'>> & { sourceCanvas?: HTMLCanvasElement | null }
): void {
  ctx.save();
  ctx.strokeStyle = o.borderTopColor;
  ctx.lineWidth = o.borderWidth;
  ctx.beginPath();
  roundedRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, o.radius - 0.5);
  ctx.stroke();

  if (!o.flat) {
    ctx.beginPath();
    ctx.rect(x, y + h * 0.55, w, h * 0.45);
    ctx.clip();
    ctx.strokeStyle = o.borderBottomColor;
    ctx.lineWidth = o.borderWidth;
    ctx.beginPath();
    roundedRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, o.radius - 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Cheap noise: render onto offscreen canvas first, then composite with
// source-over so we DON'T overwrite underlying pixels (putImageData ignores
// composite + clip — it sets pixels directly, which would erase the glass).
function drawNoise(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  strength: number
): void {
  const cw = Math.ceil(w);
  const ch = Math.ceil(h);
  if (cw <= 0 || ch <= 0) return;
  const tmp = document.createElement('canvas');
  tmp.width = cw;
  tmp.height = ch;
  const tctx = tmp.getContext('2d');
  if (!tctx) return;
  const id = tctx.createImageData(cw, ch);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : 255;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = Math.random() * 255 * strength;
  }
  tctx.putImageData(id, 0, 0);
  ctx.drawImage(tmp, Math.floor(x), Math.floor(y));
}
