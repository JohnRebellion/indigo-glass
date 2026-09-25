// @vitest-environment jsdom
/* The model against the real files: KSvg lookup, namedColor, and the design
   contract of the shipped SVGs (no translucency, gradient or blur in any part
   Plasma paints). */
import { describe, expect, test } from 'vitest';
import { ours, stock, SAGE, ROOT_FILES, VARIANT_FILES, variantIdentical, audit, topPaint, widgetPrefix, svgCoverage, mix } from './model';
import { roles, contrast } from './index';
import { PALETTE, contrast as ratio } from '../tokens';
import { panelPadding } from './frame';

describe('KSvg lookup', () => {
  test('ours renders the root files (selector {})', () => {
    expect(ours.resolve('dialogs/background')).toEqual({ set: 'SageInk', path: 'dialogs/background' });
  });
  test('ours falls back to the default set for widgets/tasks', () => {
    expect(ours.resolve('widgets/tasks')).toEqual({ set: 'default', path: 'widgets/tasks' });
  });
  test('stock prefers translucent/, then the root, then the explicit solid/ path', () => {
    expect(stock.resolve('widgets/tooltip')).toEqual({ set: 'default', path: 'translucent/widgets/tooltip' });
    expect(stock.resolve('widgets/scrollbar')).toEqual({ set: 'default', path: 'widgets/scrollbar' });
    expect(stock.resolve('solid/widgets/tooltip')).toEqual({ set: 'default', path: 'solid/widgets/tooltip' });
  });
  test('every shipped variant copy is byte-identical to its root file', () => {
    expect(VARIANT_FILES.filter((p) => !variantIdentical(p))).toEqual([]);
  });
});

describe('namedColor', () => {
  test('Background is the Window set, whatever the colorSet', () => {
    expect(ours.named('Tooltip', 'Background')).toBe(ours.scheme('Window', 'BackgroundNormal'));
  });
  test('group roles use their own set; HighlightedText is Selection', () => {
    expect(ours.named('Window', 'ButtonHover')).toBe(ours.scheme('Button', 'DecorationHover'));
    expect(ours.named('Window', 'ViewHighlightedText')).toBe(ours.scheme('Selection', 'ForegroundNormal'));
  });
  test('Frame mixes the current set by frameContrast', () => {
    expect(ours.named('Window', 'Frame')).toBe(mix(ours.scheme('Window', 'BackgroundNormal'), ours.scheme('Window', 'ForegroundNormal'), ours.frameContrast));
  });
  test('a key missing from breeze-dark falls back to the Window set (Header) or the compiled-in default', () => {
    expect(stock.scheme('Header', 'DecorationFocus')).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('shipped SVGs honour the ink contract', () => {
  const rows = audit(SAGE.files, ROOT_FILES);
  test('no translucent, gradient or blurred paint in any live part', () => {
    expect(rows.filter((r) => r.live).map((r) => `${r.file}#${r.el || r.part}: ${r.kind} ${r.detail}`)).toEqual([]);
  });
  test('widgets/background has no blurred prefix, so applets never get the wallpaper blur', () => {
    expect(widgetPrefix(ours)).toBe('');
  });
  test('the stock default does ship the blurred prefix (what the fix removed)', () => {
    expect(widgetPrefix(stock)).toBe('blurred');
  });
  test('popup and tooltip edges are border_strong on three enabled sides', () => {
    expect(topPaint(ours, 'dialogs/background', 'left')).toBe(PALETTE.border_strong);
    expect(topPaint(ours, 'widgets/tooltip', 'bottom', 'Tooltip')).toBe(PALETTE.border_strong);
  });
});

describe('frames from the shipped files', () => {
  test('panel: top border only, thick margins give the Panel.qml padding', () => {
    const f = ours.frame('widgets/panel-background', ['south', ''], { top: true, bottom: false, left: false, right: false })!;
    expect(f.geom.border.top).toBeGreaterThan(0);
    expect(Object.keys(f.tiles).sort()).toEqual(['center', 'top']);
    const thick = ours.frame('widgets/panel-background', 'thick')!;
    expect(thick.geom.prefix).toBe('thick-');
    expect(panelPadding(thick.geom.fixedMargin, 32).top).toBe(5);
  });
  test('Kickoff without a bottom border paints no bottom row', () => {
    const f = ours.frame('dialogs/background', '', { top: true, bottom: false, left: true, right: true })!;
    expect(Object.keys(f.tiles).filter((k) => k.startsWith('bottom'))).toEqual([]);
  });
  test('viewitem prefixes all resolve', () => {
    for (const p of ['normal', 'hover', 'selected', 'selected+hover']) expect(ours.frame('widgets/viewitem', p)!.geom.prefix).toBe(`${p}-`);
  });
});

describe('page checks', () => {
  test('every role bound to a token equals it', () => {
    expect(roles.filter((r) => r.token && r.ours.toUpperCase() !== PALETTE[r.token]).map((r) => `${r.role}: ${r.ours} want ${PALETTE[r.token!]}`)).toEqual([]);
  });
  test('floors are 4.5 (text) or 3 (large text, rings, edges)', () => {
    expect(contrast.every((p) => p.min === 4.5 || p.min === 3)).toBe(true);
  });
  test('every declared pair meets its floor', () => {
    expect(contrast.filter((p) => ratio(p.fg.slice(0, 7), p.bg.slice(0, 7)) < p.min).map((p) => p.name)).toEqual([]);
  });
  test('svg coverage docs list every root file plus the variant table', () => {
    const c = svgCoverage(ours);
    expect(c.docs.map((d) => d.label)).toEqual([...ROOT_FILES, 'variant copies']);
  });
});
