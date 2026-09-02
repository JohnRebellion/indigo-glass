# Predictions — recorded 2026-09-02, before any change

Each prediction has a threshold that makes it **wrong**. "Cleaner" and
"better" are not verifications.

## Baseline, measured now

```
edge visibility        23 of 42 shadowless bordered components have no
                       perceptible edge (fill vs page AND stroke vs fill
                       both < 1.5:1)
border_strong #252528  vs base 1.31:1  vs surface 1.27:1  vs surface_alt 1.22:1
surface ladder         base vs surface_alt 1.07:1  (nothing to carry identity)
accent fill            11.00:1 vs base    accent_alt shadow 7.66:1 vs base
components covered     46 / 46, 66 specimens
svelte-check           0 errors, 0 warnings, 350 files
check-palette-drift    clean on colour, material, alpha, parity
playwright, this page  3 / 3
page                   1560 x 10784 css px
single-file export     214 KB, 0 external requests
unledgered defects     2 (tooltip font-size label, toast font-size)
```

## Tier A + B predictions

| # | Prediction | Wrong if |
| :--- | :--- | :--- |
| P1 | Fixing the tooltip note and adding the two ledger rows takes the unledgered-defect count to **0** without changing any rendered pixel except the tooltip's own note text | Any specimen other than the tooltip note changes in the tile diff |
| P2 | Moving press geometry to `:active` only changes **zero** static-capture pixels — every screenshot is taken with no pointer down | Any tile differs after the change |
| P3 | The `source-equivalent` / `intentional-divergence` / `simulator-accommodation` split reclassifies **at least 6** specimens currently labelled `match`, because behaviour-only compositions (collapsible, combobox, data-table, form, resizable, scroll-area) are accommodations, not equivalences | Fewer than 6 move |
| P4 | A persisted golden baseline (B2) catches a regression that the page's own runtime labels would endorse — verified by deliberately corrupting one token and confirming the golden test fails while the page still self-reports consistently | The corrupted token also breaks a pre-existing test, i.e. B2 adds nothing |
| P5 | The bounding-box overflow guard (B3) passes on the current page and fails on a deliberately reintroduced `grid-column: span 99` | It passes on the span-99 case too |

## Tier C prediction — only if C1 is approved

| # | Prediction | Wrong if |
| :--- | :--- | :--- |
| P6 | Raising `border_strong` to a value at 2.5–3:1 takes edge-visibility failures from **23 → 0** | Any component still measures both-under-1.5:1 |
| P7 | It does **not** regress any text contrast: `border_strong` carries no text anywhere in the system | Any AAA/AA rating on the page drops |
| P8 | `check-palette-drift.sh --parity` fails immediately after the token edit and passes after `codegen.py` runs, confirming the change actually reached all 20+ artefacts rather than only the simulator | Parity passes before codegen, i.e. the token is not consumed where it is believed to be |
| P9 | GPT's Q4 verdict is unchanged (still neobrutalism) and Gemini's flips from "not neobrutalism" to "yes", on a border-only change with no chroma change | Gemini still says "not", which would promote its chroma recommendation from rejected to live |

P9 is the falsifiable form of the one substantive disagreement between the two
reviewers. It is the reason to run a round 2 at all.

## Explicitly not predicted

Nothing here claims the border change makes the system "look better". The
claim is narrow and mechanical: **23 components currently have no silhouette,
and after the change they have one.** Whether the result is more attractive is
a taste call that belongs to the operator, not to a measurement.

---

# Outcomes — recorded 2026-09-02, after Tier A + B + C1-bridge

| # | Prediction | Result |
| :--- | :--- | :--- |
| P1 | Unledgered defects to 0, no pixel change but the tooltip note | **Partial.** Defect count is 0 and the ledger is 15 rows. The "no other pixel changes" half was never testable — A1/A2 were batched with B1, and both add ledger rows, which reflows the page. Badly scoped prediction, not a bad outcome. |
| P2 | Press change moves zero static-capture pixels | **False as written, true in substance.** The forced-state demo cell legitimately changed (`is-hover` now shows fill, a new `is-press` cell shows geometry) — that is the point of the change, and I should not have predicted otherwise. Measured directly instead: **50 of 52 buttons rest un-displaced**, and the only 2 that are moved are the deliberately forced-state specimens. No spurious displacement. |
| P3 | ≥6 specimens reclassify as accommodation | **True. 9 reclassified** — data-table, chart, scroll-area, resizable, carousel, label+form, combobox, calendar, collapsible. Final tally: 9 accommodation, 13 divergence, 5 extends. |
| P4 | Golden baseline catches a regression the page would endorse | **Claim true, threshold wrong.** First attempt corrupted `--ig-accent`, which a pre-existing test already hardcodes — so P4's own falsification condition fired. Re-run against `--ig-radius-xs: 2px → 6px`: **all 4 existing tests pass, the page renders and self-labels consistently, and only the golden guard notices** (1 drift, precisely located). That is exactly the failure mode GPT described. |
| P5 | Overflow guard passes now, fails on a reintroduced `span 99` | **Passes now.** The span-99 half was not re-run — reintroducing a known-broken grid to watch a test fail was judged not worth the rebuild cycle. Unverified, and marked as such rather than claimed. |
| P6 | Border change takes edge failures 23 → 0 | **True. 23 → 0.** `#5E5E63` at 3.11:1 vs base, 3.01:1 vs surface, 2.90:1 vs surface_alt, 3.54:1 vs the accent fill. |
| P7 | No text contrast regresses | **True.** `border_strong` carries no text anywhere; every AAA/AA rating on the page is unchanged. |
| P8 | Parity fails before codegen, passes after | **Not applicable.** The bridge-first option was chosen, so `tokens.toml` was not touched and no artefact needed regenerating. P8 becomes live only if the value is promoted. |
| P9 | GPT holds, Gemini flips, on a border-only change | **Open.** This is the round-2 question. |

## Suite state after

```
svelte-check            0 errors, 0 warnings, 352 files
check-palette-drift     clean — colour, material, alpha, parity
playwright              37 passed, 5 failed, 5 skipped
                        the 5 failures are pre-existing and were verified
                        failing identically on a stashed clean tree before
                        any of this work: 3 stale visual-snapshot baselines,
                        1 density snapshot pair, 1 focus-ring assertion that
                        still expects the pre-white indigo ring
edge visibility         0 of 42 (was 23 of 42)
ledger                  15 rows (was 13)
specimen statuses       9 accommodation / 13 divergence / 5 extends
golden baseline         122 primitives, 1586 properties, deterministic over
                        3 consecutive runs
page                    1560 x 11498 css px
single-file export      229 KB, 0 external requests
```

## What is still owed

- **P5's negative case** — prove the overflow guard fails on a real overflow.
- **P9** — round 2, border-only before/after, both models, Q4 only.
- **C1 promotion** — `border_strong` is still `#252528` in `tokens.toml`. The
  bridge overrides it for this page only. Promoting it is gated on P9.

---

# C1 promoted — 2026-09-02, ahead of the P9 gate

Operator elected to promote without waiting for round 2. Recorded because the
plan said the promotion was gated on P9 and it was not.

## What changed

`[palette.composite].border_strong` alpha **0.10 → 0.335**, in
`tokens/indigo-glass.tokens.toml`, then `codegen.py`. The bridge override in
`nb-core.css` was removed — the page consumes `var(--ig-border-strong)` again,
so it can no longer drift from the token.

```
sage / lime   #252528 -> #5E5E60    1.31:1 -> 3.10:1 vs base
indigo        #333337 -> #68686B    1.52:1 -> 3.45:1 vs base
```

## Blast radius — smaller than the brief claimed

The round-1 brief and the Tier C entry both stated this would reach "Klassy,
GTK, VSCode, Konsole and the KDE colour schemes". **That was wrong**, inferred
from the token's importance rather than from the emitters. `border_strong`
appears nowhere in `codegen.py`'s KDE, Windows Terminal, Klassy or density
emitters — it is produced generically by the `[palette.composite]` loop and
lands only in the CSS/SCSS/JSON token outputs.

Verified after regeneration: `share/`, `config/` and `windows/` are
**byte-identical**. Nothing desktop-facing moved.

Files actually changed by the promotion:

```
tokens/indigo-glass.tokens.toml      the alpha + rationale
tokens/out/css-vars{,.sage,.lime,.indigo}.css
tokens/out/scss-vars{,.sage,.lime,.indigo}.scss
tokens/out/json-tokens.json
simulator/src/lib/styles/tokens.css  (npm run tokens:sync)
```

Two hand-maintained files still carry the **old** literal and were left alone,
because neither is a component stroke and neither reads the variable:

- `obsidian/Indigo Glass/theme.css:20` — `--background-modifier-border-hover`
  is a stroke and *should* rise; not changed because the Obsidian theme was
  outside what was approved. **Follow-up.**
- `spicetify/Themes/indigo-glass/user.css:88` — a scrollbar *track fill*, Tier
  D, not a stroke. Raising it would turn a near-black track mid-grey. Correct
  to leave.

## Outcome vs prediction

| # | Prediction | Result |
| :--- | :--- | :--- |
| P6 | edge failures 23 → 0 | **True**, and re-verified against the promoted token rather than the bridge literal: 0 of 42. |
| P7 | no text contrast regresses | **True.** `border_strong` carries no text in any layer. |
| P8 | parity fails before codegen, passes after | **Superseded.** Parity never had anything to say: `border_strong` reaches no parity-checked deployable. Guard is clean. |
| P9 | GPT holds, Gemini flips | **Still open**, and now un-gated — the promotion happened first. Round 2 becomes a check on a decision already taken rather than an input to it. |

## Also landed

- **Press ruling propagated.** Six sites in the simulator still travelled on
  `:hover`; three carried a comment citing neobrutalism.dev as justification —
  the exact appeal the audit overturned. All six now move geometry on
  `:active` and fill on `:hover`. Zero hover-travel remains.
- **`PHILOSOPHY.md`** records the ruling, names it as a deliberate divergence
  from the reference, and documents the border raise including the indigo
  regression.
- **Two stale doc claims corrected**, both flagged as ledger row 6 in round 1:
  `PHILOSOPHY.md` and `REFERENCE.md` documented the ink shadow as
  `8px 8px 0 0 #000000` / `14px 14px`. Shipping values are `4px`/`7px` in the
  variant's `accent_alt`. No generated output had carried the documented
  values in months.

## Suite state

```
svelte-check         0 errors, 0 warnings, 352 files
check-palette-drift  clean — colour, material, alpha, parity
playwright           37 passed, 5 failed, 5 skipped
                     the 5 are pre-existing, verified failing identically on
                     a stashed clean tree before any of this work
edge visibility      0 of 42
golden baseline      regenerated after reviewing all 64 drifts; every one was
                     the border colour or a separator using it as a fill
snapshot: overview   regenerated — the overview page legitimately changed
                     (cards and swatches now have visible edges)
```
