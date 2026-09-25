# /components/ — one page per UI component, across every layer

`/components/<id>/` draws one component (button, menu, tooltip, text field,
list selection, scrollbar, checkbox, tab) in every theming layer that has it,
stock beside Sage Ink, then reads each paint back off the DOM and judges it.

| File | Role |
| :--- | :--- |
| `catalogue.ts` | the components, their slots, the documented contracts, the contrast pairs |
| `layer.ts` | `LayerDef`, the contract a layer fills in |
| `probe.ts` | `data-probe` grammar, reading computed colours, `judge()` |
| `registry.ts` | discovers `layers/*/index.ts` + `Specimen.svelte` by glob |
| `ComponentPage.svelte` | the page |
| `layers/<id>/` | one folder per layer |

## Adding a layer

1. `layers/<id>/index.ts` exports `layer: LayerDef`. Build both lanes from
   files imported `?raw` — the shipped file for `ours`, a frozen upstream
   file under `simulator/fixtures/stock/<layer>/` for `stock` (with a
   `README.md` naming its origin and version). Prefer the parsed models the
   `/desktop/` and `/sites/` pages already build (import them read-only) so
   the two pages cannot disagree about what a file says. Never transcribe a
   shipped value into the layer.
2. `layers/<id>/Specimen.svelte` takes `{ component, lane }` and draws the
   component in the layer's own idiom (its real class names / widget node
   names, so the real stylesheet applies). Mark each painting element with
   `data-probe` (grammar in `probe.ts`): `fill`, `label:color`,
   `edge:border`, `thumb:=#HEX` for a value from the model that CSS cannot
   report (an SVG tile). The first element in a lane naming a slot wins.
3. Every catalogue component id appears in exactly one of
   `layer.components` or `layer.absent` (with the reason it has none).
4. Lane stylesheets (`lanes.<lane>.css`) must be scoped to
   `layerScope(id, lane)`; Svelte `<style>` in the Specimen is already
   scoped by Svelte.

## Verdicts

Every Sage Ink slot must be opaque and a palette token (STATE_GRAMMAR.md
principles 1–2); slots with an `expect` must also meet it. A slot that does
not is one of:

- `known` — a real defect in the shipped file, not fixed yet: say what
  paints it and what a fix needs. e2e fails if the slot starts passing and
  the entry is left behind.
- `exception` — a deliberate, documented departure (the reason must cite
  where it is decided).
- `skip` — the layer cannot paint that slot at all.

Anything else is `fail`, and `e2e/components.spec.ts` rejects it.

## Lint

`scripts/check-ink-contract.py` scans every `simulator/src/**/*.svelte`:
no `#RRGGBB` that is not a token, no translucent `rgba()` outside a hover
rule, no `border: 1px` on a control selector. Keep colours in lane
variables or lane CSS (computed in TS), not literals in the Specimen.
