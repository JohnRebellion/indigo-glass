/* Spicetify: color.ini (INI, ../ini.ts - same reader as KDE/Konsole/VLC/GTK)
 * layered with user.css (real Spotify DOM selectors, plain CSS - no custom
 * properties at all, unlike Obsidian/Vencord's `--name` grammar). The CSS
 * side reuses ../obsidian/cssTheme.ts's scopePlainCss/cssCoverage read-only
 * (per the brief's cross-surface read-only allowance): cssCoverage's
 * selector-inventory half works unmodified on a var-free file (its
 * declaredVars half just returns zero vars, contributing nothing), so it is
 * the same "does every shipped selector find an element" check every other
 * app surface uses, without inventing a new one. */
import shippedIniText from '../../../../../spicetify/Themes/indigo-glass/color.ini?raw';
import shippedCssText from '../../../../../spicetify/Themes/indigo-glass/user.css?raw';
import stockIniText from '../../../../fixtures/stock/spicetify/color.ini?raw';
import stockCssText from '../../../../fixtures/stock/spicetify/stock.css?raw';
import { parseIni, type IniDoc } from '../ini';
import { cssCoverage } from '../obsidian/cssTheme';
import { cssVars } from '../surface';
import type { Coverage } from '../surface';

export type SpiceModel = { ini: IniDoc; css: string; get: (key: string) => string };

function model(iniText: string, cssText: string): SpiceModel {
  const ini = parseIni(iniText);
  return { ini, css: cssText, get: (key: string) => ini.get('base', key) ?? '000000' };
}

export const stock = model(stockIniText, stockCssText);
export const ours = model(shippedIniText, shippedCssText);
export { shippedCssText as shippedCss, stockCssText as stockCss };

/* `#`-prefixed for direct use in a hex position (color.ini stores bare
 * RRGGBB, no leading `#` - QSettings/Spicetify's own INI convention). */
const hex = (m: SpiceModel, key: string) => `#${m.get(key)}`;

/* Keys this page's own local CSS actually consumes as `var(--spice-<key>)` -
 * real Spicetify wiring (spicetify's core injects exactly these variables
 * from color.ini before any user.css loads), reused here for the sidebar/
 * library, now-playing chrome and search-input specimens, which the shipped
 * user.css itself never touches. Keys not listed here still count as covered
 * through ../coverage's iniCoverage `doc.used()` fallback - every key above
 * is read via `.get()` in roleRows()/contrast below, whether or not a var
 * carries it into the DOM. */
export const KEY_VARS: Record<string, string[]> = {
  main: ['spice-main'],
  sidebar: ['spice-sidebar'],
  player: ['spice-player'],
  card: ['spice-card'],
  text: ['spice-text'],
  subtext: ['spice-subtext'],
  button: ['spice-button'],
  'button-active': ['spice-button-active'],
  'notification-error': ['spice-notification-error'],
  misc: ['spice-misc']
};

export function laneVars(m: SpiceModel): string {
  return cssVars({
    'desk-bg': hex(m, 'main'),
    'desk-font': '"Circular Std", -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif',
    'spice-main': hex(m, 'main'),
    'spice-sidebar': hex(m, 'sidebar'),
    'spice-player': hex(m, 'player'),
    'spice-card': hex(m, 'card'),
    'spice-text': hex(m, 'text'),
    'spice-subtext': hex(m, 'subtext'),
    'spice-button': hex(m, 'button'),
    'spice-button-active': hex(m, 'button-active'),
    'spice-notification-error': hex(m, 'notification-error'),
    'spice-misc': hex(m, 'misc')
  });
}

/* .main-searchInput-searchInputInput and similar Spicetify community
 * selectors could not be independently confirmed this pass (see index.ts's
 * fidelityWhy) - the search-input specimen renders a plain `input[type=
 * search]` driven by these color.ini vars instead of a shipped-file
 * selector, so it is disclosed as a page approximation, not attributed to
 * user.css coverage. */
const INI_IGNORE = [
  { token: '.main-topBar-UpgradeButton', why: 'the ad-hide rule also targets the context-menu Upgrade item rendered in this page; the top-bar button itself has no separate specimen' },
  { token: 'dark/*', why: "Spicetify's `color_scheme` config picks ONE of [base]/[dark]/[light] at a time (spicetify config current_theme … color_scheme dark); this page reads only [base] (model.ts's get()), the same one-appearance-at-a-time approach as every other /desktop/ surface. [dark] here is byte-identical to [base] anyway (see color.ini)" }
];

export const coverage = (): Coverage => {
  const css = cssCoverage(shippedCssText, document, '[data-lane="ours"]', INI_IGNORE);
  const skip = (k: string) => INI_IGNORE.some((i) => (i.token.endsWith('/*') ? k.startsWith(i.token.slice(0, -1)) : i.token === k));
  const iniKeys = ours.ini.keys().filter((k) => !skip(k));
  const usedIni = ours.ini.used();
  const missingIni = iniKeys.filter((k) => !usedIni.has(k));
  return { total: css.total + iniKeys.length, missing: [...css.missing, ...missingIni], ignored: INI_IGNORE };
};

const ROLES: [string, string | null, string?][] = [
  ['main', 'base'],
  ['sidebar', 'sidebar'],
  ['player', 'surface'],
  ['card', 'surface_alt'],
  ['text', 'text'],
  ['subtext', 'text_muted'],
  ['sidebar-text', 'text'],
  ['shadow', null, "literal black - Spicetify's own description overloads this key (\"card drop shadow; button background\"), and Sage Ink's shadow is [shadow].ink (#000000) anyway, so black is correct without being a named palette step"],
  ['selected-row', 'surface_alt'],
  ['button', 'accent'],
  ['button-active', 'accent_hi'],
  ['button-disabled', 'text_dim'],
  ['tab-active', 'surface_alt'],
  ['notification', 'accent'],
  ['notification-error', 'negative'],
  ['misc', 'accent_alt'],
  ['equalizer', 'positive']
];

export function roleRows(): { role: string; ours: string; stock?: string; token: string | null; note?: string }[] {
  return ROLES.map(([key, token, note]) => ({
    role: key,
    ours: hex(ours, key),
    stock: hex(stock, key),
    token,
    note
  }));
}
