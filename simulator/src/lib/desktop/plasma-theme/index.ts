import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, stock, SAGE, PLASMA_SETS, PT_KEYS, topPaint, type PlasmaSet, type PtKey, type PtModel } from './model';

export const meta: SurfaceMeta = {
  id: 'plasma-theme',
  name: 'Plasma desktop theme',
  group: 'linux',
  order: 9,
  shipped: [
    { path: 'config/plasma-theme/SageInk/colors', generated: true },
    { path: 'config/plasma-theme/SageInk/plasmarc' },
    { path: 'config/plasma-theme/SageInk/metadata.json' },
    ...Object.keys(SAGE.files).sort().map((p) => ({ path: `config/plasma-theme/SageInk/${p}.svg` }))
  ],
  stockSource:
    'breeze-dark (colors, plasmarc, metadata.json; no SVGs) over the "default" image set, from /usr/share/plasma/desktoptheme on the Fedora 44 host, rpm libplasma-6.7.4-1.fc44 (fixtures/stock/plasma-theme, .svgz gunzipped). Rendered with the KSvg selector "translucent", as on a stock session with the KWin blur effect on.',
  fidelity: 'medium',
  fidelityWhy:
    'Every frame is cut from the shipped SVG and laid out by a port of KSvg FrameSvg (hint margins, tiling, disabled borders, prefix fallback) with colours from ImageSetPrivate::namedColor over the theme\'s own colors file, so geometry, paint and colour roles come from the files. The Sage Ink lane renders the ROOT files: this host (Wayland, KWin blur effect removed) gets KSvg selector {} from ThemePrivate::updateKSvgSelectors; the stock lane renders default/translucent/ because a stock session has blur on. The browser rasterises the SVG, not QtSvg (sub-pixel seams can differ); panel, Kickoff and applet content are mock-ups; the wallpaper blur of stock "blurred" widgets and KWin\'s blur behind stock popups are not simulated.',
  live:
    'scripts/check-deployment.sh reports "plasma widget theme" (plasmarc [Theme] name=SageInk). Then look: open Kickoff (flush on the panel, 2px edge on three sides, no bottom edge), hover a task (tooltip: flat fill, 2px edge), scroll a long Kickoff list (thumb accent, accent_hi on hover), add a Sticky Note widget (flat, no blur). Checkable on this host by eye (Plasma 6.7.4, Wayland); no desktop screenshots.'
};

/* Token each Plasma colour role must equal in the Sage Ink lane. */
const BG: Record<PlasmaSet, string> = { Window: 'surface', View: 'base', Button: 'surface_alt', Header: 'base', Tooltip: 'surface_alt', Complementary: 'base' };
const LINK: Record<PlasmaSet, string> = { Window: 'accent_hi', View: 'accent_hi', Button: 'accent_alt', Header: 'accent_alt', Tooltip: 'accent_alt', Complementary: 'accent_alt' };
const token = (s: PlasmaSet, k: PtKey): string => {
  switch (k) {
    case 'BackgroundNormal': return BG[s];
    case 'ForegroundNormal': return 'text';
    case 'ForegroundInactive': return 'text_muted';
    case 'ForegroundActive': return 'accent_hi';
    case 'ForegroundLink': return LINK[s];
    case 'ForegroundVisited': return 'accent_alt';
    case 'ForegroundNegative': return 'negative';
    case 'ForegroundNeutral': return 'amber';
    case 'ForegroundPositive': return 'positive';
    case 'DecorationFocus': return 'text';
    case 'DecorationHover': return 'accent_hi';
  }
};

/* Painted roles need the SVG DOM; the registry is also imported outside a
   browser (prerender entries), where they are skipped. */
const DOM = typeof DOMParser !== 'undefined';
type Painted = { role: string; file: string; id: string; set?: PlasmaSet; token: string | null; note?: string; min?: number };
const PAINTED: Painted[] = [
  { role: 'panel fill', file: 'widgets/panel-background', id: 'center', token: 'surface' },
  { role: 'desktop widget fill', file: 'widgets/background', id: 'center', token: 'surface' },
  { role: 'popup fill (dialogs/background)', file: 'dialogs/background', id: 'center', token: 'surface' },
  { role: 'popup 2px edge', file: 'dialogs/background', id: 'top', token: 'border_strong', note: 'ELEVATION level 2 edge' },
  { role: 'tooltip fill', file: 'widgets/tooltip', id: 'center', set: 'Tooltip', token: 'surface', note: 'ColorScheme-Background is always the Window set (namedColor)' },
  { role: 'tooltip 2px edge', file: 'widgets/tooltip', id: 'top', set: 'Tooltip', token: 'border_strong' },
  { role: 'in-scene tooltip ink shadow', file: 'solid/widgets/tooltip', id: 'shadow-right', set: 'Tooltip', token: 'accent_alt', note: 'hard 4px-style offset, PC3 ToolTip only' },
  { role: 'viewitem hover ring', file: 'widgets/viewitem', id: 'hover-top', token: 'accent_hi' },
  { role: 'viewitem selected ring', file: 'widgets/viewitem', id: 'selected-top', token: 'text', note: 'Tier C: outline, no fill' },
  { role: 'viewitem selected+hover ring', file: 'widgets/viewitem', id: 'selected+hover-top', token: 'text' },
  { role: 'scrollbar track', file: 'widgets/scrollbar', id: 'background-vertical-center', token: 'surface_alt' },
  { role: 'scrollbar thumb', file: 'widgets/scrollbar', id: 'slider-center', token: 'accent', note: 'Tier D identity fill' },
  { role: 'scrollbar thumb, hover', file: 'widgets/scrollbar', id: 'mouseover-slider-center', token: 'accent_hi' },
  { role: 'task manager focus (fallback)', file: 'widgets/tasks', id: 'focus-center', token: null, min: 0.01, note: 'SageInk ships no widgets/tasks: KSvg falls back to default/widgets/tasks.svg, a translucent ButtonFocus wash' }
];
const paint = (m: PtModel, p: Painted) => topPaint(m, p.file, p.id, p.set, p.min);

export const roles: Role[] = [
  ...PLASMA_SETS.flatMap((s) =>
    (Object.keys(PT_KEYS) as PtKey[]).map((k) => ({ role: `${s}.${k}`, ours: ours.scheme(s, k), stock: stock.scheme(s, k), token: token(s, k) }))
  ),
  { role: 'Selection.BackgroundNormal (Highlight)', ours: ours.scheme('Selection', 'BackgroundNormal'), stock: stock.scheme('Selection', 'BackgroundNormal'), token: 'accent' },
  /* base, not text: the plasmashell flavour of the scheme (codegen emit_kde_colors(plasma_shell=True)) - PC3 fields paint selected text in it over accent. */
  { role: 'Selection.ForegroundNormal (HighlightedText)', ours: ours.scheme('Selection', 'ForegroundNormal'), stock: stock.scheme('Selection', 'ForegroundNormal'), token: 'base' },
  ...(DOM ? PAINTED.map((p) => ({ role: p.role, ours: paint(ours, p), stock: paint(stock, p), token: p.token, note: p.note })) : [])
];

const w = (k: PtKey, s: PlasmaSet = 'Window') => ours.scheme(s, k);
const at = (file: string, id: string, set?: PlasmaSet) => (DOM ? topPaint(ours, file, id, set) : w('BackgroundNormal'));
const panel = at('widgets/panel-background', 'center');
const dialog = at('dialogs/background', 'center');
const tip = at('widgets/tooltip', 'center', 'Tooltip');
const widget = at('widgets/background', 'center');
const track = at('widgets/scrollbar', 'background-vertical-center');
const desk = ours.scheme('View', 'BackgroundNormal');

export const contrast: ContrastPair[] = [
  { name: 'Panel clock / task label', fg: w('ForegroundNormal'), bg: panel, min: 4.5 },
  { name: 'Kickoff item label', fg: w('ForegroundNormal'), bg: dialog, min: 4.5 },
  { name: 'Kickoff item description', fg: w('ForegroundInactive'), bg: dialog, min: 4.5 },
  { name: 'Kickoff link', fg: w('ForegroundLink'), bg: dialog, min: 4.5 },
  { name: 'Tooltip title (Tooltip text on Window-set fill)', fg: w('ForegroundNormal', 'Tooltip'), bg: tip, min: 4.5 },
  { name: 'Tooltip subtitle', fg: w('ForegroundInactive', 'Tooltip'), bg: tip, min: 4.5 },
  { name: 'Desktop widget text', fg: w('ForegroundNormal'), bg: widget, min: 4.5 },
  /* PC3 TextField/TextArea (Kickoff and KRunner search) paint selected text
     in highlightedTextColor on highlightColor — both from this file's
     Selection set (PlasmaTheme::syncColors). No Klassy patch reaches QML. */
  { name: 'Selected text in a Plasma text field (PC3 TextField)', fg: ours.scheme('Selection', 'ForegroundNormal'), bg: ours.scheme('Selection', 'BackgroundNormal'), min: 4.5 },
  { name: 'Negative text on a popup', fg: w('ForegroundNegative'), bg: dialog, min: 4.5 },
  { name: 'Viewitem selected ring on popup', fg: at('widgets/viewitem', 'selected-top'), bg: dialog, min: 3 },
  { name: 'Viewitem hover ring on popup', fg: at('widgets/viewitem', 'hover-top'), bg: dialog, min: 3 },
  { name: 'Scrollbar thumb on track', fg: at('widgets/scrollbar', 'slider-center'), bg: track, min: 3 },
  { name: 'Scrollbar hover thumb on track', fg: at('widgets/scrollbar', 'mouseover-slider-center'), bg: track, min: 3 },
  /* The edge separates the popup from what is behind it; the lane backdrop
     (View background) stands in for the wallpaper. Against its own fill it is 2.9995:1 —
     see the proposed border_strong change in the report. */
  { name: 'Popup edge against the desktop backdrop', fg: at('dialogs/background', 'top'), bg: desk, min: 3 },
  { name: 'Tooltip edge against the desktop backdrop', fg: at('widgets/tooltip', 'top', 'Tooltip'), bg: desk, min: 3 }
];
