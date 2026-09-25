/* KDE colour scheme + kdeglobals, parsed into lane variables.
 *
 * Stock: BreezeDark.colors (plasma-breeze-common) and Plasma's compiled-in
 * kdeglobals defaults. Ours: share/color-schemes/SageInk.colors (generated)
 * and config/kdeglobals.snippet, both imported raw — the files install.sh
 * copies, not a transcription of them. */
import sageColors from '../../../../../share/color-schemes/SageInk.colors?raw';
import sageGlobals from '../../../../../config/kdeglobals.snippet?raw';
import breezeColors from '../../../../fixtures/stock/kde-colors/BreezeDark.colors?raw';
import breezeGlobals from '../../../../fixtures/stock/kde-colors/kdeglobals?raw';
import { parseIni, kdeColor, type IniDoc } from '../ini';
import { cssVars } from '../surface';
import { contrast } from '../tokens';
import type { KeyVars } from '../coverage';

export const SETS = ['Window', 'View', 'Button', 'Header', 'Selection', 'Tooltip', 'Complementary'] as const;
export type SetName = (typeof SETS)[number];

/* Role key -> short variable suffix. Order is the order a KDE colour editor
   lists them in, and the order the swatch cards render. */
export const ROLE_KEYS = {
  BackgroundNormal: 'bg',
  BackgroundAlternate: 'alt',
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

export type Font = { family: string; pt: number; weight: number };
export type KdeModel = {
  colors: IniDoc;
  globals: IniDoc;
  /* Resolved widget style name from kdeglobals — decides how a selection is
     drawn: Breeze fills the row, Klassy (Tier C patch) outlines it. */
  style: string;
  fonts: Record<'font' | 'fixed' | 'menuFont' | 'smallestReadableFont' | 'toolBarFont' | 'activeFont', Font>;
  c: (set: SetName | 'Header/Inactive', key: keyof typeof ROLE_KEYS) => string;
  wm: (key: string) => string;
};

function parseFont(v: string | undefined, fallback: string): Font {
  const p = (v ?? fallback).split(',');
  return { family: p[0], pt: Number(p[1]), weight: Number(p[4] ?? 400) };
}

/* KColorScheme effects, approximated in sRGB. KDE works in HCY; the lane
   shows the disabled state close enough to judge legibility, not to pixel
   match. Intensity 1 shade / 2 darken / 3 lighten; Color 1 desaturate /
   2 fade / 3 tint; Contrast 1 fade / 2 tint (towards the background). */
function mix(a: string, b: string, t: number): string {
  const pa = a.replace('#', ''), pb = b.replace('#', '');
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const out = [0, 2, 4].map((i) => Math.round(ch(pa, i) * (1 - t) + ch(pb, i) * t));
  return '#' + out.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}
function effect(doc: IniDoc, state: 'Disabled' | 'Inactive', fg: string, bg: string): { fg: string; bg: string } {
  const g = `ColorEffects:${state}`;
  const num = (k: string) => Number(doc.get(g, k) ?? 0);
  if (state === 'Inactive' && doc.get(g, 'Enable') === 'false') return { fg, bg };
  const apply = (c: string) => {
    const ie = num('IntensityEffect'), ia = num('IntensityAmount');
    if (ie === 2) c = mix(c, '#000000', ia);
    else if (ie === 3 || ie === 1) c = mix(c, '#FFFFFF', ia);
    const ce = num('ColorEffect'), ca = num('ColorAmount'), col = kdeColor(doc.get(g, 'Color'));
    if (ce === 2 || ce === 3) c = mix(c, col, ca);
    return c;
  };
  const nbg = apply(bg);
  let nfg = apply(fg);
  const xe = num('ContrastEffect'), xa = num('ContrastAmount');
  if (xe === 1 || xe === 2) nfg = mix(nfg, nbg, xa);
  return { fg: nfg, bg: nbg };
}

function model(colorsText: string, globalsText: string): KdeModel {
  const colors = parseIni(colorsText);
  const globals = parseIni(globalsText);
  const g = (k: string, d: string) => globals.get('General', k) ?? d;
  return {
    colors,
    globals,
    style: globals.get('KDE', 'widgetStyle') ?? 'Breeze',
    fonts: {
      font: parseFont(g('font', ''), 'Noto Sans,10'),
      fixed: parseFont(g('fixed', ''), 'Hack,10'),
      menuFont: parseFont(g('menuFont', ''), 'Noto Sans,10'),
      smallestReadableFont: parseFont(g('smallestReadableFont', ''), 'Noto Sans,8'),
      toolBarFont: parseFont(g('toolBarFont', ''), 'Noto Sans,10'),
      activeFont: parseFont(globals.get('WM', 'activeFont') ?? colors.get('WM', 'activeFont'), 'Noto Sans,10,-1,5,700')
    },
    c: (set, key) => kdeColor(colors.get(`Colors:${set}`, key)),
    wm: (key) => kdeColor(colors.get('WM', key))
  };
}

/* Which lane variable renders which file key — the coverage map. A key is
   shown only if a rule on the page references its variable. */
export const KEY_VARS: KeyVars = {};
const bind = (key: string, ...vars: string[]) => { (KEY_VARS[key] ??= []).push(...vars); };
for (const s of SETS)
  for (const [k, short] of Object.entries(ROLE_KEYS)) bind(`Colors:${s}/${k}`, `k-${s.toLowerCase()}-${short}`);
for (const [k, short] of Object.entries(ROLE_KEYS)) bind(`Colors:Header/Inactive/${k}`, `k-header-inactive-${short}`);
const WM_KEYS = ['activeBackground', 'activeForeground', 'inactiveBackground', 'inactiveForeground', 'activeBlend', 'inactiveBlend'];
for (const k of WM_KEYS) bind(`WM/${k}`, `k-wm-${k}`);
for (const k of ['IntensityEffect', 'IntensityAmount', 'ColorEffect', 'ColorAmount', 'Color', 'ContrastEffect', 'ContrastAmount'])
  bind(`ColorEffects:Disabled/${k}`, 'k-disabled-fg', 'k-disabled-bg');
for (const k of ['Enable', 'ChangeSelectionColor', 'IntensityEffect', 'IntensityAmount', 'ColorEffect', 'ColorAmount', 'Color', 'ContrastEffect', 'ContrastAmount'])
  bind(`ColorEffects:Inactive/${k}`, 'k-inactive-fg', 'k-inactive-bg');
bind('KDE/frameContrast', 'k-frame');
for (const [k, v] of [['font', 'k-font'], ['fixed', 'k-font-fixed'], ['menuFont', 'k-font-menu'], ['smallestReadableFont', 'k-font-small'], ['toolBarFont', 'k-font-toolbar']])
  bind(`General/${k}`, v);
bind('WM/activeFont', 'k-font-title', 'k-title-weight');

/* config/klassy/selection-text.patch: in QLineEdit/QTextEdit/QPlainTextEdit,
   HighlightedText becomes whichever of Text/Base contrasts more with
   Highlight. Breeze has no such patch and uses Selection's foreground. */
export function editSelectionText(m: KdeModel): string {
  const fill = m.c('Selection', 'BackgroundNormal');
  if (m.style !== 'Klassy') return m.c('Selection', 'ForegroundNormal');
  const text = m.c('View', 'ForegroundNormal'), base = m.c('View', 'BackgroundNormal');
  return contrast(text, fill) >= contrast(base, fill) ? text : base;
}

export function laneVars(m: KdeModel): string {
  const v: Record<string, string | number> = {};
  for (const s of SETS)
    for (const [k, short] of Object.entries(ROLE_KEYS)) v[`k-${s.toLowerCase()}-${short}`] = m.c(s, k as keyof typeof ROLE_KEYS);
  /* Header's [Inactive] subgroup overrides only what it names; the rest
     falls back to the active Header values, as KColorScheme does. */
  for (const [k, short] of Object.entries(ROLE_KEYS)) {
    const c = m.c('Header/Inactive', k as keyof typeof ROLE_KEYS);
    v[`k-header-inactive-${short}`] = c !== 'transparent' ? c : m.c('Header', k as keyof typeof ROLE_KEYS);
  }
  for (const k of WM_KEYS) v[`k-wm-${k}`] = m.wm(k);
  const dis = effect(m.colors, 'Disabled', m.c('Button', 'ForegroundNormal'), m.c('Button', 'BackgroundNormal'));
  v['k-disabled-fg'] = dis.fg;
  v['k-disabled-bg'] = dis.bg;
  const ina = effect(m.colors, 'Inactive', m.c('Window', 'ForegroundNormal'), m.c('Window', 'BackgroundNormal'));
  v['k-inactive-fg'] = ina.fg;
  v['k-inactive-bg'] = ina.bg;
  /* Breeze derives its frame outline from window bg/fg by frameContrast. */
  const fc = Number(m.colors.get('KDE', 'frameContrast') ?? 0.2);
  v['k-frame'] = mix(m.c('Window', 'BackgroundNormal'), m.c('Window', 'ForegroundNormal'), fc);
  const font = (f: Font) => `"${f.family}", "Carlito", sans-serif`;
  v['k-font'] = font(m.fonts.font);
  v['k-font-fixed'] = `"${m.fonts.fixed.family}", monospace`;
  v['k-font-menu'] = font(m.fonts.menuFont);
  v['k-font-small'] = font(m.fonts.smallestReadableFont);
  v['k-font-toolbar'] = font(m.fonts.toolBarFont);
  v['k-font-title'] = font(m.fonts.activeFont);
  v['k-title-weight'] = m.fonts.activeFont.weight;
  v['k-edit-selection-fg'] = editSelectionText(m);
  v['desk-bg'] = m.c('Complementary', 'BackgroundNormal');
  v['desk-font'] = font(m.fonts.font);
  return cssVars(v);
}

export const stock = model(breezeColors, breezeGlobals);
export const ours = model(sageColors, sageGlobals);
