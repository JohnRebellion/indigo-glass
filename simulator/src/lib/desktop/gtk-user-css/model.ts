/* gtk-3.0/gtk4.0 user CSS + settings.ini vs stock GTK/libadwaita defaults.
 *
 * Two independent @scope pairs share one page: GTK4/libadwaita (primary —
 * every modern GNOME/libadwaita app, and the xdg-desktop-portal-gtk dialogs
 * most non-GTK apps show) and a compact GTK3 layering demo. Each pair gets
 * its own scope selector (".gtk4-demo" / ".gtk3-demo" nested under the usual
 * [data-lane] root) so the two translated stylesheets never cross-match each
 * other's specimens despite sharing one lane attribute value on the page.
 *
 * GTK3 "ours" is the real load order, not just the override file alone:
 * config/gtk-3.0/gtk.css is a small accent retint that GTK loads AFTER the
 * SageInk theme (~/.themes/SageInk/gtk-3.0/gtk-dark.css) is already applied —
 * concatenating theme-then-override and relying on gtkToWeb's last-@define-
 * color-wins semantics (tested in gtk3-theme/gtkcss.test.ts) reproduces that
 * cascade. Stock has no such override layer: a stock desktop never had this
 * file, so stock is Breeze-Dark alone, reused read-only from ../gtk3-theme/model.
 *
 * GTK4 follows the identical shape: stock is libadwaita's own compiled dark
 * palette (fixtures/stock/gtk-user-css/adwaita-dark.css, gresource-extracted —
 * see that file's header), ours is that same palette with config/gtk-4.0/
 * gtk.css layered on top, exactly as GTK4 loads it (libadwaita's stylesheet,
 * then the user's gtk.css, unconditionally — GTK4/libadwaita apps do not
 * consult gtk-theme-name at all, unlike GTK3; see index.ts fidelityWhy). */
import userGtk3Css from '../../../../../config/gtk-3.0/gtk.css?raw';
import userGtk4Css from '../../../../../config/gtk-4.0/gtk.css?raw';
/* Re-exported: the coverage footer inventories these two files alone (what
 * this surface actually ships), not oursG4Source/oursG3Source below (which
 * also carry the stock/theme file underneath for rendering the real cascade —
 * inventorying that too would wrongly require this page to cover gtk3-theme's
 * own shipped selectors, which that surface already covers). */
export { userGtk3Css, userGtk4Css };
import settings3Raw from '../../../../../config/gtk-3.0/settings.ini?raw';
import settings4Raw from '../../../../../config/gtk-4.0/settings.ini?raw';
import gtkShRaw from '../../../../../config/plasma-workspace/env/gtk.sh?raw';
import adwaitaDarkCss from '../../../../fixtures/stock/gtk-user-css/adwaita-dark.css?raw';
import { oursSource as sageGtk3ThemeCss, breezeDarkCss, resolveVar } from '../gtk3-theme/model';
import { gtkToWeb, extractDefineColors, type GtkTranslation } from '../gtk3-theme/gtkcss';
import { parseIni, type IniDoc } from '../ini';

export const OURS_SCOPE_G4 = '[data-lane="ours"] .gtk4-demo';
export const STOCK_SCOPE_G4 = '[data-lane="stock"] .gtk4-demo';
export const OURS_SCOPE_G3 = '[data-lane="ours"] .gtk3-demo';
export const STOCK_SCOPE_G3 = '[data-lane="stock"] .gtk3-demo';

export const oursG4Source = adwaitaDarkCss + '\n' + userGtk4Css;
export const oursG3Source = sageGtk3ThemeCss + '\n' + userGtk3Css;

export const oursG4: GtkTranslation = gtkToWeb(oursG4Source, OURS_SCOPE_G4);
export const stockG4: GtkTranslation = gtkToWeb(adwaitaDarkCss, STOCK_SCOPE_G4);
export const oursG3: GtkTranslation = gtkToWeb(oursG3Source, OURS_SCOPE_G3);
export const stockG3: GtkTranslation = gtkToWeb(breezeDarkCss, STOCK_SCOPE_G3);

export const settings3: IniDoc = parseIni(settings3Raw);
export const settings4: IniDoc = parseIni(settings4Raw);
export const gtkSh: string = gtkShRaw;

function defMap(css: string): Map<string, string> {
  const { defs } = extractDefineColors(css);
  const m = new Map<string, string>();
  for (const [name, raw] of defs) m.set(name, raw);
  return m;
}

export const oursG4Defs = defMap(oursG4Source);
export const stockG4Defs = defMap(adwaitaDarkCss);
export const oursG3Defs = defMap(oursG3Source);
export const stockG3Defs = defMap(breezeDarkCss);

export const ourG4Color = (name: string) => resolveVar(name, oursG4Defs);
export const stockG4Color = (name: string) => resolveVar(name, stockG4Defs);
export const ourG3Color = (name: string) => resolveVar(name, oursG3Defs);

/* GTK4/libadwaita named-colour roles config/gtk-4.0/gtk.css actually sets
 * (accent/destructive/success/warning/error + the window/view/headerbar/
 * card/popover/dialog/sidebar surfaces + link colours). Bound to the token
 * each hex must equal, same pattern as gtk3-theme/model.ts's ROLE_TOKENS. */
export const ROLE_TOKENS_G4: [string, string][] = [
  ['window_bg_color', 'surface'],
  ['window_fg_color', 'text'],
  ['view_bg_color', 'base'],
  ['view_fg_color', 'text'],
  ['headerbar_bg_color', 'surface_alt'],
  ['headerbar_fg_color', 'text'],
  ['headerbar_border_color', 'border'],
  ['headerbar_backdrop_color', 'surface'],
  ['card_bg_color', 'surface_alt'],
  ['card_fg_color', 'text'],
  ['popover_bg_color', 'surface_alt'],
  ['popover_fg_color', 'text'],
  ['dialog_bg_color', 'surface_alt'],
  ['dialog_fg_color', 'text'],
  ['sidebar_bg_color', 'sidebar'],
  ['sidebar_fg_color', 'text'],
  ['sidebar_backdrop_color', 'base'],
  ['sidebar_border_color', 'border'],
  ['accent_color', 'accent_hi'],
  ['accent_bg_color', 'accent'],
  ['accent_fg_color', 'base'],
  ['destructive_bg_color', 'negative'],
  ['destructive_fg_color', 'base'],
  ['success_bg_color', 'positive'],
  ['success_fg_color', 'base'],
  ['warning_bg_color', 'amber'],
  ['warning_fg_color', 'base'],
  ['error_bg_color', 'negative'],
  ['error_fg_color', 'base'],
  ['link_color', 'accent_alt'],
  ['link_visited_color', 'accent_hi'],
  ['violet_color', 'accent_alt']
];
