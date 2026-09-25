/* GTK3 theme: SageInk (ours) vs Breeze-Dark (stock), translated to web CSS by
 * gtkToWeb and scoped to each lane root. gtk-3.0/gtk.css is a one-line
 * `@import url("gtk-dark.css");` (loaded whenever prefer-dark-theme is off;
 * Sage Ink is dark-first so gtk-dark.css carries every rule) - both files are
 * still read raw so a change to either is honestly reflected. */
import sageThemeCss from '../../../../../config/gtk-theme/SageInk/gtk-3.0/gtk.css?raw';
import sageDarkCss from '../../../../../config/gtk-theme/SageInk/gtk-3.0/gtk-dark.css?raw';
import indexThemeRaw from '../../../../../config/gtk-theme/SageInk/index.theme?raw';
import breezeDarkCss from '../../../../fixtures/stock/gtk3-theme/breeze-dark-gtk.css?raw';
import { gtkToWeb, extractDefineColors, type GtkTranslation } from './gtkcss';
import { parseIni, type IniDoc } from '../ini';

export const OURS_SCOPE = '[data-lane="ours"]';
export const STOCK_SCOPE = '[data-lane="stock"]';

/* Raw (untranslated) source, kept for the coverage footer: coverage must
 * inventory the shipped GTK selectors themselves, not gtkToWeb's translated
 * output (whose preludes carry [data-hover]-style rewrites of GTK's
 * pseudo-classes, which are not selector tokens the shipped file names). */
export const oursSource = sageThemeCss + '\n' + sageDarkCss;
/* Re-exported (not just used locally): ../gtk-user-css/model.ts reuses this
 * fixture read-only for its compact GTK3-layering demo, per the brief's
 * explicit allowance to import read-only from another surface's model. */
export { breezeDarkCss };
export const ours: GtkTranslation = gtkToWeb(oursSource, OURS_SCOPE);
export const stock: GtkTranslation = gtkToWeb(breezeDarkCss, STOCK_SCOPE);

export const indexTheme: IniDoc = parseIni(indexThemeRaw);

/* Pure (no browser needed) @define-color -> literal-or-@ref map, so roles can
 * be computed at import time like every other /desktop/ surface. Follows a
 * short @ref chain (Breeze aliases its THEME_* names to _breeze-suffixed
 * literals two hops away); a value that bottoms out in a shade()/alpha()/
 * mix() function is returned as-is - fine, since only `ours` role values are
 * checked against the token palette, and every one of those is a plain hex
 * literal in the shipped files (verified: check-ink-contract.py already
 * enforces token-only hex on gtk-dark.css, so any hex it finds IS a token). */
function defMap(css: string): Map<string, string> {
  const { defs } = extractDefineColors(css);
  const m = new Map<string, string>();
  for (const [name, raw] of defs) m.set(name, raw);
  return m;
}
export function resolveVar(name: string, map: Map<string, string>, hops = 6): string {
  let cur = map.get(name);
  for (let i = 0; i < hops && cur && /^@[\w-]+$/.test(cur.trim()); i++) cur = map.get(cur.trim().slice(1));
  return cur ?? name;
}

export const oursDefs = defMap(oursSource);
export const stockDefs = defMap(breezeDarkCss);

export const ourColor = (name: string) => resolveVar(name, oursDefs);
export const stockColor = (name: string) => resolveVar(name, stockDefs);

/* Named colours the shipped CSS defines directly as a hex literal, bound to
 * the token that hex must equal (checked) or PALETTE literal it's meant to
 * match when the rule paints a hardcoded hex rather than a @name (surface_alt
 * for button/tooltip/menu/popover fills, sidebar for the places pane - Sage
 * Ink's gtk-dark.css header comment gives this exact mapping, and
 * check-ink-contract.py already guarantees every hex in the file is some
 * token of the variant). */
export const ROLE_TOKENS: [string, string][] = [
  ['theme_bg_color', 'surface'],
  ['theme_fg_color', 'text'],
  ['theme_base_color', 'base'],
  ['theme_text_color', 'text'],
  ['theme_selected_bg_color', 'accent'],
  ['theme_selected_fg_color', 'base'],
  ['insensitive_bg_color', 'sidebar'],
  ['insensitive_fg_color', 'text_muted'],
  ['insensitive_base_color', 'sidebar'],
  ['theme_unfocused_bg_color', 'surface'],
  ['theme_unfocused_fg_color', 'text_muted'],
  ['theme_unfocused_base_color', 'base'],
  ['theme_unfocused_selected_bg_color', 'accent_alt'],
  ['theme_unfocused_selected_fg_color', 'base'],
  ['borders', 'border_strong'],
  ['unfocused_borders', 'border_strong'],
  ['warning_color', 'amber'],
  ['error_color', 'negative'],
  ['success_color', 'positive'],
  ['accent_color', 'accent'],
  ['accent_bg_color', 'accent'],
  ['accent_fg_color', 'base'],
  ['destructive_color', 'negative'],
  ['destructive_bg_color', 'negative'],
  ['destructive_fg_color', 'base']
];

