/* Plasma desktop theme, parsed into lane models.
 *
 * Ours: config/plasma-theme/SageInk/** (colors is generated; the SVGs,
 * plasmarc and metadata.json are hand-kept), imported raw — the tree
 * install.sh copies to ~/.local/share/plasma/desktoptheme/SageInk.
 * Stock: breeze-dark (colors, plasmarc, metadata.json, no SVGs) over the
 * "default" image set, both from libplasma 6.7.4 (fixtures/stock/plasma-theme).
 *
 * How Plasma turns these files into pixels, and where each rule lives:
 *   file lookup   KSvg::ImageSet::imagePath (ksvg imageset.cpp:159-191):
 *                 the theme, then fallbackImageSets = {"default"}
 *                 (imageset_p.cpp:719). plasmarc [Settings] FallbackTheme is
 *                 NOT an SVG fallback: libplasma walks it only for wallpaper
 *                 settings (theme_p.cpp setThemeName, :435-453).
 *   variant dir   ImageSetPrivate::findInImageSet (imageset_p.cpp:238-267)
 *                 tries /<selector>/ then /. The selector comes from
 *                 ThemePrivate::updateKSvgSelectors (theme_p.cpp:169-191):
 *                 compositing + blur effect active -> {"translucent"};
 *                 compositing, no blur -> {} (the root files);
 *                 X11 without compositing -> {"opaque"}. solid/ is never a
 *                 selector: Dialog asks for "solid/<path>" explicitly when
 *                 the SolidBackground hint is set (dialog.cpp updateTheme).
 *   colours       ImageSetPrivate::namedColor (imageset_p.cpp:339-520) over
 *                 KColorSchemes built from the theme's own `colors` file
 *                 (imageset_p.cpp setImageSetName:702-714), injected as
 *                 .ColorScheme-<Name>{color:…} by svgStyleSheet (:522-600).
 */
import sageColors from '../../../../../config/plasma-theme/SageInk/colors?raw';
import sagePlasmarc from '../../../../../config/plasma-theme/SageInk/plasmarc?raw';
import sageMeta from '../../../../../config/plasma-theme/SageInk/metadata.json?raw';
import breezeColors from '../../../../fixtures/stock/plasma-theme/breeze-dark/colors?raw';
import breezePlasmarc from '../../../../fixtures/stock/plasma-theme/breeze-dark/plasmarc?raw';
import breezeMeta from '../../../../fixtures/stock/plasma-theme/breeze-dark/metadata.json?raw';
import { parseIni, kdeColor, type IniDoc } from '../ini';
import { cssVars } from '../surface';
import type { KeyVars } from '../coverage';
import { ours as kdeOurs, stock as kdeStock } from '../kde-colors/model';
import { parseSvg, elementBox, partSvg, dataUri, namedParts, paintsOf, auditPart, type SvgDoc, type Finding, type Box } from './svg';
import { frameGeometry, resolvePrefix, shadowGeometry, hasPrefix, ALL_BORDERS, PARTS, SHADOW_TILES, type Borders, type ElementSource, type FrameGeom, type PartName, type ShadowGeom, type ShadowTile } from './frame';

const SAGE_SVGS = import.meta.glob('../../../../../config/plasma-theme/SageInk/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const DEFAULT_SVGS = import.meta.glob('../../../../fixtures/stock/plasma-theme/default/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/* 'config/plasma-theme/SageInk/solid/widgets/tooltip.svg' -> 'solid/widgets/tooltip' */
const byName = (rec: Record<string, string>, base: string) =>
  Object.fromEntries(Object.entries(rec).map(([p, t]) => [p.slice(p.indexOf(base) + base.length).replace(/\.svg$/, ''), t]));

export type ImageSet = { name: string; files: Record<string, string> };
export const SAGE: ImageSet = { name: 'SageInk', files: byName(SAGE_SVGS, 'SageInk/') };
export const DEFAULT: ImageSet = { name: 'default', files: byName(DEFAULT_SVGS, 'default/') };
const BREEZE_DARK: ImageSet = { name: 'breeze-dark', files: {} };

/* ---- colours: KColorScheme as Plasma builds it --------------------------- */

export const PLASMA_SETS = ['Window', 'Button', 'View', 'Tooltip', 'Complementary', 'Header'] as const;
export type PlasmaSet = (typeof PLASMA_SETS)[number];
type SchemeSet = PlasmaSet | 'Selection';

/* Key -> lane-variable suffix, for every key Plasma reads per set. */
export const PT_KEYS = {
  BackgroundNormal: 'bg',
  ForegroundNormal: 'fg',
  ForegroundInactive: 'inactive',
  ForegroundActive: 'active',
  ForegroundLink: 'link',
  ForegroundVisited: 'visited',
  ForegroundNegative: 'negative',
  ForegroundNeutral: 'neutral',
  ForegroundPositive: 'positive',
  DecorationFocus: 'focus',
  DecorationHover: 'hover'
} as const;
export type PtKey = keyof typeof PT_KEYS;

/* KColorScheme's compiled-in defaults (Breeze Light), used for any key a
   colors file leaves out (kcolorscheme.cpp:120-217). Order: the PT_KEYS
   order minus the decorations. */
const D = (bg: string, fg: string, inactive: string, active: string, link: string, visited: string, negative: string, neutral: string, positive: string) =>
  ({ BackgroundNormal: bg, ForegroundNormal: fg, ForegroundInactive: inactive, ForegroundActive: active, ForegroundLink: link, ForegroundVisited: visited, ForegroundNegative: negative, ForegroundNeutral: neutral, ForegroundPositive: positive });
const DEFAULTS: Record<SchemeSet, Record<string, string>> = {
  View: D('255,255,255', '35,38,41', '112,125,138', '61,174,233', '41,128,185', '155,89,182', '218,68,83', '246,116,0', '39,174,96'),
  Window: D('239,240,241', '35,38,41', '112,125,138', '61,174,233', '41,128,185', '155,89,182', '218,68,83', '246,116,0', '39,174,96'),
  Button: D('252,252,252', '35,38,41', '112,125,138', '61,174,233', '41,128,185', '155,89,182', '218,68,83', '246,116,0', '39,174,96'),
  Selection: D('61,174,233', '255,255,255', '112,125,138', '255,255,255', '253,188,75', '155,89,182', '176,55,69', '198,92,0', '23,104,57'),
  Tooltip: D('247,247,247', '35,38,41', '112,125,138', '61,174,233', '41,128,185', '155,89,182', '218,68,83', '246,116,0', '39,174,96'),
  Complementary: D('42,46,50', '252,252,252', '161,169,177', '61,174,233', '29,153,243', '155,89,182', '218,68,83', '246,116,0', '39,174,96'),
  Header: D('222,224,226', '35,38,41', '112,125,138', '61,174,233', '41,128,185', '155,89,182', '218,68,83', '246,116,0', '39,174,96')
};
const DECO_DEFAULTS = { DecorationFocus: '61,174,233', DecorationHover: '147,206,233' };

/* KColorUtils::mix: a straight sRGB blend. */
export function mix(a: string, b: string, t: number): string {
  const ch = (h: string, i: number) => parseInt(h.replace('#', '').slice(i, i + 2), 16);
  const out = [0, 2, 4].map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t));
  return '#' + out.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/* One KColorScheme value, as KColorSchemePrivate::initFromConfig resolves
   it for QPalette::Active (kcolorscheme.cpp:290-380): the set's key, else
   for Header the Window key, else the compiled-in default. */
function schemeValue(doc: IniDoc, set: SchemeSet, key: PtKey): string {
  const read = (s: SchemeSet) => doc.get(`Colors:${s}`, key);
  const fallback = key.startsWith('Decoration') ? DECO_DEFAULTS[key as keyof typeof DECO_DEFAULTS] : DEFAULTS[set][key];
  return kdeColor(read(set) ?? (set === 'Header' ? read('Window') : undefined) ?? fallback);
}

/* ---- the lane model ----------------------------------------------------- */

export type Loaded = { key: string; set: string; path: string; doc: SvgDoc; src: ElementSource };
export type Tile = { id: string; uri: string; box: Box };
export type Frame = { file: Loaded; geom: FrameGeom; tiles: Partial<Record<PartName, Tile>> };
export type Shadow = { file: Loaded; geom: ShadowGeom; tiles: Partial<Record<ShadowTile, Tile>> };

export type PtModel = {
  which: 'stock' | 'ours';
  theme: ImageSet;
  colors: IniDoc;
  plasmarc: IniDoc;
  meta: IniDoc;
  /* KSvg selectors this lane renders with (see the header comment). */
  selectors: string[];
  /* Why those selectors, for the page. */
  selectorWhy: string;
  frameContrast: number;
  scheme(set: SchemeSet, key: PtKey): string;
  /* ImageSetPrivate::namedColor for one ColorScheme-* class, status Normal. */
  named(set: PlasmaSet, cls: string): string;
  resolve(name: string): { set: string; path: string } | null;
  svg(name: string): Loaded | null;
  frame(name: string, prefixes: string | string[], borders?: Borders, set?: PlasmaSet): Frame | null;
  shadow(name: string, borders?: Borders): Shadow | null;
  tile(file: Loaded, id: string, set?: PlasmaSet): Tile | null;
  /* The ids painted (or, for hint-*, read), per resolved file key. */
  seen: Map<string, Set<string>>;
};

const GROUPS = ['Button', 'View', 'Tooltip', 'Complementary', 'Header'] as const;
const GROUP_ROLE = /^(Button|View|Tooltip|Complementary|Header)(Text|Background|Hover|Focus|HighlightedText|PositiveText|NeutralText|NegativeText)$/;

function flattenJson(text: string): string {
  const out: Record<string, string[]> = { root: [] };
  const walk = (v: unknown, path: string, group: string) => {
    if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (!path && k === 'KPlugin') walk(x, '', 'KPlugin');
        else walk(x, path ? `${path}.${k}` : k, group);
      }
    } else (out[group] ??= []).push(`${path}=${String(v)}`);
  };
  walk(JSON.parse(text), '', 'root');
  return Object.entries(out).map(([g, lines]) => `[${g}]\n${lines.join('\n')}`).join('\n');
}

function model(which: 'stock' | 'ours', theme: ImageSet, colorsText: string, plasmarcText: string, metaText: string, selectors: string[], selectorWhy: string, frameContrast: number): PtModel {
  const colors = parseIni(colorsText);
  const plasmarc = parseIni(plasmarcText);
  const meta = parseIni(flattenJson(metaText));
  const sets = [theme, DEFAULT];
  const parsed = new Map<string, Loaded>();
  const tiles = new Map<string, Tile | null>();
  const seen = new Map<string, Set<string>>();
  const mark = (key: string, id: string) => { let s = seen.get(key); if (!s) seen.set(key, (s = new Set())); s.add(id); };

  const scheme = (set: SchemeSet, key: PtKey) => schemeValue(colors, set, key);
  const named = (set: PlasmaSet, cls: string): string => {
    const cur = (k: PtKey) => scheme(set, k);
    switch (cls) {
      case 'Text': return cur('ForegroundNormal');
      /* Background is the Window set whatever the SVG's colorSet. */
      case 'Background': return scheme('Window', 'BackgroundNormal');
      case 'Highlight': return scheme('Selection', 'BackgroundNormal');
      case 'HighlightedText': return scheme('Selection', 'ForegroundNormal');
      case 'PositiveText': return cur('ForegroundPositive');
      case 'NeutralText': return cur('ForegroundNeutral');
      case 'NegativeText': return cur('ForegroundNegative');
      case 'Frame': return mix(cur('BackgroundNormal'), cur('ForegroundNormal'), frameContrast);
    }
    const m = cls.match(GROUP_ROLE);
    if (!m) return '#000000';
    const g = m[1] as (typeof GROUPS)[number];
    switch (m[2]) {
      case 'Text': return scheme(g, 'ForegroundNormal');
      case 'Background': return scheme(g, 'BackgroundNormal');
      case 'Hover': return scheme(g, 'DecorationHover');
      case 'Focus': return scheme(g, 'DecorationFocus');
      case 'HighlightedText': return scheme('Selection', 'ForegroundNormal');
      case 'PositiveText': return scheme(g, 'ForegroundPositive');
      case 'NeutralText': return scheme(g, 'ForegroundNeutral');
      default: return scheme(g, 'ForegroundNegative');
    }
  };

  const resolve = (name: string) => {
    for (const s of sets)
      for (const path of [...selectors.map((sel) => `${sel}/${name}`), name])
        if (s.files[path] !== undefined) return { set: s.name, path };
    return null;
  };
  const svg = (name: string): Loaded | null => {
    const r = resolve(name);
    if (!r) return null;
    const key = `${r.set}/${r.path}`;
    let l = parsed.get(key);
    if (!l) {
      const doc = parseSvg((r.set === theme.name ? theme : DEFAULT).files[r.path]);
      /* hint-* elements are geometry, not paint: reading one is rendering it. */
      const track = (id: string) => { if (id.includes('hint-')) mark(key, id); };
      const src: ElementSource = {
        has: (id) => { track(id); return doc.has(id); },
        box: (id) => { track(id); return elementBox(doc, id); }
      };
      l = { key, ...r, doc, src };
      parsed.set(key, l);
    }
    return l;
  };
  const tile = (file: Loaded, id: string, set: PlasmaSet = 'Window'): Tile | null => {
    const k = `${file.key}|${id}|${set}`;
    if (tiles.has(k)) return tiles.get(k)!;
    const part = partSvg(file.doc, id, (classes) => Object.fromEntries([...classes].map((c) => [c, named(set, c)])));
    const t = part ? { id, uri: dataUri(part.xml), box: part.box } : null;
    tiles.set(k, t);
    if (t) {
      mark(file.key, id);
      /* Named pieces inside the part (Inkscape ids like sr, border-top). */
      for (const e of Array.from(file.doc.byId(id)!.getElementsByTagName('*'))) {
        const n = e.getAttribute('id');
        if (n) mark(file.key, n);
      }
    }
    return t;
  };
  const frame = (name: string, prefixes: string | string[], borders: Borders = ALL_BORDERS, set: PlasmaSet = 'Window'): Frame | null => {
    const file = svg(name);
    if (!file) return null;
    const prefix = resolvePrefix(file.src, prefixes);
    const geom = frameGeometry(file.src, prefix, borders);
    const out: Frame['tiles'] = {};
    for (const p of PARTS) {
      const side = (s: 'top' | 'bottom' | 'left' | 'right') => borders[s];
      const need = p === 'center' || (p.startsWith('top') ? side('top') : p.startsWith('bottom') ? side('bottom') : true) && (p.endsWith('left') ? side('left') : p.endsWith('right') ? side('right') : true);
      if (!need || !geom.present[p]) continue;
      const t = tile(file, prefix + p, set);
      if (t) out[p] = t;
    }
    return { file, geom, tiles: out };
  };
  const shadow = (name: string, borders: Borders = ALL_BORDERS): Shadow | null => {
    const file = svg(name);
    if (!file) return null;
    const geom = shadowGeometry(file.src, borders);
    const out: Shadow['tiles'] = {};
    if (geom.present)
      for (const t of SHADOW_TILES) {
        const on = (t.includes('top') ? borders.top : t.includes('bottom') ? borders.bottom : true) && (t.includes('left') ? borders.left : t.includes('right') ? borders.right : true);
        const x = on ? tile(file, `shadow-${t}`) : null;
        if (x) out[t] = x;
      }
    return { file, geom, tiles: out };
  };
  return { which, theme, colors, plasmarc, meta, selectors, selectorWhy, frameContrast, scheme, named, resolve, svg, frame, shadow, tile, seen };
}

/* KColorScheme::frameContrast() reads kdeglobals, not the theme's colors
   file: take it from the lane's global scheme (kde-colors page). */
const fc = (doc: IniDoc) => Number(doc.get('KDE', 'frameContrast') ?? 0.2);

export const stock = model('stock', BREEZE_DARK, breezeColors, breezePlasmarc, breezeMeta, ['translucent'],
  'stock Plasma 6.7.4 enables the KWin blur effect by default, so updateKSvgSelectors picks {"translucent"}', fc(kdeStock.colors));
export const ours = model('ours', SAGE, sageColors, sagePlasmarc, sageMeta, [],
  'Sage Ink removes the KWin blur effect (kwinrc blurEnabled=false, install path v5), so on Wayland updateKSvgSelectors picks {} — the root files', fc(kdeOurs.colors));

/* ---- lane variables and the coverage map ---------------------------------- */

export const KEY_VARS: KeyVars = {};
for (const s of PLASMA_SETS)
  for (const [k, short] of Object.entries(PT_KEYS)) (KEY_VARS[`Colors:${s}/${k}`] ??= []).push(`pt-${s.toLowerCase()}-${short}`);
KEY_VARS['Colors:Selection/BackgroundNormal'] = ['pt-selection-bg'];
KEY_VARS['Colors:Selection/ForegroundNormal'] = ['pt-selection-fg'];

export function laneVars(m: PtModel): string {
  const v: Record<string, string> = {};
  for (const s of PLASMA_SETS) for (const [k, short] of Object.entries(PT_KEYS)) v[`pt-${s.toLowerCase()}-${short}`] = m.scheme(s, k as PtKey);
  v['pt-selection-bg'] = m.scheme('Selection', 'BackgroundNormal');
  v['pt-selection-fg'] = m.scheme('Selection', 'ForegroundNormal');
  /* Plasma draws applet text in the global font (kdeglobals [General] font). */
  const f = (m.which === 'ours' ? kdeOurs : kdeStock).fonts.font;
  v['pt-font'] = `"${f.family}", "Carlito", sans-serif`;
  /* Stand-in for the wallpaper behind panels and popups (no theme file says
     what it is): the View background, the darkest set in both schemes, so a
     translucent stock popup does not vanish into an equal backdrop. */
  v['desk-bg'] = m.scheme('View', 'BackgroundNormal');
  v['desk-font'] = v['pt-font'];
  return cssVars(v);
}

/* ---- SVG coverage: every named element of every shipped SVG ---------------- */

/* Root files are rendered; the opaque/, solid/ and translucent/ copies are
   covered when they are byte-identical to the root file they shadow. */
export const ROOT_FILES = Object.keys(SAGE.files).filter((p) => !/^(opaque|solid|translucent)\//.test(p)).sort();
export const VARIANT_FILES = Object.keys(SAGE.files).filter((p) => /^(opaque|solid|translucent)\//.test(p)).sort();
export const variantRoot = (p: string) => p.replace(/^(opaque|solid|translucent)\//, '');
export const variantIdentical = (p: string) => SAGE.files[p] === SAGE.files[variantRoot(p)];

/* Coverage group of one id: which ignore rule (if any) can apply to it. */
export function category(id: string): 'mask' | 'shadow' | 'thick' | 'hint' | 'part' {
  if (/^mask-/.test(id)) return 'mask';
  if (/^shadow-/.test(id)) return 'shadow';
  if (/^thick-(?!hint-)/.test(id)) return 'thick';
  if (/hint-/.test(id)) return 'hint';
  return 'part';
}

export type SvgCoverage = { docs: { label: string; doc: IniDoc }[]; ignore: { token: string; why: string }[] };

export function svgCoverage(m: PtModel): SvgCoverage {
  const docs: SvgCoverage['docs'] = [];
  const empties: SvgCoverage['ignore'] = [];
  for (const f of ROOT_FILES) {
    const s = parseSvg(SAGE.files[f]);
    const by: Record<string, string[]> = {};
    for (const id of new Set(namedParts(s))) (by[category(id)] ??= []).push(id);
    const text = Object.entries(by).map(([c, ids]) => `[${f}/${c}]\n${ids.map((i) => `${i}=1`).join('\n')}`).join('\n');
    const doc = parseIni(text);
    /* A byte-identical variant copy renders the same elements: what the page
       paints from solid/widgets/tooltip is painted from widgets/tooltip. */
    const seen = new Set<string>(m.seen.get(`${SAGE.name}/${f}`) ?? []);
    for (const v of VARIANT_FILES) if (variantRoot(v) === f && variantIdentical(v)) for (const id of m.seen.get(`${SAGE.name}/${v}`) ?? []) seen.add(id);
    for (const id of new Set(namedParts(s))) {
      const el = s.byId(id)!;
      if (el.localName === 'g' && el.children.length === 0)
        empties.push({ token: `${f}/${category(id)}/${id}`, why: 'empty <g> (an Inkscape leftover): paints nothing and no consumer looks it up' });
    }
    for (const [c, ids] of Object.entries(by)) for (const id of ids) if (seen.has(id)) doc.touch(`${f}/${c}`, id);
    docs.push({ label: f, doc });
  }
  const variants = parseIni(`[variants]\n${VARIANT_FILES.map((p) => `${p}=1`).join('\n')}`);
  for (const p of VARIANT_FILES) if (variantIdentical(p)) variants.touch('variants', p);
  docs.push({ label: 'variant copies', doc: variants });

  const ignore: SvgCoverage['ignore'] = [...empties];
  for (const f of ROOT_FILES)
    if (/mask-/.test(SAGE.files[f]))
      ignore.push({ token: `${f}/mask/*`, why: 'mask-* is the alpha mask FrameSvg::mask() hands KWin for blur/contrast regions and the X11 shape; it is never painted' });
  ignore.push(
    { token: 'widgets/background/shadow/*', why: 'no consumer: BasicAppletContainer.qml paints a ShadowBackground applet with a QML DropShadow, and nothing reads widgets/background shadow-* on Plasma 6' },
    { token: 'widgets/panel-background/thick/*', why: 'Panel.qml creates thickPanelSvg (prefix "thick") with visible:false; only its fixedMargins are read, for the panel padding table' },
    { token: 'widgets/panel-background/shadow/shadow-center', why: 'KWindowShadow has no centre tile (PanelShadows)' },
    { token: 'dialogs/background/shadow/shadow-center', why: 'KWindowShadow has no centre tile (DialogShadows::setupTiles)' }
  );
  for (const f of ['widgets/panel-background', 'dialogs/background'])
    for (const side of ['top', 'bottom', 'left', 'right'])
      ignore.push({ token: `${f}/shadow/shadow-hint-${side}-inset`, why: 'no reader: DialogShadows/PanelShadows read only shadow-hint-*-margin' });
  return { docs, ignore };
}

/* ---- the design-system audit -------------------------------------------- */

export type AuditRow = Finding & { file: string; live: boolean; why?: string };

/* Every frame/shadow part of every root file (hints and masks excluded —
   they are geometry and alpha masks, not paint). `live` is false for parts
   nothing paints, per the coverage ignore list. */
export function audit(files: Record<string, string>, names: string[]): AuditRow[] {
  const part = /(^|-)(topleft|topright|bottomleft|bottomright|top|bottom|left|right|center)$/;
  const rows: AuditRow[] = [];
  for (const f of names) {
    const s = parseSvg(files[f]);
    for (const id of new Set(namedParts(s))) {
      if (!part.test(id) || category(id) === 'mask' || id.includes('hint-')) continue;
      const cat = category(id);
      /* f may carry an image-set and variant prefix (SageInk/, default/translucent/). */
      const is = (name: string) => new RegExp(`(^|/)${name}$`).test(f);
      const dead = (is('widgets/background') && cat === 'shadow') || (is('widgets/panel-background') && cat === 'thick') || (/shadow-center$/.test(id) && !is('widgets/tooltip'));
      for (const x of auditPart(s, id)) rows.push({ ...x, part: id, file: f, live: !dead, why: dead ? 'not painted' : undefined });
    }
  }
  return rows;
}

/* The topmost colour an element paints with at least `min` alpha (what a
   role sees); below full alpha the result carries it as #RRGGBBAA. */
export function topPaint(m: PtModel, name: string, id: string, set: PlasmaSet = 'Window', min = 0.5): string {
  const f = m.svg(name);
  if (!f) return 'transparent';
  const p = paintsOf(f.doc, id, (c) => m.named(set, c)).filter((x) => !x.gradient && x.alpha >= min);
  if (!p.length) return 'transparent';
  const top = p[p.length - 1];
  const hex = top.colour.toUpperCase();
  const a = Math.round(top.alpha * 255);
  return a < 255 && /^#[0-9A-F]{6}$/.test(hex) ? hex + a.toString(16).padStart(2, '0').toUpperCase() : hex;
}

/* Does this lane's widgets/background have the blurred prefix
   (BasicAppletContainer.qml: prefix blurEnabled ? "blurred" : "")? */
export const widgetPrefix = (m: PtModel) => {
  const f = m.svg('widgets/background');
  return f && hasPrefix(f.src, 'blurred') ? 'blurred' : '';
};
