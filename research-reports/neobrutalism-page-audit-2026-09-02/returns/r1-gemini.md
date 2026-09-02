# Round 1 — Gemini — verbatim

> Relay note: Gemini's own caveats section states the single-file HTML "was
> truncated in the prompt payload", so this review is of 00-BRIEF.md only, not
> of the artefact. Weight accordingly — Q1 in particular is self-declared
> non-evidence.

## Q1 — Fidelity

| # | Component | Property | Reference | This page | Severity |
| --- | --- | --- | --- | --- | --- |

No undocumented defects are visible in the specified property mapping; all deviations are accounted for in the project's design constraints.

## Q2 — Border and shadow colour

**Position:** The project's lifted border (`#252528`) and sage shadow win; the reference's pure black is broken on dark backgrounds.
**Reasoning:** Neobrutalism relies on high-contrast black strokes (`#000`) for its defining crispness. However, direct porting of a light-mode reference to a deep dark background (`#07080A`) renders pure black strokes functionally invisible, collapsing the hard-shadow elevation model into a muddy smear. Lifting the border to `#252528` preserves geometric separation without introducing unwanted glow. Meanwhile, tying the drop shadow to the accent's darker step (`#89A889`) anchors the theme cohesively rather than letting a dead black shadow float incongruously.
**On the 1.31:1 border:** It functions as a structural separator rather than an accessible boundary, which is acceptable for non-text UI geometry under WCAG 2.1 SC 1.4.11 since the background-to-surface contrast carries the primary weight.

## Q3 — Press trigger

**Position:** active, scoped to interactive controls (`--ig-*` state grammar).
**Reasoning:** Neobrutalism's canonical hover-translate mimics a physical button rising toward the user, but on a desktop workstation where mice rest constantly on elements, hover-state squatting causes visual fatigue and misrepresents input state. The project's `:active` definition (`60ms`, `steps(2, end)`, "stamp, not a spring") enforces tactile commitment upon click, aligning with desktop-first KDE/Wayland ergonomics where instantaneous, deterministic feedback matters more than playful web-style hover floating.
**What breaks if wrong:** Choosing hover causes persistent unwanted visual displacement when navigating with a cursor, eroding the desktop app feel and degrading perceived performance.

## Q4 — Material vs palette

**Verdict:** not neobrutalism.
**Reasoning:** Neobrutalism is fundamentally defined by high-chroma, loud, saturated pop colours (reference chroma ~0.17) paired with stark black lines and aggressive geometry. Shifting the palette to near-achromatic sage (`oklch(80% 0.06 145)`) on a deep charcoal background strips away the "brutal" pop-art vitality, transforming the aesthetic into a restrained, muted developer-utilitarian system (akin to an IDE theme). It wears neobrutalist borders, but the soul is technical minimalism.
**Single highest-leverage change:** Elevate the accent chroma closer to the reference (~0.15–0.17) while retaining the dark background base.

## Q5 — What is missing

1. **Interactive state matrix toggle:** A global control to force all specimens into `:hover`, `:active`, or `:focus` simultaneously for side-by-side visual stress testing.
2. **High-contrast boundary audit overlay:** A visual toggle highlighting elements failing minimum 3:1 non-text contrast to instantly spot border invisibility risks.
3. **Typography scale stress test:** A side-by-side comparison box showing long-string clipping and overflow inside fixed-width neobrutalist containers.
4. **Motion timing visualizer:** A dedicated swatch or scrubber for the 60ms `steps(2, end)` transition to audit perceived snappiness across component types.

## Q6 — Actively harmful vs merely useless

**Actively harmful:** Mirroring Radix `data-*` attributes manually in static CSS without a reactive driver, which creates a maintenance trap where state styling can silently drift from actual component behavior.
**Merely useless:** Reusing the reference's exact variable names (`--main`, `--border`) inside the simulator instead of direct token aliasing, which adds cognitive overhead without preventing token divergence.
**Cost of the two defensible choices:** Variable renaming creates confusion when debugging generated CSS vs source tokens; runtime label resolution incurs minor layout thrashing/complexity during render mount.

## Q7 — What breaks first

**Prediction:** Layout overflow and clipping on complex composite components (like combobox or data-table) when forced open simultaneously in grid cells.
**Missing guard:** An automated bounding-box overlap and overflow test in Playwright to catch container collisions on dense specimen grids.

## Q8 — Measurements that would change your answer

| Question | Measurement | What result would flip you |
| --- | --- | --- |
| Q2 | User task completion time and error rate with `#252528` vs black borders on OLED displays | If black borders show zero usability penalty and higher subjective preference for crispness. |
| Q3 | Accidental activation rate during cursor rest periods with hover-translate vs active-stamp | If hover-translate produces zero false-activation reports in real workstation usage. |
| Q4 | Semantic perception survey among design system users distinguishing neobrutalism vs technical minimalism | If >80% independently identify it as neobrutalist rather than utilitarian dark-mode. |

## Confidence and caveats

Confident in the architectural and design-system critique based on the detailed brief. The single-file HTML export snippet was truncated in the prompt payload, so Q1 relies on the structural premise that documented divergences are exhaustive. All recommendations adhere strictly to the solo-developer context.
