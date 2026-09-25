import { describe, it, expect } from 'vitest';
import { contrast } from '../tokens';
import { ours, stock, attr, hex, parseIcls } from './model';

describe('parseIcls', () => {
  it('reads the scheme name and parent_scheme', () => {
    expect(ours.name).toBe('Lime Glass');
    expect(ours.parent).toBe('Darcula');
    expect(stock.name).toBe('Darcula');
  });
  it('reads a flat <colors> option', () => {
    expect(ours.colors.CONSOLE_BACKGROUND_KEY).toBe('07080A');
  });
  it('reads a nested <attributes> FOREGROUND', () => {
    expect(ours.attrs.DEFAULT_KEYWORD.fg).toBe('C0E3C0');
  });
  it('reads FONT_TYPE as bold/italic flags', () => {
    expect(ours.attrs.DEFAULT_KEYWORD.bold).toBe(true);
    expect(ours.attrs.DEFAULT_LINE_COMMENT.italic).toBe(true);
  });
  it('reads EFFECT_COLOR for underline-only attributes', () => {
    expect(ours.attrs.WARNING_ATTRIBUTES.effectColor).toBe('FBBF24');
  });
});

describe('attr() falls back to DEFAULT_IDENTIFIER for an empty <value/>', () => {
  it("stock Darcula's DEFAULT_CLASS_NAME has no FOREGROUND of its own", () => {
    expect(stock.attrs.DEFAULT_CLASS_NAME?.fg).toBeUndefined();
  });
  it('attr() resolves it to DEFAULT_IDENTIFIER instead', () => {
    expect(attr(stock, 'DEFAULT_CLASS_NAME').fg).toBe(stock.attrs.DEFAULT_IDENTIFIER.fg);
  });
});

describe('hex()', () => {
  it('adds the # and upper-cases', () => {
    expect(hex('a9b7c6')).toBe('#A9B7C6');
  });
  it('falls back when the value is empty', () => {
    expect(hex('', '#111111')).toBe('#111111');
    expect(hex(undefined)).toBe('#000000');
  });
});

/* 2026-09-25 findings: the shipped .icls declared itself "Lime Glass" but
   painted SAGE's accent/accent_hi/accent_alt (the project's own default
   variant) almost everywhere, with a few stray hexes that matched neither
   variant's current generated palette at all. Fixed to sage throughout. */
describe('2026-09-25 fixes: drifted-off-every-token hexes now read sage', () => {
  it('text_muted (was 6B7280 for line comments/line numbers, 9CA3AF for doc comments)', () => {
    expect(hex(ours.colors.LINE_NUMBERS_COLOR)).toBe('#7F8695');
    expect(hex(ours.attrs.DEFAULT_LINE_COMMENT.fg)).toBe('#7F8695');
    expect(hex(ours.attrs.DEFAULT_DOC_COMMENT.fg)).toBe('#7F8695');
  });
  it('positive (was 71F79F, lime\'s positive, not sage\'s 3FFABB)', () => {
    expect(hex(ours.attrs.DEFAULT_STRING.fg)).toBe('#3FFABB');
    expect(hex(ours.attrs.GUTTER_VCS_NEW.fg)).toBe('#3FFABB');
  });
  it('negative (was ED254E, not sage\'s F42E53)', () => {
    expect(hex(ours.attrs.ERRORS_ATTRIBUTES.fg)).toBe('#F42E53');
    expect(hex(ours.attrs.BAD_CHARACTER.effectColor)).toBe('#F42E53');
    expect(hex(ours.attrs.GUTTER_VCS_REMOVED.fg)).toBe('#F42E53');
  });
  it('accent/accent_hi/accent_alt already matched sage and are unchanged', () => {
    expect(hex(ours.colors.SELECTION_BACKGROUND)).toBe('#A6C9A6');
    expect(hex(ours.colors.CARET_COLOR)).toBe('#C0E3C0');
    expect(hex(ours.attrs.DEFAULT_CLASS_NAME.fg)).toBe('#89A889');
  });
});

describe('2026-09-25 fix: SELECTION_FOREGROUND contrast', () => {
  const fill = hex(ours.colors.SELECTION_BACKGROUND);
  it('is now base, not the old FFFFFF', () => {
    expect(hex(ours.colors.SELECTION_FOREGROUND)).toBe('#07080A');
  });
  it('the old FFFFFF really did fail the 4.5:1 floor on this light accent fill', () => {
    expect(contrast('#FFFFFF', fill)).toBeLessThan(4.5);
  });
  it('the fixed value clears the floor by a wide margin', () => {
    expect(contrast(hex(ours.colors.SELECTION_FOREGROUND), fill)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('2026-09-25 fix: attr() no longer drops an effectColor-only attribute', () => {
  it('WARNING_ATTRIBUTES sets EFFECT_COLOR but no FOREGROUND/BACKGROUND', () => {
    expect(ours.attrs.WARNING_ATTRIBUTES.fg).toBeUndefined();
    expect(ours.attrs.WARNING_ATTRIBUTES.bg).toBeUndefined();
  });
  it('attr() still returns it (not the DEFAULT_IDENTIFIER fallback)', () => {
    expect(attr(ours, 'WARNING_ATTRIBUTES').effectColor).toBe('FBBF24');
  });
});

describe('contrast pairs the page declares', () => {
  const bg = hex(ours.colors.CONSOLE_BACKGROUND_KEY);
  it('every foreground role clears 4.5:1 on the editor background', () => {
    for (const key of ['DEFAULT_IDENTIFIER', 'DEFAULT_KEYWORD', 'DEFAULT_STRING', 'DEFAULT_LINE_COMMENT', 'DEFAULT_NUMBER', 'DEFAULT_FUNCTION_DECLARATION', 'ERRORS_ATTRIBUTES'] as const) {
      const fg = hex(attr(ours, key).fg);
      expect(contrast(fg, bg), key).toBeGreaterThanOrEqual(4.5);
    }
  });
});
