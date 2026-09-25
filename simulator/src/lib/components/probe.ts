/* Read a component's slot values back off the rendered DOM, then judge them.
 *
 * A specimen marks each painting element with data-probe, a space-separated
 * list of entries:
 *   slot          — read the slot's default property (catalogue.ts `prop`)
 *   slot:prop     — read another property (bg|color|border|outline|ring|fill|stroke)
 *   slot:=#HEX    — a value taken from the layer's parsed model because the
 *                   paint is not CSS the browser can report (a Plasma SVG
 *                   tile, a canvas). Marked "model" on the page.
 * The first element in a lane that names a slot wins.
 *
 * Values are normalised to #RRGGBB, or #RRGGBBAA when translucent, through a
 * 1x1 canvas when the computed colour is not rgb()/rgba() (oklch(),
 * color-mix() and color() survive into computed style in Chromium).
 */
import { PALETTE, normHex, contrast } from '$lib/desktop/tokens';
import type { ComponentDef, ProbeProp, Slot } from './catalogue';
import type { LayerDef } from './layer';

export type Reading = { value: string | null; how: 'painted' | 'model' | 'none' };
export type Readings = Record<string, Reading>;

type Entry = { slot: string; prop?: ProbeProp; literal?: string };

export function parseProbe(attr: string): Entry[] {
  return attr
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const i = tok.indexOf(':');
      if (i === -1) return { slot: tok };
      const slot = tok.slice(0, i);
      const rest = tok.slice(i + 1);
      if (rest.startsWith('=')) return { slot, literal: rest.slice(1) };
      return { slot, prop: rest as ProbeProp };
    });
}

let scratch: CanvasRenderingContext2D | null = null;
/* Any CSS colour string to #RRGGBB[AA], or null for fully transparent. */
export function toHex(css: string | null | undefined): string | null {
  if (!css) return null;
  const s = css.trim();
  if (!s || s === 'none' || s === 'transparent' || s === 'currentcolor') return null;
  let hex: string;
  if (/^#[0-9a-f]{3,8}$/i.test(s) || /^rgba?\(/i.test(s)) {
    hex = normHex(s);
  } else {
    scratch ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
    if (!scratch) return null;
    scratch.clearRect(0, 0, 1, 1);
    scratch.fillStyle = '#000';
    scratch.fillStyle = s;
    scratch.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = scratch.getImageData(0, 0, 1, 1).data;
    hex = normHex(a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a / 255})`);
  }
  if (/^#[0-9A-F]{6}00$/.test(hex)) return null;
  return hex;
}

const opaque = (hex: string) => hex.length === 7;

/* The background a box actually shows: its own if it paints one, else the
   nearest ancestor's, up to and including the lane root. A translucent
   background is returned as-is — compositing it would hide the violation. */
export function effectiveBg(el: Element, stop: Element): string | null {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const v = toHex(getComputedStyle(e).backgroundColor);
    if (v) return v;
    if (e === stop) break;
  }
  return null;
}

const SIDES = ['top', 'right', 'bottom', 'left'] as const;
function border(cs: CSSStyleDeclaration): string | null {
  for (const s of SIDES) {
    const w = parseFloat(cs.getPropertyValue(`border-${s}-width`));
    const st = cs.getPropertyValue(`border-${s}-style`);
    if (w > 0 && st !== 'none' && st !== 'hidden') {
      const v = toHex(cs.getPropertyValue(`border-${s}-color`));
      if (v) return v;
    }
  }
  return null;
}
function outline(cs: CSSStyleDeclaration): string | null {
  if (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) <= 0) return null;
  return toHex(cs.outlineColor);
}
/* A focus / selection ring: an outline, else a zero-offset spread
   box-shadow (a ring, not an elevation shadow), else a border. */
function ring(cs: CSSStyleDeclaration): string | null {
  const o = outline(cs);
  if (o) return o;
  const shadow = cs.boxShadow;
  if (shadow && shadow !== 'none') {
    for (const part of shadow.split(/,(?![^(]*\))/)) {
      const color = part.match(/(rgba?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8})/i)?.[1];
      const lens = part.replace(color ?? '', '').match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
      const [x = 0, y = 0, , spread = 0] = lens;
      if (color && x === 0 && y === 0 && spread > 0) return toHex(color);
    }
  }
  return border(cs);
}

function readProp(el: Element, prop: ProbeProp, stop: Element): string | null {
  const cs = getComputedStyle(el);
  switch (prop) {
    case 'bg': return effectiveBg(el, stop);
    case 'color': return toHex(cs.color);
    case 'border': return border(cs);
    case 'outline': return outline(cs);
    case 'ring': return ring(cs);
    case 'fill': return toHex(cs.fill);
    case 'stroke': return toHex(cs.stroke);
  }
}

export function measure(laneRoot: Element, comp: ComponentDef): Readings {
  const out: Readings = {};
  const slots = new Map(comp.slots.map((s) => [s.id, s]));
  const els = [laneRoot, ...Array.from(laneRoot.querySelectorAll('[data-probe]'))].filter((e) => e.hasAttribute('data-probe'));
  for (const el of els) {
    for (const e of parseProbe(el.getAttribute('data-probe') ?? '')) {
      const slot = slots.get(e.slot);
      if (!slot || out[e.slot]) continue;
      if (e.literal !== undefined) out[e.slot] = { value: toHex(e.literal), how: 'model' };
      else out[e.slot] = { value: readProp(el, e.prop ?? slot.prop, laneRoot), how: 'painted' };
    }
  }
  for (const s of comp.slots) out[s.id] ??= { value: null, how: 'none' };
  return out;
}

/* ---------- judging ---------- */

/* Palette names that are pure aliases of another name (legacy variant
   vocabulary). They still match, but the page shows the canonical name. */
const ALIASES = new Set(['indigo', 'indigo_hi', 'lime', 'lime_hi', 'violet', 'lime_alt']);
/* Values a document names that the token file does not carry as a hex:
   STATE_GRAMMAR.md Tier C's on-dark ring is "white/near-white", the
   reference's --ring token, oklch(100% 0 0). Near-white is `text`. */
export const CONTRACT_EXTRAS: Record<string, string> = { ring: '#FFFFFF' };
const hexOf = (layer: LayerDef, token: string) =>
  (layer.tokenHex?.[token] ?? PALETTE[token] ?? CONTRACT_EXTRAS[token])?.toUpperCase();

export function tokenNames(hex: string | null, layer: LayerDef): string[] {
  if (!hex) return [];
  const names = new Set([...Object.keys(PALETTE), ...Object.keys(CONTRACT_EXTRAS), ...Object.keys(layer.tokenHex ?? {})]);
  return [...names].filter((n) => !ALIASES.has(n) && hexOf(layer, n) === hex.toUpperCase());
}

export type Verdict = 'ok' | 'observed' | 'fail' | 'known' | 'exception' | 'skip';
export type Cell = {
  slot: string;
  label: string;
  stock: string | null;
  ours: string | null;
  how: Reading['how'];
  tokens: string[];
  stockTokens: string[];
  expect: Slot['expect'];
  verdict: Verdict;
  why: string;
};
export type PairRow = { name: string; slots: [string, string]; fg: string | null; bg: string | null; ratio: number | null; min: number; ok: boolean | null };
export type LayerResult = { layer: string; cells: Cell[]; contrast: PairRow[] };

export function judge(comp: ComponentDef, layer: LayerDef, stock: Readings, ours: Readings): LayerResult {
  const use = layer.components[comp.id] ?? {};
  const skipWhy = (s: string) => use.skip?.find((k) => k.slot === s)?.why;
  const excWhy = (s: string) => use.exceptions?.find((k) => k.slot === s)?.why;
  const knownWhy = (s: string) => use.known?.find((k) => k.slot === s)?.why;

  const cells: Cell[] = comp.slots.map((s) => {
    const v = ours[s.id].value;
    const tokens = tokenNames(v, layer);
    const base = {
      slot: s.id, label: s.label, stock: stock[s.id].value, ours: v, how: ours[s.id].how,
      tokens, stockTokens: tokenNames(stock[s.id].value, layer), expect: s.expect
    };
    const fail = (why: string): Cell => {
      const e = excWhy(s.id);
      if (e) return { ...base, verdict: 'exception', why: `${why} — ${e}` };
      const k = knownWhy(s.id);
      return k ? { ...base, verdict: 'known', why: `${why} — ${k}` } : { ...base, verdict: 'fail', why };
    };
    if (v === null) {
      const k = skipWhy(s.id);
      return k ? { ...base, verdict: 'skip', why: k } : fail('not painted by the specimen');
    }
    if (!opaque(v)) return fail(`translucent (${v}); STATE_GRAMMAR principle 1`);
    if (!tokens.length) return fail(`${v} is no palette token; STATE_GRAMMAR principle 2`);
    const x = s.expect;
    if (!x) return { ...base, verdict: 'observed', why: '' };
    if ('token' in x) return tokens.includes(x.token) ? { ...base, verdict: 'ok', why: '' } : fail(`is ${tokens.join('/')}, contract says ${x.token}`);
    if ('oneOf' in x) return x.oneOf.some((t) => tokens.includes(t)) ? { ...base, verdict: 'ok', why: '' } : fail(`is ${tokens.join('/')}, contract says one of ${x.oneOf.join(', ')}`);
    const other = ours[x.sameAs]?.value;
    return other && other === v ? { ...base, verdict: 'ok', why: '' } : fail(`is ${tokens.join('/')}, contract says the same as ${x.sameAs} (${other ?? 'unmeasured'})`);
  });

  const contrastRows: PairRow[] = comp.contrast.map((p) => {
    const fg = ours[p.fg]?.value ?? null;
    const bg = ours[p.bg]?.value ?? null;
    const slots: [string, string] = [p.fg, p.bg];
    if (!fg || !bg || !opaque(fg) || !opaque(bg)) return { name: p.name, slots, fg, bg, ratio: null, min: p.min, ok: null };
    const r = Math.round(contrast(fg, bg) * 100) / 100;
    return { name: p.name, slots, fg, bg, ratio: r, min: p.min, ok: r >= p.min };
  });

  return { layer: layer.id, cells, contrast: contrastRows };
}

