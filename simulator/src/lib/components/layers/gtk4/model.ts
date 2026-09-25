/* GTK4 / libadwaita lanes for /components/.
 *
 * Stock: libadwaita 1.9.3's compiled widget stylesheet (fixtures/stock/
 * libadwaita/gtk.css), dark branch, with the accent GTK injects at runtime
 * taken from the palette fixture /desktop/gtk-user-css/ already uses.
 * Ours: that same stylesheet with config/gtk-4.0/gtk.css on top, as GTK4
 * loads it — imported read-only from the gtk-user-css model.
 *
 * GTK resolves the two files by style-provider priority before specificity:
 * libadwaita is a THEME provider, ~/.config/gtk-4.0/gtk.css a USER provider,
 * and a USER declaration wins even over a more specific THEME selector
 * (gtk/gtkstylecascade.c). Plain concatenation would let libadwaita's
 * `button:focus:focus-visible { outline-color }` beat the user file's
 * `* { outline-color }`; a cascade layer for libadwaita reproduces GTK's
 * rule — any unlayered (user) declaration beats every layered (theme) one.
 *
 * libadwaita's file is modern CSS, so a few things are adapted before
 * gtkToWeb sees it, each a translation rather than a change of meaning:
 *  - `:root` custom properties land on the lane root (`:scope`);
 *  - `@media (prefers-color-scheme: dark)` is unwrapped (a dark session
 *    resolves it true) and `@media (prefers-contrast: more)` dropped (off by
 *    default), so the browser's own preference cannot pick the branch;
 *  - `:focus-within` and `:drop(active)` become data attributes like the
 *    other GTK states (gtkcss.ts PSEUDO_MAP has neither; an unknown
 *    `:drop()` would also void every rule sharing its selector list).
 */
import { layerScope, type LaneName } from '../../layer';
import adwaitaCss from '../../../../../fixtures/stock/libadwaita/gtk.css?raw';
import adwaitaPalette from '../../../../../fixtures/stock/gtk-user-css/adwaita-dark.css?raw';
import { userGtk4Css, ourG4Color, stockG4Color } from '$lib/desktop/gtk-user-css/model';
import { gtkToWeb, extractDefineColors } from '$lib/desktop/gtk3-theme/gtkcss';
import { stripComments } from '$lib/sites/scopedStylus';
import { uaReset } from '../gtk3/model';

const ID = 'gtk4';
const scope = (lane: LaneName) => layerScope(ID, lane);

/* Replace each top-level `@media <cond> { ... }` block by `keep(cond, inner)`. */
function mapMedia(css: string, keep: (cond: string, inner: string) => string): string {
  let out = '';
  let i = 0;
  for (;;) {
    const at = css.indexOf('@media', i);
    if (at === -1) return out + css.slice(i);
    const open = css.indexOf('{', at);
    let depth = 1;
    let j = open + 1;
    for (; j < css.length && depth > 0; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
    }
    out += css.slice(i, at) + keep(css.slice(at + 6, open).trim(), css.slice(open + 1, j - 1));
    i = j;
  }
}

function adapt(css: string): string {
  const flat = mapMedia(stripComments(css), (cond, inner) => {
    if (/prefers-color-scheme:\s*dark/.test(cond)) return inner;
    if (/prefers-contrast/.test(cond)) return '';
    return `@media ${cond} {${inner}}`;
  });
  return flat
    .replace(/:root\b/g, ':scope')
    .replace(/:focus-within\b/g, '[data-focus-within]')
    .replace(/:drop\(active\)/g, '[data-drop-active]');
}

/* The runtime accent (not compiled into libadwaita's file), from the palette
   fixture's own @define-color lines. */
const accentDefaults = extractDefineColors(adwaitaPalette)
  .defs.filter(([n]) => n === 'accent_bg_color' || n === 'accent_fg_color')
  .map(([n, v]) => `@define-color ${n} ${v};`)
  .join('\n');

const theme = accentDefaults + '\n' + adapt(adwaitaCss);
/* Declared in this order so the UA reset sits below libadwaita, and both
   below the unlayered user file. */
const RESET = 'gtk4-ua-reset';
const LAYER = 'gtk4-libadwaita-theme';

export const laneCss: Record<LaneName, string> = {
  stock: uaReset(scope('stock')) + '\n' + gtkToWeb(theme, scope('stock')).css,
  ours:
    `@layer ${RESET}, ${LAYER};\n` +
    `@layer ${RESET} {\n${uaReset(scope('ours'))}\n}\n` +
    `@layer ${LAYER} {\n${gtkToWeb(theme, scope('ours')).css}\n}\n` +
    gtkToWeb(adapt(userGtk4Css), scope('ours')).css
};

export const laneStyle = (lane: LaneName) =>
  [
    `--desk-bg: ${lane === 'ours' ? ourG4Color('window_bg_color') : stockG4Color('window_bg_color')}`,
    `--desk-font: ${lane === 'ours' ? 'Carlito' : '"Adwaita Sans", Cantarell'}, sans-serif`
  ].join('; ');
