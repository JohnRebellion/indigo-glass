/* Shared lane builders for the three Stylus site layers (github, wikipedia,
 * youtube). Nothing here changes a declaration; it only moves the site's
 * stylesheets onto the /components/ lane roots and simulates the two
 * interaction states a static page cannot hold.
 *
 *   - The /sites/<id>/stock.css mocks are written `@scope (.site-<id>) {...}`
 *     (youtube's also carries a few rules after the block). rescopeStock()
 *     lifts the whole file into `@scope (<layerScope(id, lane)>)`, so the
 *     same mock paints this page's lane and nothing else.
 *   - The shipped .user.css goes through scopeStylus() from the /sites/ page
 *     (read-only import), which already takes any scope selector: the ours
 *     lane gets exactly the text /sites/<id>/ injects, re-rooted here.
 *   - ComponentPage's `.lane-root` rule paints `background: var(--desk-bg,
 *     transparent)` at (0,2,0); a site's `:scope { background: ... }` is
 *     (0,1,0) and would lose, leaving the page colour unpainted. boostRoot()
 *     lifts selectors that are ONLY the scope root to `:scope[data-layer]
 *     [data-lane]` (0,3,0) — the attributes layerScope() guarantees — so the
 *     site's root rules paint its root, as they do on its own <html>.
 *   - Only one element per document can hold focus, and nothing can hold a
 *     hover, so simulate() rewrites `:focus`, `:focus-visible` to
 *     `[data-sim-focus]`, `:focus-within` to "is or contains one", and
 *     `:hover` to `[data-sim-hover]`. The specimen marks the one focused /
 *     hovered copy; every other element is unaffected, and
 *     `:focus:not(:focus-visible)` becomes a selector that never matches —
 *     keyboard focus, which is the state Tier C is about.
 */
import { layerScope, type LaneDef, type LaneName } from '../../layer';
import { scopeStylus, stripComments, mapPreludes } from '$lib/sites/scopedStylus';
import { laneRootClass, type Site } from '$lib/sites/registry';

/* Split a selector list at top-level commas (not those inside :is(a, b)). */
export function splitList(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (const c of list) {
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) {
      out.push(buf);
      buf = '';
    } else buf += c;
  }
  out.push(buf);
  return out;
}

/* The block body of the first `@scope (<sel>) {`, plus everything outside it,
   all wrapped in one `@scope (<scope>)`. */
export function rescopeStock(css: string, siteClass: string, scope: string): string {
  const src = stripComments(css);
  const head = src.search(new RegExp(`@scope\\s*\\(\\s*\\.${siteClass}\\s*\\)`));
  if (head === -1) throw new Error(`stock.css has no @scope (.${siteClass}) block`);
  const open = src.indexOf('{', head);
  let depth = 0;
  let j = open;
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) break;
  }
  const inner = src.slice(open + 1, j);
  const outer = src.slice(0, head) + src.slice(j + 1);
  return `@scope (${scope}) {\n${inner}\n${outer}\n}`;
}

const ROOT_ONLY = /^(\s*):scope(?![\w-])([^\s>+~]*)(\s*)$/;
export function boostRoot(css: string): string {
  return mapPreludes(css, (prelude) => {
    if (prelude.trim().startsWith('@') || !prelude.includes(':scope')) return prelude;
    return splitList(prelude)
      .map((item) => item.replace(ROOT_ONLY, '$1:scope[data-layer][data-lane]$2$3'))
      .join(',');
  });
}

const STATE = /:(focus-within|focus-visible|focus|hover)(?![\w-])/g;
export function simulate(css: string): string {
  return mapPreludes(css, (prelude) => {
    if (prelude.trim().startsWith('@')) return prelude;
    return prelude.replace(STATE, (_, s: string) =>
      s === 'hover' ? '[data-sim-hover]'
        : s === 'focus-within' ? ':is([data-sim-focus], :has([data-sim-focus]))'
          : '[data-sim-focus]');
  });
}

/* Top-level style rules of an upstream (minified) stylesheet whose selectors
   pass `keep`; at-rule blocks (@media, @supports, @keyframes) are skipped.
   Each kept rule carries only its passing selectors. */
export function pickRules(css: string, keep: (selector: string) => boolean): string {
  const src = stripComments(css);
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    if (open === -1) break;
    const prelude = src.slice(i, open).trim();
    let depth = 0;
    let j = open;
    for (; j < src.length; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}' && --depth === 0) break;
    }
    if (!prelude.startsWith('@')) {
      const kept = splitList(prelude).map((s) => s.trim()).filter(keep);
      if (kept.length) out.push(`${kept.join(',')}{${src.slice(open + 1, j)}}`);
    }
    i = j + 1;
  }
  return out.join('\n');
}

/* A selector that applies to a focused element — the focus pseudo appears
   outside any :not(), so `:not(:focus)` rules (which paint the UNfocused
   state) are left out. */
export const isFocusRule = (sel: string) =>
  /:(focus|focus-visible|focus-within)(?![\w-])/.test(sel.replace(/:not\([^()]*\)/g, ''));

/* Both lanes of a site layer. `upstream` is extra stock CSS the /sites/ mock
   does not model (a focus rule, a checkbox tick) taken from a frozen fixture;
   it sits between the mock and the userstyle, as the site's own sheets sit
   before Stylus's. */
export function siteLanes(site: Site, stockCss: string, upstream = ''): Record<LaneName, LaneDef> {
  const version = site.css.match(/^@version\s+(.+)$/m)?.[1]?.trim() ?? '?';
  const lane = (l: LaneName): LaneDef => {
    const scope = layerScope(site.id, l);
    const parts = [rescopeStock(stockCss, laneRootClass(site), scope)];
    if (upstream) parts.push(`@scope (${scope}) {\n${upstream}\n}`);
    if (l === 'ours') parts.push(scopeStylus(site.css, scope));
    return {
      label: l === 'ours' ? `${site.file} v${version} over the stock mock` : `/sites/${site.id}/ stock mock (${site.stockSource})`,
      rootClass: site.rootClass,
      rootAttrs: site.rootAttrs,
      css: simulate(boostRoot(parts.join('\n')))
    };
  };
  return { stock: lane('stock'), ours: lane('ours') };
}

/* The site's own accent ladder (registry hue row = README per-site table:
   hi / mid / alt are accent_hi / accent / accent_alt). */
export const siteTokens = (site: Site): Record<string, string> => ({
  accent_hi: site.hue.hi.toUpperCase(),
  accent: site.hue.mid.toUpperCase(),
  accent_alt: site.hue.alt.toUpperCase()
});
