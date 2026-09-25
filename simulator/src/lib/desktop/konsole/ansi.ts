/* Foundation gap: PALETTE (tokens.ts) only carries the surface/accent/text
 * roles used by [palette] — it does not resolve [variants.<v>.ansi], because
 * nothing before this surface needed a terminal's 16-slot contract. TOKENS
 * (the raw json-tokens.json) does carry it, but only as OKLCH triples
 * (`TOKENS.variants.sage.ansi.blue === [0.74, 0.09, 255]`), never as hex —
 * json-tokens.json's `_derived.palettes` block, which pre-resolves hex, is
 * built from `[palette]` only and never visits `[variants.*.ansi]` either.
 * Role (surface.ts) can bind a role to a PALETTE token name or to nothing
 * (`token: null`); it has no way to say "must equal this computed value that
 * isn't in PALETTE". So every ANSI role here is declared `token: null` (shown,
 * not checked by e2e's role assertion) and this file does the real check
 * instead: reproduce codegen.py's oklch_to_hex exactly and compare.
 *
 * Report: PALETTE could be extended with an `ansi.<variant>.<slot>` branch
 * derived the same way `_derived.palettes` is, which would let this surface
 * use a real Role/token binding like every other surface. Proposed, not
 * applied — codegen.py is off-limits to this surface (see CLAUDE.md /
 * brief). tokens/codegen.py:1187 `ansi_palette()` already computes exactly
 * this map for the Konsole-flavoured layers that don't exist yet; it is
 * just never exposed to json-tokens.json in resolved hex form.
 *
 * The maths below is a line-for-line port of tokens/codegen.py's
 * `_oklab_to_linear_srgb` / `_oklch_to_linear_srgb` / `oklch_to_hex`
 * (codegen.py:99-123): OKLCH -> OKLab -> linear sRGB -> gamma-encoded sRGB,
 * gamut-clipped and rounded the same way, so it reproduces the exact hex
 * codegen would emit if it exposed this block. Two independent
 * implementations from the same public OKLab matrices reduces (does not
 * remove) the chance a transcription slipped past both.
 */

function srgbFromLinear(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ];
}

/* OKLCH triple, as stored in TOKENS.variants.<v>.ansi.<slot>, to #RRGGBB. */
export function oklchToHex([L, C, H]: [number, number, number]): string {
  const rad = (H * Math.PI) / 180;
  const [rl, gl, bl] = oklabToLinearSrgb(L, C * Math.cos(rad), C * Math.sin(rad));
  const byte = (lin: number) => Math.round(Math.min(1, Math.max(0, srgbFromLinear(lin))) * 255);
  return (
    '#' +
    [rl, gl, bl]
      .map((c) => byte(c).toString(16).padStart(2, '0'))
      .join('')
  ).toUpperCase();
}

export const ANSI_SLOTS = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'bright_black', 'bright_red', 'bright_green', 'bright_yellow', 'bright_blue', 'bright_magenta', 'bright_cyan', 'bright_white'
] as const;
export type AnsiSlot = (typeof ANSI_SLOTS)[number];

export type AnsiCheck = { slot: AnsiSlot; ours: string; expected: string; ok: boolean };

/* The equality check the Role/token mechanism cannot express (see header):
 * every ANSI slot's shipped hex against the token-file OKLCH, converted here. */
export function checkAnsi(ansiTokens: Record<string, [number, number, number]>, ours: Record<AnsiSlot, string>): AnsiCheck[] {
  return ANSI_SLOTS.map((slot) => {
    const expected = oklchToHex(ansiTokens[slot]);
    return { slot, ours: ours[slot], expected, ok: ours[slot].toUpperCase() === expected };
  });
}
