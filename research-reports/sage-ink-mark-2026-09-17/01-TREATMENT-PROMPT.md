# Design treatment — Sage Ink brand mark

Do NOT generate an image. Return a markdown design treatment only.

## What this is

A brand mark for a Linux desktop design system, "Sage Ink". Its primary shipped
form is 30x15 half-block ASCII in a terminal fetch tool. This request is for a
richer concept render (README hero, favicon) of the SAME silhouette — not a
different logo — to check the form before it is manually flattened back to two
tones for the terminal asset.

## Hard constraints (measured, not aesthetic preference)

- Edges: horizontal, vertical, 45 degrees, or circular arcs ONLY. No 30/60 degree angles.
- No sharp corners. Every terminal and join rounded.
- Exactly two flat tones in the terminal version: body #C0E3C0, hard 1px
  down-right offset shadow #89A889, on near-black #07080A. No gradient, no
  blur, no translucency, no third tone. The concept render may use more
  tonal range than the terminal asset, but the FORM must stay flat-ink:
  opaque, neobrutalist, colour-as-elevation — not glossy, not glassy, not lit
  with soft highlights.
- Silhouette: a tapered ink drop (circle body, 45-degree taper to a rounded
  tip) with ONE straight diagonal vein cut through it as negative space,
  positioned along the same 45-degree axis as the taper. The vein reads as a
  leaf's midrib; the drop reads as ink. This exact silhouette already passed
  quantisation testing at 30x15 half-blocks — do not propose a different base
  shape.

## Negative constraints

- Not a glossy/realistic water droplet (violates flat-ink material).
- Not a botanical illustration with serrations, a visible stem, or branching veins.
- Not a leaf-in-circle composite (two separate shapes, not one fused silhouette).
- Not the Nobara distro logo.
- Not a generic hamburger/layers stack.

## The hardest problem

The mark must read as "ink" (opaque, deliberate, mark-making) AND "sage"
(botanical, calm) using ONE fused silhouette, because two separate shapes
double the edge count and fail the raster target. My proposed solution: drop
silhouette carries "ink"; a single straight vein carries "sage" as a botanical
reference without needing a literal leaf outline.

Give me:
1. A ruling on my proposed solution above.
2. How you would light/render this as a flat-ink concept image: viewing angle,
   background treatment, whether/how to suggest dimensionality (hard offset
   shadow, not soft) without breaking the "opaque flat ink" material rule.
3. Any risk you see in an image model rendering "ink drop" or "leaf vein" that
   would fight this brief (its trained priors for those words).

Be opinionated. If any part of this brief is a mistake, say so and explain.
