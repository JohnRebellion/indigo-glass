import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, lstatSync, readlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseXcursor, sizes, bestSize, imageFor, framesAt, frameCount, pixelAt, straight, toRGBA, opaqueHistogram,
  XcursorError, IMAGE_TYPE, type XcFile
} from './xcursor';
import { oursSrc, stockSrc, loadTheme, parseRecipe, resolveNames, fetchUrl } from './model';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..', '..', '..');
const OURS = join(REPO, 'cursor/out/Bibata-IndigoGlass/cursors');
const STOCK = join(REPO, 'simulator/fixtures/stock/cursor/cursors');
const read = (dir: string, n: string) => parseXcursor(readFileSync(join(dir, dir === STOCK ? `${n}.xcur` : n)));

/* A synthetic file: one 2x1 image at nominal 24, hotspot (1,0). */
function synth(pixels: number[], opts: { header?: number; w?: number; h?: number } = {}): Uint8Array {
  const header = opts.header ?? 16, w = opts.w ?? 2, h = opts.h ?? 1;
  const pos = header + 12;
  const buf = new DataView(new ArrayBuffer(pos + 36 + pixels.length * 4));
  const u = (o: number, v: number) => buf.setUint32(o, v, true);
  u(0, 0x72756358); u(4, header); u(8, 0x10000); u(12, 1);
  u(header, IMAGE_TYPE); u(header + 4, 24); u(header + 8, pos);
  u(pos, 36); u(pos + 4, IMAGE_TYPE); u(pos + 8, 24); u(pos + 12, 1);
  u(pos + 16, w); u(pos + 20, h); u(pos + 24, 1); u(pos + 28, 0); u(pos + 32, 50);
  pixels.forEach((p, i) => u(pos + 36 + i * 4, p));
  return new Uint8Array(buf.buffer);
}

describe('parseXcursor header', () => {
  it('rejects bytes that are not an Xcursor file', () => {
    expect(() => parseXcursor(new TextEncoder().encode('[Icon Theme]\nName=x\n'))).toThrow(XcursorError);
    expect(() => parseXcursor(new Uint8Array([0x58, 0x63, 0x75, 0x72]))).toThrow(/shorter/);
    const png = new Uint8Array(32); png.set([0x89, 0x50, 0x4e, 0x47]);
    expect(() => parseXcursor(png)).toThrow(/bad magic/);
  });

  it('rejects a TOC that runs past the end of the file', () => {
    const b = synth([0, 0]);
    new DataView(b.buffer).setUint32(12, 999, true);
    expect(() => parseXcursor(b)).toThrow(/truncated/);
  });

  it('reads the TOC at offset `header`, not at 16 (libXcursor skips header-16)', () => {
    const f = parseXcursor(synth([0xff112233, 0], { header: 24 }));
    expect(f.header).toBe(24);
    expect(f.tocs).toEqual([{ type: IMAGE_TYPE, subtype: 24, position: 36 }]);
    expect(imageFor(f, 24)).toMatchObject({ width: 2, height: 1, xhot: 1, yhot: 0, delay: 50 });
  });

  it('refuses a hotspot outside the image, as _XcursorReadImage does', () => {
    const b = synth([0, 0]);
    new DataView(b.buffer).setUint32(28 + 24, 5, true); /* xhot = 5 > width 2 */
    expect(() => imageFor(parseXcursor(b), 24)).toThrow(/hotspot/);
  });
});

describe('real files: TOC, size pick, hotspot', () => {
  it('Bibata left_ptr: 14 image chunks, one per nominal size 16..96', () => {
    const f = read(OURS, 'left_ptr');
    expect(f.version).toBe(0x10000);
    expect(f.tocs).toHaveLength(14);
    expect(sizes(f)).toEqual([16, 20, 22, 24, 28, 32, 40, 48, 56, 64, 72, 80, 88, 96]);
  });

  it('Bibata wait: 54 animation frames at every size', () => {
    const f = read(OURS, 'wait');
    expect(f.tocs).toHaveLength(14 * 54);
    expect(frameCount(f, 24)).toBe(54);
  });

  it('Breeze default: 11 sizes 12..72 in steps of 6', () => {
    const f = read(STOCK, 'default');
    expect(sizes(f)).toEqual([12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72]);
  });

  it('picks the nearest nominal size; a tie keeps the first in the TOC', () => {
    const b = read(OURS, 'left_ptr'), s = read(STOCK, 'default');
    expect([24, 32, 48].map((n) => bestSize(b, n))).toEqual([24, 32, 48]);
    expect([24, 32, 48].map((n) => bestSize(s, n))).toEqual([24, 30, 48]);
    /* 26 is 2 from both 24 and 28; 24 comes first */
    expect(bestSize(b, 26)).toBe(24);
    expect(bestSize(s, 27)).toBe(24);
    expect(bestSize(b, 500)).toBe(96);
  });

  it('extracts the hotspot and the real image size (Breeze pads 24 into 32x32)', () => {
    expect(imageFor(read(OURS, 'left_ptr'), 24)).toMatchObject({ size: 24, width: 24, height: 24, xhot: 5, yhot: 1 });
    expect(imageFor(read(OURS, 'hand2'), 48)).toMatchObject({ width: 48, xhot: 21, yhot: 3 });
    expect(imageFor(read(OURS, 'top_right_corner'), 32)).toMatchObject({ xhot: 28, yhot: 3 });
    expect(imageFor(read(STOCK, 'default'), 24)).toMatchObject({ size: 24, width: 32, height: 32, xhot: 4, yhot: 4 });
  });

  it('every shipped cursor file parses and has an image near 24', () => {
    const names = readdirSync(OURS).filter((n) => !lstatSync(join(OURS, n)).isSymbolicLink());
    expect(names).toHaveLength(56);
    for (const n of names) expect(imageFor(read(OURS, n), 24).width, n).toBeGreaterThan(0);
  });
});

describe('pixels', () => {
  it('undoes premultiplied alpha', () => {
    expect(straight(0x80404040)).toEqual([128, 128, 128, 128]);
    expect(straight(0x00000000)).toEqual([0, 0, 0, 0]);
    expect(straight(0xffa6c9a6)).toEqual([0xa6, 0xc9, 0xa6, 255]);
    /* clickgen stores 50% #F8F8F8 as trunc(248*128/255) = 0x7C. Straight
       alpha must bring it back near F8 (the 8-bit round trip loses <= 1),
       not leave 0x7C, which is the dark fringe. */
    const [r] = straight(0x807c7c7c);
    expect(Math.abs(r - 0xf8)).toBeLessThanOrEqual(1);
    expect(straight(0x80808080)).toEqual([255, 255, 255, 128]);
    const f = parseXcursor(synth([0x80808080, 0xff07080a]));
    expect([...toRGBA(imageFor(f, 24))]).toEqual([255, 255, 255, 128, 0x07, 0x08, 0x0a, 255]);
  });

  it('Bibata default @96: body #07080A, outline #F8F8F8 (from the #00FF00 / #0000FF slots)', () => {
    const img = imageFor(read(OURS, 'left_ptr'), 96);
    const h = opaqueHistogram(img);
    expect(h[0][0]).toBe('#07080A');
    expect(h[1][0]).toBe('#F8F8F8');
    /* the hotspot pixel is transparent-ish edge; a pixel well inside the arrow is body */
    expect(pixelAt(img, 30, 40)).toEqual([0x07, 0x08, 0x0a, 255]);
  });

  it('the accent reaches only the wait / progress spinner', () => {
    const f = read(OURS, 'wait');
    const h = new Map(opaqueHistogram(framesAt(f, 96)[0]));
    expect(h.get('#A6C9A6')).toBeGreaterThan(100);
    expect(opaqueHistogram(imageFor(read(OURS, 'crossed_circle'), 96))[0][0]).toBe('#FE0000');
  });

  it('the shipped pixels really are premultiplied (every channel <= alpha)', () => {
    for (const n of ['left_ptr', 'hand2', 'xterm']) {
      const img = imageFor(read(OURS, n), 24);
      const bad = [...img.pixels].filter((p) => [16, 8, 0].some((s) => ((p >>> s) & 255) > p >>> 24));
      expect(bad, n).toEqual([]);
    }
    /* and a half-transparent edge pixel of the white outline un-premultiplies to near-white */
    const img = imageFor(read(OURS, 'left_ptr'), 96);
    const edge = [...img.pixels].map(straight).filter(([r, g, b, a]) => a > 60 && a < 200 && r > 200);
    expect(edge.length).toBeGreaterThan(20);
  });
});

describe('model', () => {
  it('reads the recipe slot table from build-bibata.sh', () => {
    const r = parseRecipe(readFileSync(join(REPO, 'cursor/build-bibata.sh'), 'utf8'));
    expect(r.vars).toEqual({ ACCENT: '#A6C9A6', OUTLINE: '#07080A', BASE: '#F8F8F8' });
    expect(r.slots).toEqual({ '#00FF00': '#07080A', '#0000FF': '#F8F8F8', '#FF0000': '#A6C9A6' });
  });

  it('names from the ?url glob match the real symlinks on disk', () => {
    for (const [dir, src] of [[OURS, oursSrc], [STOCK, stockSrc]] as const) {
      const disk: Record<string, string> = {};
      const regular: string[] = [];
      const bare = (n: string) => n.replace(/\.xcur$/, '');
      for (const n of readdirSync(dir).filter((f) => dir === OURS || f.endsWith('.xcur'))) {
        if (lstatSync(join(dir, n)).isSymbolicLink()) {
          /* follow chains to the final real file */
          let t = n;
          while (lstatSync(join(dir, t)).isSymbolicLink()) t = readlinkSync(join(dir, t));
          disk[bare(n)] = bare(t);
        } else regular.push(bare(n));
      }
      expect(src.aliases).toEqual(disk);
      expect(src.regular).toEqual(regular.sort());
    }
  });

  it('adds the dev-server slash only to extensionless /@fs/ paths in dev', () => {
    expect(fetchUrl('/@fs/r/cursors/left_ptr', true)).toBe('/@fs/r/cursors/left_ptr/');
    expect(fetchUrl('/fixtures/stock/cursor/cursors/default.xcur', true)).toBe('/fixtures/stock/cursor/cursors/default.xcur');
    expect(fetchUrl('/@fs/r/cursors/left_ptr', false)).toBe('/@fs/r/cursors/left_ptr');
    expect(fetchUrl('./_app/immutable/assets/left_ptr-AbC12', true)).toBe('./_app/immutable/assets/left_ptr-AbC12');
  });

  it('resolves a static-build asset URL (name-<hash>) to the real name', () => {
    const r = resolveNames({ 'x/left_ptr': 'assets/left_ptr-AbC12_x9', 'x/arrow': 'assets/left_ptr-AbC12_x9', 'x/left_ptr_watch': 'assets/left_ptr_watch-Zz9' });
    expect(r.aliases).toEqual({ arrow: 'left_ptr' });
    expect(r.regular).toEqual(['left_ptr', 'left_ptr_watch']);
  });

  it('loads a theme and samples the painted colours', async () => {
    const fetcher = async (url: string) => {
      const n = url.split('/').pop()!;
      const b = readFileSync(join(url.includes('fixtures/stock') ? STOCK : OURS, n));
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    };
    const ours = await loadTheme(oursSrc, fetcher);
    expect(ours.realName('default')).toBe('left_ptr');
    expect(ours.realName('grabbing')).toBe('grabbing');
    expect(ours.sample).toMatchObject({ body: '#07080A', outline: '#F8F8F8', accent: '#A6C9A6' });
    const stock = await loadTheme(stockSrc, fetcher);
    expect(stock.realName('move')).toBe('dnd-move');
    expect(Object.keys(stock.files)).toHaveLength(13);
  });
});

export type { XcFile };
