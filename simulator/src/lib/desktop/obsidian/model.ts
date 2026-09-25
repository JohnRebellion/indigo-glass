/* Obsidian's ".theme-dark" variables: obsidian/Indigo Glass/theme.css
 * (shipped, hand-kept) layered over fixtures/stock/obsidian/stock.css
 * (Obsidian's own default dark theme, reconstructed - see that file's header
 * for provenance). Both declare `.theme-dark { --name: value; }` and
 * `body { --font-*: ...; }`; `ours` is the cascade result of stock THEN
 * shipped (shipped's `!important` declarations win, same as the real app
 * loading the theme after its own defaults). */
import shippedCss from '../../../../../obsidian/Indigo Glass/theme.css?raw';
import stockCssRaw from '../../../../fixtures/stock/obsidian/stock.css?raw';
import { extractCssVars, resolveVar, cssCoverage } from './cssTheme';
import { cssVars } from '../surface';
import type { Coverage } from '../surface';

export const SELECTORS = ['.theme-dark', 'body'];

const stockVars = extractCssVars(stockCssRaw, SELECTORS);
const shippedVars = extractCssVars(shippedCss, SELECTORS);
const oursVars = new Map([...stockVars, ...shippedVars]);

export type ObsidianModel = { vars: Map<string, string>; get: (name: string) => string };
const toModel = (vars: Map<string, string>): ObsidianModel => ({ vars, get: (name) => resolveVar(vars, name) });

export const stock = toModel(stockVars);
export const ours = toModel(oursVars);
export { shippedCss, stockCssRaw as stockCss };

/* Every var either file declares gets exposed under its own real name, so
 * Page.svelte's specimen CSS reads `var(--background-primary)` etc directly -
 * there is no lane-prefixed re-mapping layer to keep in step (unlike KDE's
 * `--k-*` scheme) because the ACTUAL files are what paints the lane (see
 * Page.svelte: scopeStylus injects the real CSS, scoped, into each lane). This
 * laneVars() only carries the two vars DPair's lane-root itself needs a value
 * for before any specimen mounts (background + font), read from the resolved
 * model so the lane root isn't unstyled between mount and the injected
 * <style> tag taking effect - both paint the same thing either way. */
export function laneVars(m: ObsidianModel): string {
  return cssVars({ 'desk-bg': m.get('--background-primary'), 'desk-font': m.get('--font-interface') });
}

/* Nine of these are real Obsidian syntax-highlighting vars (obsidian-
 * developer-docs/Editor/Code.md, fetched 2026-09-25) whose DOM-class mapping
 * is deliberately undocumented — Obsidian's own note on that page: two
 * different highlighting libraries (Editing vs Reading view) with mismatched
 * styling, no published class list. Fabricating a `.cm-keyword`-style
 * selector to satisfy coverage would assert a fidelity this reconstruction
 * doesn't have, so these stay uncovered and cited instead. Three more
 * (--code-number/-class/-constant) aren't Obsidian variables at all per the
 * same reference (it has --code-value, not --code-number, and no class/
 * constant equivalents) — a dead declaration in the shipped file itself,
 * reported in the surface report rather than silently fixed (not one of the
 * brief's fix categories: no token drift, contrast failure, translucency, or
 * border-width issue is asserted by keeping an inert custom property). */
const UNDOCUMENTED_SYNTAX_VARS = [
  '--code-comment', '--code-keyword', '--code-string', '--code-function',
  '--code-tag', '--code-property', '--code-operator', '--code-punctuation', '--code-important'
];
const NONSTANDARD_SYNTAX_VARS = ['--code-number', '--code-class', '--code-constant'];

export const coverage = (): Coverage =>
  cssCoverage(shippedCss, document, '[data-lane="stock"]', [
    { token: '--text-italic-color', why: 'value is literally var(--text-muted); no separate visual to show beyond muted text itself' },
    { token: '--background-modifier-active-hover', why: "shipped file's own comment: made inert (set transparent) because the .is-active/.is-selected outline rule replaces it; no component reads it" },
    { token: '--text-highlight-bg-active', why: 'the "currently editing this ==highlight==" live-preview state; this page renders reading view, not live-preview edit mode' },
    ...UNDOCUMENTED_SYNTAX_VARS.map((token) => ({ token, why: "real Obsidian variable, but its syntax-highlighter DOM-class mapping is not published (obsidian-developer-docs/Editor/Code.md); no selector to cite without guessing" })),
    ...NONSTANDARD_SYNTAX_VARS.map((token) => ({ token, why: "not an Obsidian CSS variable per obsidian-developer-docs/Editor/Code.md (2026-09-25) — shipped file's own dead declaration; reported, not fixed" }))
  ]);

/* Role -> token. Colours only; layout/shape facts (radius, border width,
 * shadow shape) are asserted by structure.ts instead, same split desktop.spec
 * uses (roles table vs the page's own structure block). `token: null` marks a
 * value that is legitimately not a flat palette step - Tier A/D per
 * STATE_GRAMMAR.md, or a literal the reference itself hardcodes. */
const ROLES: [string, string | null, string?][] = [
  ['--background-primary', 'base'],
  ['--background-primary-alt', 'surface'],
  ['--background-secondary', 'sidebar'],
  ['--background-secondary-alt', 'surface_alt'],
  ['--background-modifier-hover', null, 'Tier A transient hover wash (STATE_GRAMMAR.md), not a flat fill'],
  ['--background-modifier-active-hover', null, 'transparent - Obsidian on-select is a real outline instead (see the .is-active/.is-selected rule)'],
  ['--background-modifier-border', 'border'],
  ['--background-modifier-border-hover', 'border_strong'],
  ['--background-modifier-border-focus', 'accent'],
  ['--background-modifier-form-field', 'surface'],
  ['--background-modifier-success', null, 'opaque success wash composited over surface_alt, not a flat token (Tier D)'],
  ['--background-modifier-error', null, 'opaque error wash composited over surface_alt, not a flat token (Tier D)'],
  ['--background-modifier-error-hover', null, 'opaque error-hover wash, not a flat token (Tier D)'],
  ['--text-normal', 'text'],
  ['--text-muted', 'text_muted'],
  ['--text-faint', 'text_dim'],
  ['--text-on-accent', null, 'literal white: the accent fill is light, so its label is ink per docs/ELEVATION.md, not a palette step'],
  ['--text-error', 'negative'],
  ['--text-success', 'positive'],
  ['--text-accent', 'accent_hi'],
  ['--text-accent-hover', 'accent_alt'],
  ['--interactive-accent', 'accent'],
  ['--interactive-accent-hover', 'accent_hi'],
  ['--interactive-normal', 'surface_alt'],
  ['--tag-color', 'accent_alt'],
  ['--tag-background', null, 'opaque pale-sage chip composite, not a flat token (Tier D identity fill)'],
  ['--tag-color-hover', 'accent_hi'],
  ['--code-normal', 'text'],
  ['--code-background', 'surface_alt'],
  ['--code-comment', 'text_muted'],
  ['--code-keyword', 'accent_hi'],
  ['--code-string', 'positive'],
  ['--code-number', 'accent_alt', "not in Obsidian's current public variable reference (obsidian-developer-docs/Editor/Code.md, 2026-09-25) — the real var for values is --code-value; shipped file's own dead declaration, reported not fixed"],
  ['--code-function', 'amber'],
  ['--code-tag', 'accent_hi'],
  ['--code-property', 'accent_alt'],
  ['--code-operator', 'accent_hi'],
  ['--code-punctuation', 'text_muted'],
  ['--code-class', 'accent_alt', "not in Obsidian's current public variable reference (obsidian-developer-docs/Editor/Code.md, 2026-09-25) has no --code-class; shipped file's own dead declaration, reported not fixed"],
  ['--code-constant', 'accent_alt', "not in Obsidian's current public variable reference (obsidian-developer-docs/Editor/Code.md, 2026-09-25) has no --code-constant; shipped file's own dead declaration, reported not fixed"],
  ['--code-important', 'negative'],
  ['--link-color', 'accent_hi'],
  ['--link-color-hover', 'accent_alt'],
  ['--link-external-color', 'accent_hi'],
  ['--link-external-color-hover', 'accent_alt'],
  ['--link-unresolved-color', 'negative'],
  ['--h1-color', 'text'],
  ['--h5-color', 'accent_hi'],
  ['--h6-color', 'accent_alt'],
  ['--scrollbar-thumb-bg', 'accent_alt'],
  ['--scrollbar-active-thumb-bg', 'accent_hi']
];

/* Callout colours are NOT set under `.theme-dark` - the shipped file (and
   stock, matching it) reassigns `--callout-color` per `.callout[data-callout=
   "x"]` selector, so extractCssVars needs the exact compound selector, not
   the SELECTORS list above. Read shipped first, stock as the fallback for a
   type the shipped file leaves untouched (default, question). */
function calloutColorFrom(css: string, selector: string): string | undefined {
  return extractCssVars(css, [selector]).get('--callout-color');
}
export function calloutColor(type: string, lane: 'stock' | 'ours'): string {
  const selector = `.callout[data-callout="${type}"]`;
  const raw = (lane === 'ours' ? calloutColorFrom(shippedCss, selector) : undefined) ?? calloutColorFrom(stockCssRaw, selector);
  if (!raw) return 'transparent';
  const [r, g, b] = raw.split(',').map((n) => Number(n.trim()));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
/* Every distinct data-callout value the shipped file's selectors name -
   coverage needs an element per exact attribute VALUE, not just per group. */
export const ALL_CALLOUT_TYPES = ['note', 'info', 'tip', 'warning', 'caution', 'success', 'done', 'failure', 'error', 'bug', 'example', 'quote'];

export const CALLOUT_GROUPS: [string, string, string][] = [
  ['note', 'accent_hi', 'Colors:Note'],
  ['info', 'accent', 'Colors:Info/Tip'],
  ['warning', 'amber', 'Colors:Warning/Caution'],
  ['success', 'positive', 'Colors:Success/Done'],
  ['failure', 'negative', 'Colors:Failure/Error/Bug'],
  ['example', 'accent_alt', 'Colors:Example/Quote']
];

export function roleRows(): { role: string; ours: string; stock?: string; token: string | null; note?: string }[] {
  return [
    ...ROLES.map(([v, token, note]) => ({ role: v, ours: ours.get(v), stock: stock.get(v), token, note })),
    ...CALLOUT_GROUPS.map(([type, token]) => ({
      role: `callout ${type}`,
      ours: calloutColor(type, 'ours'),
      stock: calloutColor(type, 'stock'),
      token
    }))
  ];
}
