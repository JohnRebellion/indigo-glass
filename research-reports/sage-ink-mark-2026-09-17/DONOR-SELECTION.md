# Stage 2 — donor selection

## The discriminating constraint

Every candidate must survive quantisation to a 30×15 half-block grid where a
45°-axis edge stairsteps and a circle is ~10 px across (measured directly,
`REPORT.md`). That single fact eliminates entire design families before
aesthetics enter the conversation:

- **Any mark whose silhouette is majority-diagonal-edge** (a lens, a diamond,
  a chevron with a large open span) — dies. Measured: `L-leaf` (vesica) went
  from a clean vector to a diagonal slab.
- **Any mark relying on a thin positive stroke** (< 3 raster px) — dies below
  that width. Rules out line-art botanical marks (a stem, a spray of leaves).
- **Any mark whose identity depends on a counter < 4 px across** — the counter
  closes. Rules out letterform marks and enclosed-ring marks (`F-bite` failed
  exactly this way).

What survives: **a shape whose mass is dominated by convex arc, with area
concentrated in the interior rather than the edge.** A circle-derived silhouette
(disc, drop, capsule) is the only family that clears all three cuts.

## Donor: the tapered ink drop (teardrop / seed silhouette)

Lineage — this is not a novel shape, it is the standard "ink drop" glyph family
used across brand marks and icon sets (Adobe's ink-drop mnemonics, seed/leaf
hybrid marks in eco-branding) precisely because a circle-plus-taper reads at
tiny sizes in *every* medium: favicon, app icon, embroidery, and — the case
that matters here — half-block terminal art.

**Rejected neighbours** (the priors an image model will default to if not
steered away from):
- **Water droplet realism** — glossy highlight, refraction, translucency.
  Violates M1 (flat ink, opaque, two tones only). Must describe explicitly as
  matte/flat, not "glossy droplet."
- **Leaf illustration realism** — serrated edge, visible stem, veins fanning
  in multiple directions. Violates G1/G5 (fine branching detail can't survive
  the raster) and reads as botanical illustration, not a brand mark.
- **Generic "eco" leaf-in-circle icons** — the leaf sits *inside* a circle as a
  separate element. Rejected because two separate shapes double the edge count
  the raster has to preserve; the working version fuses them into one
  silhouette (drop body + single straight vein), which is what survived
  quantisation in the prior pass.

## What this donor is FOR here

Not the shipping asset. The shipping asset is already a hand-authored flat SVG
(`config/fastfetch/sage-ink-mark.txt`, done 2026-09-17, same day). This pipeline
run generates **concept art** — a more fully realised visual treatment of the
same drop-plus-vein silhouette — to sanity-check the form reads as intended
outside the terminal (README hero, favicon, elsewhere the flat asset might be
reused) before it's treated as final. Any concept render gets re-flattened to
two tones by hand; nothing generated is used as source pixels.
