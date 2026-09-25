/* GTK CSS -> web CSS translator, shared by /desktop/gtk3-theme/ and
 * /desktop/gtk-user-css/. GTK's CSS dialect is a near-subset of real CSS (it
 * is parsed by a fork of libcroco/a hand-rolled CSS2.1-ish parser), so most of
 * a GTK stylesheet is already valid browser CSS. Five things are not:
 *
 *   1. `@define-color name value;` is a GTK at-rule, not a custom property.
 *      We turn each into `--gtk-name: value;` set on the lane's @scope root,
 *      so `@name` references resolve at cascade time exactly like GTK
 *      resolves them at parse time - including one @define-color overriding
 *      an earlier one of the same name (last write wins, same as GTK), which
 *      matters for gtk-user-css layering a user gtk.css AFTER the theme.
 *   2. `@name` in a value is GTK's variable reference syntax -> `var(--gtk-name)`.
 *   3. shade()/alpha()/mix()/lighter()/darker() are GTK-only colour functions.
 *      alpha() and mix() translate to color-mix() with no loss (see below).
 *      shade()/lighter()/darker() are an approximation - GTK scales HSL
 *      lightness multiplicatively; CSS has no such primitive. Documented at
 *      `shadeExpr` below.
 *   4. `-gtk-*` properties and functions (icon shadow/source/recolor/scaled/
 *      palette/effect/transform/theme, and the GTK2 `-gtk-gradient()` mini
 *      language) have no CSS equivalent and are dropped, each with a reason
 *      collected in `dropped` for the coverage footer. `-gtk-outline-radius`
 *      is the one exception with a real web target and is kept, renamed.
 *   5. GTK's state pseudo-classes (:backdrop, :checked, :selected, :disabled,
 *      :hover, :active, :focus, :focus-visible) need to be shown side by side,
 *      statically, on one page - not triggered by real interaction. Each maps
 *      to a class/attribute a specimen sets directly: `:backdrop` -> `.backdrop`
 *      (matches the brief's own example), the rest -> `[data-<name>]`.
 *
 * Everything else (selectors, combinators, `:not()`, comments, `@keyframes`,
 * plain hex/rgba/named colours, and already-modern colour syntax some real
 * GTK4/libadwaita stylesheets ship - `oklab(from ... )`, `color-mix()`,
 * `RGB(r g b / a%)`) passes through untouched.
 */
import { stripComments, missingFromDom } from '../../sites/scopedStylus';
import type { Coverage } from '../surface';

/* ---------- @define-color extraction ---------------------------------- */

/* GTK's own grammar never puts a `;` inside a @define-color value (colours,
 * @refs and the five functions below all use commas, never semicolons), and
 * @define-color is always a top-level statement, never nested in a block -
 * so a single non-greedy regex is a faithful, not approximate, extraction. */
const DEFINE_RE = /@define-color\s+([\w-]+)\s+([^;]+);/g;

export function extractDefineColors(css: string): { defs: [string, string][]; rest: string } {
  const defs: [string, string][] = [];
  const rest = css.replace(DEFINE_RE, (_, name: string, raw: string) => {
    defs.push([name, raw.trim()]);
    return '';
  });
  return { defs, rest };
}

/* ---------- @name -> var(--gtk-name) ----------------------------------- */

export function substituteNames(value: string): string {
  return value.replace(/@([A-Za-z_][\w-]*)/g, (_, n: string) => `var(--gtk-${n})`);
}

/* ---------- GTK colour functions -> color-mix() ------------------------ */

/* Negative lookbehind keeps this from firing on `color-mix(` (the "mix" in
 * the middle is preceded by a hyphen, a word character for \b purposes, so a
 * plain \bmix\( would falsely match inside it). */
const FN_RE = /(?<![\w-])(shade|alpha|mix|lighter|darker)\(/g;

function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(buf.trim());
      buf = '';
    } else buf += ch;
  }
  parts.push(buf.trim());
  return parts;
}

function parseFactor(s: string): number {
  const pct = s.match(/^(-?[\d.]+)%$/);
  if (pct) return Number(pct[1]) / 100;
  return Number(s);
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const pct = (n: number) => `${+n.toFixed(4)}%`;

/* GTK's shade(color, factor): "changes the lightness of color; factor ranges
 * from 0 for black to 2 for white" (docs.gtk.org gtk4 css-properties). GTK's
 * actual implementation (hsla_shade) converts to HSL and multiplies the L
 * channel by factor, clamped to [0,1] - a multiplicative lightness scale, not
 * a blend toward black/white. CSS has no multiplicative-HSL-lightness
 * primitive, so this is a documented approximation: a piecewise-linear
 * color-mix() toward black (factor 0..1) or white (factor 1..2), anchored at
 * the color itself at factor 1 and at the two endpoints GTK's own docs give
 * for the factor domain. This is exact at the anchors (0, 1, 2) and close
 * near 1, but a saturated colour diverges from true HSL scaling as factor
 * moves toward the extremes - an RGB blend toward a neutral desaturates
 * faster than multiplying lightness alone would. */
function shadeExpr(c: string, fRaw: number): string {
  const f = Math.min(2, Math.max(0, fRaw));
  if (f === 1) return c;
  if (f < 1) return `color-mix(in srgb, black ${pct((1 - f) * 100)}, ${c})`;
  return `color-mix(in srgb, ${c} ${pct((2 - f) * 100)}, white)`;
}

function emitFn(name: string, args: string[]): string {
  switch (name) {
    case 'alpha': {
      /* alpha(color, factor): multiplies color's alpha by factor. Mixing an
       * opaque-or-not colour with `transparent` at factor*100% is an exact
       * translation - color-mix() interpolates the alpha channel too, so an
       * already-translucent input scales correctly, not just an opaque one. */
      const [c, a] = args;
      const f = parseFactor(a);
      return Number.isNaN(f)
        ? `color-mix(in srgb, ${c} calc(${a} * 100%), transparent)`
        : `color-mix(in srgb, ${c} ${pct(clamp01(f) * 100)}, transparent)`;
    }
    case 'mix': {
      /* mix(c1, c2, factor): linear interpolant, factor 0 = c1, 1 = c2. An
       * exact translation assuming (undocumented, but the natural reading of
       * "interpolates between the two colors") GTK blends channel-wise in the
       * same sRGB space color-mix() defaults to here. */
      const [c1, c2, f] = args;
      const t = parseFactor(f);
      if (Number.isNaN(t)) return `color-mix(in srgb, ${c1} calc((1 - (${f})) * 100%), ${c2})`;
      const tc = clamp01(t);
      return `color-mix(in srgb, ${c1} ${pct((1 - tc) * 100)}, ${c2} ${pct(tc * 100)})`;
    }
    case 'shade': {
      const [c, f] = args;
      const factor = parseFactor(f);
      return shadeExpr(c, Number.isNaN(factor) ? 1 : factor);
    }
    /* lighter()/darker(): the conventional GTK2/3 shorthand for shade(c, 1.3)
     * and shade(c, 0.7) respectively - cited from common GTK theming
     * references, not re-derived from GTK source in this session. */
    case 'lighter':
      return shadeExpr(args[0], 1.3);
    case 'darker':
      return shadeExpr(args[0], 0.7);
    default:
      return `${name}(${args.join(', ')})`;
  }
}

export function translateFunctions(value: string): string {
  let out = '';
  let i = 0;
  for (;;) {
    FN_RE.lastIndex = i;
    const m = FN_RE.exec(value);
    if (!m) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, m.index);
    const name = m[1];
    const openIdx = m.index + m[0].length - 1;
    let depth = 1;
    let j = openIdx + 1;
    for (; j < value.length && depth > 0; j++) {
      if (value[j] === '(') depth++;
      else if (value[j] === ')') depth--;
    }
    const closeIdx = j - 1;
    const innerTranslated = translateFunctions(value.slice(openIdx + 1, closeIdx));
    out += emitFn(name, splitTopLevel(innerTranslated));
    i = closeIdx + 1;
  }
  return out;
}

/* ---------- pseudo-class -> class/attribute ---------------------------- */

const PSEUDO_MAP: Record<string, string> = {
  backdrop: '.backdrop',
  checked: '[data-checked]',
  selected: '[data-selected]',
  disabled: '[data-disabled]',
  hover: '[data-hover]',
  active: '[data-active]',
  focus: '[data-focus]',
  'focus-visible': '[data-focus-visible]'
};

/* Everything not in the map (:not(), :dir(), :first-child, :indeterminate...)
 * passes through as a real pseudo-class - either it works natively (:not,
 * :dir, structural ones) or it simply never matches our specimen DOM (no
 * <input>, so :indeterminate is inert), an honest gap rather than a fake. */
export function rewritePseudoClasses(prelude: string): string {
  return prelude.replace(/:(?!:)([\w-]+)/g, (full, name: string) => PSEUDO_MAP[name] ?? full);
}

/* ---------- -gtk-* properties: keep+rename, or drop+reason ------------- */

const GTK_PROPERTY_RENAME: Record<string, string> = {
  /* Not observed in any fixture this surface ships, but exercised by a unit
   * test: outline-radius is a real (if lightly supported) CSS property that
   * targets the same box feature -gtk-outline-radius does, so a plain rename
   * is a faithful translation, unlike the icon/gradient properties below. */
  '-gtk-outline-radius': 'outline-radius'
};

const GTK_DROP_REASON: Record<string, string> = {
  '-gtk-icon-shadow':
    'shadows a rendered icon surface, not a box or text node - no CSS primitive drop-shadows an arbitrary background-image the way this does, and every Sage Ink use of it is already `none`',
  '-gtk-icon-source':
    'names an icon lookup (a GTK IconSet/asset reference), not a paintable value; the assets it names are theme icons outside the simulator bundle',
  '-gtk-icon-palette': 'remaps symbolic-icon recolour slots; no CSS box/text equivalent',
  '-gtk-icon-effect': "GTK's icon post-processing pipeline (highlight/dim on the icon layer only); no CSS equivalent",
  '-gtk-icon-transform':
    "a transform applied only to a widget's rendered icon layer, distinct from the widget's own box transform; CSS has no such second transform target",
  '-gtk-icontheme': 'names an icon theme for lookup; has no rendering effect expressible as CSS',
  '-gtk-gradient':
    'GTK2-era gradient mini-language (`-gtk-gradient(linear, from(...), to(...), color-stop(...))`) predates CSS gradient syntax and is not a drop-in parse target; only Breeze-Dark’s stock CSS uses it, which is not coverage-checked, so the loss is a disclosed cosmetic gap in the stock lane, not a Sage Ink omission',
  '-gtk-scaled':
    'selects a 1x/2x PNG pair by device scale factor; the referenced files are theme assets not present in the simulator bundle',
  '-gtk-recolor':
    'recolours an SVG icon asset per current theme colours at render time; the wrapped asset paths live outside the simulator bundle and CSS has no "recolour this image" primitive matching it without an SVG-mask + currentColor pipeline the source assets don’t use'
};

export type DroppedDecl = { property: string; reason: string };

function processDeclaration(raw: string, dropped: DroppedDecl[]): string {
  const colon = raw.indexOf(':');
  if (colon === -1) return raw;
  const prop = raw.slice(0, colon).trim();
  const propLower = prop.toLowerCase();
  const value = raw.slice(colon + 1);
  if (propLower.startsWith('-gtk-')) {
    const rename = GTK_PROPERTY_RENAME[propLower];
    if (rename) return `${raw.slice(0, colon).replace(prop, rename)}:${translateFunctions(substituteNames(value))}`;
    dropped.push({ property: prop, reason: GTK_DROP_REASON[propLower] ?? 'no web equivalent for this GTK-only property' });
    return '';
  }
  const fnMatch = value.match(/-gtk-([a-z-]+)\(/i);
  if (fnMatch) {
    const fn = `-gtk-${fnMatch[1].toLowerCase()}`;
    dropped.push({ property: prop, reason: GTK_DROP_REASON[fn] ?? `value uses ${fn}(), a GTK-only function with no CSS equivalent` });
    return '';
  }
  return `${prop}:${translateFunctions(substituteNames(value))}`;
}

/* ---------- flat-CSS rule walker ---------------------------------------
 * GTK CSS (like the compiled themes here) is flat: no Sass-style nesting.
 * `@keyframes` is the one construct with a brace inside a brace; onPrelude
 * is called for its inner `to`/`0%` "selectors" too, but since those never
 * match a pseudo-class or -gtk- property they pass through unchanged. */
export function walkRules(css: string, onPrelude: (p: string) => string, onDecl: (d: string) => string): string {
  let out = '';
  let buf = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') {
      out += onPrelude(buf) + '{';
      buf = '';
    } else if (c === '}' || c === ';') {
      out += onDecl(buf) + c;
      buf = '';
    } else buf += c;
  }
  return out + onDecl(buf);
}

/* ---------- selector inventory (GTK has no @-moz-document/:root/html/body,
 * so scopedStylus's selectorInventory can't be reused as-is: it returns ''
 * for input with no @-moz-document wrapper). --------------------------- */
const TAG_RE = /(^|[\s,>+~(])([a-z][a-z0-9-]*)(?=$|[\s,>+~.#[:)])/g;
const TOKEN_RE = /\.[A-Za-z_][\w-]*|#[A-Za-z_][\w-]*|\[[^\]]+\]/g;
/* @keyframes step selectors (`from`, `to`, `0%, 50%, 100%`) are not element
 * names; walkRules has no notion of "inside @keyframes" so this is a cheap
 * grammar check instead of real nesting-depth tracking - sufficient because
 * neither pattern is ever a legitimate GTK node name. */
const KEYFRAME_STEP = /^(from|to|(\d+(\.\d+)?%\s*,?\s*)+)$/;

export function gtkSelectorInventory(css: string): string[] {
  const stripped = stripComments(css);
  const found = new Set<string>();
  walkRules(
    stripped,
    (prelude) => {
      const p = prelude.trim();
      if (p && !p.startsWith('@') && !KEYFRAME_STEP.test(p)) {
        for (const m of p.matchAll(TOKEN_RE)) found.add(m[0]);
        for (const m of p.matchAll(TAG_RE)) found.add(m[2]);
      }
      return prelude;
    },
    (d) => d
  );
  return [...found].sort();
}

/* ---------- top-level entry --------------------------------------------
 * Produces one @scope block per lane: `@scope (scopeSelector) { :scope {
 * --gtk-name: value; ... } <rest of the file, translated> }`. Two separate
 * calls (one per lane selector) never collide since each lane parses its own
 * file and gets its own @scope block with its own --gtk-* values. */
export type GtkTranslation = { css: string; defineNames: string[]; dropped: DroppedDecl[] };

export function gtkToWeb(source: string, scopeSelector: string): GtkTranslation {
  const { defs, rest } = extractDefineColors(stripComments(source));
  const dropped: DroppedDecl[] = [];
  const body = walkRules(
    rest,
    (p) => (p.trim().startsWith('@') ? p : rewritePseudoClasses(p)),
    (d) => processDeclaration(d, dropped)
  );
  const varLines = defs.map(([name, raw]) => `  --gtk-${name}: ${translateFunctions(substituteNames(raw))};`);
  const css = `@scope (${scopeSelector}) {\n:scope {\n${varLines.join('\n')}\n}\n${body}\n}`;
  const seen = new Set<string>();
  const dedupedDropped = dropped.filter((d) => (seen.has(d.property) ? false : (seen.add(d.property), true)));
  return { css, defineNames: defs.map(([n]) => n), dropped: dedupedDropped };
}

/* ---------- coverage: every selector token in the shipped CSS has a
 * rendered element, or is disclosed with a reason ------------------------
 * Mirrors sites/coverage.ts's shape (Coverage: total/missing/ignored) but
 * built on gtkSelectorInventory instead of iniCoverage's key tracking, since
 * a GTK theme is selectors, not INI keys. `dropped` (from gtkToWeb) becomes
 * part of `ignored` automatically: a -gtk-* property this translator removed
 * can never appear on the page, so it would otherwise show as a false
 * "missing" selector token when its own property name coincides with a
 * class/element the file also uses elsewhere (it usually doesn't, but this
 * keeps the two lists honestly linked rather than coincidentally consistent). */
export function gtkCoverage(
  source: string,
  laneSelector: string,
  dropped: DroppedDecl[],
  ignore: { token: string; why: string }[] = [],
  root: ParentNode = document
): Coverage {
  const ignoredTokens = new Set(ignore.map((i) => i.token));
  const tokens = gtkSelectorInventory(source).filter((t) => !ignoredTokens.has(t));
  const missing = missingFromDom(root, laneSelector, tokens);
  return { total: tokens.length, missing, ignored: [...ignore, ...dropped.map((d) => ({ token: d.property, why: d.reason }))] };
}
