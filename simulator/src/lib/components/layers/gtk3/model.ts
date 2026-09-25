/* GTK3 lanes for /components/: the shipped Sage Ink GTK3 theme and stock
 * Breeze-Dark, translated to scoped web CSS by the same gtkToWeb the
 * /desktop/gtk3-theme/ page uses.
 *
 * Ours is the real GTK3 load order, reused read-only from the
 * /desktop/gtk-user-css/ model: SageInk gtk.css + gtk-dark.css (THEME
 * priority), then ~/.config/gtk-3.0/gtk.css (USER priority). The user file
 * carries only @define-color lines, so concatenation (last define wins) is the
 * same cascade as GTK's provider priorities here. Its `@import 'colors.css'`
 * names a file kde-gtk-config writes at runtime (not shipped); it is inert.
 *
 * Two things GTK3's renderer does that CSS in a browser does not, modelled
 * here (both lanes) rather than in the specimen:
 *  - `outline` paints only on the focused widget. gtk_css_gadget_draw()
 *    (gtk-3-24 gtk/gtkcssgadget.c) calls gtk_css_style_render_outline() only
 *    when the gadget's draw returns draw_focus; a hovered menu item never
 *    draws one. SageInk gtk-dark.css:410-413 records the same finding
 *    empirically for rows. `outlineOnlyOnFocus` below strips outline from
 *    every node the specimen has not marked [data-focus].
 *  - An entry's placeholder is not a CSS node. gtk_entry_get_placeholder_
 *    text_color() (gtk-3-24 gtk/gtkentry.c:6333) looks up the named colour
 *    `placeholder_text_color` and falls back to rgb(0.5, 0.5, 0.5), which
 *    Pango rounds to #808080. `placeholder` below resolves that per lane.
 */
import { layerScope, type LaneName } from '../../layer';
import { breezeDarkCss, stockColor, ourColor, resolveVar } from '$lib/desktop/gtk3-theme/model';
import { oursG3Source, oursG3Defs, stockG3Defs } from '$lib/desktop/gtk-user-css/model';
import { gtkToWeb } from '$lib/desktop/gtk3-theme/gtkcss';

const ID = 'gtk3';
const scope = (lane: LaneName) => layerScope(ID, lane);

const outlineOnlyOnFocus = (lane: LaneName) =>
  `${scope(lane)} :not([data-focus]) { outline-style: none !important; }`;

/* GTK node names that are also HTML elements carry browser UA paint GTK
   never has: <button> sets its own color/background/border, where a GTK
   node's initial values are an inherited color, a transparent background and
   no border. Zero specificity and emitted first, so every theme rule wins
   over it (gtk4 puts it in a lower cascade layer for the same reason). */
export const uaReset = (sel: string) =>
  `@scope (${sel}) { :where(button, menu, label, header) { color: inherit; background-color: transparent; border: 0 none; font: inherit; margin: 0; } }`;

export const laneCss = (lane: LaneName) =>
  uaReset(scope(lane)) + '\n' +
  gtkToWeb(lane === 'ours' ? oursG3Source : breezeDarkCss, scope(lane)).css + '\n' + outlineOnlyOnFocus(lane);

/* GTK's fallback, gdk_rgba {0.5, 0.5, 0.5} through Pango's 16-bit channels. */
const PLACEHOLDER_FALLBACK = '#808080';
function placeholderOf(defs: Map<string, string>): string {
  const v = resolveVar('placeholder_text_color', defs).trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : PLACEHOLDER_FALLBACK;
}
export const placeholder: Record<LaneName, string> = {
  stock: placeholderOf(stockG3Defs),
  ours: placeholderOf(oursG3Defs)
};

export const laneStyle = (lane: LaneName) =>
  [
    `--desk-bg: ${lane === 'ours' ? ourColor('theme_bg_color') : stockColor('theme_bg_color')}`,
    `--desk-font: "Noto Sans", sans-serif`,
    `--gtk3-placeholder: ${placeholder[lane]}`
  ].join('; ');
