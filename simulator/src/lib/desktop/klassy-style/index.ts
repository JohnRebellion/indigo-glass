import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { PALETTE, normHex } from '../tokens';
import { stock, ours, editSelectionText } from './model';

export const meta: SurfaceMeta = {
  id: 'klassy-style',
  name: 'Klassy widget style',
  group: 'linux',
  order: 2,
  shipped: [
    { path: 'config/klassy/tierc-outline.patch' },
    { path: 'config/klassy/menu-tooltip-ink.patch' },
    { path: 'config/klassy/selection-text.patch' },
    { path: 'config/klassy/klassyrc' }
  ],
  stockSource:
    "Breeze widget style, unpatched (KDE Frameworks, kstyle/breezestyle.cpp + breezehelper.cpp + breezeshadowhelper.cpp) — quoted verbatim from the '-' context lines of the three patches above, which are Breeze's own pre-patch source, plus the same BreezeDark.colors + Plasma defaults ../kde-colors/model uses for its stock lane (widgetStyle=Breeze).",
  fidelity: 'medium',
  fidelityWhy:
    'Outline widths, fill-vs-outline behaviour, corner sharpness and shadow offsets are read straight from the patch hunks and klassyrc, not guessed, so the geometry this page asserts is exact. The mock widgets are Breeze-shaped approximations of real Qt controls, and one colour input (the kstyle popup shadow colour, unchanged by these patches) is rendered as an approximation because its computation lives in unpatched Breeze source this page does not fetch.',
  live: "System Settings > Appearance > Application Style shows Klassy active (kreadconfig6 --file kdeglobals --group KDE --key widgetStyle). Open Dolphin's list view, a QMenu (right-click any icon), and a tooltip to see the 2px outline vs fill and the hard offset shadow. Checkable on this host if Klassy is built and applied; scripts/check-deployment.sh does not check the widget style."
};

/* Colours only — geometry (border widths, radii, shadow offsets) is derived
 * from the patch text directly and shown in the page's settings table, not
 * routed through this token-equality check (Role expects a swatch, not a
 * pixel count). */
const tierCText = ours.c('View', 'ForegroundNormal');
const editFg = editSelectionText(ours);
const editFgToken = normHex(editFg) === PALETTE.text ? 'text' : normHex(editFg) === PALETTE.base ? 'base' : null;

export const roles: Role[] = [
  {
    role: 'Tier C on-select outline (item view + menu)',
    ours: '#FFFFFF',
    stock: ours.c('Selection', 'BackgroundNormal'),
    token: null,
    note: "tierc-outline.patch hardcodes Qt::white (drawPanelItemViewItemPrimitive, drawMenuItemControl, renderFocusRect) — not a read of the text token (#F8F8F8). It happens to match STATE_GRAMMAR.md's Tier C convention (adaptive black/light, white on a dark style), but it is a literal, not a token reference; a future variant with a lighter dark surface would not get an updated ring unless the patch is edited too. Surfaced as a role finding, not fixed — this is by design per STATE_GRAMMAR.md's own 'white/near-white on dark' rule."
  },
  {
    role: 'Tier C selected label (item view, after HighlightedText remap)',
    ours: tierCText,
    stock: stock.c('Selection', 'ForegroundNormal'),
    token: 'text'
  },
  {
    role: 'Menu / tooltip frame outline',
    ours: '#5E5E60',
    token: 'border_strong',
    note: 'menu-tooltip-ink.patch shipped literal QColor(0,0,0) here (fixed in this pass, see report) — pure black measured 1.08:1 against the menu\'s own Window fill and 1.12:1 against the tooltip\'s Tooltip fill, both far under the 3:1 UI-ring floor docs/ELEVATION.md sets, i.e. an invisible border. border_strong is the Tier B ("chrome") token STATE_GRAMMAR.md names for exactly this. It measures 3.00:1 / 2.89:1 against those two fills — a large improvement, but still short of 3:1 specifically because [palette.composite] border_strong is calibrated against `surface` alone; see the report for the proposed tokens.toml alpha change.'
  },
  {
    role: 'Line edit selection fill',
    ours: ours.c('Selection', 'BackgroundNormal'),
    stock: stock.c('Selection', 'BackgroundNormal'),
    token: 'accent'
  },
  {
    role: 'Line edit selected text (selection-text.patch contrast pick)',
    ours: editFg,
    stock: stock.c('Selection', 'ForegroundNormal'),
    token: editFgToken,
    note: editFgToken ? undefined : 'neither Text nor Base matched exactly after normalisation — see editSelectionText in ../kde-colors/model'
  }
];

const c = ours.c;
export const contrast: ContrastPair[] = [
  { name: 'Tier C selected row label vs view background (unfilled)', fg: tierCText, bg: c('View', 'BackgroundNormal'), min: 4.5 },
  { name: 'Tier C selected menu item label vs window background (unfilled)', fg: c('Window', 'ForegroundNormal'), bg: c('Window', 'BackgroundNormal'), min: 4.5 },
  { name: 'Line edit selected text vs selection fill', fg: editFg, bg: c('Selection', 'BackgroundNormal'), min: 4.5 },
  { name: 'Tooltip text vs tooltip background', fg: c('Tooltip', 'ForegroundNormal'), bg: c('Tooltip', 'BackgroundNormal'), min: 4.5 },
  { name: 'Tier C outline (white) vs view background', fg: '#FFFFFF', bg: c('View', 'BackgroundNormal'), min: 3 },
  { name: 'Tier C outline (white) vs window background', fg: '#FFFFFF', bg: c('Window', 'BackgroundNormal'), min: 3 }
];
