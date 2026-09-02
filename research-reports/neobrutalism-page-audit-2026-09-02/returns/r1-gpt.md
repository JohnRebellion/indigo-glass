# Round 1 — GPT — verbatim

> Relay note: GPT read the attached single-file HTML and its inlined CSS. Its
> caveats state it had no graphical browser, so it worked from source, embedded
> markup and the export's printed claims rather than a pixel-level scroll.

## Q1 — Fidelity

| # | Component | Property | Reference | This page | Severity |
|---|-----------|----------|-----------|-----------|----------|
| 1 | Tooltip | font-size | `text-sm`, 14px; the page note instead claims an intentional 8pt divergence | `.nb-tooltip` uses `--ig-caption-pt`, which resolves to 9pt, approximately 12px | Medium |
| 2 | Sonner / toast | font-size | Hardcoded 13px | `.nb-toast` uses `--ig-caption-pt`, which resolves to 9pt, approximately 12px | Low |

The Select implementation is materially accurate, including the absence of a shadow on SelectContent; the reference source confirms that geometry. The two rows above are unledgered implementation or labelling defects: the CSS does not paint what the page says it paints. `indigo-glass-simulator-neobrutalism.html`

## Q2 — Border and shadow colour

**Position:** The simulator's lifted neutral border and coloured hard shadow win; the web/Tailwind layer's black must be changed.

**Reasoning:** Black preserves source fidelity while destroying the source's visual intent. On `#07080A`, black cannot describe the component edge or elevation, so it ceases to be a functional implementation of the reference grammar. The shadow should remain `#89A889`: it is unmistakable, derived from the variant, and makes colour-as-elevation literal. The border should not remain `#252528`, however. That value is too close to the page and delegates nearly all object recognition to the shadow. Increase it to a neutral that survives on both `--background` and `--secondary-background`, without turning every component into an accent outline. The Tailwind layer should consume the same resolved border and shadow tokens as this bridge.

**On the 1.31:1 border:** It is nominally a border but perceptually an absence on unshadowed dark surfaces. Treat it as failed structure, not merely failed WCAG contrast.

## Q3 — Press trigger

**Position:** `:active` only for shadow-collapse and translation; hover may change fill or cursor, but must not simulate depression.

**Reasoning:** Travelling into the shadow is a physical press metaphor. Triggering it on pointer arrival reports an action that has not happened and removes the button's visible elevation before commitment. Desktop hover is cheap precisely because it should provide preview, not activation. The 60ms stepped active transition is coherent with "stamp, not spring," while hover can use accent-hi without altering geometry. Keyboard activation should receive the same press treatment where the browser exposes activation, and reduced motion should collapse the duration without changing the state distinction.

**What breaks if wrong:** Hover-triggered collapse creates false activation feedback, makes controls look permanently depressed while being targeted, causes reverse buttons to jump before clicking, and produces pointer-only semantics that touch and keyboard users never receive. Using only `:active` without a separate hover affordance would reduce pointer discoverability, but that is a smaller failure.

## Q4 — Material vs palette

**Verdict:** Still neobrutalism, but a restrained dark dialect near the boundary.

**Reasoning:** The material survives because the decisive features remain structural: flat opaque fills, thick explicit strokes, hard offset shadows, abrupt state changes, blunt composition, and colour blocks carrying hierarchy. Saturation and a light canvas are common signals, not necessary conditions. The table, accent-filled controls, hard-shadowed cards, and outlined states still read as intentionally constructed rather than conventionally dark UI.

The weak point is not sage chroma alone. It is that the principal 2px border nearly disappears, leaving sage shadows to carry both silhouette and elevation. That makes quieter components read as generic dark UI while elevated components read as green-offset objects. The system therefore oscillates instead of maintaining one material signal.

**Single highest-leverage change:** Raise `--border` to a clearly visible neutral, targeting roughly 2.5:1 to 3:1 against both dark surface levels. Do not increase accent chroma first; stronger structure would recover more of the style across more components.

## Q5 — What is missing

1. A machine-generated reference-versus-page property diff per primitive, limited to material properties: fill, stroke, shadow, radius, spacing, typography and states.
2. Side-by-side reference and Sage captures at identical viewport, scale and component state. Memory is not an adequate visual baseline.
3. Per-component provenance linking each specimen to the exact reference file, component export and source revision.
4. A state matrix showing idle, hover, active, focus-visible, disabled, open, selected and invalid where applicable. Forced-open examples do not prove selector parity.
5. Narrow and wide viewport captures. The audit currently proves roster presence, not that its own review layout remains inspectable.
6. An explicit distinction between three statuses: source-equivalent, intentional divergence, and simulator-only accommodation. "Match" currently compresses those meanings.

## Q6 — Actively harmful vs merely useless

**Actively harmful:**

- Wiring geometric press feedback to both `:hover` and `:active`. It encodes contradictory interaction semantics in executable CSS, not merely in documentation.
- Calling specimens "match" when their typography or behaviour differs. The tooltip and toast demonstrate that status labels can overstate fidelity.
- Runtime-only truth without a persisted comparison baseline. A generator regression can change both pixels and labels together, causing the audit to endorse the regression.
- Flattening overlays into flow without labelling positioning, collision and stacking properties as untested. The convention is useful for capture, but harmful if the page presents it as component fidelity rather than a deliberate simulation boundary.

**Merely useless:**

- Repeating explanatory prose already encoded in the ledger.
- Displaying every spacing token without showing which reference class or component consumes it.
- Including behaviour-only compositions as if their wrapper itself supplied fidelity evidence.

**Cost of the two defensible choices:**

- Mirroring reference variable names improves direct comparison but creates a second semantic namespace. Reviewers can mistake bridge variables for canonical tokens, while drift can occur in the binding layer even when both upstream schemas remain internally correct.
- Runtime-resolved labels prevent stale hand-entered values but share the same failure domain as the implementation. If resolution, conversion or cascade is wrong, the specimen and its evidence can agree falsely. It also makes the scriptless export historical output rather than independently recomputable evidence.

## Q7 — What breaks first

**Prediction:** State and variant parity will break before palette parity. A reference class change, newly added Radix state selector, or local specificity override will leave the idle specimen looking correct while hover, focus, disabled, selected or open behaviour silently diverges. Typography labels are already showing the smaller version of this failure.

**Missing guard:** A property-level contract test generated from the pinned reference revision. For every primitive and state, assert a normalized tuple of computed background-color, color, border width/style, radius, shadow geometry, font size/weight, padding, opacity, transform and positioning. Intentional divergences must be explicit waivers keyed to component, state and property. Add pixel-diff captures as a second guard, not the primary oracle.

## Q8 — Measurements that would change your answer

| Question | Measurement | What result would flip you |
|----------|-------------|----------------------------|
| Q2 | Controlled recognition test at normal workstation viewing conditions: identify boundaries and elevation for unshadowed and shadowed components using black, `#252528`, and progressively lighter neutral borders | If users reliably identify unshadowed boundaries with `#252528` at the same speed and error rate as a roughly 3:1 neutral, I would keep 1.31:1. If black performs equivalently, I would restore reference black. |
| Q3 | Instrumented desktop task test comparing hover-collapse, active-collapse and hover-fill-plus-active-collapse; measure misclicks, pointer hesitation, perceived activation before click and task time | I would choose hover if it materially reduces acquisition time without increasing false-activation reports, hesitation or misclicks, and keyboard/touch equivalence remains intelligible. |
| Q4 | Blinded visual classification against dark UI controls: ask reviewers to classify cropped specimens before and after border-only and chroma-only changes; record "neobrutalist" recognition and confidence | I would call the current system a different material if recognition stays near generic dark UI and only a substantial chroma increase, not stronger borders, restores reliable neobrutalist classification. |

## Confidence and caveats

I could inspect the complete HTML and its inlined CSS, but this environment had no installed graphical browser, so I could not perform an independent pixel-level scroll review. I worked from the source, embedded specimen markup, computed claims printed in the export, and the reference source where needed. `indigo-glass-simulator-neobrutalism.html`

Confidence is high on Q2, Q3, Q6 and the tooltip/toast defects. Confidence is moderate on Q4 because material classification needs rendered comparison under controlled viewing conditions. Q1 is necessarily incomplete without Appendix A or a full automated diff against the pinned reference revision; I did not manufacture additional defects from memory.
