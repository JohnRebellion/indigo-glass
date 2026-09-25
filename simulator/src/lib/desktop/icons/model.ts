/* Icon theme: which theme kdeglobals names, and how KDE paints it.
 *
 * Stock: [Icons] Theme from the stock kdeglobals fixture (breeze-dark, the
 * Breeze Dark global theme's default). Ours: [Icons] Theme from
 * config/kdeglobals.snippet (Papirus-Dark) — the file install.sh writes with
 * kwriteconfig6. Both themes' SVGs are frozen host copies under
 * fixtures/stock/icons (manifest.json records the lookup and rpm owner).
 *
 * The one thing the colour scheme changes: both themes declare
 * FollowsColorScheme=true, so KIconLoader replaces every SVG's
 * <style id="current-color-scheme"> with a stylesheet built from the app
 * palette (KIconColors, kiconthemes 6.29 kiconcolors.cpp). Classes the icon
 * uses (ColorScheme-Text, -Accent, -NegativeText...) take the scheme's
 * colours; hard-coded fills stay what the theme drew. Each lane is recoloured
 * with its own colour scheme (BreezeDark.colors / SageInk.colors, read via
 * ../kde-colors/model). Every icon is drawn as an <img> data URI, because an
 * inline SVG's <style> would leak across the whole page. */
import snippet from '../../../../../config/kdeglobals.snippet?raw';
import stockGlobalsText from '../../../../fixtures/stock/kde-colors/kdeglobals?raw';
import manifest from '../../../../fixtures/stock/icons/manifest.json';
import { parseIni, type IniDoc } from '../ini';
import { cssVars } from '../surface';
import { contrast } from '../tokens';
import { ours as kdeOurs, stock as kdeStock, laneVars as kdeLaneVars, type KdeModel } from '../kde-colors/model';

const RAW = import.meta.glob('../../../../fixtures/stock/icons/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const raw = (file: string): string => {
  const v = RAW[`../../../../fixtures/stock/icons/${file}`];
  if (v === undefined) throw new Error(`icon fixture missing: ${file}`);
  return v;
};

export const SIZES = [16, 22, 32, 48] as const;
export type Size = (typeof SIZES)[number];

/* Same names in both themes, grouped by freedesktop context. */
export const GROUPS = {
  places: ['folder', 'folder-documents', 'folder-download', 'user-home', 'user-trash'],
  mimetypes: ['text-x-generic', 'application-pdf', 'image-x-generic'],
  actions: ['edit-copy', 'list-add', 'edit-delete', 'document-save'],
  status: ['dialog-information', 'dialog-warning', 'dialog-error'],
  emblems: ['emblem-favorite']
} as const;
export type IconName = (typeof GROUPS)[keyof typeof GROUPS][number];
export const NAMES = Object.values(GROUPS).flat() as IconName[];

type Entry = { file: string; source: string; real: string | null; package: string; dirSize: number; dirType: string };
type ThemeManifest = {
  inherits: string[];
  followsColorScheme: boolean;
  index: string;
  indexPackage: string;
  icons: Record<string, Record<string, Entry>>;
  folderColours?: Record<string, Entry>;
};
const THEMES = (manifest as unknown as { themes: Record<string, ThemeManifest> }).themes;

/* ---- KIconColors ---------------------------------------------------- */

export type IconColors = {
  text: string; background: string; highlight: string; highlightedText: string;
  positive: string; neutral: string; negative: string; accent: string;
};

/* KIconColors(const QPalette&): text = WindowText, background = Window,
   highlight = Highlight, highlightedText = HighlightedText, accent = Accent;
   positive/neutral/negative from KColorScheme(Active, Window). KColorScheme's
   createApplicationPalette fills Highlight and Accent both from
   Selection.BackgroundNormal. */
export function iconColors(k: KdeModel): IconColors {
  return {
    text: k.c('Window', 'ForegroundNormal'),
    background: k.c('Window', 'BackgroundNormal'),
    highlight: k.c('Selection', 'BackgroundNormal'),
    highlightedText: k.c('Selection', 'ForegroundNormal'),
    positive: k.c('Window', 'ForegroundPositive'),
    neutral: k.c('Window', 'ForegroundNeutral'),
    negative: k.c('Window', 'ForegroundNegative'),
    accent: k.c('Selection', 'BackgroundNormal')
  };
}

/* KIconColors::stylesheet(), class order as upstream (NormalState). */
export const SHEET_CLASSES: [string, keyof IconColors][] = [
  ['Text', 'text'], ['Background', 'background'], ['Highlight', 'highlight'], ['HighlightedText', 'highlightedText'],
  ['PositiveText', 'positive'], ['NeutralText', 'neutral'], ['NegativeText', 'negative'], ['Accent', 'accent']
];
export const stylesheet = (c: IconColors) =>
  SHEET_CLASSES.map(([cls, k]) => `.ColorScheme-${cls} { color:${c[k]}; }`).join('\n');

const STYLE_RE = /(<style\b[^>]*\bid=["']current-color-scheme["'][^>]*>)([\s\S]*?)(<\/style>)/;

/* What KIconLoader does to an SVG from a FollowsColorScheme theme: the
   current-color-scheme stylesheet's content is replaced, nothing else. An
   SVG without that element is drawn as shipped. */
export function recolour(svg: string, sheet: string): string {
  return STYLE_RE.test(svg) ? svg.replace(STYLE_RE, (_, open, _body, close) => `${open}${sheet}${close}`) : svg;
}
export const followsScheme = (svg: string) => STYLE_RE.test(svg);

export const dataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/* The icon's body colour — what a user reads as "the folder colour". A shape
   painted with a scheme class (Accent/Highlight) takes the lane colour; else
   the largest opaque <rect> fill, which is Papirus's folder front. */
export function bodyFill(svg: string, c: IconColors): string | null {
  const cls = svg.match(/class=["'][^"']*ColorScheme-(Accent|Highlight)\b/);
  if (cls && followsScheme(svg)) return cls[1] === 'Accent' ? c.accent : c.highlight;
  let best: { area: number; fill: string } | null = null;
  for (const m of svg.matchAll(/<rect\b([^>]*)\/?>/g)) {
    const a = m[1];
    if (/opacity\s*[:=]/.test(a)) continue;
    const fill = a.match(/fill\s*[:=]\s*["']?(#[0-9a-fA-F]{6})/)?.[1];
    const w = Number(a.match(/(?:^|\s)width=["']([\d.]+)/)?.[1]);
    const h = Number(a.match(/(?:^|\s)height=["']([\d.]+)/)?.[1]);
    if (!fill || !w || !h) continue;
    if (!best || w * h > best.area) best = { area: w * h, fill: fill.toUpperCase() };
  }
  return best?.fill ?? null;
}

/* ---- OKLCH, for the folder-colour judgement ------------------------- */

const lin = (x: number) => { const s = x / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export type Oklch = { L: number; C: number; H: number; a: number; b: number };
export function oklch(hex: string): Oklch {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16)));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360, a: A, b: B };
}
export const hueDelta = (x: Oklch, y: Oklch) => { const d = Math.abs(x.H - y.H) % 360; return d > 180 ? 360 - d : d; };
export const deltaE = (x: Oklch, y: Oklch) => Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);

/* ---- Lane model ----------------------------------------------------- */

export type Resolved = { name: IconName; size: Size; entry: Entry; svg: string; uri: string; follows: boolean; body: string | null };
export type IconModel = {
  globals: IniDoc;
  theme: string;
  meta: ThemeManifest;
  kde: KdeModel;
  colors: IconColors;
  sheet: string;
  icon: (name: IconName, size: Size) => Resolved;
};

function model(globalsText: string, kde: KdeModel): IconModel {
  const globals = parseIni(globalsText);
  const theme = globals.req('Icons', 'Theme');
  const meta = THEMES[theme];
  if (!meta) throw new Error(`[Icons] Theme=${theme} has no fixture set under fixtures/stock/icons`);
  const colors = iconColors(kde);
  const sheet = stylesheet(colors);
  const cache = new Map<string, Resolved>();
  const icon = (name: IconName, size: Size): Resolved => {
    const key = `${name}@${size}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const entry = meta.icons[name]?.[String(size)];
    if (!entry) throw new Error(`${theme}: no ${name} at ${size}`);
    const shipped = raw(entry.file);
    const svg = meta.followsColorScheme ? recolour(shipped, sheet) : shipped;
    const r = { name, size, entry, svg, uri: dataUri(svg), follows: meta.followsColorScheme && followsScheme(shipped), body: bodyFill(svg, colors) };
    cache.set(key, r);
    return r;
  };
  return { globals, theme, meta, kde, colors, sheet, icon };
}

export function laneVars(m: IconModel): string {
  return `${kdeLaneVars(m.kde)};${cssVars({ 'ic-accent': m.colors.accent, 'ic-text': m.colors.text })}`;
}

export const stock = model(stockGlobalsText, kdeStock);
export const ours = model(snippet, kdeOurs);

/* ---- papirus-folders candidates ------------------------------------- */

export type FolderCandidate = {
  colour: string; file: string; fill: string; uri: string;
  lch: Oklch; dH: number; dE: number; onWindow: number; isDefault: boolean;
};

/* The folder colours `papirus-folders -C <c>` can select, measured against
   the ours accent. Only the Papirus manifest carries them. */
export function folderCandidates(m: IconModel = ours): FolderCandidate[] {
  const acc = oklch(m.colors.accent);
  const current = m.meta.icons.folder?.['48']?.real ?? '';
  return Object.entries(m.meta.folderColours ?? {})
    .map(([colour, e]) => {
      const svg = raw(e.file);
      const fill = bodyFill(svg, m.colors);
      if (!fill) throw new Error(`no body fill in ${e.file}`);
      const lch = oklch(fill);
      return {
        colour, file: e.file, fill, uri: dataUri(svg), lch,
        dH: hueDelta(lch, acc), dE: deltaE(lch, acc), onWindow: contrast(fill, m.colors.background),
        isDefault: current.endsWith(`/folder-${colour}.svg`)
      };
    })
    .sort((x, y) => x.dE - y.dE);
}
