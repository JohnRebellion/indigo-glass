import { describe, it, expect } from 'vitest';
import { oklchToHex, checkAnsi, ANSI_SLOTS, type AnsiSlot } from './ansi';

describe('oklchToHex', () => {
  /* Expected values are tokens/codegen.py's own oklch_to_hex() run on the
   * exact [variants.sage.ansi] triples (tokens/indigo-glass.tokens.toml),
   * via `python3 -c "...cg.oklch_to_hex(L,C,H)..."` — ground truth is the
   * generator this port stands in for, not a hand re-derivation. */
  it('matches codegen.py oklch_to_hex for every sage ANSI slot', () => {
    const cases: [[number, number, number], string][] = [
      [[0.34, 0.012, 264.0], '#35383E'],
      [[0.63, 0.2279, 17.6], '#F42E53'],
      [[0.8792, 0.1706, 165.0], '#3FFABB'],
      [[0.8369, 0.1644, 84.43], '#FBBF24'],
      [[0.74, 0.09, 255.0], '#84AEE3'],
      [[0.74, 0.09, 330.0], '#CC96C6'],
      [[0.8, 0.09, 200.0], '#71D0D5'],
      [[0.87, 0.006, 264.0], '#D2D4D8'],
      [[0.62, 0.0234, 264.36], '#7F8695'],
      [[0.7, 0.2, 17.6], '#FF5D6F'],
      [[0.93, 0.13, 165.0], '#8BFFD2'],
      [[0.9, 0.15, 84.43], '#FFD55A'],
      [[0.83, 0.08, 255.0], '#A5CAFB'],
      [[0.83, 0.08, 330.0], '#E6B5E0'],
      [[0.88, 0.08, 200.0], '#96E8EC'],
      [[0.9791, 0.0, 89.88], '#F8F8F8']
    ];
    for (const [lch, hex] of cases) expect(oklchToHex(lch)).toBe(hex);
  });

  it('clips out-of-gamut channels instead of wrapping', () => {
    const hex = oklchToHex([0.9, 0.4, 145]);
    expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('checkAnsi', () => {
  const filler: [number, number, number] = [0.5, 0.05, 0];
  const tokens = Object.fromEntries(ANSI_SLOTS.map((s) => [s, filler])) as Record<AnsiSlot, [number, number, number]>;
  tokens.black = [0.34, 0.012, 264.0];
  const oursFor = (blackHex: string) =>
    Object.fromEntries(ANSI_SLOTS.map((s) => [s, s === 'black' ? blackHex : oklchToHex(filler)])) as Record<AnsiSlot, string>;

  it('flags a slot whose shipped hex does not match the token', () => {
    const row = checkAnsi(tokens, oursFor('#0D0D10')).find((r) => r.slot === 'black')!;
    expect(row).toEqual({ slot: 'black', ours: '#0D0D10', expected: '#35383E', ok: false });
  });
  it('passes when the shipped hex matches exactly (case-insensitive)', () => {
    const row = checkAnsi(tokens, oursFor('#35383e')).find((r) => r.slot === 'black')!;
    expect(row.ok).toBe(true);
  });
});
