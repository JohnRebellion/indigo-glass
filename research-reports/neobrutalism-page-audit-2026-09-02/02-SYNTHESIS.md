# Round 1 synthesis — 2026-09-02

## 0. Read this first: the two reviews are not comparable in weight

**Gemini did not read the artefact.** Its own caveats say the single-file HTML
"was truncated in the prompt payload", so it reviewed `00-BRIEF.md` alone. It
returned an empty Q1 table and stated that emptiness rests on "the structural
premise that documented divergences are exhaustive" — i.e. it assumed the
ledger was complete rather than checking. GPT read the file, cites it, and
found two defects the ledger does not cover, both of which verify.

Gemini is therefore weighted as a **design-opinion second voice**, not as a
fidelity reviewer. Its agreement with GPT on Q2 and Q3 is still worth
something — it reached those conclusions from the same premises independently
— but its Q1 is non-evidence and its Q4 rests on a premise that measurement
refutes.

**Relay defect to fix next round:** attach the HTML in a way that survives the
payload limit, or split it. A review of the brief is not a review of the page.

---

## 1. Where they agree

| Question | Both models |
| :--- | :--- |
| Q2 border/shadow | The lifted neutral border + sage shadow beat the reference's pure black. Black on `#07080A` is not fidelity, it is a non-implementation. The web/Tailwind layer's black is the side that must change. |
| Q3 press trigger | **`:active`, not `:hover`.** Travel-into-shadow is a press metaphor; firing it on pointer arrival reports an action that has not happened. |
| Q5 | A **state matrix** is the biggest gap — forced-open specimens prove roster presence, not selector parity. |

Q3 is now **adjudicated**. Two independent models, same answer, and the
reference's own `:hover` behaviour loses on desktop-first grounds. Ledger row
5 stops being a question.

---

## 2. Where they disagree, and who wins

### Q4 — is it still neobrutalism? **GPT wins, on measurement.**

- **Gemini:** not neobrutalism. Fix = raise accent chroma to ~0.15–0.17.
- **GPT:** still neobrutalism, a restrained dark dialect near the boundary.
  Fix = raise `--border` to 2.5–3:1. *"Do not increase accent chroma first."*

GPT identified a **mechanism**, Gemini asserted a **category**. The mechanism
is testable, so it was tested (`simulator/scripts/measure-edges.mjs`):

```
23 of 42 shadowless bordered components have no perceptible edge
   (fill vs page AND stroke vs fill both under 1.5:1)
```

The split is perfectly binary, and it is exactly the oscillation GPT
described:

```
accent-filled   badge, button--noShadow, select-trigger, menu, popover,
                tooltip, hovercard, tabs-trigger, menubar-trigger, ...
                fill 11.00:1   stroke 8.39:1     -> reads as a real object

neutral         input, textarea, switch, table, tabs-list, menubar, sheet,
                checkbox, radio, sidebar, progress, avatar, otp-slot,
                scroll-area, marquee, chart, resizable, skeleton, ...
                fill 1.00-1.07:1   stroke 1.22-1.31:1   -> no silhouette
```

Every neutral surface in the system is edge-less. Only the accent fill or the
sage shadow makes anything visible. That is "quieter components read as
generic dark UI while elevated components read as green-offset objects",
measured.

### Q2 sub-question — is 1.31:1 acceptable? **GPT wins. Gemini's reason is false.**

Gemini accepted it because *"the background-to-surface contrast carries the
primary weight"*. Measured from the token file:

```
base #07080A  vs  surface_alt #121216     1.07:1
base #07080A  vs  surface     #0D0D10     1.03:1
base #07080A  vs  sidebar     #0A0A0D     1.01:1
```

**There is no surface contrast to carry any weight.** The premise of the
defence does not exist. Gemini also cited WCAG 2.1 SC 1.4.11 as permitting
this; 1.4.11 asks for 3:1 on boundaries *needed to identify a component*,
which is the opposite of what it was cited for.

GPT's verdict stands: *"nominally a border but perceptually an absence — treat
it as failed structure, not merely failed WCAG contrast."*

---

## 3. Verified findings

| # | Claim | Source | Verdict |
| :--- | :--- | :--- | :--- |
| 1 | Tooltip note claims an intentional 8pt size; CSS uses `--ig-caption-pt` (9pt) | GPT | **CONFIRMED.** `Overlays.svelte:118` says "type.xs (8pt)"; `nb-surfaces.css:60` sets `--ig-caption-pt`. The page's own label disagrees with its own CSS — the worst possible bug in a fidelity artefact. |
| 2 | Toast is 9pt (~12px) against the reference's hardcoded 13px, unledgered | GPT | **CONFIRMED**, low severity. The note describes the reference's px value without recording the divergence. |
| 3 | Select is materially accurate incl. no shadow on `SelectContent` | GPT | **CONFIRMED** against Appendix A. |
| 4 | `--border` at 1.31:1 delegates object recognition to the shadow | GPT | **CONFIRMED** — 23/42 components, above. |
| 5 | Surface contrast carries component identification | Gemini | **REFUTED** — 1.01–1.07:1. |
| 6 | Wiring press to both `:hover` and `:active` encodes a contradiction in executable CSS | GPT | **CONFIRMED.** `nb-core.css` has both. Deliberate (to show both sides), but GPT is right that the primitive layer is the wrong place for it. |
| 7 | Runtime-only truth shares a failure domain with the implementation | GPT | **CONFIRMED, and demonstrated twice during this synthesis** — see §6. |

---

## 4. Rejected

- **Gemini, Q6 "actively harmful": mirroring Radix `data-*` attributes without
  a reactive driver.** This is a static audit page by construction; there is no
  runtime component whose behaviour the CSS could drift from. The `data-*`
  attributes are how the reference's own selectors are written, which is the
  entire point of mirroring them.
- **Gemini, Q4 fix: raise accent chroma first.** Refuted above — the measured
  failure is structural, not chromatic. Raising chroma would also mean
  abandoning the palette decision the whole system is named after, cascading
  into every deployed layer, to fix a problem the measurement locates
  elsewhere. GPT explicitly warned against exactly this ordering.
- **Gemini, Q8 measurements.** All three are user studies with n>1 humans. For
  a solo personal project they are unrunnable, which makes them non-answers to
  "what measurement would change your mind". GPT's Q8 has the same problem for
  Q3 and Q4; its Q2 row is the only one reducible to something local.

---

## 5. Ranked plan

Ordered by evidence strength, not by how confidently it was argued.

### Tier A — safe by construction, no behavioural risk

| # | Action | Evidence |
| :--- | :--- | :--- |
| A1 | Fix the tooltip note/CSS mismatch and add a ledger row for it | Verified defect |
| A2 | Add a ledger row for the toast's 9pt vs 13px | Verified defect |
| A3 | Add `measure-edges.mjs` output as an on-page section — the audit should publish its own weakest number | Measured |
| A4 | Label the overlay-flattening convention as an explicit **simulation boundary**: positioning, collision and stacking are NOT under test | GPT Q6, uncontested |
| A5 | Split `variant="match"` into `source-equivalent` / `intentional-divergence` / `simulator-accommodation` | GPT Q5.6 — "match" overstated fidelity in exactly the tooltip case |

### Tier B — resolves an adjudicated contradiction, changes page behaviour

| # | Action | Evidence |
| :--- | :--- | :--- |
| B1 | Press geometry moves to `:active` only. Hover changes fill (`accent_hi`) and cursor, never geometry. Ledger row 5 becomes a recorded decision, and a **new** divergence from the reference (which uses `:hover`) | Both models agree |
| B2 | Persisted golden baseline of computed styles, asserted independently of the page's own resolver | GPT Q6/Q7 + §6 below |
| B3 | Bounding-box overflow guard on the specimen grid | Gemini Q7 — and it has empirical support: this exact bug shipped during construction (`grid-column: span 99` forced `auto-fill` to materialise 99 tracks) |

### Tier C — needs a decision, cascades system-wide

| # | Action | Cost |
| :--- | :--- | :--- |
| C1 | Raise `--ig-border-strong` from `#252528` to ~`#5A5A5D` (2.83:1 vs base, 2.64:1 vs surface_alt) | `border_strong` is a core token. It regenerates 20+ artefacts and feeds Klassy, GTK, VSCode, Konsole and the KDE colour schemes. This is a visible change to the whole desktop, not just this page. |

C1 is the single highest-leverage finding in the audit and is **not** being
applied unilaterally.

---

## 6. What this synthesis got wrong about itself

GPT's sharpest architectural point was that runtime-resolved truth *"shares
the same failure domain as the implementation — if resolution, conversion or
cascade is wrong, the specimen and its evidence can agree falsely."*

While verifying that very claim, the throwaway measurement script written to
test it **reproduced the original bug twice**:

1. It parsed `getComputedStyle().backgroundColor` with a numeric regex.
   Chromium returns `oklch(...)` for oklch-authored values and `rgb(...)` for
   hex-authored ones, so borders and fills were compared across colour spaces.
   First run reported "1 edge-less component" — wrong.
2. The fix assumed canvas `fillStyle` normalises `oklch()` to sRGB. **It does
   not** — Chromium round-trips it unchanged. Second run: also wrong.
3. It gated on `outline-width >= 2`, but `outline-width` computes to `3px`
   ("medium") even when `outline-style: none`, so every element on the page
   was admitted.

Only the third attempt, painting a pixel and reading it back, agreed with the
independent Python calculation from the raw token hexes. The shipped
`liveTokens.ts` was correct throughout — it already falls through to
`getImageData` — but three consecutive measurements of the same quantity
disagreed, and the only reason the right answer was identifiable is that a
second, browser-free calculation existed to check against.

That is GPT's point, demonstrated, and it is why B2 (a persisted baseline
computed by something other than the page) is Tier B rather than optional.

---

## 7. Round 2?

Not yet. Round 2 should open with *"here is what we predicted, here is what
happened"* after Tier A and B land and C1 is decided. The one thing worth
asking a second time is Q4, re-run with the border change applied and
before/after crops attached — GPT's own Q8 says a blinded border-only vs
chroma-only comparison is what would flip it, and that is the disagreement
between the two reviewers.
