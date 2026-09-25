import { describe, it, expect } from 'vitest';
import { contrast, PALETTE } from '../tokens';
import { parseReg, decodeAbgr, buildModel, ours, stock, pickOnAccentText } from './model';

describe('parseReg', () => {
  it('reads a dword under its [Section] header', () => {
    const reg = parseReg('[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\DWM]\n"AccentColor"=dword:ffa6c9a6\n');
    expect(reg.get('HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\DWM', 'AccentColor')).toBe('ffa6c9a6');
  });
  it('ignores comment lines and blank lines', () => {
    const reg = parseReg('; a comment\n\n[Section]\n"Key"=dword:00000001\n');
    expect(reg.get('Section', 'Key')).toBe('00000001');
  });
  it('keeps two same-named keys in different sections distinct', () => {
    const reg = parseReg('[A]\n"AccentColorMenu"=dword:ffa6c9a6\n[B]\n"AccentColorMenu"=dword:ffa6c9a6\n');
    expect(reg.get('A', 'AccentColorMenu')).toBe('ffa6c9a6');
    expect(reg.get('B', 'AccentColorMenu')).toBe('ffa6c9a6');
  });
});

describe('decodeAbgr: 0xAABBGGRR -> #RRGGBB', () => {
  it("decodes the shipped file's own AccentColor to sage's accent token", () => {
    expect(decodeAbgr('ffa6c9a6')).toEqual({ a: 255, hex: '#A6C9A6' });
  });
  it('is undefined for a missing key', () => {
    expect(decodeAbgr(undefined)).toBeUndefined();
  });
  it('separates R, G, B correctly for a non-palindromic colour (Windows blue 0078D4 as 0xff d4 78 00)', () => {
    /* R=00 G=78 B=D4 -> stored little-endian-with-alpha as AA BB GG RR = ff d4 78 00 */
    expect(decodeAbgr('ffd47800')).toEqual({ a: 255, hex: '#0078D4' });
  });
});

describe('buildModel reads every key the shipped .reg sets', () => {
  it('AccentColor / ColorizationColor / ColorizationAfterglow all decode to sage accent', () => {
    expect(ours.accentColor?.hex).toBe('#A6C9A6');
    expect(ours.colorizationColor?.hex).toBe('#A6C9A6');
    expect(ours.colorizationAfterglow?.hex).toBe('#A6C9A6');
  });
  it('matches tokens.ts PALETTE.accent exactly (sage is the default variant)', () => {
    expect(ours.accentColor?.hex).toBe(PALETTE.accent);
  });
  it('ColorizationColor carries a non-opaque alpha (0xC4)', () => {
    expect(ours.colorizationColor?.a).toBe(0xc4);
  });
  it('balance/flag DWORDs decode as plain integers/booleans', () => {
    expect(ours.colorizationColorBalance).toBe(0x59);
    expect(ours.colorizationAfterglowBalance).toBe(0x0a);
    expect(ours.colorizationBlurBalance).toBe(1);
    expect(ours.enableWindowColorization).toBe(true);
  });
  it('dark mode + ColorPrevalence are both on, matching the shipped .reg', () => {
    expect(ours.appsUseLightTheme).toBe(false);
    expect(ours.systemUsesLightTheme).toBe(false);
    expect(ours.colorPrevalence).toBe(true);
  });
  it('AutoColorization is turned off (manual accent wins over wallpaper-derived colour)', () => {
    expect(ours.autoColorization).toBe(false);
  });
  it('both *ColorMenu keys (DWM + Explorer\\Accent) resolve to the same accent', () => {
    expect(ours.accentColorMenuDwm?.hex).toBe('#A6C9A6');
    expect(ours.accentColorMenuExplorer?.hex).toBe('#A6C9A6');
    expect(ours.startColorMenu?.hex).toBe('#A6C9A6');
  });
});

describe('stock lane never invents an undocumented default', () => {
  it('asserts only the cited fields', () => {
    expect(stock.accentColor?.hex).toBe('#0078D4');
    expect(stock.colorPrevalence).toBe(false);
    expect(stock.autoColorization).toBe(true);
  });
  it('leaves ColorizationColor/Afterglow/balance unset (DWM computes them at runtime, not documented as a static default)', () => {
    expect(stock.colorizationColor).toBeUndefined();
    expect(stock.colorizationColorBalance).toBeUndefined();
  });
});

describe('pickOnAccentText: light fill gets the dark token, not a bare #000000/#FFFFFF flip', () => {
  it("sage's accent is light -- picks PALETTE.base, clearing 4.5:1", () => {
    const fg = pickOnAccentText(PALETTE.accent);
    expect(fg).toBe(PALETTE.base);
    expect(contrast(fg, PALETTE.accent)).toBeGreaterThanOrEqual(4.5);
  });
  it('a hypothetical dark fill would pick white instead', () => {
    expect(pickOnAccentText('#101010')).toBe('#FFFFFF');
  });
});
