# Sage Ink brand mark — constraint set (Stage 1)

Not web-researched: every binding number here comes from this repo's own token
source or from how a terminal actually renders a glyph cell. Sources named per row.

## Hard geometry constraints (from the ASCII target, not taste)

| # | Constraint | Where it comes from |
|---|---|---|
| G1 | Edges may only be horizontal, vertical, 45°, or circular arcs | user brief; a 30°/60° edge lands between half-block rows and stairsteps |
| G2 | No sharp corners — every join and terminal is rounded | user brief |
| G3 | Terminal cell aspect is 1:2 (w:h); a half-block `▀`/`▄` pixel is square | `fastfetch` render, verified in this repo's logo work |
| G4 | Target raster is 30 px wide × 30 px tall = 30 cols × 15 char rows | matches the 16-line fastfetch module block |
| G5 | Minimum stroke ≥ 3 raster px (≈ 24 units on a 240 canvas) | thinner than 3 px breaks up under 0.45 coverage thresholding |
| G6 | Counters (holes) ≥ 4 raster px across | below that they close up when quantised |

## Material constraints (from `tokens/indigo-glass.tokens.toml`)

| # | Constraint | Token |
|---|---|---|
| M1 | Two flat tones only — no gradient, no blur, no translucency | `[meta] material_style = "flat_ink"` |
| M2 | Body `#C0E3C0`, hard offset shadow `#89A889` | `accent_hi`, `accent_alt` (sage) |
| M3 | Shadow is hard offset, zero blur, down-right | `[shadow] ink = "4px 4px 0 0"` → accent_alt at emit |
| M4 | Canvas is `#07080A` | `--ig-base` |

## Negative constraints — what it must not become

- Not the Nobara mark (rounded blob with an open counter) — that is what this replaces.
- Not a generic "layers"/hamburger stack — reads as a menu icon at 30 px.
- Not a leaf with drawn-out pointed tips — violates G2 and dissolves under G5.
- Not text or a letterform that needs more than 3 strokes — unreadable at 30 px.
