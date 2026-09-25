import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { PALETTE, normHex } from '../tokens';
import { ourColor, stockColor, ROLE_TOKENS } from './model';

export const meta: SurfaceMeta = {
  id: 'gtk3-theme',
  name: 'GTK3 theme',
  group: 'linux',
  order: 7,
  shipped: [
    { path: 'config/gtk-theme/SageInk/gtk-3.0/gtk.css' },
    { path: 'config/gtk-theme/SageInk/gtk-3.0/gtk-dark.css' },
    { path: 'config/gtk-theme/SageInk/index.theme' }
  ],
  stockSource:
    'Breeze-Dark gtk-3.0/gtk.css (fixtures/stock/gtk3-theme), copied from /usr/share/themes/Breeze-Dark/gtk-3.0/gtk.css on this host — `rpm -qf` reports breeze-gtk-gtk3-6.7.4-1.fc44.noarch. Breeze-Dark is what a stock Plasma 6 session applies to GTK3 apps by default (kde-gtk-config), not upstream Adwaita.',
  fidelity: 'high',
  fidelityWhy:
    'Both stylesheets are translated by a shared GTK-CSS-to-web-CSS translator (gtkcss.ts), not hand-copied into the specimen markup: real selectors, real @define-color values (resolved through var()), real shade()/alpha()/mix() colour math (color-mix() equivalents — alpha() and mix() are exact; shade()/lighter()/darker() are a documented piecewise approximation of GTK’s HSL-lightness scaling), and the same state pseudo-classes GTK ships, mapped to static classes/attributes so every state renders without simulated interaction. What is lost: -gtk-* icon/gradient/asset properties (dropped, listed below with why — mostly affects the Breeze-Dark stock lane, which is not coverage-checked) and real GTK widget layout algorithms (a GtkTreeView’s exact hit-testing, a GtkSwitch’s real drag physics) that no CSS translation can reproduce; the specimens are DOM shaped like the real widget tree, not a running GTK process.',
  live: 'System Settings > Appearance shows GTK theme "SageInk" (via kde-gtk-config); a GTK3 app (e.g. GParted, Meld, or the xdg-desktop-portal-gtk file chooser used by MS Edge — see the gtk-dark.css file-chooser comment) shows the ink material live. scripts/check-deployment.sh does not check GTK specifically; verify via `gsettings get org.gnome.desktop.interface gtk-theme` (should read a value the GTK3 stack actually honours) or by opening a real GTK3 window. Checkable on this host — GTK3 and Breeze-Dark are both installed.'
};

const c = (name: string) => normHex(ourColor(name));

export const roles: Role[] = ROLE_TOKENS.map(([name, token]) => ({
  role: name,
  ours: ourColor(name),
  stock: stockColor(`${name}_breeze`) !== `${name}_breeze` ? stockColor(`${name}_breeze`) : stockColor(name),
  token
}));

/* Pairs the shipped CSS actually paints. Literal hex the file hardcodes
 * outside a @define-color (button/tooltip/menu/popover fill, sidebar/places
 * pane) are read from PALETTE directly — surface_alt (#121216) and sidebar
 * (#0A0A0D) per the file's own header comment — rather than re-typed, so a
 * token change is still caught here even though it isn't behind a @name. */
export const contrast: ContrastPair[] = [
  { name: 'Window text', fg: c('theme_fg_color'), bg: c('theme_bg_color'), min: 4.5 },
  { name: 'Button label', fg: c('theme_fg_color'), bg: PALETTE.surface_alt, min: 4.5 },
  { name: 'Hover/focus ring on a button', fg: c('accent_color'), bg: PALETTE.surface_alt, min: 3 },
  { name: 'Suggested-action label', fg: c('accent_fg_color'), bg: c('accent_color'), min: 4.5 },
  { name: 'Destructive-action label', fg: c('destructive_fg_color'), bg: c('destructive_bg_color'), min: 4.5 },
  { name: 'Entry text', fg: c('theme_text_color'), bg: c('theme_base_color'), min: 4.5 },
  { name: 'Text selection fill (Tier A)', fg: c('accent_fg_color'), bg: c('accent_color'), min: 4.5 },
  { name: 'On-select outline vs view (Tier C)', fg: c('theme_text_color'), bg: c('theme_base_color'), min: 3 },
  { name: 'Tooltip text', fg: c('theme_fg_color'), bg: PALETTE.surface_alt, min: 4.5 },
  { name: 'Menu item text', fg: c('theme_fg_color'), bg: PALETTE.surface_alt, min: 4.5 },
  { name: 'Sidebar text', fg: c('theme_fg_color'), bg: PALETTE.sidebar, min: 4.5 },
  { name: 'Focus ring on window', fg: c('theme_fg_color'), bg: c('theme_bg_color'), min: 3 }
];
