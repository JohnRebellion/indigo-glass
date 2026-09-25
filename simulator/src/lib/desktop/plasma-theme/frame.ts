/* KSvg::FrameSvg and the KWin shadow, as numbers.
 *
 * Pure geometry, no DOM, so the 9-slice maths is unit-tested on its own:
 *   resolvePrefix   FrameSvgItem::applyPrefixes + FrameSvg::setElementPrefix
 *   frameGeometry   FrameSvgPrivate::updateSizes (ksvg framesvg.cpp:916-1045)
 *   frameLayout     generateFrameBackground / contentGeometry / paintCenter /
 *                   paintBorder / paintCorner + FrameSvgHelpers::sectionRect
 *   shadowGeometry  DialogShadows::Private::updateShadow (libplasma dialogshadows.cpp)
 *   shadowLayout    how KWin places KWindowShadow tiles around the window
 *   panelPadding    Panel.qml topPadding..rightPadding (plasma-desktop 6.7.4) */
import type { Box } from './svg';

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Borders = Record<Side, boolean>;
export const ALL_BORDERS: Borders = { top: true, bottom: true, left: true, right: true };
export const SIDES: Side[] = ['top', 'bottom', 'left', 'right'];
export const CORNERS = ['topleft', 'topright', 'bottomleft', 'bottomright'] as const;
export type Corner = (typeof CORNERS)[number];
export type PartName = 'center' | Side | Corner;
export const PARTS: PartName[] = ['topleft', 'top', 'topright', 'left', 'center', 'right', 'bottomleft', 'bottom', 'bottomright'];

/* What frameGeometry needs from an SVG: does an element exist, and its rect. */
export type ElementSource = { has(id: string): boolean; box(id: string): Box | null };

/* Svg::elementSize rounds (ksvg svg.cpp:999-1003); a missing element is
   QRectF(), whose size is 0x0. */
const size = (b: Box | null) => (b ? { w: Math.round(b.w), h: Math.round(b.h) } : { w: 0, h: 0 });
const isValid = (b: Box | null) => !!b && b.w > 0 && b.h > 0;

/* FrameSvg::hasElementPrefix: a prefix exists when "<prefix>-center" does. */
export const hasPrefix = (s: ElementSource, p: string) => (p ? s.has(`${p.replace(/-$/, '')}-center`) : s.has('center'));

/* FrameSvgItem takes a list and uses the first prefix that exists; if none
   does it sets the LAST one, and FrameSvg::setElementPrefix turns a missing
   prefix into "" (no prefix). Returns the element-name prefix ("thick-" or ""). */
export function resolvePrefix(s: ElementSource, prefixes: string | string[]): string {
  const list = typeof prefixes === 'string' ? [prefixes] : prefixes;
  const pick = list.find((p) => hasPrefix(s, p)) ?? list[list.length - 1] ?? '';
  return pick && s.has(`${pick}-center`) ? `${pick}-` : '';
}

export type Edges = Record<Side, number>;
export type FrameGeom = {
  prefix: string;
  borders: Borders;
  /* Natural size of each of the nine parts (0x0 when missing). */
  natural: Record<PartName, { w: number; h: number }>;
  present: Record<PartName, boolean>;
  /* topHeight/bottomHeight/leftWidth/rightWidth: 0 for a disabled border. */
  border: Edges;
  fixedBorder: Edges;
  /* hint-*-margin when present, else the border size; 0 when disabled. */
  margin: Edges;
  fixedMargin: Edges;
  /* hint-*-inset, -1 when absent. */
  inset: Edges;
  /* Which hint elements set a margin (for the page's hint table). */
  marginFrom: Record<Side, 'hint' | 'border'>;
  tileCenter: boolean;
  stretchBorders: boolean;
  composeOverBorder: boolean;
  noBorderPadding: boolean;
};

export function frameGeometry(s: ElementSource, prefix: string, borders: Borders = ALL_BORDERS): FrameGeom {
  const el = (n: string) => s.box(prefix + n);
  const natural = {} as FrameGeom['natural'];
  const present = {} as FrameGeom['present'];
  for (const p of PARTS) { natural[p] = size(el(p)); present[p] = s.has(prefix + p); }
  const fixedBorder: Edges = { top: natural.top.h, bottom: natural.bottom.h, left: natural.left.w, right: natural.right.w };
  const fixedMargin = {} as Edges, margin = {} as Edges, border = {} as Edges, inset = {} as Edges;
  const marginFrom = {} as FrameGeom['marginFrom'];
  for (const side of SIDES) {
    const vertical = side === 'top' || side === 'bottom';
    const hint = el(`hint-${side}-margin`);
    marginFrom[side] = isValid(hint) ? 'hint' : 'border';
    fixedMargin[side] = isValid(hint) ? (vertical ? hint!.h : hint!.w) : fixedBorder[side];
    margin[side] = borders[side] ? fixedMargin[side] : 0;
    border[side] = borders[side] ? fixedBorder[side] : 0;
    const ins = el(`hint-${side}-inset`);
    inset[side] = isValid(ins) ? (vertical ? ins!.h : ins!.w) : -1;
  }
  const either = (n: string) => s.has(n) || s.has(prefix + n);
  return {
    prefix, borders, natural, present, border, fixedBorder, margin, fixedMargin, inset, marginFrom,
    tileCenter: either('hint-tile-center'),
    stretchBorders: either('hint-stretch-borders'),
    noBorderPadding: either('hint-no-border-padding'),
    composeOverBorder: s.has(prefix + 'hint-compose-over-border') && s.has('mask-' + prefix + 'center')
  };
}

export type Cell = {
  part: PartName;
  x: number; y: number; w: number; h: number;
  /* stretch: element scaled to the cell; tile: element at `tile` size, repeated from the cell origin. */
  mode: 'stretch' | 'tile';
  tile?: { w: number; h: number };
};
export type FrameLayout = { cells: Cell[]; content: Box; contents: Box };

/* Where FrameSvg paints each part for a frame of W x H, and the contents
   rect (FrameSvg::contentsRect: the frame minus the margins). */
export function frameLayout(g: FrameGeom, W: number, H: number): FrameLayout {
  const cw = W - g.border.left - g.border.right, ch = H - g.border.top - g.border.bottom;
  const content: Box = {
    x: g.borders.left && g.present.left ? g.border.left : 0,
    y: g.borders.top && g.present.top ? g.border.top : 0,
    w: cw, h: ch
  };
  const right = content.x + content.w, bottom = content.y + content.h;
  const section = (p: PartName): Box => {
    switch (p) {
      case 'center': return content;
      case 'top': return { x: content.x, y: 0, w: content.w, h: content.y };
      case 'bottom': return { x: content.x, y: bottom, w: content.w, h: H - bottom };
      case 'left': return { x: 0, y: content.y, w: content.x, h: content.h };
      case 'right': return { x: right, y: content.y, w: W - right, h: content.h };
      case 'topleft': return { x: 0, y: 0, w: content.x, h: content.y };
      case 'topright': return { x: right, y: 0, w: W - right, h: content.y };
      case 'bottomleft': return { x: 0, y: bottom, w: content.x, h: H - bottom };
      case 'bottomright': return { x: right, y: bottom, w: W - right, h: H - bottom };
    }
  };
  /* paintCorner / paintBorder round the position and ceil the size. */
  const snap = (b: Box): Box => { const x = Math.round(b.x), y = Math.round(b.y); return { x, y, w: Math.ceil(b.w), h: Math.ceil(b.h) }; };
  const cells: Cell[] = [];
  if (content.w > 0 && content.h > 0 && g.present.center) {
    const r = g.composeOverBorder ? { x: 0, y: 0, w: W, h: H } : content;
    cells.push(g.tileCenter ? { part: 'center', ...r, mode: 'tile', tile: g.natural.center } : { part: 'center', ...r, mode: 'stretch' });
  }
  for (const c of CORNERS) {
    const need = (c.startsWith('top') ? g.borders.top : g.borders.bottom) && (c.endsWith('left') ? g.borders.left : g.borders.right);
    if (!need || !g.present[c]) continue;
    cells.push({ part: c, ...snap(section(c)), mode: 'stretch' });
  }
  for (const side of ['left', 'right', 'top', 'bottom'] as Side[]) {
    const vertical = side === 'left' || side === 'right';
    const tile = vertical ? { w: g.border[side], h: g.natural[side].h } : { w: g.natural[side].w, h: g.border[side] };
    if (!g.borders[side] || !g.present[side] || tile.w <= 0 || tile.h <= 0) continue;
    if (g.stretchBorders) cells.push({ part: side, ...section(side), mode: 'stretch' });
    else cells.push({ part: side, ...snap(section(side)), mode: 'tile', tile: { w: Math.ceil(tile.w), h: Math.ceil(tile.h) } });
  }
  const contents: Box = { x: g.margin.left, y: g.margin.top, w: W - g.margin.left - g.margin.right, h: H - g.margin.top - g.margin.bottom };
  return { cells, content, contents };
}

/* ---- window shadows --------------------------------------------------- */

export const SHADOW_TILES = ['top', 'topright', 'right', 'bottomright', 'bottom', 'bottomleft', 'left', 'topleft'] as const;
export type ShadowTile = (typeof SHADOW_TILES)[number];
export type ShadowGeom = {
  present: boolean;
  tiles: Record<ShadowTile, { w: number; h: number }>;
  /* KWindowShadow padding: how far the shadow reaches past each window edge. */
  padding: Edges;
  paddingFrom: Record<Side, 'hint' | 'missing' | 'disabled'>;
};

/* DialogShadows::Private::updateShadow takes each side's padding from
   elementSize("shadow-hint-<side>-margin") when that size isValid(), else
   from the tile. elementSize of a MISSING element is QRectF().size() = 0x0,
   and QSize(0,0).isValid() is true (w >= 0 && h >= 0) — so on KF6 the tile
   fallback is unreachable: a missing hint means padding 0 on that side. */
export function shadowGeometry(s: ElementSource, borders: Borders = ALL_BORDERS): ShadowGeom {
  const tiles = {} as ShadowGeom['tiles'];
  for (const t of SHADOW_TILES) tiles[t] = size(s.box(`shadow-${t}`));
  const padding = {} as Edges;
  const paddingFrom = {} as ShadowGeom['paddingFrom'];
  for (const side of SIDES) {
    if (!borders[side]) { padding[side] = 0; paddingFrom[side] = 'disabled'; continue; }
    const vertical = side === 'top' || side === 'bottom';
    const hint = size(s.box(`shadow-hint-${side}-margin`));
    padding[side] = vertical ? hint.h : hint.w;
    paddingFrom[side] = s.has(`shadow-hint-${side}-margin`) ? 'hint' : 'missing';
  }
  return { present: s.has('shadow-left'), tiles, padding, paddingFrom };
}

export type ShadowCell = { tile: ShadowTile; x: number; y: number; w: number; h: number };

/* KWin Shadow::buildQuads: the shadow rect is the window grown by the
   padding; corners sit in its corners at their natural size, edges stretch
   between them at their natural thickness. Coordinates are relative to the
   window's top-left. */
export function shadowLayout(g: ShadowGeom, W: number, H: number): ShadowCell[] {
  if (!g.present) return [];
  const o = { x: 0 - g.padding.left, y: 0 - g.padding.top, w: W + g.padding.left + g.padding.right, h: H + g.padding.top + g.padding.bottom };
  const t = g.tiles;
  const tl = { x: o.x, y: o.y, ...t.topleft };
  const tr = { x: o.x + o.w - t.topright.w, y: o.y, ...t.topright };
  const bl = { x: o.x, y: o.y + o.h - t.bottomleft.h, ...t.bottomleft };
  const br = { x: o.x + o.w - t.bottomright.w, y: o.y + o.h - t.bottomright.h, ...t.bottomright };
  const cells: ShadowCell[] = [
    { tile: 'topleft', ...tl }, { tile: 'topright', ...tr }, { tile: 'bottomleft', ...bl }, { tile: 'bottomright', ...br },
    { tile: 'top', x: tl.x + tl.w, y: o.y, w: tr.x - (tl.x + tl.w), h: t.top.h },
    { tile: 'bottom', x: bl.x + bl.w, y: o.y + o.h - t.bottom.h, w: br.x - (bl.x + bl.w), h: t.bottom.h },
    { tile: 'left', x: o.x, y: tl.y + tl.h, w: t.left.w, h: bl.y - (tl.y + tl.h) },
    { tile: 'right', x: o.x + o.w - t.right.w, y: tr.y + tr.h, w: t.right.w, h: br.y - (tr.y + tr.h) }
  ];
  return cells.filter((c) => c.w > 0 && c.h > 0);
}

/* ---- the panel -------------------------------------------------------- */

/* Kirigami.Units defaults on Plasma 6: smallSpacing 4, iconSizes.smallMedium 22. */
export const SMALL_SPACING = 4;
export const ICON_SMALL_MEDIUM = 22;

/* Panel.qml: every side's padding is min(thick fixedMargin + smallSpacing,
   spacingAtMinSize), where spacingAtMinSize = floor(max(1, thickness - 22) / 2). */
export function panelPadding(thickFixedMargin: Edges, thickness: number): Edges & { atMin: number } {
  const atMin = Math.floor(Math.max(1, thickness - ICON_SMALL_MEDIUM) / 2);
  const p = (m: number) => Math.round(Math.min(m + SMALL_SPACING, atMin));
  return { top: p(thickFixedMargin.top), bottom: p(thickFixedMargin.bottom), left: p(thickFixedMargin.left), right: p(thickFixedMargin.right), atMin };
}
