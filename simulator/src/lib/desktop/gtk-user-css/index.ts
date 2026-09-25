import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { PALETTE, normHex } from '../tokens';
import { ourG4Color, stockG4Color, ourG3Color, ROLE_TOKENS_G4 } from './model';

export const meta: SurfaceMeta = {
  id: 'gtk-user-css',
  name: 'GTK user CSS',
  group: 'linux',
  order: 8,
  shipped: [
    { path: 'config/gtk-3.0/gtk.css' },
    { path: 'config/gtk-4.0/gtk.css' },
    { path: 'config/gtk-3.0/settings.ini' },
    { path: 'config/gtk-4.0/settings.ini' },
    { path: 'config/plasma-workspace/env/gtk.sh' }
  ],
  stockSource:
    'GTK4/libadwaita half: fixtures/stock/gtk-user-css/adwaita-dark.css, the resolved-dark branch of libadwaita 1.9.3’s own compiled stylesheet (gresource-extracted from /usr/lib64/libadwaita-1.so.0 on this host — see that file’s header; accent_bg_color/accent_fg_color are libadwaita’s runtime-injected default, GNOME "blue" #3584e4). GTK3 half: Breeze-Dark, reused read-only from fixtures/stock/gtk3-theme (same fixture the gtk3-theme surface ships).',
  fidelity: 'high',
  fidelityWhy:
    'Both files are translated by the same gtkcss.ts translator as gtk3-theme, and both "ours" lanes are rendered as the real load order — theme/stock stylesheet concatenated with the user override, not the override in isolation — so a value the override does not touch still shows the layer underneath it, and the brief’s "layers ON TOP" instruction is demonstrated structurally, not just asserted in prose. GTK4/libadwaita apps do not consult gtk-theme-name at all (that key is GTK3-only compatibility cruft); gtk-4.0/settings.ini’s gtk-theme-name=SageInk line has no effect on a libadwaita app and is shown as such in the settings table, not silently treated as if it worked. What is lost: the same -gtk-*/icon-asset gap as gtk3-theme (none appear in these two files — they are pure colour/shape overrides, not full themes), and settings.ini keys with no visual effect in a static CSS specimen (cursor-blink-time, primary-button-warps-slider) are shown literally rather than simulated.',
  live: 'GTK4/libadwaita: any GNOME app (Nautilus/Text Editor/xdg-desktop-portal-gtk\'s own dialogs) picks up gtk-4.0/gtk.css automatically — no toggle needed. GTK3: same as gtk3-theme (kde-gtk-config sets GTK_THEME=SageInk via gtk.sh; a GTK3 app then also loads ~/.config/gtk-3.0/gtk.css on top). Checkable on this host — GTK3, GTK4 and libadwaita are all installed.'
};

const g4 = (name: string) => normHex(ourG4Color(name));

export const roles: Role[] = ROLE_TOKENS_G4.map(([name, token]) => ({
  role: name,
  ours: ourG4Color(name),
  stock: stockG4Color(name),
  token
}));

export const contrast: ContrastPair[] = [
  { name: 'Window text', fg: g4('window_fg_color'), bg: g4('window_bg_color'), min: 4.5 },
  { name: 'Headerbar text', fg: g4('headerbar_fg_color'), bg: g4('headerbar_bg_color'), min: 4.5 },
  { name: 'View text', fg: g4('view_fg_color'), bg: g4('view_bg_color'), min: 4.5 },
  { name: 'Card text', fg: g4('card_fg_color'), bg: g4('card_bg_color'), min: 4.5 },
  { name: 'Suggested-action label', fg: g4('accent_fg_color'), bg: g4('accent_bg_color'), min: 4.5 },
  { name: 'Destructive-action label', fg: g4('destructive_fg_color'), bg: g4('destructive_bg_color'), min: 4.5 },
  { name: 'On-select outline vs view (Tier C)', fg: g4('window_fg_color'), bg: g4('view_bg_color'), min: 3 },
  { name: 'Sidebar text', fg: g4('sidebar_fg_color'), bg: g4('sidebar_bg_color'), min: 4.5 },
  { name: 'Popover text', fg: g4('popover_fg_color'), bg: g4('popover_bg_color'), min: 4.5 },
  {
    name: 'GTK3 layered link colour vs base (accent override on top of the theme)',
    fg: normHex(ourG3Color('link_color')),
    bg: PALETTE.base,
    min: 4.5
  }
];
