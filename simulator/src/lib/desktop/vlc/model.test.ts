import { describe, expect, it } from 'vitest';
import { parseToolbar, stock, ours, findItem } from './model';

describe('parseToolbar', () => {
  it('decodes a plain button id with no option', () => {
    expect(parseToolbar('1')).toEqual([{ id: 1, option: 0, kind: 'button', label: 'Stop', shiny: false, big: false, flat: false }]);
  });

  it('decodes the WIDGET_SHINY bit (0x4) on the volume special widget', () => {
    const [item] = parseToolbar('35-4');
    expect(item).toMatchObject({ id: 35, option: 4, kind: 'special', label: 'Volume', shiny: true, big: false, flat: false });
  });

  it('decodes WIDGET_BIG (0x2) on the play button', () => {
    const [item] = parseToolbar('0-2');
    expect(item).toMatchObject({ id: 0, kind: 'button', big: true, shiny: false });
  });

  it('tells the two spacer pseudo-widgets apart (64 fixed, 65 expanding)', () => {
    expect(parseToolbar('64;65').map((i) => i.kind)).toEqual(['spacer', 'spacer-extend']);
  });

  it('strips the QSettings quoting around a value containing ";"', () => {
    expect(parseToolbar('"64;39"').map((i) => i.id)).toEqual([64, 39]);
  });

  it('returns [] for an absent key', () => {
    expect(parseToolbar(undefined)).toEqual([]);
  });

  it('falls back to a numbered label for an id this repo never uses', () => {
    expect(parseToolbar('99')[0].label).toBe('Special 99');
  });
});

describe('vlc lane models', () => {
  it('stock keeps the shiny flag on the seek slider (33) and volume (35); ours drops both', () => {
    expect(findItem(stock.inputToolbar, 33)?.shiny).toBe(true);
    expect(findItem(stock.mainToolbar2, 35)?.shiny).toBe(true);
    expect(findItem(stock.fscToolbar, 35)?.shiny).toBe(true);
    expect(findItem(ours.inputToolbar, 33)?.shiny).toBe(false);
    expect(findItem(ours.mainToolbar2, 35)?.shiny).toBe(false);
    expect(findItem(ours.fscToolbar, 35)?.shiny).toBe(false);
  });

  it('layout (ids, order) is unchanged between stock and ours', () => {
    const ids = (items: { id: number }[]) => items.map((i) => i.id);
    expect(ids(ours.mainToolbar1)).toEqual(ids(stock.mainToolbar1));
    expect(ids(ours.mainToolbar2)).toEqual(ids(stock.mainToolbar2));
    expect(ids(ours.advToolbar)).toEqual(ids(stock.advToolbar));
    expect(ids(ours.inputToolbar)).toEqual(ids(stock.inputToolbar));
    expect(ids(ours.fscToolbar)).toEqual(ids(stock.fscToolbar));
  });

  it('fullscreen controller opacity: stock 0.8, ours opaque', () => {
    expect(stock.fsOpacity).toBeCloseTo(0.8);
    expect(ours.fsOpacity).toBe(1);
  });

  it('the four qt-slider-colours stops collapse to one accent colour in ours, but not in stock', () => {
    const hexes = ours.sliderStops.map((s) => s.join(','));
    expect(new Set(hexes).size).toBe(1);
    const stockHexes = stock.sliderStops.map((s) => s.join(','));
    expect(new Set(stockHexes).size).toBeGreaterThan(1);
  });
});
