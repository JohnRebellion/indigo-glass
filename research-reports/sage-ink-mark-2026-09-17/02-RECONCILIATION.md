# Stage 3 — reconciliation

Only Groq (`big`) ran here — GPT/Gemini web-chat legs go out with the Stage 4
prompts below, since those models are also where the actual render happens.
If either flags a problem before generating, fold its correction in before
using the render.

## Corrections to my own brief

- **"Flat-ink concept image" was ambiguous on tone count.** Groq read it as
  possibly allowing unlimited shading. Ruling: cap at **three solid tones
  max** (body, hard shadow, one optional inner accent), and the accent must
  be droppable — flattening to two tones for the terminal asset must not lose
  silhouette information, only the accent line.

## Settled

- Silhouette is locked: circle body → 45° taper → rounded tip, one straight
  45°-axis vein as the only internal division. No redesign in this pass —
  this run is about render treatment, not shape exploration (that already
  happened in `REPORT.md`).
- Viewing angle: orthographic, straight-on. Any perspective tilt introduces
  angles the raster can't hold.
- Shadow: one hard offset for the whole silhouette including the vein cut —
  not a separate shadow per element (would add a third tonal region).

## New idea worth keeping

Groq's "step-elevation" framing — treat the tip/vein as one discrete step
higher than the body, same colour, optionally rimmed in the shadow tone —
gives a dimensionality cue that stays flat-ink (no gradient) and matches how
the *real* shipped shadow token behaves (`[shadow] ink` is a flat colour
block, not a gradient). Using it in the generation prompt below.

## Named model-prior traps (going straight into the negative constraints)

1. "Ink drop" → glossy/translucent water droplet. Counter: state matte, opaque, flat colour explicitly, every prompt.
2. "Leaf vein" → full leaf outline with a stem and branching veins. Counter: "single straight line, no leaf outline, no stem, no branching."
3. "Sage" → herb bundle or a green gradient. Counter: name the exact two hex values, forbid gradient explicitly.
4. Taper drifting to 30°/60° (a very common real teardrop angle). Counter: state "exactly 45 degrees" and pair with the orthogonal/45°-only rule.
5. Soft/blurred drop shadow (default for "depth"). Counter: "hard-edged, zero blur, 1-pixel offset, opaque."

## Resolved values for Stage 4

- Body `#C0E3C0`, shadow `#89A889`, optional inner accent `#5A735A` (droppable), background `#07080A`.
- Geometry: circle radius ~74 units of a 240-unit canvas, tip radius ~16, taper axis 45°, vein along the same axis, inset ~55% from tip.
- Format: square canvas, orthographic, no perspective.
