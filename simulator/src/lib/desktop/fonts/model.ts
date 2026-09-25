/* Font roles, parsed into lane models and checked against TOKENS.type.
 *
 * Ours: the files that set a desktop font — config/kdeglobals.snippet (five
 * [General] roles), SageInk.colors [WM] activeFont (the title bar; generated),
 * share/konsole/SageInk.profile Font, and GTK 3/4 settings.ini gtk-font-name —
 * plus the font bundle and Iosevka build plan under share/fonts/. Stock: the
 * Plasma 6 compiled-in kdeglobals defaults (the kde-colors fixture), which
 * Konsole's default profile and kde-gtk-config inherit.
 *
 * The shared Role check is colour-only (normHex against PALETTE), so the
 * family / size / weight check this surface exists for is computed here
 * (`checks`) and rendered as its own table; the colour roles in index.ts
 * cover the text/background the specimens paint. */
import snippetText from '../../../../../config/kdeglobals.snippet?raw';
import sageColorsText from '../../../../../share/color-schemes/SageInk.colors?raw';
import konsoleText from '../../../../../share/konsole/SageInk.profile?raw';
import gtk3Text from '../../../../../config/gtk-3.0/settings.ini?raw';
import gtk4Text from '../../../../../config/gtk-4.0/settings.ini?raw';
import buildPlanText from '../../../../../share/fonts/private-build-plans.toml?raw';
import bundleReadme from '../../../../../share/fonts/indigo-glass-fonts/README.md?raw';
import typographyMd from '../../../../../docs/TYPOGRAPHY.md?raw';
import stockGlobalsText from '../../../../fixtures/stock/kde-colors/kdeglobals?raw';
import breezeColorsText from '../../../../fixtures/stock/kde-colors/BreezeDark.colors?raw';
import { parseIni, kdeColor, type IniDoc } from '../ini';
import { cssVars } from '../surface';
import { TOKENS } from '../tokens';
import { HOSTS } from '../hosts';
import type { KeyVars } from '../coverage';
import { parseKdeFont, parseGtkFont, parseFlatToml, mdTable, familyVerdict, cssFamily, matchWeight, type KFont, type FamilyVerdict } from './parse';

type TypeTokens = {
  families: Record<'prose' | 'chrome' | 'mono', string[]>;
  scale: Record<string, number>;
  roles: Record<string, number>;
  weight: Record<'base' | 'heading', number>;
  line_height: Record<'tight' | 'default' | 'prose', number>;
};
export const TYPE = TOKENS.type as TypeTokens;

/* ---------- files ---------- */

export const snippet = parseIni(snippetText);
const sageColors = parseIni(sageColorsText);
const konsole = parseIni(konsoleText);
const gtk3 = parseIni(gtk3Text);
const gtk4 = parseIni(gtk4Text);
const stockGlobals = parseIni(stockGlobalsText);
const breezeColors = parseIni(breezeColorsText);

/* Every file in the bundle, by path under share/fonts/indigo-glass-fonts/.
   Lazy ?url glob: the keys are the file list, nothing is fetched. */
const bundleGlob = import.meta.glob('../../../../../share/fonts/indigo-glass-fonts/**/*.{ttf,otf}', { query: '?url', import: 'default' });
export const BUNDLE_FILES = Object.keys(bundleGlob).map((p) => p.split('indigo-glass-fonts/')[1]).sort();

/* ---------- roles ---------- */

export type Stack = 'prose' | 'chrome' | 'mono';
export type RoleId = 'body' | 'mono' | 'menu' | 'toolbar' | 'smallest' | 'title' | 'terminal' | 'gtk3' | 'gtk4';

type Spec = {
  id: RoleId;
  label: string;
  /* file and key the ours value is read from */
  file: string;
  key: string;
  stack: Stack;
  /* TOKENS.type.roles key it must equal */
  token: string;
  /* the hosts/*.toml [fonts]/[konsole] key hosts/apply.sh writes into this
     file; null when apply.sh does not touch it */
  host: { sect: string; key: string; cssVar: string } | null;
  /* TYPOGRAPHY.md Role -> Size row, and Weight row */
  docRole: string;
  docWeightRow: string;
  weightToken: 'base' | 'heading';
};

export const SPECS: Spec[] = [
  { id: 'body', label: 'UI body', file: 'config/kdeglobals.snippet', key: 'General/font', stack: 'prose', token: 'body_pt',
    host: { sect: 'fonts', key: 'body_pt', cssVar: '--host-body-pt' }, docRole: 'Body / app content', docWeightRow: 'Body', weightToken: 'base' },
  { id: 'mono', label: 'Mono / code', file: 'config/kdeglobals.snippet', key: 'General/fixed', stack: 'mono', token: 'mono_pt',
    host: { sect: 'fonts', key: 'mono_pt', cssVar: '--host-mono-pt' }, docRole: 'Monospace / code', docWeightRow: 'Body', weightToken: 'base' },
  { id: 'menu', label: 'Menu', file: 'config/kdeglobals.snippet', key: 'General/menuFont', stack: 'chrome', token: 'menu_pt',
    host: { sect: 'fonts', key: 'menu_pt', cssVar: '--host-menu-pt' }, docRole: 'Menu / context menu', docWeightRow: 'Body', weightToken: 'base' },
  { id: 'toolbar', label: 'Toolbar', file: 'config/kdeglobals.snippet', key: 'General/toolBarFont', stack: 'chrome', token: 'toolbar_pt',
    host: { sect: 'fonts', key: 'toolbar_pt', cssVar: '--host-toolbar-pt' }, docRole: 'Toolbar button label', docWeightRow: 'Toolbar', weightToken: 'base' },
  { id: 'smallest', label: 'Caption / tooltip', file: 'config/kdeglobals.snippet', key: 'General/smallestReadableFont', stack: 'chrome', token: 'smallest_pt',
    host: { sect: 'fonts', key: 'smallest_pt', cssVar: '--host-small-pt' }, docRole: 'Tooltip / caption', docWeightRow: 'Caption / dim', weightToken: 'base' },
  { id: 'title', label: 'Window title', file: 'share/color-schemes/SageInk.colors', key: 'WM/activeFont', stack: 'chrome', token: 'window_title_pt',
    host: null, docRole: 'Window title', docWeightRow: 'Body', weightToken: 'base' },
  { id: 'terminal', label: 'Terminal', file: 'share/konsole/SageInk.profile', key: 'Appearance/Font', stack: 'mono', token: 'mono_pt',
    host: { sect: 'konsole', key: 'font_size', cssVar: '--host-konsole-pt' }, docRole: 'Monospace / code', docWeightRow: 'Body', weightToken: 'base' },
  { id: 'gtk3', label: 'GTK 3 apps', file: 'config/gtk-3.0/settings.ini', key: 'Settings/gtk-font-name', stack: 'prose', token: 'body_pt',
    host: { sect: 'gtk', key: 'font_pt', cssVar: '--host-body-pt' }, docRole: 'Body / app content', docWeightRow: 'Body', weightToken: 'base' },
  { id: 'gtk4', label: 'GTK 4 apps', file: 'config/gtk-4.0/settings.ini', key: 'Settings/gtk-font-name', stack: 'prose', token: 'body_pt',
    host: { sect: 'gtk', key: 'font_pt', cssVar: '--host-body-pt' }, docRole: 'Body / app content', docWeightRow: 'Body', weightToken: 'base' }
];

const split = (k: string) => { const i = k.lastIndexOf('/'); return [k.slice(0, i), k.slice(i + 1)] as const; };

function oursFont(s: Spec): KFont {
  const [g, k] = split(s.key);
  switch (s.id) {
    case 'title': return parseKdeFont(sageColors.req(g, k));
    case 'terminal': return parseKdeFont(konsole.req(g, k));
    case 'gtk3': return parseGtkFont(gtk3.req(g, k));
    case 'gtk4': return parseGtkFont(gtk4.req(g, k));
    default: return parseKdeFont(snippet.req(g, k));
  }
}

/* Stock: Plasma's compiled-in kdeglobals. Konsole's default profile uses the
   system fixed font (kdeglobals `fixed`); kde-gtk-config writes the general
   font into gtk-font-name. So neither needs a fixture of its own. */
function stockFont(s: Spec): KFont {
  const g = (k: string) => parseKdeFont(stockGlobals.req('General', k));
  switch (s.id) {
    case 'title': return parseKdeFont(stockGlobals.req('WM', 'activeFont'));
    case 'terminal': return g('fixed');
    case 'gtk3': case 'gtk4': return g('font');
    default: return g(split(s.key)[1]);
  }
}

/* ---------- the docs' own tables ---------- */

/* docs/TYPOGRAPHY.md "Role -> Size": role, step, pt, notes. */
export const DOC_ROLES = mdTable(typographyMd, 'Role -> Size').map(([role, step, pt, notes]) => ({ role, step, pt: Number(pt), notes: notes ?? '' }));
/* docs/TYPOGRAPHY.md "Weight": role, weight. */
export const DOC_WEIGHTS = mdTable(typographyMd, 'Weight').map(([role, w]) => ({ role, weight: Number(String(w).match(/\d+/)?.[0]) }));
/* The weight a doc row states in its notes ("weight 500") wins over the
   generic Weight-table row, as a reader of the doc would take it. */
function docWeight(s: { docRole: string; docWeightRow: string }): { weight: number; from: string } {
  const r = DOC_ROLES.find((d) => d.role === s.docRole);
  const inNote = r?.notes.match(/weight\s+(\d+)/i);
  if (inNote) return { weight: Number(inNote[1]), from: `Role table: ${s.docRole}` };
  const w = DOC_WEIGHTS.find((d) => d.role === s.docWeightRow);
  return { weight: w?.weight ?? NaN, from: `Weight table: ${s.docWeightRow}` };
}

/* ---------- faces the simulator / bundle has ---------- */

/* Weights each family ships as real faces in share/fonts/indigo-glass-fonts
   (read from the file names; Inter is one variable font, 100-900). */
function bundleFaces(family: string): number[] | null {
  const W: [RegExp, number][] = [[/Thin/, 100], [/Light/, 300], [/Semibold/i, 600], [/Medium/, 500], [/Heavy/, 900], [/Bold/, 700]];
  const dir: Record<string, (f: string) => boolean> = {
    Carlito: (f) => f.startsWith('Carlito/'),
    'SF Pro Display': (f) => f.startsWith('SFProDisplay/'),
    'MesloLGS NF': (f) => f.startsWith('MesloLGS/'),
    'Iosevka Custom Condensed': (f) => f.startsWith('IosevkaCustom/IosevkaCustom-Condensed'),
    'Iosevka Custom': (f) => f.startsWith('IosevkaCustom/') && !f.includes('Condensed'),
    Inter: (f) => f.startsWith('Inter/')
  };
  const pick = dir[family];
  if (!pick) return null;
  const files = BUNDLE_FILES.filter(pick).filter((f) => !/Italic/.test(f));
  if (family === 'Inter' && files.length) return [100, 200, 300, 400, 500, 600, 700, 800, 900];
  return [...new Set(files.map((f) => W.find(([re]) => re.test(f.split('/')[1]))?.[1] ?? 400))].sort((a, b) => a - b);
}

/* ---------- the check the page exists for ---------- */

export type Check = {
  id: RoleId;
  label: string;
  file: string;
  key: string;
  raw: string;
  family: string;
  stack: Stack;
  stackHead: string;
  familyOk: FamilyVerdict;
  pt: number;
  tokenKey: string;
  tokenPt: number;
  sizeOk: boolean;
  /* what hosts/apply.sh writes on the _default host, if it touches the key */
  applied: { host: string; pt: number; ok: boolean } | null;
  weight: number;
  weightToml: number;
  weightDoc: { weight: number; from: string };
  weightAgree: boolean;
  /* faces the bundle has for the family, and the one a request draws */
  faces: number[] | null;
  drawn: { file: number; toml: number } | null;
  docPt: number | undefined;
  stock: KFont;
};

const DEFAULT_HOST = HOSTS[0];

export const CHECKS: Check[] = SPECS.map((s) => {
  const f = oursFont(s);
  const tokenPt = TYPE.roles[s.token];
  const hostPt = s.host ? Number(DEFAULT_HOST.v[s.host.sect]?.[s.host.key]) : NaN;
  const weightToml = TYPE.weight[s.weightToken];
  const weightDoc = docWeight(s);
  const faces = bundleFaces(f.family);
  return {
    id: s.id, label: s.label, file: s.file, key: s.key, raw: f.raw,
    family: f.family, stack: s.stack, stackHead: TYPE.families[s.stack][0], familyOk: familyVerdict(f.family, TYPE.families[s.stack]),
    pt: f.pt, tokenKey: s.token, tokenPt, sizeOk: f.pt === tokenPt,
    applied: s.host ? { host: DEFAULT_HOST.id, pt: hostPt, ok: hostPt === tokenPt } : null,
    weight: f.weight, weightToml, weightDoc, weightAgree: f.weight === weightToml && weightToml === weightDoc.weight,
    faces, drawn: faces ? { file: matchWeight(f.weight, faces), toml: matchWeight(weightToml, faces) } : null,
    docPt: DOC_ROLES.find((d) => d.role === s.docRole)?.pt,
    stock: stockFont(s)
  };
});

/* Heading roles have no desktop key: Plasma draws headings with Kirigami,
   which derives them from the general font (kf6-kirigami 6.29
   controls/Heading.qml: level 1 x1.35, 2 x1.20, 3 x1.15; weight Normal unless
   type Primary). The token roles only reach CSS consumers. */
export const KIRIGAMI = [{ level: 1, factor: 1.35 }, { level: 2, factor: 1.2 }, { level: 3, factor: 1.15 }];
export const TOKEN_HEADINGS = [
  { key: 'heading_pt', pt: TYPE.roles.heading_pt },
  { key: 'section_pt', pt: TYPE.roles.section_pt },
  { key: 'hero_pt', pt: TYPE.scale.hero_pt, scale: true }
];
/* The naming comparison: token role name vs the doc's name for the same pt. */
export const NAMING = TOKEN_HEADINGS.map((h) => {
  const d = DOC_ROLES.filter((r) => r.pt === h.pt);
  return { token: `${h.scale ? 'scale' : 'roles'}.${h.key}`, pt: h.pt, doc: d.map((r) => r.role).join(', ') || '—' };
});

/* Every doc row checked against the token file, by pt: the doc's scale must
   land on a token role or scale step with the same use. */
export const DOC_VS_TOKEN = DOC_ROLES.map((r) => {
  const spec = SPECS.find((s) => s.docRole === r.role);
  const tok = spec ? TYPE.roles[spec.token] : undefined;
  return { ...r, tokenKey: spec?.token, tokenPt: tok, ok: tok === undefined ? null : tok === r.pt };
});

/* The snippet's own header comment claims the sizes too; show it verbatim. */
export const SNIPPET_COMMENT = snippetText.split('\n').filter((l) => /^#\s+(body|fixed|menu)/.test(l)).map((l) => l.replace(/^#\s*/, ''));

/* ---------- bundle README claims vs files ---------- */

export const README_ROWS = mdTable(bundleReadme, 'Bundle contents').map(([folder, family, files, licence, notes]) => {
  const dir = folder.replace(/\/$/, '');
  const actual = BUNDLE_FILES.filter((f) => f.startsWith(`${dir}/`));
  return { dir, family, claimed: Number(files.match(/\d+/)?.[0]), actual: actual.length, licence, notes };
});
export const README_TITLE = bundleReadme.split('\n')[0].replace(/^#\s*/, '');
export const README_NOT_SHIPPED = /Iosevka Custom Condensed \(NOT shipped\)/.test(bundleReadme);

/* ---------- build plan ---------- */

export const BUILD_PLAN = parseFlatToml(buildPlanText);

/* ---------- lanes ---------- */

export type Specimen = { family: string; pt: number; weight: number; size: string };
export type FontsModel = {
  which: 'stock' | 'ours';
  fonts: Record<RoleId, KFont>;
  headings: { label: string; pt: number; weight: number; size: string; stack: Stack }[];
  colors: IniDoc;
};

function laneModel(which: 'stock' | 'ours'): FontsModel {
  const fonts = Object.fromEntries(SPECS.map((s) => [s.id, which === 'ours' ? oursFont(s) : stockFont(s)])) as Record<RoleId, KFont>;
  const body = fonts.body;
  const headings: FontsModel['headings'] = KIRIGAMI.map((k) => ({
    label: `Kirigami.Heading level ${k.level} (general font x${k.factor})`,
    pt: Math.round(body.pt * k.factor * 100) / 100,
    weight: 400,
    size: which === 'ours' ? `calc(var(--host-body-pt) * ${k.factor})` : `${body.pt * k.factor}pt`,
    stack: 'prose' as Stack
  }));
  if (which === 'ours')
    for (const h of TOKEN_HEADINGS)
      headings.push({
        label: `TOKENS.type.${h.scale ? 'scale' : 'roles'}.${h.key} (CSS consumers only)`,
        pt: h.pt, weight: TYPE.weight.heading, size: `calc(${h.pt}pt * var(--host-scale))`, stack: 'chrome'
      });
  return { which, fonts, headings, colors: which === 'ours' ? sageColors : breezeColors };
}

export const ours = laneModel('ours');
export const stock = laneModel('stock');

/* Which lane variable renders which snippet key — the coverage map. */
export const KEY_VARS: KeyVars = {
  'General/font': ['f-body-family', 'f-body-size'],
  'General/fixed': ['f-mono-family', 'f-mono-size'],
  'General/menuFont': ['f-menu-family', 'f-menu-size'],
  'General/toolBarFont': ['f-toolbar-family', 'f-toolbar-size'],
  'General/smallestReadableFont': ['f-smallest-family', 'f-smallest-size']
};

/* Ours sizes follow what hosts/apply.sh writes for the selected host (the
   documented install step: merge the snippet, then apply.sh); keys apply.sh
   never touches (activeFont) stay at the file's pt on every host. Stock is
   Plasma at 100%: the file's pt, unscaled. */
export function laneVars(m: FontsModel): string {
  const v: Record<string, string | number> = {};
  for (const s of SPECS) {
    const f = m.fonts[s.id];
    const stack = m.which === 'ours' ? TYPE.families[s.stack] : [s.stack === 'mono' ? 'monospace' : 'sans-serif'];
    v[`f-${s.id}-family`] = cssFamily([f.family, ...stack]);
    v[`f-${s.id}-weight`] = f.weight;
    v[`f-${s.id}-size`] = m.which === 'ours' && s.host ? `var(${s.host.cssVar})` : `${f.pt}pt`;
  }
  const c = (set: string, k: string) => kdeColor(m.colors.get(`Colors:${set}`, k));
  v['f-window-bg'] = c('Window', 'BackgroundNormal');
  v['f-window-fg'] = c('Window', 'ForegroundNormal');
  v['f-window-muted'] = c('Window', 'ForegroundInactive');
  v['f-view-bg'] = c('View', 'BackgroundNormal');
  v['f-view-fg'] = c('View', 'ForegroundNormal');
  v['f-rule'] = c('Window', 'BackgroundAlternate');
  v['f-title-bg'] = kdeColor(m.colors.get('WM', 'activeBackground'));
  v['f-title-fg'] = kdeColor(m.colors.get('WM', 'activeForeground'));
  v['desk-bg'] = c('Complementary', 'BackgroundNormal');
  v['desk-font'] = cssFamily([m.fonts.body.family, 'sans-serif']);
  return cssVars(v);
}

/* hosts/*.toml [gtk] font_pt is rendered through --host-body-pt (hosts.ts
   exposes no GTK variable). Holds only while the two agree on every host;
   the page shows this list, and it must stay empty. */
export const GTK_HOST_MISMATCH = HOSTS.filter((h) => Number(h.v.gtk?.font_pt) !== Number(h.v.fonts?.body_pt)).map((h) => `${h.id}: gtk.font_pt ${h.v.gtk?.font_pt} vs fonts.body_pt ${h.v.fonts?.body_pt}`);
