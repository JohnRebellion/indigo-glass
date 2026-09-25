/* Discord's CSS custom properties: vencord/indigo-glass.theme.css (shipped,
 * hand-kept) layered over fixtures/stock/vencord/stock.css (Discord's own
 * default dark theme, reconstructed — see that file's header for
 * provenance). Same merge-by-Map pattern as ../obsidian/model.ts (cssTheme.ts
 * is owned by obsidian/, imported read-only here per the brief's allowance —
 * both apps share the identical "real CSS custom properties, plain files,
 * no @-moz-document wrapper" shape). */
import shippedCss from '../../../../../vencord/indigo-glass.theme.css?raw';
import stockCssRaw from '../../../../fixtures/stock/vencord/stock.css?raw';
import { extractCssVars, resolveVar, cssCoverage } from '../obsidian/cssTheme';
import { cssVars } from '../surface';
import type { Coverage } from '../surface';

export const SELECTORS = [':root', '.theme-dark'];

const stockVars = extractCssVars(stockCssRaw, SELECTORS);
const shippedVars = extractCssVars(shippedCss, SELECTORS);
const oursVars = new Map([...stockVars, ...shippedVars]);

export type VencordModel = { vars: Map<string, string>; get: (name: string) => string };
const toModel = (vars: Map<string, string>): VencordModel => ({ vars, get: (name) => resolveVar(vars, name) });

export const stock = toModel(stockVars);
export const ours = toModel(oursVars);
export { shippedCss, stockCssRaw as stockCss };

export function laneVars(m: VencordModel): string {
  return cssVars({ 'desk-bg': m.get('--background-primary'), 'desk-font': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" });
}

/* --ig-* are the shipped file's own intermediate variables (declared under
 * :root, consumed by the .theme-dark block two lines later in the SAME
 * file) - real, but not part of Discord's API, so they're not role rows;
 * they still count toward coverage because the shipped stylesheet's own
 * `var(--ig-base)` etc is text any injected copy of it carries. */
export const coverage = (): Coverage =>
  cssCoverage(shippedCss, document, '[data-lane="stock"]', [
    { token: '--background-mobile-primary', why: 'mobile-only surface; this page has no mobile specimen' },
    { token: '--background-mobile-secondary', why: 'mobile-only surface; this page has no mobile specimen' },
    { token: '--scrollbar-auto-track', why: 'value is transparent; nothing to show beyond the thumb itself' },
    { token: '--brand-experiment-100', why: "lightest interpolated brand tint (see stock.css header) - no specimen this light exists on a dark theme; kept declared for parity with Discord's own ramp shape" },
    { token: '--brand-experiment-200', why: 'interpolated brand tint, no matching specimen on a dark theme (see stock.css header)' },
    { token: '--brand-experiment-360', why: 'interpolated brand tint, no matching specimen on a dark theme (see stock.css header)' },
    { token: '.theme-darker', why: "Discord's own alternate dark-mode setting (Settings -> Appearance); this page renders the plain .theme-dark specimen only, same one-appearance-at-a-time approach as every other /desktop/ surface" },
    { token: '.theme-pureBlack', why: "Discord's own alternate dark-mode setting; not rendered here, see .theme-darker" }
  ]);

/* Role -> token. `token: null` marks Tier A/D per STATE_GRAMMAR.md or a
 * literal the reference itself hardcodes - same split obsidian/model.ts uses. */
const ROLES: [string, string | null, string?][] = [
  ['--background-primary', 'base'],
  ['--background-secondary', 'surface'],
  ['--background-secondary-alt', 'surface_alt'],
  ['--background-tertiary', 'sidebar'],
  ['--background-accent', 'accent'],
  ['--background-floating', 'surface_alt'],
  ['--background-modifier-hover', null, 'Tier A transient hover wash (STATE_GRAMMAR.md), not a flat fill'],
  ['--background-modifier-active', null, "Discord's own on-click state var, opaque flat composite (Tier D) - see shipped file's comment on why this can't be a real outline"],
  ['--background-modifier-selected', null, "Discord's own on-select state var, opaque flat composite (Tier D) - see shipped file's comment: no stable selector exists to attach a real outline to, unlike Obsidian's .is-active"],
  ['--background-modifier-accent', null, 'opaque flat composite (Tier D), mirrors -active'],
  ['--text-normal', 'text'],
  ['--text-muted', 'text_muted'],
  ['--text-link', 'accent_hi'],
  ['--text-positive', 'positive'],
  ['--text-warning', 'amber'],
  ['--text-danger', 'negative'],
  ['--interactive-normal', 'text'],
  ['--interactive-hover', 'text'],
  ['--interactive-active', 'accent_hi'],
  ['--interactive-muted', 'text_muted'],
  ['--header-primary', 'text'],
  ['--header-secondary', 'text_muted'],
  ['--channels-default', 'text_muted'],
  ['--channel-icon', 'text_muted'],
  ['--channeltextarea-background', 'surface_alt'],
  ['--activity-card-background', 'surface_alt'],
  ['--modal-background', 'base'],
  ['--modal-footer-background', 'surface'],
  ['--scrollbar-thin-thumb', 'accent_alt'],
  ['--scrollbar-auto-thumb', 'accent_alt'],
  ['--brand-experiment', 'accent'],
  ['--brand-experiment-500', 'accent'],
  ['--brand-experiment-560', 'accent_hi'],
  ['--brand-experiment-600', 'accent_hi'],
  ['--status-positive-text', 'positive'],
  ['--status-warning-text', 'amber'],
  ['--status-danger-text', 'negative']
];

export function roleRows(): { role: string; ours: string; stock?: string; token: string | null; note?: string }[] {
  return ROLES.map(([v, token, note]) => ({ role: v, ours: ours.get(v), stock: stock.get(v), token, note }));
}
