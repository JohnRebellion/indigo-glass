// 9-slice canvas renderer.
// GRUB rules: corners 1:1, n/s scale horizontally, e/w scale vertically, c fills.

export interface NineSliceImages {
  nw?: HTMLImageElement;
  n?: HTMLImageElement;
  ne?: HTMLImageElement;
  w?: HTMLImageElement;
  c?: HTMLImageElement;
  e?: HTMLImageElement;
  sw?: HTMLImageElement;
  s?: HTMLImageElement;
  se?: HTMLImageElement;
}

export function drawNineSlice(
  ctx: CanvasRenderingContext2D,
  imgs: NineSliceImages,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const nwW = imgs.nw?.naturalWidth ?? imgs.w?.naturalWidth ?? 0;
  const nwH = imgs.nw?.naturalHeight ?? imgs.n?.naturalHeight ?? 0;
  const neW = imgs.ne?.naturalWidth ?? imgs.e?.naturalWidth ?? 0;
  const neH = imgs.ne?.naturalHeight ?? imgs.n?.naturalHeight ?? 0;
  const swW = imgs.sw?.naturalWidth ?? imgs.w?.naturalWidth ?? 0;
  const swH = imgs.sw?.naturalHeight ?? imgs.s?.naturalHeight ?? 0;
  const seW = imgs.se?.naturalWidth ?? imgs.e?.naturalWidth ?? 0;
  const seH = imgs.se?.naturalHeight ?? imgs.s?.naturalHeight ?? 0;

  const leftW = Math.max(nwW, swW);
  const rightW = Math.max(neW, seW);
  const topH = Math.max(nwH, neH);
  const botH = Math.max(swH, seH);
  const midW = Math.max(0, w - leftW - rightW);
  const midH = Math.max(0, h - topH - botH);

  // Corners
  if (imgs.nw) ctx.drawImage(imgs.nw, x, y, leftW, topH);
  if (imgs.ne) ctx.drawImage(imgs.ne, x + w - rightW, y, rightW, topH);
  if (imgs.sw) ctx.drawImage(imgs.sw, x, y + h - botH, leftW, botH);
  if (imgs.se) ctx.drawImage(imgs.se, x + w - rightW, y + h - botH, rightW, botH);

  // Edges (scaled along their axis)
  if (imgs.n && midW > 0) ctx.drawImage(imgs.n, x + leftW, y, midW, topH);
  if (imgs.s && midW > 0) ctx.drawImage(imgs.s, x + leftW, y + h - botH, midW, botH);
  if (imgs.w && midH > 0) ctx.drawImage(imgs.w, x, y + topH, leftW, midH);
  if (imgs.e && midH > 0) ctx.drawImage(imgs.e, x + w - rightW, y + topH, rightW, midH);

  // Center (scaled both)
  if (imgs.c && midW > 0 && midH > 0) {
    ctx.drawImage(imgs.c, x + leftW, y + topH, midW, midH);
  }
}

const SLICE_KEYS = ['nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se'] as const;

export async function loadNineSlice(
  pattern: string,
  resolve: (relPath: string) => string | undefined
): Promise<NineSliceImages> {
  const out: NineSliceImages = {};
  const promises = SLICE_KEYS.map(async (k) => {
    const filename = pattern.replace('*', k);
    const url = resolve(filename);
    if (!url) return;
    const img = await loadImage(url);
    out[k] = img;
  });
  await Promise.all(promises);
  return out;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = (e) => rej(e);
    img.src = url;
  });
}
