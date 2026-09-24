/* Turn a Stylus site style into CSS that applies to ONE lane of the
 * /sites/<id>/ comparison page, and read its selector vocabulary back out so
 * the page can prove it renders an element for every rule in the file.
 *
 * The .user.css files are the implementation under review, imported raw from
 * browser/stylus/sites/. Nothing here changes a declaration: the same
 * `!important` custom-property remaps and component rules apply, only their
 * reach is narrowed from the document to the "ours" lane root.
 *
 *   - `@-moz-document domain(...) { ... }` is unwrapped (Chromium drops the
 *     at-rule as unknown; Stylus strips it before injection, so this matches
 *     what the browser actually receives).
 *   - Comments go first, because the files talk about `:root` and `body` in
 *     prose and a selector rewrite must not touch that.
 *   - `:root`, `html` and `body` in selector position become `:scope`, and the
 *     whole body is wrapped in `@scope (<lane root>) { ... }`. The lane root
 *     carries the classes and attributes the site's <html> carries
 *     (`data-color-mode`, `skin-theme-clientpref-night`, `dark`, ...), so
 *     `html.skin-theme-clientpref-night` -> `:scope.skin-theme-clientpref-night`
 *     still matches.
 *
 * Known limit: Stylus applies per document, so an id selector matches once.
 * Here every specimen renders the same markup in two lanes, so ids repeat and
 * `#tsf`-style rules match each copy. Same paint, different DOM validity.
 */

const ROOT_SELECTOR = /(^|[\s,>+~(])(:root|html|body)(?![\w-])/g;

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/* Port of scripts/style-check/check.mjs `unwrap`: the block brace is the first
 * `{` OUTSIDE the prelude's parentheses, because google.user.css's regexp()
 * prelude contains `{2,3}`. Text outside any @-moz-document block (the
 * ==UserStyle== header) is dropped. */
export function unwrapMozDocument(css: string): string {
  const out: string[] = [];
  let i = 0;
  for (;;) {
    const start = css.indexOf('@-moz-document', i);
    if (start === -1) break;
    let open = -1;
    let paren = 0;
    for (let k = start; k < css.length; k++) {
      const c = css[k];
      if (c === '(') paren++;
      else if (c === ')') paren--;
      else if (c === '{' && paren === 0) { open = k; break; }
    }
    if (open === -1) break;
    let depth = 0;
    let j = open;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (depth === 0) break; }
    }
    out.push(css.slice(open + 1, j));
    i = j + 1;
  }
  return out.join('\n');
}

/* Walk rule preludes (the text before each `{`). Declarations end in `;` or
 * `}` and so never reach a `{` with their text intact, which is what keeps a
 * `font-family` value or a `url()` out of the selector rewrite. */
export function mapPreludes(css: string, fn: (prelude: string) => string): string {
  let out = '';
  let buf = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') {
      out += fn(buf) + '{';
      buf = '';
    } else if (c === '}' || c === ';') {
      out += buf + c;
      buf = '';
    } else {
      buf += c;
    }
  }
  return out + buf;
}

export function rewriteRoots(prelude: string): string {
  if (prelude.trim().startsWith('@')) return prelude;
  return prelude.replace(ROOT_SELECTOR, '$1:scope');
}

export function scopeStylus(userCss: string, scopeSelector: string): string {
  const body = mapPreludes(unwrapMozDocument(stripComments(userCss)), rewriteRoots);
  return `@scope (${scopeSelector}) {\n${body}\n}`;
}

export function readMeta(userCss: string, key: string): string | null {
  const m = userCss.match(new RegExp(`^@${key}\\s+(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

/* Every class, id, attribute and element token the file's selectors name.
 * Pseudo-classes are dropped; the argument of :not()/:is()/:where() is kept,
 * because a rule that excludes `.btn-octicon` is a claim about how octicon
 * buttons look too. `:root`/`html`/`body` are the lane root, not specimens. */
const ROOTS = new Set(['root', 'scope', 'html', 'body']);
const TAG = /(^|[\s,>+~(])([a-z][a-z0-9-]*)(?=$|[\s,>+~.#[:)])/g;
const TOKEN = /\.[A-Za-z_][\w-]*|#[A-Za-z_][\w-]*|\[[^\]]+\]/g;

export function selectorInventory(userCss: string): string[] {
  const css = unwrapMozDocument(stripComments(userCss));
  const found = new Set<string>();
  mapPreludes(css, (prelude) => {
    const p = prelude.trim();
    if (!p || p.startsWith('@')) return prelude;
    for (const m of p.matchAll(TOKEN)) found.add(m[0]);
    for (const m of p.matchAll(TAG)) if (!ROOTS.has(m[2])) found.add(m[2]);
    return prelude;
  });
  return [...found].sort();
}

/* Which inventory tokens have no element in `root`. Matches the lane root
 * itself as well as its descendants, so a token carried by the root
 * (`[data-color-mode]`, `.fui-FluentProvider`, `#app`) counts. */
export function missingFromDom(root: ParentNode, laneSelector: string, tokens: string[]): string[] {
  return tokens.filter((tok) => {
    const q = `${laneSelector}:is(${tok}), ${laneSelector} :is(${tok})`;
    try {
      return !root.querySelector(q);
    } catch {
      return true;
    }
  });
}
