import { describe, expect, test } from 'vitest';
import type { Box } from './svg';
import {
  ALL_BORDERS, frameGeometry, frameLayout, panelPadding, resolvePrefix, shadowGeometry, shadowLayout,
  type Borders, type ElementSource
} from './frame';

/* An ElementSource from a plain id -> rect table. */
const src = (t: Record<string, Box>): ElementSource => ({ has: (id) => id in t, box: (id) => t[id] ?? null });
const r = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/* A 9-slice with 6px sides, 20px centre, like widgets/tooltip. */
function nine(prefix = '', b = 6, c = 20): Record<string, Box> {
  const p = (n: string) => prefix + n;
  return {
    [p('topleft')]: r(0, 0, b, b), [p('top')]: r(b, 0, c, b), [p('topright')]: r(b + c, 0, b, b),
    [p('left')]: r(0, b, b, c), [p('center')]: r(b, b, c, c), [p('right')]: r(b + c, b, b, c),
    [p('bottomleft')]: r(0, b + c, b, b), [p('bottom')]: r(b, b + c, c, b), [p('bottomright')]: r(b + c, b + c, b, b)
  };
}

describe('resolvePrefix (FrameSvgItem::applyPrefixes + setElementPrefix)', () => {
  const s = src({ ...nine(), ...nine('normal-') });
  test('first prefix that has a centre wins', () => expect(resolvePrefix(s, ['south-normal', 'normal'])).toBe('normal-'));
  test('none exists: the last is set, and a missing prefix becomes ""', () => expect(resolvePrefix(s, ['south-x', 'x'])).toBe(''));
  test('empty prefix', () => expect(resolvePrefix(s, '')).toBe(''));
});

describe('frameGeometry (FrameSvgPrivate::updateSizes)', () => {
  test('borders come from the part sizes, rounded like Svg::elementSize', () => {
    const g = frameGeometry(src({ ...nine('', 5.6) }), '');
    expect(g.border).toEqual({ top: 6, bottom: 6, left: 6, right: 6 });
  });
  test('hint-*-margin wins over the border; missing hint falls back', () => {
    const g = frameGeometry(src({ ...nine(), 'hint-top-margin': r(0, 0, 3, 4), 'hint-left-margin': r(0, 0, 2.5, 1) }), '');
    expect(g.margin).toEqual({ top: 4, bottom: 6, left: 2.5, right: 6 });
    expect(g.marginFrom).toEqual({ top: 'hint', bottom: 'border', left: 'hint', right: 'border' });
  });
  test('a zero-area hint is invalid and ignored', () => {
    const g = frameGeometry(src({ ...nine(), 'hint-top-margin': r(0, 0, 0, 4) }), '');
    expect(g.margin.top).toBe(6);
  });
  test('disabled borders have zero border and margin but keep the fixed values', () => {
    const b: Borders = { top: true, bottom: false, left: false, right: false };
    const g = frameGeometry(src(nine()), '', b);
    expect(g.border).toEqual({ top: 6, bottom: 0, left: 0, right: 0 });
    expect(g.margin).toEqual({ top: 6, bottom: 0, left: 0, right: 0 });
    expect(g.fixedMargin.bottom).toBe(6);
  });
  test('insets read from hint-*-inset, else -1', () => {
    const g = frameGeometry(src({ ...nine(), 'hint-top-inset': r(0, 0, 1, 2) }), '');
    expect(g.inset).toEqual({ top: 2, bottom: -1, left: -1, right: -1 });
  });
  test('hints apply globally or with the prefix', () => {
    const g = frameGeometry(src({ ...nine('p-'), 'hint-tile-center': r(0, 0, 1, 1), 'p-hint-stretch-borders': r(0, 0, 1, 1) }), 'p-');
    expect([g.tileCenter, g.stretchBorders, g.composeOverBorder]).toEqual([true, true, false]);
  });
  test('compose-over-border needs the prefixed hint and mask-<prefix>center', () => {
    const t = { ...nine('p-'), 'p-hint-compose-over-border': r(0, 0, 1, 1) };
    expect(frameGeometry(src(t), 'p-').composeOverBorder).toBe(false);
    expect(frameGeometry(src({ ...t, 'mask-p-center': r(0, 0, 1, 1) }), 'p-').composeOverBorder).toBe(true);
  });
});

describe('frameLayout (generateFrameBackground)', () => {
  const g = frameGeometry(src(nine()), '');
  for (const W of [40, 97, 300]) {
    test(`all nine parts tile the frame exactly at width ${W}`, () => {
      const l = frameLayout(g, W, 30);
      expect(l.cells.map((c) => c.part).sort()).toEqual(['bottom', 'bottomleft', 'bottomright', 'center', 'left', 'right', 'top', 'topleft', 'topright']);
      const area = l.cells.reduce((a, c) => a + c.w * c.h, 0);
      expect(area).toBe(W * 30);
      expect(l.content).toEqual({ x: 6, y: 6, w: W - 12, h: 18 });
      const top = l.cells.find((c) => c.part === 'top')!;
      expect([top.x, top.w, top.mode, top.tile]).toEqual([6, W - 12, 'tile', { w: 20, h: 6 }]);
    });
  }
  test('contents rect is the frame minus the margins', () => {
    const h = frameGeometry(src({ ...nine(), 'hint-top-margin': r(0, 0, 1, 2) }), '');
    expect(frameLayout(h, 100, 40).contents).toEqual({ x: 6, y: 2, w: 88, h: 32 });
  });
  test('a top-only panel: no corners, no side cells, content from x 0', () => {
    const b: Borders = { top: true, bottom: false, left: false, right: false };
    const l = frameLayout(frameGeometry(src(nine()), '', b), 200, 32);
    expect(l.cells.map((c) => c.part).sort()).toEqual(['center', 'top']);
    expect(l.content).toEqual({ x: 0, y: 6, w: 200, h: 26 });
    expect(l.cells.find((c) => c.part === 'top')).toMatchObject({ x: 0, y: 0, w: 200, h: 6 });
  });
  test('stretch-borders stretches sides; tile-center tiles the centre', () => {
    const s = frameGeometry(src({ ...nine(), 'hint-stretch-borders': r(0, 0, 1, 1), 'hint-tile-center': r(0, 0, 1, 1) }), '');
    const l = frameLayout(s, 90, 50);
    expect(l.cells.find((c) => c.part === 'left')!.mode).toBe('stretch');
    expect(l.cells.find((c) => c.part === 'center')).toMatchObject({ mode: 'tile', tile: { w: 20, h: 20 } });
  });
  test('no centre cell when the frame is smaller than its borders', () => {
    expect(frameLayout(g, 10, 10).cells.some((c) => c.part === 'center')).toBe(false);
  });
});

describe('shadowGeometry (DialogShadows::Private::updateShadow)', () => {
  const tiles = { 'shadow-left': r(0, 0, 5, 5), 'shadow-top': r(0, 0, 5, 5), 'shadow-right': r(0, 0, 5, 5), 'shadow-bottom': r(0, 0, 5, 5), 'shadow-topleft': r(0, 0, 5, 5), 'shadow-topright': r(0, 0, 5, 5), 'shadow-bottomleft': r(0, 0, 5, 5), 'shadow-bottomright': r(0, 0, 5, 5) };
  test('padding from the rounded hint size', () => {
    const g = shadowGeometry(src({ ...tiles, 'shadow-hint-right-margin': r(0, 0, 4.6, 1), 'shadow-hint-bottom-margin': r(0, 0, 1, 5) }));
    expect(g.padding).toEqual({ top: 0, bottom: 5, left: 0, right: 5 });
  });
  test('a missing hint is QSize(0,0), which isValid(): padding 0, never the tile size', () => {
    const g = shadowGeometry(src(tiles));
    expect(g.padding).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
    expect(g.paddingFrom.top).toBe('missing');
  });
  test('disabled borders get no padding', () => {
    const g = shadowGeometry(src({ ...tiles, 'shadow-hint-bottom-margin': r(0, 0, 1, 5) }), { ...ALL_BORDERS, bottom: false });
    expect(g.padding.bottom).toBe(0);
    expect(g.paddingFrom.bottom).toBe('disabled');
  });
  test('no shadow-left: shadows disabled', () => expect(shadowLayout(shadowGeometry(src({})), 50, 50)).toEqual([]));
  test('tiles ring the window grown by the padding', () => {
    const g = shadowGeometry(src({ ...tiles, 'shadow-hint-right-margin': r(0, 0, 5, 1), 'shadow-hint-bottom-margin': r(0, 0, 1, 5) }));
    const cells = shadowLayout(g, 100, 40);
    expect(cells.find((c) => c.tile === 'bottomright')).toMatchObject({ x: 100, y: 40, w: 5, h: 5 });
    expect(cells.find((c) => c.tile === 'right')).toMatchObject({ x: 100, y: 5, w: 5, h: 35 });
    expect(cells.find((c) => c.tile === 'topleft')).toMatchObject({ x: 0, y: 0 });
  });
});

describe('panelPadding (Panel.qml)', () => {
  const m8 = { top: 8, bottom: 8, left: 8, right: 8 };
  test.each([
    [24, 1], [32, 5], [44, 11], [64, 12]
  ])('thickness %i -> %i', (t, want) => {
    const p = panelPadding(m8, t);
    expect(p.top).toBe(want);
    expect(p.atMin).toBe(Math.floor(Math.max(1, t - 22) / 2));
  });
});
