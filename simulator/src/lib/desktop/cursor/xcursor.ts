/* Xcursor file reader — the compiled cursor binaries a theme ships.
 *
 * Layout checked against libXcursor 1.2.3 (Fedora's
 * /usr/include/X11/Xcursor/Xcursor.h, libXcursor-devel-1.2.3-4.fc44) and
 * gitlab.freedesktop.org/xorg/lib/libxcursor src/file.c
 * (_XcursorReadFileHeader, _XcursorFindBestSize, _XcursorReadImage):
 *
 *   FileHeader  magic "Xcur" | header (bytes) | version | ntoc   CARD32 LE each
 *               then ntoc x FileToc, starting at offset `header` (the reader
 *               skips header-16 bytes, so a longer header is legal)
 *   FileToc     type | subtype (nominal size for images) | position   12 bytes
 *   Chunk       header | type | subtype | version            16 bytes, then
 *   Image       width | height | xhot | yhot | delay         20 bytes, then
 *               width*height CARD32 pixels, ARGB, A in the high byte
 *
 * Pixels are PREMULTIPLIED alpha: xcursorgen (xcursorgen.c premultiply_data)
 * and clickgen, which built Bibata (clickgen/writer/x11.py premultiply_alpha),
 * both multiply RGB by A before writing, because XRender's ARGB32 cursor
 * picture is premultiplied. Canvas ImageData is straight alpha, so `toRGBA`
 * divides it back out; drawing the raw bytes would put a dark fringe on
 * every anti-aliased edge. */

export const XCURSOR_MAGIC = 0x72756358; /* "Xcur" read little-endian */
export const IMAGE_TYPE = 0xfffd0002;
export const COMMENT_TYPE = 0xfffe0001;
const FILE_HEADER_LEN = 16;
const TOC_LEN = 12;
const IMAGE_HEADER_LEN = 16 + 20;
const IMAGE_MAX_SIZE = 0x7fff;

export type Toc = { type: number; subtype: number; position: number };
export type XcFile = { header: number; version: number; tocs: Toc[]; view: DataView };
export type XcImage = {
  /* Nominal size the theme matches against (Xcursor size / XCURSOR_SIZE). */
  size: number;
  width: number;
  height: number;
  xhot: number;
  yhot: number;
  /* Milliseconds to the next frame; meaningful only when a size has several. */
  delay: number;
  /* Premultiplied ARGB, one CARD32 per pixel, row-major. */
  pixels: Uint32Array;
};

export class XcursorError extends Error {}

function asView(buf: ArrayBuffer | Uint8Array): DataView {
  return buf instanceof Uint8Array ? new DataView(buf.buffer, buf.byteOffset, buf.byteLength) : new DataView(buf);
}

export function parseXcursor(buf: ArrayBuffer | Uint8Array): XcFile {
  const view = asView(buf);
  if (view.byteLength < FILE_HEADER_LEN) throw new XcursorError('not an Xcursor file: shorter than the 16-byte header');
  const u = (o: number) => view.getUint32(o, true);
  if (u(0) !== XCURSOR_MAGIC) throw new XcursorError('not an Xcursor file: bad magic');
  const header = u(4), version = u(8), ntoc = u(12);
  if (header < FILE_HEADER_LEN) throw new XcursorError(`header length ${header} < 16`);
  if (header + ntoc * TOC_LEN > view.byteLength) throw new XcursorError(`truncated: ${ntoc} TOC entries do not fit`);
  const tocs: Toc[] = [];
  for (let i = 0; i < ntoc; i++) {
    const o = header + i * TOC_LEN;
    tocs.push({ type: u(o), subtype: u(o + 4), position: u(o + 8) });
  }
  return { header, version, tocs, view };
}

/* Distinct nominal sizes of the image chunks, ascending. */
export function sizes(f: XcFile): number[] {
  return [...new Set(f.tocs.filter((t) => t.type === IMAGE_TYPE).map((t) => t.subtype))].sort((a, b) => a - b);
}

/* libXcursor's _XcursorFindBestSize: the image size nearest the request;
   on a tie the one met first in the TOC wins (it only replaces on strictly
   smaller distance). 0 when the file has no image. */
export function bestSize(f: XcFile, want: number): number {
  let best = 0;
  for (const t of f.tocs) {
    if (t.type !== IMAGE_TYPE) continue;
    if (!best || Math.abs(t.subtype - want) < Math.abs(best - want)) best = t.subtype;
  }
  return best;
}

export function readImage(f: XcFile, tocIndex: number): XcImage {
  const t = f.tocs[tocIndex];
  if (!t || t.type !== IMAGE_TYPE) throw new XcursorError(`TOC ${tocIndex} is not an image`);
  const { view } = f;
  if (t.position + IMAGE_HEADER_LEN > view.byteLength) throw new XcursorError(`image ${tocIndex} header past end of file`);
  const u = (o: number) => view.getUint32(t.position + o, true);
  /* Chunk header sanity check, as _XcursorFileReadChunkHeader does. */
  if (u(4) !== t.type || u(8) !== t.subtype) throw new XcursorError(`image ${tocIndex}: chunk header disagrees with TOC`);
  const width = u(16), height = u(20), xhot = u(24), yhot = u(28), delay = u(32);
  if (!width || !height || width > IMAGE_MAX_SIZE || height > IMAGE_MAX_SIZE) throw new XcursorError(`image ${tocIndex}: bad size ${width}x${height}`);
  if (xhot > width || yhot > height) throw new XcursorError(`image ${tocIndex}: hotspot outside image`);
  /* libXcursor reads pixels straight after the 5 image fields, whatever the
     chunk header's own length field says; so does this. */
  const start = t.position + IMAGE_HEADER_LEN;
  if (start + width * height * 4 > view.byteLength) throw new XcursorError(`image ${tocIndex}: pixel data truncated`);
  const pixels = new Uint32Array(width * height);
  for (let i = 0; i < pixels.length; i++) pixels[i] = view.getUint32(start + i * 4, true);
  return { size: t.subtype, width, height, xhot, yhot, delay, pixels };
}

/* Every frame at one nominal size, in TOC order (XcursorFileLoadImages). */
export function framesAt(f: XcFile, size: number): XcImage[] {
  return f.tocs.flatMap((t, i) => (t.type === IMAGE_TYPE && t.subtype === size ? [readImage(f, i)] : []));
}

export function frameCount(f: XcFile, size: number): number {
  return f.tocs.filter((t) => t.type === IMAGE_TYPE && t.subtype === size).length;
}

/* First frame at the size libXcursor would pick for `want`. */
export function imageFor(f: XcFile, want: number): XcImage {
  const s = bestSize(f, want);
  const i = f.tocs.findIndex((t) => t.type === IMAGE_TYPE && t.subtype === s);
  if (i < 0) throw new XcursorError('no image chunk');
  return readImage(f, i);
}

/* One pixel with the premultiplication undone: straight 0-255 channels. */
export function straight(p: number): [number, number, number, number] {
  const a = p >>> 24;
  if (a === 0) return [0, 0, 0, 0];
  const un = (c: number) => Math.min(255, Math.round((c * 255) / a));
  return [un((p >>> 16) & 255), un((p >>> 8) & 255), un(p & 255), a];
}

export function pixelAt(img: XcImage, x: number, y: number): [number, number, number, number] {
  return straight(img.pixels[y * img.width + x]);
}

/* Canvas-ready RGBA (straight alpha). */
export function toRGBA(img: XcImage): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(new ArrayBuffer(img.width * img.height * 4));
  for (let i = 0; i < img.pixels.length; i++) out.set(straight(img.pixels[i]), i * 4);
  return out;
}

const hex2 = (n: number) => n.toString(16).padStart(2, '0');
export const rgbHex = ([r, g, b]: [number, number, number, number] | number[]) => `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();

/* Opaque colours by pixel count, most common first. Only A=255 pixels are
   counted: those are the fills and outlines the SVG painted, not the
   anti-aliased edge or the soft drop shadow. */
export function opaqueHistogram(img: XcImage): [string, number][] {
  const m = new Map<string, number>();
  for (const p of img.pixels) {
    if (p >>> 24 !== 255) continue;
    const h = rgbHex(straight(p));
    m.set(h, (m.get(h) ?? 0) + 1);
  }
  return [...m].sort((a, b) => b[1] - a[1]);
}
