# Sage Ink brand mark — concept pass, 2026-09-17

Replaces the borrowed Nobara silhouette currently used by the fastfetch greeter.

## Pipeline deviation (stated up front)

`concept-image-pipeline` Gate 1 diverts this work away from image generation: a
brand mark is exact vector geometry, and generative models cannot hold precise
geometry. So Stages 1–3 ran as written (constraints → treatment → reconciliation)
and Stage 4 is hand-authored SVG instead of a diffusion render. Stage 5 inspection
was done by reading each render directly rather than via `gemini-see`, because the
failure modes here are geometric, and a relayed description is lossy about geometry.

Constraints: [CONSTRAINTS.md](CONSTRAINTS.md). Sources are this repo's tokens and
measured terminal behaviour, not the web.

## Stage 3 — cross-model treatment (Groq, `big`)

Asked for an opinionated ruling on four first-pass candidates. What it changed:

- **Killed my proposal to abandon the botanical half of the name.** Its argument:
  a pure ink mark leaves "Sage" unrepresented and the brand ambiguous. Accepted —
  the drop-with-vein carries both readings in one form.
- **Confirmed the drop failed on construction, not concept** — a circle unioned
  with a stub is a blob with a wart; a properly tapered hull is a drop.
- **Confirmed negative-space circles survive 30 px** where thin positive strokes do not.
- **Rejected its own preferred "ink capsule"** (rounded rect with a circular bite)
  after drawing it: at 30 px the bite closed up, failing constraint G6. Its risk
  assessment was right in principle and wrong about which shape survives.

## Stage 5 — inspection results

Every candidate was rendered at 480 px, read directly, then quantised to the real
target (30 × 30 px → 30 cols × 15 half-block rows) and read again.

| Candidate | Vector read | 30 px read | Verdict |
|---|---|---|---|
| `H-drop-big` | clean tapered drop | solid, silhouette intact | **PASS** |
| `H2-drop-vein` | drop + diagonal vein → reads leaf *and* ink | vein holds, ≥ 3 px | **PASS** |
| `A2-prompt` | rounded `>_` | crisp, 45° stairsteps read as intended | **PASS** — but generic |
| `L-leaf` | clean rounded vesica | degrades to a diagonal slab | **DRIFT** |
| `L2-leaf-vein` | leaf + vein | noisy, vein and edge fight | **FAIL** |
| `F-bite` | disc with circular bite | bite closes | **FAIL** (G6) |
| `B-drop`, `C-leaf`, `D-ess` (pass 1) | blob-with-wart / pill / reads "Z" | — | **FAIL** |

**The finding that matters:** a 45°-axis lens is mostly diagonal edge, and diagonal
edge is exactly what a half-block grid renders as a staircase. The drop survives
because its mass is convex arc with a broad body — most of its area is interior,
not edge. This is a property of the raster, not of the drawing, so no amount of
redrawing rescues the lens at 30 px.

## Files

- `renders/*.svg` — authored geometry (body + shadow layers as separate masks)
- `renders/contact-6.png` — the five finalists side by side
- `mk_svg*.py` — generators; `quant2.py` — the honest quantiser (mask coverage, not colour distance)

## Shipped, 2026-09-17

`H2-drop-vein` — the tapered ink drop with a leaf vein — is now the fastfetch
greeter mark, replacing the borrowed Nobara silhouette (removed, not archived:
it is the thing being replaced, and keeping it would ship another project's art).

- `config/fastfetch/sage-ink-mark.txt` — 30 cols × 15 rows (default)
- `config/fastfetch/sage-ink-mark-small.txt` — 24 cols × 12 rows
- `ship.py` regenerates both from the authored geometry: `python3 ship.py`

Two parameters were tuned against the raster rather than chosen by eye:

- **Shadow offset is exactly 1 raster pixel.** The first Nobara art used 12
  canvas units against a 30-px grid — 1.5 px — which quantised as a half-step
  staircase along every 45° edge.
- **Vein inset differs per size** (0.54 of the axis at 30 cols, 0.58 at 24).
  The vein's round cap lands mid-pixel at some grids, and a partially-covered
  cap reads as speckle on the silhouette edge. One value does not serve both
  sizes; a single compromise value was visibly worse at both.

## Superseded, 2026-09-17 (same day)

Shipping asset changed again: user asked for `gpt-01.png` (the Stage 4 GPT
render, FAIL on the 45°-only geometry rule per `03-INSPECTION.md`) used
directly, despite that rule and despite the earlier hand-authored SVG
already being live. Flagged the tradeoff once; user confirmed; proceeded.

- `ship-gpt.py` replaces `ship.py` as the generator. Traces the actual PNG
  instead of authored geometry: crops to content bbox, classifies every
  native pixel by nearest tone (sampled from the render — its exported
  colours sit a few RGB units off the spec hex), then box-downsamples each
  class's binary mask to the target grid for true area coverage.
- **First attempt classified after a Lanczos resize** (point-sample the
  already-blurred small image) and produced a flickering band of mixed
  body/shadow cells along the whole curve — the render's soft antialiased
  edge, unlike the hand-authored SVG's hard-edged mask, has no clean
  boundary for a single point sample to land on. Fixed by classifying at
  native resolution first, then area-averaging.
- **Second attempt used relative coverage** (higher of body-fraction vs
  shadow-fraction wins) and lost the shadow rim almost entirely — body/
  background antialiasing along the outer contour produces weak spurious
  shadow signal (~0.01-0.06 coverage) *inside* the body interior, and
  relative comparison let that noise out-vote the real shadow band wherever
  body coverage was near zero. Fixed with independent absolute floors
  (body ≥ 0.5, shadow ≥ 0.30 - checked in that order) instead of a contest
  between the two channels.
- **Consequence accepted**: the render's vein is too thin to hold a cell at
  this raster size and doesn't appear in the output. This asset carries
  "ink" only, not "ink + sage" as a drawn feature — noted in
  `config/fastfetch/config.jsonc` rather than silently dropped.
