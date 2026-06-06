// PFF2 binary parser.
// Spec: https://www.gnu.org/software/grub/manual/grub-dev/html_node/PFF2-Font-File-Format.html
// Magic: "FILE\x00\x00\x00\x04PFF2"
// Sections: [4-byte type][4-byte BE length][body]
// DATA section length = 0xFFFFFFFF (rest of file = glyph bitmap pool).

export interface PFF2Glyph {
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  deviceWidth: number;
  bitmap: Uint8Array;
}

export interface PFF2Font {
  name: string;
  family: string;
  weight: string;
  slant: string;
  ptsz: number;
  maxw: number;
  maxh: number;
  ascent: number;
  descent: number;
  glyphs: Map<number, PFF2Glyph>;
}

export function parsePFF2(buf: ArrayBuffer): PFF2Font {
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  // Magic check
  const magic = decodeAscii(bytes, 0, 12);
  if (!magic.startsWith('FILE') || magic.slice(8) !== 'PFF2') {
    throw new Error('Not a PFF2 file');
  }

  const font: PFF2Font = {
    name: '',
    family: '',
    weight: 'normal',
    slant: 'normal',
    ptsz: 0,
    maxw: 0,
    maxh: 0,
    ascent: 0,
    descent: 0,
    glyphs: new Map()
  };

  let off = 12;
  let chixStart = -1;
  let chixLen = 0;

  while (off < bytes.length) {
    const type = decodeAscii(bytes, off, 4);
    const len = view.getUint32(off + 4, false);
    off += 8;

    switch (type) {
      case 'NAME':
        font.name = decodeAsciiZ(bytes, off, len);
        break;
      case 'FAMI':
        font.family = decodeAsciiZ(bytes, off, len);
        break;
      case 'WEIG':
        font.weight = decodeAsciiZ(bytes, off, len);
        break;
      case 'SLAN':
        font.slant = decodeAsciiZ(bytes, off, len);
        break;
      case 'PTSZ':
        font.ptsz = view.getUint16(off, false);
        break;
      case 'MAXW':
        font.maxw = view.getUint16(off, false);
        break;
      case 'MAXH':
        font.maxh = view.getUint16(off, false);
        break;
      case 'ASCE':
        font.ascent = view.getUint16(off, false);
        break;
      case 'DESC':
        font.descent = view.getUint16(off, false);
        break;
      case 'CHIX':
        chixStart = off;
        chixLen = len;
        break;
      case 'DATA':
        // 0xFFFFFFFF terminator; remainder = glyph data pool
        // Read CHIX entries now (must've been seen already in spec order)
        if (chixStart >= 0) {
          readGlyphs(view, bytes, chixStart, chixLen, font);
        }
        return font;
    }
    if (len === 0xffffffff) break;
    off += len;
  }

  if (chixStart >= 0 && font.glyphs.size === 0) {
    readGlyphs(view, bytes, chixStart, chixLen, font);
  }
  return font;
}

function readGlyphs(
  view: DataView,
  bytes: Uint8Array,
  chixStart: number,
  chixLen: number,
  font: PFF2Font
): void {
  // CHIX entries: 4B codepoint + 1B flags + 4B absolute offset = 9 bytes
  const entrySize = 9;
  const count = Math.floor(chixLen / entrySize);
  for (let i = 0; i < count; i++) {
    const e = chixStart + i * entrySize;
    const cp = view.getUint32(e, false);
    // flags byte at e + 4 (unused for simple bitmap)
    const off = view.getUint32(e + 5, false);
    if (off + 10 > bytes.length) continue;
    const w = view.getUint16(off, false);
    const h = view.getUint16(off + 2, false);
    const xOff = view.getInt16(off + 4, false);
    const yOff = view.getInt16(off + 6, false);
    const devW = view.getInt16(off + 8, false);
    const bitmapBytes = Math.ceil((w * h) / 8);
    const bitmap = bytes.slice(off + 10, off + 10 + bitmapBytes);
    font.glyphs.set(cp, {
      width: w,
      height: h,
      xOffset: xOff,
      yOffset: yOff,
      deviceWidth: devW,
      bitmap
    });
  }
}

function decodeAscii(bytes: Uint8Array, off: number, len: number): string {
  let s = '';
  for (let i = 0; i < len && off + i < bytes.length; i++) {
    s += String.fromCharCode(bytes[off + i]);
  }
  return s;
}

function decodeAsciiZ(bytes: Uint8Array, off: number, len: number): string {
  let s = '';
  for (let i = 0; i < len && off + i < bytes.length; i++) {
    const b = bytes[off + i];
    if (b === 0) break;
    s += String.fromCharCode(b);
  }
  return s;
}

// Render a single glyph to RGBA pixel data sized w*h
export function rasteriseGlyph(
  glyph: PFF2Glyph,
  color: [number, number, number]
): ImageData {
  const { width, height, bitmap } = glyph;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bitIdx = y * width + x;
      const byteIdx = bitIdx >> 3;
      const bitMask = 0x80 >> (bitIdx & 7);
      const set = bitmap[byteIdx] && bitmap[byteIdx] & bitMask;
      const p = bitIdx * 4;
      pixels[p] = color[0];
      pixels[p + 1] = color[1];
      pixels[p + 2] = color[2];
      pixels[p + 3] = set ? 255 : 0;
    }
  }
  return new ImageData(pixels, width, height);
}
