/* Cursor theme: the compiled Xcursor binaries, parsed in the browser.
 *
 * Stock: breeze_cursors from breeze-cursor-theme 6.7.4 (fixtures/stock/cursor,
 * copied byte for byte). Ours: cursor/out/Bibata-IndigoGlass/, the directory
 * cursor/README.md tells you to copy to ~/.local/share/icons — read in place,
 * never copied into the simulator.
 *
 * Loading: every cursor file is imported with Vite's `?url` and fetched as an
 * ArrayBuffer. `?url` works on extensionless files (Vite's asset plugin keys
 * on the query, not the extension) and in a static build resolves to an
 * emitted asset. `?raw` would decode the binary as UTF-8 and corrupt it;
 * `?inline` would base64 ~28 MB into the JS bundle. One dev-server snag:
 * `vite dev` treats a request for an extensionless path as a JS module
 * (isJSRequest) and 500s trying to transform the binary. So in dev only,
 * the shipped files (served from /@fs/, outside the simulator root) are
 * fetched with a trailing "/", which the transform skips and sirv strips;
 * and the stock copies, which are ours to name, carry a `.xcur` extension.
 *
 * Names: a theme is a directory of real files plus symlinks (arrow ->
 * left_ptr). Vite resolves a symlink to its real path before building the
 * URL, so names that share a URL are one file; the real one is the name the
 * URL ends in. The unit test checks this against fs.readlinkSync. */
import recipeText from '../../../../../cursor/build-bibata.sh?raw';
import gtkSettingsText from '../../../../../config/gtk-3.0/settings.ini?raw';
import stockIndexText from '../../../../fixtures/stock/cursor/index.theme?raw';
import { parseIni, type IniDoc } from '../ini';
import { cssVars } from '../surface';
import { PALETTE } from '../tokens';
import { parseXcursor, imageFor, opaqueHistogram, framesAt, sizes, type XcFile } from './xcursor';

/* cursor/out/ is gitignored build output, absent from a fresh clone until
   cursor/build-bibata.sh runs. A glob of a missing file is an empty map, not
   a failed import, so the registry (eager) and every other /desktop/ page
   still load; this page reports OURS_BUILT instead. */
const OURS_TEXT = import.meta.glob('../../../../../cursor/out/Bibata-IndigoGlass/{index,cursor}.theme', {
  query: '?raw', import: 'default', eager: true
}) as Record<string, string>;
const oursText = (f: string) => OURS_TEXT[`../../../../../cursor/out/Bibata-IndigoGlass/${f}`] ?? '';
const oursIndexText = oursText('index.theme');
const oursCursorText = oursText('cursor.theme');
const OURS_URLS = import.meta.glob('../../../../../cursor/out/Bibata-IndigoGlass/cursors/*', {
  query: '?url', import: 'default', eager: true
}) as Record<string, string>;
const STOCK_URLS = import.meta.glob('../../../../fixtures/stock/cursor/cursors/*.xcur', {
  query: '?url', import: 'default', eager: true
}) as Record<string, string>;

/* The pointer shapes a desktop actually asks for, by freedesktop / CSS name
   (what Qt, GTK and wp_cursor_shape_v1 request). Each theme resolves the
   name through its own symlinks. */
export const SPECIMENS: { name: string; label: string }[] = [
  { name: 'default', label: 'Default' },
  { name: 'pointer', label: 'Pointer' },
  { name: 'text', label: 'Text' },
  { name: 'wait', label: 'Wait' },
  { name: 'progress', label: 'Progress' },
  { name: 'crosshair', label: 'Crosshair' },
  { name: 'move', label: 'Move' },
  { name: 'not-allowed', label: 'Not allowed' },
  { name: 'n-resize', label: 'Resize N' },
  { name: 'e-resize', label: 'Resize E' },
  { name: 'ne-resize', label: 'Resize NE' },
  { name: 'nw-resize', label: 'Resize NW' },
  { name: 'help', label: 'Help' },
  { name: 'grabbing', label: 'Grabbing' }
];

/* GTK is the one shipped file that names a size (config/gtk-3.0/settings.ini
   gtk-cursor-theme-size); Plasma's kcminputrc default is the same 24. The
   hosts/*.toml profiles carry no cursor size. */
export const gtk = parseIni(gtkSettingsText);
export const SHIPPED_SIZE = Number(gtk.get('Settings', 'gtk-cursor-theme-size') ?? 24);
export const SHIPPED_THEME = gtk.get('Settings', 'gtk-cursor-theme-name') ?? '';
export const NOMINAL = [SHIPPED_SIZE, 32, 48].filter((v, i, a) => a.indexOf(v) === i);

/* The build recipe's own colour table: ACCENT / OUTLINE / BASE and which
   Bibata placeholder each replaces. Read from the script, not retyped. */
export function parseRecipe(text: string) {
  const v = (k: string) => text.match(new RegExp(`^${k}="(#[0-9A-Fa-f]{6})"`, 'm'))?.[1]?.toUpperCase() ?? '';
  const vars: Record<string, string> = { ACCENT: v('ACCENT'), OUTLINE: v('OUTLINE'), BASE: v('BASE') };
  /* {"match": "#00FF00", "replace": outline}, ... inside the render.json patch */
  const slots: Record<string, string> = {};
  for (const m of text.matchAll(/"match":\s*"(#[0-9A-Fa-f]{6})",\s*"replace":\s*(\w+)/g)) slots[m[1].toUpperCase()] = vars[m[2].toUpperCase()] ?? '';
  return { vars, slots };
}
export const recipe = parseRecipe(recipeText);

/* What each Bibata placeholder paints, from upstream svg/modern/*.svg
   (Bibata_Cursor 35ccfe20): left_ptr.svg is fill="#00FF00" stroke="#0000FF",
   and render.json's Amber variant maps #00FF00 to its amber body. So
   #00FF00 is the BODY and #0000FF the OUTLINE — the opposite of the labels
   in build-bibata.sh's comment ("#00FF00 -> outline"). */
export const SLOT_MEANING: Record<string, string> = { '#00FF00': 'body fill', '#0000FF': 'outline', '#FF0000': 'accent (wait spinner)' };

export type ThemeSrc = {
  which: 'stock' | 'ours';
  theme: string;
  dir: string;
  index: IniDoc;
  cursorTheme?: IniDoc;
  /* name -> URL of the real file */
  urls: Record<string, string>;
  /* real file names, and symlink name -> real name */
  regular: string[];
  aliases: Record<string, string>;
};

export function resolveNames(globbed: Record<string, string>) {
  const byUrl = new Map<string, string[]>();
  for (const [path, url] of Object.entries(globbed)) {
    const name = path.split('/').pop()!.replace(/\.xcur$/, '');
    byUrl.set(url, [...(byUrl.get(url) ?? []), name]);
  }
  const urls: Record<string, string> = {};
  const aliases: Record<string, string> = {};
  const regular: string[] = [];
  for (const [url, names] of byUrl) {
    const base = decodeURIComponent(url.split('?')[0].split('/').pop()!).replace(/\.xcur$/, '');
    /* dev: /@fs/.../left_ptr; build: assets/left_ptr-<hash>. Longest match wins
       so left_ptr_watch is not read as left_ptr. */
    const real = names.filter((n) => base === n || base.startsWith(`${n}-`)).sort((a, b) => b.length - a.length)[0];
    for (const n of names) {
      urls[n] = url;
      if (real && n !== real) aliases[n] = real;
    }
    if (real) regular.push(real);
    else regular.push(...names); /* cannot tell: treat every name as a file */
  }
  regular.sort();
  return { urls, aliases, regular };
}

export const OURS_BUILT = oursIndexText !== '' && Object.keys(OURS_URLS).length > 0;

export const oursSrc: ThemeSrc = {
  which: 'ours',
  theme: 'Bibata-IndigoGlass',
  dir: 'cursor/out/Bibata-IndigoGlass',
  index: parseIni(oursIndexText),
  cursorTheme: parseIni(oursCursorText),
  ...resolveNames(OURS_URLS)
};
export const stockSrc: ThemeSrc = {
  which: 'stock',
  theme: 'breeze_cursors',
  dir: 'fixtures/stock/cursor',
  index: parseIni(stockIndexText),
  ...resolveNames(STOCK_URLS)
};

export type Sample = { body: string; outline: string; accent: string | null; hist: Record<string, [string, number][]> };

export type CursorModel = ThemeSrc & {
  files: Record<string, XcFile>;
  file(name: string): XcFile | undefined;
  realName(name: string): string | undefined;
  sample: Sample;
  /* Every real file and alias a specimen actually drew or listed. */
  shown: Set<string>;
};

/* Colours the compiled binary really paints. The largest image has the
   fewest resampling artefacts (small sizes are Lanczos-downscaled, whose
   overshoot clamps some edge pixels to #FFFFFF / #000000). Body = the most
   common opaque colour of the default arrow, outline = the next. Accent =
   the recipe ACCENT if the first wait frame contains it, else the most
   common spinner colour that is neither body nor outline. */
export function sampleColours(file: (n: string) => XcFile | undefined, accentHint: string): Sample {
  const hist: Sample['hist'] = {};
  const top = (name: string, frame = 0) => {
    const f = file(name);
    if (!f) return [];
    const big = sizes(f).at(-1)!;
    const h = opaqueHistogram(framesAt(f, big)[frame]);
    hist[name] = h.slice(0, 8);
    return h;
  };
  const arrow = top('default');
  const body = arrow[0]?.[0] ?? '';
  const outline = arrow[1]?.[0] ?? '';
  const spin = top('wait');
  top('not-allowed');
  const hint = accentHint && spin.find(([c]) => c === accentHint);
  const accent = hint ? hint[0] : spin.find(([c]) => c !== body && c !== outline)?.[0] ?? null;
  return { body, outline, accent, hist };
}

export async function loadTheme(src: ThemeSrc, fetcher: (url: string) => Promise<ArrayBuffer> = defaultFetch): Promise<CursorModel> {
  const files: Record<string, XcFile> = {};
  await Promise.all(src.regular.map(async (n) => { files[n] = parseXcursor(await fetcher(src.urls[n])); }));
  const realName = (n: string) => (files[n] ? n : src.aliases[n] && files[src.aliases[n]] ? src.aliases[n] : undefined);
  const file = (n: string) => { const r = realName(n); return r ? files[r] : undefined; };
  return {
    ...src,
    files,
    file,
    realName,
    sample: sampleColours(file, src.which === 'ours' ? recipe.vars.ACCENT : ''),
    shown: new Set()
  };
}

/* See the header: the dev server needs "/" after an extensionless /@fs/ path. */
export const fetchUrl = (url: string, dev = import.meta.env.DEV) =>
  dev && url.startsWith('/@fs/') && !/\.[\w]+$/.test(url) ? `${url}/` : url;

async function defaultFetch(url: string): Promise<ArrayBuffer> {
  const r = await fetch(fetchUrl(url));
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.arrayBuffer();
}

/* Patches the cursor is drawn over. A cursor crosses arbitrary content, not
   only this theme's surfaces: the dark patch is the ink base, the light one
   a plain white page (no light token exists in the dark-only palette). */
export const PATCH_DARK = PALETTE.base;
export const PATCH_LIGHT = '#FFFFFF'; /* drift-allow: a white web page under the pointer; not a theme surface */

export function laneVars(m: CursorModel): string {
  return cssVars({
    'cur-body': m.sample.body,
    'cur-outline': m.sample.outline,
    'cur-accent': m.sample.accent ?? undefined,
    'patch-dark': PATCH_DARK,
    'patch-light': PATCH_LIGHT,
    'desk-bg': PALETTE.surface,
    'desk-font': '"SF Pro Text", "Carlito", sans-serif'
  });
}

/* Coverage: every key of the shipped .theme files was read by a specimen
   (IniDoc.get tracking), every real cursor file was drawn and every alias
   listed (m.shown). */
export function cursorCoverage(m: CursorModel) {
  const docs: [string, IniDoc | undefined][] = [['index.theme', m.index], ['cursor.theme', m.cursorTheme]];
  const keys = docs.flatMap(([label, d]) => (d ? d.keys().map((k) => ({ label, k, ok: d.used().has(k) })) : []));
  const files = [...m.regular.map((n) => `cursors/${n}`), ...Object.keys(m.aliases).map((n) => `cursors/${n} -> ${m.aliases[n]}`)];
  const fileMissing = [
    ...m.regular.filter((n) => !m.shown.has(n)).map((n) => `cursors/${n}`),
    ...Object.keys(m.aliases).filter((n) => !m.shown.has(`alias:${n}`)).map((n) => `cursors/${n} (alias)`)
  ];
  return {
    total: keys.length + files.length,
    missing: [...keys.filter((k) => !k.ok).map((k) => `${k.label}: ${k.k}`), ...fileMissing]
  };
}
