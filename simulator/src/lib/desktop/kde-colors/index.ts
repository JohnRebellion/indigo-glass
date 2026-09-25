import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, stock, SETS, ROLE_KEYS, editSelectionText, type SetName } from './model';

export const meta: SurfaceMeta = {
  id: 'kde-colors',
  name: 'KDE colour scheme',
  group: 'linux',
  order: 1,
  shipped: [
    { path: 'share/color-schemes/SageInk.colors', generated: true },
    { path: 'config/kdeglobals.snippet' }
  ],
  stockSource:
    'BreezeDark.colors from plasma-breeze-common 6.7.4 (fixtures/stock/kde-colors), plus Plasma 6 compiled-in kdeglobals defaults (Noto Sans 10, Hack 10, Breeze widget style)',
  fidelity: 'medium',
  fidelityWhy:
    'Every colour role and font is read from the files, so role values, contrast and consistency are exact. Widget shapes are Breeze-like mock-ups, and the disabled/inactive effects are an sRGB approximation of KColorScheme\'s HCY maths.',
  live: 'System Settings > Colours shows "Sage Ink" active; Dolphin, System Settings and Kate visibly use these roles. scripts/check-deployment.sh reports the scheme. Checkable on this host.'
};

/* Token each role must equal in the Sage Ink lane. Per-set tables where the
   design differs by set; one token where it is the same everywhere. */
const BG: Record<SetName, string> = { Window: 'surface', View: 'base', Button: 'surface_alt', Header: 'base', Selection: 'accent', Tooltip: 'surface_alt', Complementary: 'base' };
const ALT: Record<SetName, string> = { Window: 'surface_alt', View: 'surface', Button: 'surface', Header: 'surface', Selection: 'accent_hi', Tooltip: 'surface', Complementary: 'surface' };
const LINK: Record<SetName, string> = { Window: 'accent_hi', View: 'accent_hi', Button: 'accent_alt', Header: 'accent_alt', Selection: 'accent_alt', Tooltip: 'accent_alt', Complementary: 'accent_alt' };
const token = (s: SetName, k: keyof typeof ROLE_KEYS): string => {
  switch (k) {
    case 'BackgroundNormal': return BG[s];
    case 'BackgroundAlternate': return ALT[s];
    case 'ForegroundNormal': return 'text';
    case 'ForegroundInactive': return 'text_muted';
    /* Tier C: a selected label stays text, not an accent tint. */
    case 'ForegroundActive': return s === 'Selection' ? 'text' : 'accent_hi';
    case 'ForegroundLink': return LINK[s];
    case 'ForegroundVisited': return 'accent_alt';
    case 'ForegroundNegative': return 'negative';
    case 'ForegroundNeutral': return 'amber';
    case 'ForegroundPositive': return 'positive';
    case 'DecorationFocus': return 'text';
    case 'DecorationHover': return 'accent_hi';
  }
};

const WM: [string, string][] = [
  ['activeBackground', 'surface'], ['activeForeground', 'text'], ['inactiveBackground', 'sidebar'],
  ['inactiveForeground', 'text_muted'], ['activeBlend', 'accent'], ['inactiveBlend', 'text_dim']
];

export const roles: Role[] = [
  ...SETS.flatMap((s) =>
    (Object.keys(ROLE_KEYS) as (keyof typeof ROLE_KEYS)[]).map((k) => ({
      role: `${s}.${k}`, ours: ours.c(s, k), stock: stock.c(s, k), token: token(s, k),
      note: s === 'Selection' && k === 'ForegroundNormal' ? 'Tier C: selected rows are outlined, not filled' : undefined
    }))
  ),
  ...WM.map(([k, t]) => ({ role: `WM.${k}`, ours: ours.wm(k), stock: stock.wm(k), token: t }))
];

const c = ours.c;
export const contrast: ContrastPair[] = [
  { name: 'Window text', fg: c('Window', 'ForegroundNormal'), bg: c('Window', 'BackgroundNormal'), min: 4.5 },
  { name: 'Window inactive text', fg: c('Window', 'ForegroundInactive'), bg: c('Window', 'BackgroundNormal'), min: 4.5 },
  { name: 'View text', fg: c('View', 'ForegroundNormal'), bg: c('View', 'BackgroundNormal'), min: 4.5 },
  { name: 'View alternate row text', fg: c('View', 'ForegroundNormal'), bg: c('View', 'BackgroundAlternate'), min: 4.5 },
  { name: 'View link', fg: c('View', 'ForegroundLink'), bg: c('View', 'BackgroundNormal'), min: 4.5 },
  { name: 'View visited link', fg: c('View', 'ForegroundVisited'), bg: c('View', 'BackgroundNormal'), min: 4.5 },
  { name: 'Button label', fg: c('Button', 'ForegroundNormal'), bg: c('Button', 'BackgroundNormal'), min: 4.5 },
  { name: 'Header text', fg: c('Header', 'ForegroundNormal'), bg: c('Header', 'BackgroundNormal'), min: 4.5 },
  { name: 'Tooltip text', fg: c('Tooltip', 'ForegroundNormal'), bg: c('Tooltip', 'BackgroundNormal'), min: 4.5 },
  { name: 'Complementary text', fg: c('Complementary', 'ForegroundNormal'), bg: c('Complementary', 'BackgroundNormal'), min: 4.5 },
  /* Tier C: the selected row is an outline over the view, so its label sits on the view background. */
  { name: 'Selected row label (outlined)', fg: c('Selection', 'ForegroundNormal'), bg: c('View', 'BackgroundNormal'), min: 4.5 },
  /* The one filled selection: text selection in a line edit; the Klassy selection-text patch picks the label. */
  { name: 'Selected text in a line edit (filled)', fg: editSelectionText(ours), bg: c('Selection', 'BackgroundNormal'), min: 4.5 },
  { name: 'Focus ring on window', fg: c('Window', 'DecorationFocus'), bg: c('Window', 'BackgroundNormal'), min: 3 },
  { name: 'Hover ring on window', fg: c('Window', 'DecorationHover'), bg: c('Window', 'BackgroundNormal'), min: 3 },
  { name: 'Negative text', fg: c('Window', 'ForegroundNegative'), bg: c('Window', 'BackgroundNormal'), min: 4.5 },
  { name: 'Active title', fg: ours.wm('activeForeground'), bg: ours.wm('activeBackground'), min: 4.5 },
  { name: 'Inactive title', fg: ours.wm('inactiveForeground'), bg: ours.wm('inactiveBackground'), min: 4.5 }
];
