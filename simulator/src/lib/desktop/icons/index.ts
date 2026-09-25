import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, stock, SHEET_CLASSES, type IconColors } from './model';

export const meta: SurfaceMeta = {
  id: 'icons',
  name: 'Icon theme',
  group: 'linux',
  order: 13,
  shipped: [{ path: 'config/kdeglobals.snippet' }],
  stockSource:
    'breeze-dark from breeze-icon-theme 6.29.0 (fixtures/stock/icons/breeze-dark, the theme [Icons] Theme names in the Breeze Dark global theme defaults). Ours: Papirus-Dark from papirus-icon-theme(-dark) 20250501, the third-party theme install.sh dnf-installs. Both copied from /usr/share/icons on this host; manifest.json records each file\'s rpm owner.',
  fidelity: 'medium',
  fidelityWhy:
    'The repo ships one value here, [Icons] Theme=Papirus-Dark; the icons are vendored, not token-generated. The SVGs are the host\'s own files at the size index.theme resolves, recoloured the way KIconLoader does (the current-color-scheme stylesheet replaced from each lane\'s .colors via KIconColors), so what follows the palette and what stays hard-coded is exact. The browser rasterises the SVG, not Qt\'s QSvgRenderer, and SelectedState/DisabledState effects are not shown. GTK apps read the same theme (gtk settings.ini) but do NOT recolour: there the symbolic glyphs stay Papirus\'s own grey.',
  live:
    'kreadconfig6 --file kdeglobals --group Icons --key Theme prints Papirus-Dark; System Settings > Colours & Themes > Icons shows Papirus-Dark selected; in Dolphin the 16px sidebar glyphs are scheme text and the 48px folders are Papirus blue. scripts/check-deployment.sh covers the kdeglobals merge. Checkable on this host (Papirus-Dark and breeze-dark both installed).'
};

const c = ours.colors;
const s = stock.colors;

/* The stylesheet KIconLoader injects, per class, and the token each must equal.
   These come from SageInk.colors through the app palette, so they are the
   checkable part of this surface. */
const SHEET_TOKEN: Record<keyof IconColors, string> = {
  text: 'text', background: 'surface', highlight: 'accent', highlightedText: 'text',
  positive: 'positive', neutral: 'amber', negative: 'negative', accent: 'accent'
};

const folder48 = ours.icon('folder', 48);
const warn48 = ours.icon('dialog-warning', 48);
const err48 = ours.icon('dialog-error', 48);

export const roles: Role[] = [
  { role: 'Window background (icons in toolbars, dialogs)', ours: ours.kde.c('Window', 'BackgroundNormal'), stock: stock.kde.c('Window', 'BackgroundNormal'), token: 'surface' },
  { role: 'View background (Dolphin icon view)', ours: ours.kde.c('View', 'BackgroundNormal'), stock: stock.kde.c('View', 'BackgroundNormal'), token: 'base' },
  ...SHEET_CLASSES.map(([cls, k]) => ({
    role: `.ColorScheme-${cls} (KIconLoader stylesheet)`, ours: c[k], stock: s[k], token: SHEET_TOKEN[k]
  })),
  {
    role: `${ours.theme} folder body, 22-48px`, ours: folder48.body ?? 'none', stock: stock.icon('folder', 48).body ?? undefined, token: null,
    note: 'hard-coded in Papirus (folder.svg -> folder-blue.svg), not recoloured by the scheme; see the folder colour section'
  },
  { role: `${ours.theme} dialog-warning, 32-48px`, ours: warn48.body ?? 'none', token: null, note: 'hard-coded Papirus yellow, not the amber token' },
  { role: `${ours.theme} dialog-error, 32-48px`, ours: err48.body ?? 'none', token: null, note: 'hard-coded Papirus red, not the negative token' }
];

/* What the ours lane really paints behind and in the icons. Icon glyphs are
   non-text UI graphics: WCAG 1.4.11, floor 3. */
const win = ours.kde.c('Window', 'BackgroundNormal');
const view = ours.kde.c('View', 'BackgroundNormal');
const header = ours.kde.c('Header', 'BackgroundNormal');
export const contrast: ContrastPair[] = [
  { name: 'Symbolic glyph (ColorScheme-Text) on window', fg: c.text, bg: win, min: 3 },
  { name: 'Symbolic glyph on toolbar (Header)', fg: c.text, bg: header, min: 3 },
  { name: 'Symbolic glyph on view', fg: c.text, bg: view, min: 3 },
  { name: 'NegativeText glyph (16/22px dialog-error) on window', fg: c.negative, bg: win, min: 3 },
  ...(folder48.body ? [{ name: 'Papirus folder body on view', fg: folder48.body, bg: view, min: 3 }] : []),
  ...(warn48.body ? [{ name: 'Papirus dialog-warning disc on window', fg: warn48.body, bg: win, min: 3 }] : []),
  ...(err48.body ? [{ name: 'Papirus dialog-error disc on window', fg: err48.body, bg: win, min: 3 }] : []),
  { name: 'File name label under an icon (view)', fg: ours.kde.c('View', 'ForegroundNormal'), bg: view, min: 4.5 }
];
