/* Shared parsing for the CSS-custom-property desktop apps (Obsidian, Vencord):
 * unlike KDE's .colors/kdeglobals (an INI grammar with its own reader in
 * ../ini.ts) or Spicetify's color.ini (same reader), these two apps carry
 * their stock/shipped values as plain CSS custom properties declared inside
 * `.theme-dark { --name: value; }`-shaped blocks. This is the equivalent
 * small reader: which vars a block declares, resolving one level (or more)
 * of `var(--x, fallback)` indirection, and a coverage combiner built on
 * sites/scopedStylus's selectorInventory/missingFromDom (the same functions
 * /sites/ uses for its Stylus files) plus ../coverage's referencedVars.
 *
 * Owned by obsidian/ (this surface); imported read-only by ../vencord/model.ts
 * per the brief's "may import from other surface folders read-only" allowance
 * — the two apps share exactly this one grammar, so duplicating it would only
 * invite drift between the two copies. */
import { selectorInventory, missingFromDom, scopeStylus, stripComments } from '../../sites/scopedStylus';
import { referencedVars } from '../coverage';
import type { Coverage } from '../surface';

/* scopedStylus's own scopeStylus()/selectorInventory() both call its
 * unwrapMozDocument() internally (see scopedStylus.ts:91,109) — correct for
 * /sites/, where every .user.css is Stylus-authored and always wrapped in
 * `@-moz-document domain(...) { ... }`. Obsidian/Vencord's real theme.css
 * files carry no such wrapper, so unwrapMozDocument would silently reduce
 * them to '' before either function ever sees a rule (the same empty-`out`
 * bug fixed in extractCssVars/declaredVars above). Since scopedStylus.ts is
 * shared foundation and out of scope to edit, wrap the plain CSS in a throwaway
 * `@-moz-document` shell right before handing it to scopeStylus/
 * selectorInventory — cheaper than reimplementing scoping/token-extraction
 * here, and the wrapper is stripped straight back off by their own unwrap. */
const asStylusDoc = (css: string): string => `@-moz-document domain("") {\n${css}\n}`;

/* Scope a plain shipped/stock CSS file into one lane, working around the
 * unwrap requirement above. Used in place of importing scopeStylus directly. */
export const scopePlainCss = (css: string, scopeSelector: string): string => scopeStylus(asStylusDoc(css), scopeSelector);

/* Every `SELECTORS { --a: 1; --b: 2; }` block whose prelude names one of
 * `selectors` (exact, comma-split match — these files never nest rules or
 * use combinators on the blocks that carry custom properties), last write
 * wins per name (declaration order), `!important` stripped. Comments are
 * stripped first (stripComments, shared with scopedStylus). NOTE: unlike
 * /sites/'s Stylus files, these are plain app theme.css files with no
 * `@-moz-document` wrapper, so scopedStylus's unwrapMozDocument must NOT be
 * used here — it returns '' for input with zero such blocks (its `out` array
 * is only ever pushed to inside the block-found loop), which silently
 * destroyed every var this function read until caught by cssTheme.test.ts. */
export function extractCssVars(css: string, selectors: string[]): Map<string, string> {
  const text = stripComments(css);
  const out = new Map<string, string>();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const sels = m[1].split(',').map((s) => s.trim());
    if (!sels.some((s) => selectors.includes(s))) continue;
    for (const decl of m[2].split(';')) {
      const c = decl.indexOf(':');
      if (c < 0) continue;
      const name = decl.slice(0, c).trim();
      if (!name.startsWith('--')) continue;
      out.set(name, decl.slice(c + 1).replace(/!important/gi, '').trim());
    }
  }
  return out;
}

/* Resolve `var(--x)` / `var(--x, fallback)` chains within one vars map — as
 * far as a real cascade goes when every declaration lives in the map (true
 * here: stock and shipped are each merged into one map before a role reads
 * from it). A cycle or a dangling reference with no fallback renders as
 * 'transparent', which shows up loudly on the page rather than throwing. */
export function resolveValue(vars: Map<string, string>, value: string, seen = new Set<string>()): string {
  const m = value.trim().match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/);
  if (!m) return value.trim();
  const [, ref, fallback] = m;
  if (seen.has(ref)) return fallback ? resolveValue(vars, fallback, seen) : 'transparent';
  seen.add(ref);
  if (vars.has(ref)) return resolveValue(vars, vars.get(ref)!, seen);
  return fallback ? resolveValue(vars, fallback, seen) : 'transparent';
}
export const resolveVar = (vars: Map<string, string>, name: string): string =>
  vars.has(name) ? resolveValue(vars, vars.get(name)!) : 'transparent';

/* Every `--name` declared ANYWHERE in the file (any selector) — the set a
 * coverage footer must show as read, whether by a specimen rule of ours or
 * by a stock component rule (stock.css carries the component rules the
 * shipped file's variables paint through — see fixtures/stock/*.css headers).
 * Declaration position only: `var(--x)` (a usage, no trailing colon touching
 * the name) never matches. */
export function declaredVars(css: string): string[] {
  const text = stripComments(css);
  const out = new Set<string>();
  for (const m of text.matchAll(/(^|[{;])\s*(--[\w-]+)\s*:/g)) out.add(m[2]);
  return [...out];
}

/* Coverage for a shipped CSS file: every selector token it names (via
 * selectorInventory, the same reader /sites/ uses) must find an element in
 * the DOM, and every custom property it declares must be read by SOME rule
 * on the page (referencedVars scans every <style> in the document, so a
 * stock.css component rule that paints `var(--background-primary)` counts,
 * exactly like a KDE role variable being referenced by a lane rule). */
export function cssCoverage(
  shippedCss: string,
  root: ParentNode,
  laneSelector: string,
  ignore: { token: string; why: string }[] = []
): Coverage {
  const skip = (k: string) => ignore.some((i) => (i.token.endsWith('/*') ? k.startsWith(i.token.slice(0, -1)) : i.token === k));
  const selTokens = selectorInventory(asStylusDoc(shippedCss)).filter((t) => !skip(t));
  const missingSel = missingFromDom(root, laneSelector, selTokens);
  const vars = declaredVars(shippedCss).filter((v) => !skip(v));
  const refs = referencedVars(root instanceof Document ? root : document);
  const missingVar = vars.filter((v) => !refs.has(v));
  return { total: selTokens.length + vars.length, missing: [...missingSel, ...missingVar], ignored: ignore };
}
