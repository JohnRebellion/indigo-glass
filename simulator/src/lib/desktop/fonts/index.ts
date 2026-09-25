import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { kdeColor } from '../ini';
import { ours, stock } from './model';

export const meta: SurfaceMeta = {
  id: 'fonts',
  name: 'Fonts and type roles',
  group: 'linux',
  order: 12,
  shipped: [
    { path: 'config/kdeglobals.snippet' },
    { path: 'share/fonts/indigo-glass-fonts/' },
    { path: 'share/fonts/private-build-plans.toml' }
  ],
  stockSource:
    'Plasma 6 compiled-in kdeglobals defaults (fixtures/stock/kde-colors/kdeglobals: Noto Sans 10, Hack 10, smallest Noto Sans 8, title Noto Sans 10 bold), which Konsole\'s default profile and kde-gtk-config inherit; Kirigami heading factors from kf6-kirigami 6.29 controls/Heading.qml on this host. Colours from BreezeDark.colors (same fixture dir).',
  fidelity: 'medium',
  fidelityWhy:
    'Families, point sizes and weights are read from the shipped files and checked exactly against TOKENS.type; the ours lane renders Carlito and Iosevka Custom Condensed from the repo\'s own webfonts (static/fonts, byte-identical to the bundle) and SF Pro Display / Noto Sans / Hack from whatever the viewing machine has installed — the "renders as" column says which one the browser actually drew. Browser hinting and rasterisation are not Qt\'s or Pango\'s. The role check is colour-only in the shared footer, so the type check is the page\'s own table. Sources disagree and the page shows it rather than picking one: TOKENS.type.weight is base 500 / heading 700 while docs/TYPOGRAPHY.md\'s Weight table says body 400 / heading 600 / hero 700 (and claims the token file has no weight axis, which is stale); TOKENS.type.roles calls 13pt heading_pt and 16pt section_pt while the doc calls 13pt "Section heading" and 16pt "Page heading".',
  live:
    'fc-match "Carlito" / "Iosevka Custom Condensed" / "SF Pro Display" resolve to those families; kreadconfig6 --group General --key fixed (and font, menuFont, toolBarFont, smallestReadableFont) plus --group WM --key activeFont show the pt the table expects; System Settings > Text & Fonts lists the same. On this host all five families resolve and ~/.config/kdeglobals carries fixed=11 (apply.sh) but activeFont=10 — checkable here, read-only.'
};

const c = (set: string, k: string) => kdeColor(ours.colors.get(`Colors:${set}`, k));
const s = (set: string, k: string) => kdeColor(stock.colors.get(`Colors:${set}`, k));

/* The colours every specimen paints its text on — the only part of a type
   surface the shared (colour) role check can mean something for. */
export const roles: Role[] = [
  { role: 'specimen text', ours: c('Window', 'ForegroundNormal'), stock: s('Window', 'ForegroundNormal'), token: 'text' },
  { role: 'caption / inactive text', ours: c('Window', 'ForegroundInactive'), stock: s('Window', 'ForegroundInactive'), token: 'text_muted' },
  { role: 'specimen window', ours: c('Window', 'BackgroundNormal'), stock: s('Window', 'BackgroundNormal'), token: 'surface' },
  { role: 'code / terminal view', ours: c('View', 'BackgroundNormal'), stock: s('View', 'BackgroundNormal'), token: 'base' },
  { role: 'code text', ours: c('View', 'ForegroundNormal'), stock: s('View', 'ForegroundNormal'), token: 'text' }
];

/* Floors are 4.5 throughout: the caption role is 9pt (8pt hints), well
   under the large-text threshold. */
export const contrast: ContrastPair[] = [
  { name: 'Body text on window', fg: c('Window', 'ForegroundNormal'), bg: c('Window', 'BackgroundNormal'), min: 4.5 },
  { name: 'Caption (9pt) on window', fg: c('Window', 'ForegroundInactive'), bg: c('Window', 'BackgroundNormal'), min: 4.5 },
  { name: 'Code text on view', fg: c('View', 'ForegroundNormal'), bg: c('View', 'BackgroundNormal'), min: 4.5 },
  { name: 'Code comment (inactive) on view', fg: c('Window', 'ForegroundInactive'), bg: c('View', 'BackgroundNormal'), min: 4.5 },
  { name: 'Window title', fg: kdeColor(ours.colors.get('WM', 'activeForeground')), bg: kdeColor(ours.colors.get('WM', 'activeBackground')), min: 4.5 }
];
