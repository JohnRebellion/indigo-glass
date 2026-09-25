/* The KSvg side of a Plasma desktop theme, done in the browser.
 *
 * Plasma never shows an SVG whole. KSvg::Svg looks up NAMED ELEMENTS and
 * paints each one into a target rect; FrameSvg assembles nine of them into a
 * frame. What this module reproduces, each against its KF6 source:
 *
 *   elementBox   ksvg svg.cpp findAndCacheElementRect: the element's rect is
 *                transformForElement(id).map(boundsOnElement(id)) — the
 *                element's own geometry through every transform from the root,
 *                then scaled from the SVG's default size to the render size.
 *   partSvg      QSvgRenderer::render(painter, id, bounds): only that element
 *                is drawn, with its ancestors' styles and transforms applied,
 *                its bounds mapped onto the target rect (stretched).
 *   schemeCss    ksvg SharedSvgRenderer::load replaces the text of
 *                <style id="current-color-scheme"> with
 *                ImageSetPrivate::svgStyleSheet — ".ColorScheme-<Name>{color:#rrggbb;}"
 *                built from namedColor(); QColor::name() drops alpha, so every
 *                injected colour is opaque.
 *   auditPart    not KSvg: the design-system check. Walks what an element
 *                really paints and reports translucent paint, gradients and
 *                blur-only parts.
 *
 * Parsing uses DOMParser, so it runs in the browser and under jsdom in tests. */

export type Box = { x: number; y: number; w: number; h: number };
/* Affine matrix [a b c d e f]: x' = a x + c y + e, y' = b x + d y + f. */
export type Mat = [number, number, number, number, number, number];

export const I: Mat = [1, 0, 0, 1, 0, 0];

/* p * q: apply q first, then p. */
export function mul(p: Mat, q: Mat): Mat {
  return [
    p[0] * q[0] + p[2] * q[1],
    p[1] * q[0] + p[3] * q[1],
    p[0] * q[2] + p[2] * q[3],
    p[1] * q[2] + p[3] * q[3],
    p[0] * q[4] + p[2] * q[5] + p[4],
    p[1] * q[4] + p[3] * q[5] + p[5]
  ];
}

export const apply = (m: Mat, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

const NUM = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const nums = (s: string) => (s.match(NUM) ?? []).map(Number);

export function parseTransform(s: string | null | undefined): Mat {
  let m: Mat = I;
  if (!s) return m;
  for (const [, fn, args] of s.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const a = nums(args);
    let t: Mat = I;
    switch (fn) {
      case 'matrix': if (a.length === 6) t = a as Mat; break;
      case 'translate': t = [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0]; break;
      case 'scale': t = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0]; break;
      case 'rotate': {
        const r = ((a[0] ?? 0) * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
        t = [c, sn, -sn, c, 0, 0];
        if (a.length === 3) t = mul(mul([1, 0, 0, 1, a[1], a[2]], t), [1, 0, 0, 1, -a[1], -a[2]]);
        break;
      }
      case 'skewX': t = [1, 0, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 1, 0, 0]; break;
      case 'skewY': t = [1, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]; break;
    }
    m = mul(m, t);
  }
  return m;
}

/* Every point a path passes through that can be an extreme: vertices, plus
   samples along curves and arcs. Enough for a bounding box to well under a
   hundredth of a unit on these theme files. */
export function pathPoints(d: string): [number, number][] {
  const out: [number, number][] = [];
  const toks = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0, qx = 0, qy = 0;
  const N = 16;
  const num = () => Number(toks[i++]);
  const more = () => i < toks.length && !/^[a-zA-Z]$/.test(toks[i]);
  const cubic = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    for (let k = 1; k <= N; k++) {
      const t = k / N, u = 1 - t;
      out.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
    }
  };
  const quad = (x1: number, y1: number, x2: number, y2: number) => {
    for (let k = 1; k <= N; k++) {
      const t = k / N, u = 1 - t;
      out.push([u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2]);
    }
  };
  /* SVG 1.1 F.6.5: endpoint to centre parameterisation. */
  const arc = (rx: number, ry: number, phi: number, fa: number, fs: number, x2: number, y2: number) => {
    if (!rx || !ry) { out.push([x2, y2]); return; }
    rx = Math.abs(rx); ry = Math.abs(ry);
    const p = (phi * Math.PI) / 180, cp = Math.cos(p), sp = Math.sin(p);
    const dx = (x - x2) / 2, dy = (y - y2) / 2;
    const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const num2 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let co = Math.sqrt(Math.max(0, num2 / den));
    if (fa === fs) co = -co;
    const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
    const ccx = cp * cxp - sp * cyp + (x + x2) / 2, ccy = sp * cxp + cp * cyp + (y + y2) / 2;
    const ang = (ux: number, uy: number, vx: number, vy: number) => {
      const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      return a;
    };
    const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!fs && dt > 0) dt -= 2 * Math.PI;
    if (fs && dt < 0) dt += 2 * Math.PI;
    const S = 32;
    for (let k = 1; k <= S; k++) {
      const t = t1 + (dt * k) / S;
      out.push([ccx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, ccy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp]);
    }
  };
  while (i < toks.length) {
    if (/^[a-zA-Z]$/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': {
        x = ox + num(); y = oy + num(); sx = x; sy = y; out.push([x, y]);
        cmd = rel ? 'l' : 'L';
        cx = x; cy = y; qx = x; qy = y;
        break;
      }
      case 'L': x = ox + num(); y = oy + num(); out.push([x, y]); cx = x; cy = y; qx = x; qy = y; break;
      case 'H': x = ox + num(); out.push([x, y]); cx = x; cy = y; qx = x; qy = y; break;
      case 'V': y = oy + num(); out.push([x, y]); cx = x; cy = y; qx = x; qy = y; break;
      case 'C': {
        const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num(), x3 = ox + num(), y3 = oy + num();
        cubic(x1, y1, x2, y2, x3, y3); cx = x2; cy = y2; x = x3; y = y3; qx = x; qy = y;
        break;
      }
      case 'S': {
        const x1 = 2 * x - cx, y1 = 2 * y - cy;
        const x2 = ox + num(), y2 = oy + num(), x3 = ox + num(), y3 = oy + num();
        cubic(x1, y1, x2, y2, x3, y3); cx = x2; cy = y2; x = x3; y = y3; qx = x; qy = y;
        break;
      }
      case 'Q': {
        const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num();
        quad(x1, y1, x2, y2); qx = x1; qy = y1; x = x2; y = y2; cx = x; cy = y;
        break;
      }
      case 'T': {
        const x1 = 2 * x - qx, y1 = 2 * y - qy, x2 = ox + num(), y2 = oy + num();
        quad(x1, y1, x2, y2); qx = x1; qy = y1; x = x2; y = y2; cx = x; cy = y;
        break;
      }
      case 'A': {
        const rx = num(), ry = num(), phi = num();
        /* Flags may be packed without separators ("a1 1 0 011 1"). */
        const flag = () => {
          const t = toks[i];
          if (t.length > 1 && (t[0] === '0' || t[0] === '1')) { toks[i] = t.slice(1); return Number(t[0]); }
          i++; return Number(t);
        };
        const fa = flag(), fs = flag();
        const x2 = ox + num(), y2 = oy + num();
        arc(rx, ry, phi, fa, fs, x2, y2); x = x2; y = y2; cx = x; cy = y; qx = x; qy = y;
        break;
      }
      case 'Z': x = sx; y = sy; out.push([x, y]); cx = x; cy = y; qx = x; qy = y; break;
      default: i++; /* unknown token: skip rather than loop forever */
    }
    if (cmd.toUpperCase() === 'Z' && more()) cmd = rel ? 'l' : 'L';
  }
  return out.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
}

/* ---- style resolution ------------------------------------------------ */

const INHERITED = new Set(['fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'color', 'visibility']);

export function decls(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (el.getAttribute('style') ?? '').split(';')) {
    const c = part.indexOf(':');
    if (c > 0) out[part.slice(0, c).trim()] = part.slice(c + 1).trim();
  }
  return out;
}

/* The element's own value for a property: style="" beats the presentation
   attribute, as in CSS. */
export function own(el: Element, prop: string): string | undefined {
  const d = decls(el)[prop];
  if (d !== undefined && d !== '') return d;
  const a = el.getAttribute(prop);
  return a === null || a === '' || a === 'inherit' ? undefined : a;
}

/* Computed value, walking up for inherited properties. */
export function computed(el: Element, prop: string): string | undefined {
  let e: Element | null = el;
  while (e && e.nodeType === 1) {
    const v = own(e, prop);
    if (v !== undefined) return v;
    if (!INHERITED.has(prop)) return undefined;
    e = e.parentElement;
  }
  return undefined;
}

const NON_RENDER = new Set(['defs', 'style', 'metadata', 'namedview', 'title', 'desc', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'filter', 'pattern', 'symbol', 'marker', 'grid', 'RDF', 'script']);
const tag = (el: Element) => el.localName;

/* ---- the document ---------------------------------------------------- */

export type SvgDoc = {
  doc: Document;
  root: Element;
  /* KSvg's defaultSize: width/height, else the viewBox size. */
  size: { w: number; h: number };
  /* Root user units -> render px at the default size. */
  toPx: Mat;
  byId(id: string): Element | null;
  has(id: string): boolean;
};

export function parseSvg(text: string): SvgDoc {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.localName !== 'svg') throw new Error('not an SVG document');
  const vb = nums(root.getAttribute('viewBox') ?? '');
  const len = (v: string | null) => (v && /^[\d.]+(px)?$/.test(v.trim()) ? parseFloat(v) : NaN);
  let w = len(root.getAttribute('width')), h = len(root.getAttribute('height'));
  if (!Number.isFinite(w)) w = vb.length === 4 ? vb[2] : 0;
  if (!Number.isFinite(h)) h = vb.length === 4 ? vb[3] : 0;
  const toPx: Mat = vb.length === 4 && vb[2] && vb[3] ? [w / vb[2], 0, 0, h / vb[3], (-vb[0] * w) / vb[2], (-vb[1] * h) / vb[3]] : I;
  const ids = new Map<string, Element>();
  for (const el of Array.from(doc.getElementsByTagName('*'))) {
    const id = el.getAttribute('id');
    if (id && !ids.has(id)) ids.set(id, el);
  }
  return { doc, root, size: { w, h }, toPx, byId: (id) => ids.get(id) ?? null, has: (id) => ids.has(id) };
}

const hrefOf = (el: Element) => (el.getAttribute('href') ?? el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? el.getAttribute('xlink:href') ?? '').replace(/^#/, '');

function localPoints(el: Element): [number, number][] {
  const n = (a: string) => parseFloat(el.getAttribute(a) ?? '0') || 0;
  switch (tag(el)) {
    case 'rect': {
      const x = n('x'), y = n('y'), w = n('width'), h = n('height');
      if (w <= 0 || h <= 0) return [];
      return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    }
    case 'circle':
    case 'ellipse': {
      const cx = n('cx'), cy = n('cy');
      const rx = tag(el) === 'circle' ? n('r') : n('rx'), ry = tag(el) === 'circle' ? n('r') : n('ry');
      if (rx <= 0 || ry <= 0) return [];
      /* Sampled, so a rotated ellipse keeps a tight box. */
      return Array.from({ length: 32 }, (_, k) => [cx + rx * Math.cos((k * Math.PI) / 16), cy + ry * Math.sin((k * Math.PI) / 16)] as [number, number]);
    }
    case 'line': return [[n('x1'), n('y1')], [n('x2'), n('y2')]];
    case 'polyline':
    case 'polygon': {
      const a = nums(el.getAttribute('points') ?? '');
      const out: [number, number][] = [];
      for (let k = 0; k + 1 < a.length; k += 2) out.push([a[k], a[k + 1]]);
      return out;
    }
    case 'path': return pathPoints(el.getAttribute('d') ?? '');
  }
  return [];
}

const union = (a: Box | null, b: Box | null): Box | null => {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

function boxOf(pts: [number, number][]): Box | null {
  if (!pts.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function mapBox(m: Mat, b: Box): Box {
  return boxOf([apply(m, b.x, b.y), apply(m, b.x + b.w, b.y), apply(m, b.x, b.y + b.h), apply(m, b.x + b.w, b.y + b.h)])!;
}

/* QSvgNode::transformedBounds for one node: its geometry through its own
   transform and its descendants', in its parent's coordinates. `m` is the
   transform accumulated so far inside the node. */
function nodeBounds(s: SvgDoc, el: Element, m: Mat, depth = 0): Box | null {
  if (depth > 32 || NON_RENDER.has(tag(el))) return null;
  const t = mul(m, parseTransform(el.getAttribute('transform')));
  switch (tag(el)) {
    case 'svg':
    case 'g':
    case 'a':
    case 'switch': {
      let b: Box | null = null;
      for (const c of Array.from(el.children)) b = union(b, nodeBounds(s, c, t, depth + 1));
      return b;
    }
    case 'use': {
      const target = s.byId(hrefOf(el));
      if (!target) return null;
      const n = (a: string) => parseFloat(el.getAttribute(a) ?? '0') || 0;
      return nodeBounds(s, target, mul(t, [1, 0, 0, 1, n('x'), n('y')]), depth + 1);
    }
    case 'text':
    case 'tspan':
      return null; /* no font metrics here; no theme part is a text element */
  }
  const pts = localPoints(el);
  if (!pts.length) return null;
  const stroke = computed(el, 'stroke');
  const sw = stroke && stroke !== 'none' ? parseFloat(computed(el, 'stroke-width') ?? '1') || 0 : 0;
  if (sw > 0) {
    const lb = boxOf(pts)!;
    return mapBox(t, { x: lb.x - sw / 2, y: lb.y - sw / 2, w: lb.w + sw, h: lb.h + sw });
  }
  return boxOf(pts.map(([x, y]) => apply(t, x, y)));
}

/* Transform from an element's parent coordinates to root user units: the
   product of every ancestor's transform (QSvgRenderer::transformForElement). */
export function ancestorCtm(el: Element): Mat {
  const chain: Element[] = [];
  for (let p = el.parentElement; p && p.localName !== 'svg'; p = p.parentElement) chain.unshift(p);
  let m: Mat = I;
  for (const p of chain) m = mul(m, parseTransform(p.getAttribute('transform')));
  return m;
}

/* The rect KSvg uses for an element, in px at the SVG's default size. */
export function elementBox(s: SvgDoc, id: string): Box | null {
  const el = s.byId(id);
  if (!el) return null;
  const local = nodeBounds(s, el, I);
  if (!local) return null;
  return mapBox(mul(s.toPx, ancestorCtm(el)), local);
}

/* Same, in root user units (what a cut-out viewBox needs). */
function userBox(s: SvgDoc, el: Element): Box | null {
  const local = nodeBounds(s, el, I);
  return local ? mapBox(ancestorCtm(el), local) : null;
}

/* ElementSize/elementRect.isValid(): both sides positive. */
export const valid = (b: Box | null): b is Box => !!b && b.w > 0 && b.h > 0;

/* ---- colour scheme stylesheet ---------------------------------------- */

/* Every name svgStyleSheet emits, in its order (ksvg imageset_p.cpp). */
export const SCHEME_CLASSES = [
  'Text', 'Background', 'Highlight', 'HighlightedText', 'PositiveText', 'NeutralText', 'NegativeText',
  ...['Button', 'View', 'Tooltip', 'Complementary', 'Header'].flatMap((g) =>
    ['Text', 'Background', 'Hover', 'Focus', 'HighlightedText', 'PositiveText', 'NeutralText', 'NegativeText'].map((r) => g + r)
  ),
  'Frame'
] as const;

/* Every ColorScheme-* class an element tree carries. */
export function schemeClasses(el: Element): Set<string> {
  const out = new Set<string>();
  const scan = (e: Element) => {
    for (const c of (e.getAttribute('class') ?? '').split(/\s+/)) if (c.startsWith('ColorScheme-')) out.add(c.slice(12));
  };
  scan(el);
  for (const e of Array.from(el.getElementsByTagName('*'))) scan(e);
  return out;
}

export const schemeCss = (colours: Record<string, string>) =>
  Object.entries(colours).map(([k, v]) => `.ColorScheme-${k}{color:${v};}`).join('');

/* ---- one element as a standalone SVG --------------------------------- */

const SVGNS = 'http://www.w3.org/2000/svg';

export type Part = { box: Box; xml: string; classes: Set<string> };

/* Cut element `id` out as its own document: viewBox = its bounds, stretched
   to whatever box it is painted into (preserveAspectRatio none, as
   QSvgRenderer::render(painter, id, bounds) maps bounds onto the target).
   `colours(classes)` returns the stylesheet colours for the classes the cut
   actually uses, so the caller resolves (and records) only what is painted. */
export function partSvg(s: SvgDoc, id: string, colours: (classes: Set<string>) => Record<string, string>): Part | null {
  const el = s.byId(id);
  if (!el) return null;
  const ub = userBox(s, el);
  const box = elementBox(s, id);
  if (!ub || !valid(box)) return null;
  const out = s.doc.implementation.createDocument(SVGNS, 'svg', null);
  const root = out.documentElement;
  root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  root.setAttribute('width', String(box.w));
  root.setAttribute('height', String(box.h));
  root.setAttribute('viewBox', `${ub.x} ${ub.y} ${ub.w} ${ub.h}`);
  root.setAttribute('preserveAspectRatio', 'none');
  const imp = <T extends Node>(n: T, deep: boolean) => out.importNode(n, deep) as T;

  /* Paint servers and <use> targets live in <defs>. Targets outside <defs>
     (Inkscape often <use>s a sibling part) are copied in as well, unless
     they sit inside the cut already. */
  const defs = out.createElementNS(SVGNS, 'defs');
  root.appendChild(defs);
  /* The file's own current-color-scheme sheet is dropped: KSvg replaces its
     content with svgStyleSheet(), and a copied original would win the
     cascade over the injected one (same specificity, later in the file). */
  for (const d of Array.from(s.root.getElementsByTagName('defs')))
    for (const c of Array.from(d.children)) if (c.getAttribute('id') !== 'current-color-scheme') defs.appendChild(imp(c, true));
  const inside = (n: Element) => n === el || el.contains(n);
  const wanted = new Set<string>();
  const collect = (e: Element) => {
    const all = [e, ...Array.from(e.getElementsByTagName('*'))];
    for (const x of all) {
      const refs: string[] = [];
      if (tag(x) === 'use') refs.push(hrefOf(x));
      for (const v of [x.getAttribute('fill'), x.getAttribute('stroke'), x.getAttribute('style')])
        for (const m of (v ?? '').matchAll(/url\(\s*#([^)\s]+)\s*\)/g)) refs.push(m[1]);
      for (const r of refs) {
        const t = s.byId(r);
        if (!t || wanted.has(r) || inside(t) || t.closest('defs')) continue;
        wanted.add(r);
        defs.appendChild(imp(t, true));
        collect(t);
      }
    }
  };
  collect(el);

  /* Ancestors as shallow clones: their transform, opacity and fill apply,
     their other children do not. */
  let parent: Element = root;
  const chain: Element[] = [];
  for (let p = el.parentElement; p && p !== s.root; p = p.parentElement) chain.unshift(p);
  for (const p of chain) {
    const c = imp(p, false);
    parent.appendChild(c);
    parent = c;
  }
  parent.appendChild(imp(el, true));

  const classes = schemeClasses(root);
  const style = out.createElementNS(SVGNS, 'style');
  style.setAttribute('id', 'current-color-scheme');
  style.textContent = schemeCss(colours(classes));
  root.insertBefore(style, root.firstChild);
  return { box, xml: new XMLSerializer().serializeToString(out), classes };
}

/* encodeURIComponent leaves ' ( ) alone; escape them so the URI is safe in url('…'). */
export const dataUri = (xml: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}`;

/* ---- what a part paints, and the design-system audit ----------------- */

/* One visible paint operation inside a part. `colour` is resolved: a
   ColorScheme class through `cls`, currentColor through the nearest
   `color`, else the literal. Gradients keep their url(). */
export type Paint = {
  /* Nearest named ancestor-or-self (the part, or a named piece of it). */
  part: string;
  el: string;
  kind: 'fill' | 'stroke';
  colour: string;
  alpha: number;
  gradient?: { id: string; stops: number; min: number; max: number };
};

export type Finding = { part: string; el: string; kind: 'translucent' | 'gradient' | 'blur'; detail: string };

/* Alpha of a CSS colour value; ksvg-injected colours are always opaque. */
export function colourAlpha(v: string): number {
  const s = v.trim().toLowerCase();
  if (s === 'none' || s === 'transparent') return 0;
  let m = s.match(/^#([0-9a-f]{8})$/);
  if (m) return parseInt(m[1].slice(6), 16) / 255;
  m = s.match(/^#([0-9a-f]{4})$/);
  if (m) return parseInt(m[1][3] + m[1][3], 16) / 255;
  m = s.match(/^rgba?\(([^)]*)\)$/) ?? s.match(/^hsla?\(([^)]*)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    if (p.length >= 4) return p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
  }
  return 1;
}

const num1 = (v: string | undefined) => (v === undefined ? 1 : v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));
export const INVISIBLE = 1 / 255;
const AUTO_ID = /^(path|rect|g|use|circle|ellipse|text|tspan)\d/;

/* currentColor: the nearest element that sets `color`, by style/attribute
   (wins, as inline CSS does) or by a ColorScheme-* class rule. */
export function currentColour(el: Element, cls: (name: string) => string): string {
  for (let e: Element | null = el; e && e.nodeType === 1; e = e.parentElement) {
    const own1 = own(e, 'color');
    if (own1 && own1 !== 'currentColor') return own1;
    const c = (e.getAttribute('class') ?? '').split(/\s+/).find((x) => x.startsWith('ColorScheme-'));
    if (c) return cls(c.slice(12));
  }
  return '#000000';
}

/* Every visible paint `id` makes. Opacity multiplies through the ancestor
   chain (group compositing), then fill-/stroke-opacity and the colour's own
   alpha. Paint at or below 1/255 is invisible and skipped: Inkscape keeps
   sizing rects at opacity 0, and those are geometry, not paint. */
export function paintsOf(s: SvgDoc, id: string, cls: (name: string) => string = () => '#000000'): Paint[] {
  const el = s.byId(id);
  if (!el) return [];
  const out: Paint[] = [];
  let base = 1;
  for (let p = el.parentElement; p && p !== s.root; p = p.parentElement) {
    base *= num1(own(p, 'opacity'));
    if (own(p, 'display') === 'none') return [];
  }
  const nearest = (e: Element) => {
    for (let x: Element | null = e; x; x = x.parentElement) {
      const i = x.getAttribute('id');
      if (i && !AUTO_ID.test(i)) return i;
      if (x === el) break;
    }
    return id;
  };
  const gradientAlpha = (gid: string, depth = 0): { min: number; max: number; stops: number } => {
    const g = s.byId(gid);
    if (!g || depth > 8) return { min: 1, max: 1, stops: 0 };
    const stops = Array.from(g.children).filter((c) => tag(c) === 'stop');
    if (!stops.length && hrefOf(g)) return gradientAlpha(hrefOf(g), depth + 1);
    const a = stops.map((st) => num1(own(st, 'stop-opacity')) * colourAlpha(own(st, 'stop-color') ?? '#000'));
    return { min: Math.min(...a, 1), max: Math.max(...a, 0), stops: stops.length };
  };
  const walk = (e: Element, op: number, depth: number) => {
    if (depth > 32 || NON_RENDER.has(tag(e))) return;
    if (own(e, 'display') === 'none') return;
    const o = op * num1(own(e, 'opacity'));
    if (o <= INVISIBLE) return;
    if (tag(e) === 'use') {
      const t = s.byId(hrefOf(e));
      if (t) walk(t, o, depth + 1);
      return;
    }
    if (['g', 'a', 'switch', 'svg'].includes(tag(e))) {
      for (const c of Array.from(e.children)) walk(c, o, depth + 1);
      return;
    }
    if (!['rect', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan'].includes(tag(e))) return;
    if (computed(e, 'visibility') === 'hidden') return;
    const fl = decls(e)['filter'] ?? e.getAttribute('filter');
    if (fl && fl !== 'none') out.push({ part: nearest(e), el: e.getAttribute('id') ?? '', kind: 'fill', colour: `filter ${fl}`, alpha: o });
    for (const k of ['fill', 'stroke'] as const) {
      const paint = computed(e, k) ?? (k === 'fill' ? '#000000' : 'none');
      if (paint === 'none') continue;
      if (k === 'stroke' && !(parseFloat(computed(e, 'stroke-width') ?? '1') > 0)) continue;
      const po = num1(computed(e, `${k}-opacity`));
      const g = paint.match(/url\(\s*#([^)\s]+)\s*\)/);
      if (g) {
        const ga = gradientAlpha(g[1]);
        if (o * po * ga.max <= INVISIBLE) continue;
        out.push({ part: nearest(e), el: e.getAttribute('id') ?? '', kind: k, colour: paint, alpha: o * po, gradient: { id: g[1], ...ga } });
        continue;
      }
      const colour = paint === 'currentColor' ? currentColour(e, cls) : paint;
      const a = o * po * colourAlpha(colour);
      if (a <= INVISIBLE) continue;
      out.push({ part: nearest(e), el: e.getAttribute('id') ?? '', kind: k, colour, alpha: a });
    }
  };
  walk(el, base, 0);
  return out;
}

/* The design-system audit of one part: translucent paint, gradients, filters. */
export function auditPart(s: SvgDoc, id: string): Finding[] {
  return paintsOf(s, id).flatMap((p): Finding[] => {
    if (p.colour.startsWith('filter ')) return [{ part: p.part, el: p.el, kind: 'blur', detail: p.colour }];
    if (p.gradient) return [{ part: p.part, el: p.el, kind: 'gradient', detail: `${p.kind} url(#${p.gradient.id}), ${p.gradient.stops} stops, alpha ${round(p.alpha * p.gradient.min)}..${round(p.alpha * p.gradient.max)}` }];
    if (p.alpha < 1 - 1e-6) return [{ part: p.part, el: p.el, kind: 'translucent', detail: `${p.kind} ${p.colour} at alpha ${round(p.alpha)}` }];
    return [];
  });
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/* Named parts of a theme SVG: every id outside <defs>/<metadata>/the
   Inkscape namedview that is not an Inkscape auto-id. These are what KSvg
   consumers look up by name; auto-ids are drawing content of a part. */
export function namedParts(s: SvgDoc): string[] {
  const auto = /^(rect|path|g|text|tspan|layer|use|circle|ellipse|polygon|polyline|line|image|flowRoot|svg)[-_\d.]*$/;
  const out: string[] = [];
  for (const el of Array.from(s.root.getElementsByTagName('*'))) {
    const id = el.getAttribute('id');
    if (!id || auto.test(id) || NON_RENDER.has(tag(el))) continue;
    if (el.closest('defs, metadata') || el.parentElement?.localName === 'namedview') continue;
    out.push(id);
  }
  return out;
}
