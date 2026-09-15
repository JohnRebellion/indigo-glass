# Mobile posture of diesel.necir.ph and research.necir.ph: Research Report
*Date: 2026-09-15 | Scope: two subdomains | Sources: 18 in-repo measurements + 2 cross-model returns + 4 web/docs | Confidence: High*

## Executive Summary

**Neither subdomain is broken on mobile.** Both are fluid-first by construction, and the
measurement that suggested otherwise was measuring the wrong layer. `diesel.necir.ph` uses
22 `clamp()` calls, `svh`, `auto-fit`/`minmax` grids, mobile-first Tailwind column classes
and correctly gates hover effects behind `(hover: hover) and (pointer: fine)`.
`research.necir.ph` is a single-column document site whose only two-column layout collapses
at a `max-width: 900px` breakpoint, with its dense tables and diagrams deliberately wrapped
in `overflow-x: auto` scroll containers.

The real gaps are not layout defects. They are: **no mobile regression guard on either
site**, **no touch-target verification**, **no `env(safe-area-inset-*)` handling anywhere**,
and on `research.necir.ph` a genuine *readability* question about 780px-wide data tables on
a 390px screen that horizontal scrolling answers technically but not ergonomically.

## Findings

### 1. diesel.necir.ph — fluid-first, one public page

FACT (in-repo, 2026-09-15). 2,589 lines across 18 files, 5 routes. Four of the five —
`/banner`, `/marquee`, `/poster`, `/social` — render fixed 1080×1080 and 1080×1920
artboards for exporting social images. The public surface is **one page**, `/`, composed of
seven components (Nav, Hero, Products, Services, Listings, Contact, Footer).

Responsive mechanisms actually in use:

| Mechanism | Count / value |
|---|---|
| `clamp()` | **22** |
| Viewport breakpoint | 1 — `@media (min-width: 820px)` in [Listings.svelte:247](../../../../projects/rebel-diesel/src/lib/components/Listings.svelte) |
| Pointer gating | `@media (hover: hover) and (pointer: fine)` |
| Dynamic viewport unit | `min-height: clamp(560px, 94svh, 900px)` — `svh`, the stable choice |
| Fluid grids | `repeat(auto-fit, minmax(280px, 1fr))`; `grid-cols-2 sm:grid-cols-3 md:grid-cols-5` |
| Tailwind layout classes | 71 |

The `min-width: 820px` block is **progressive enhancement**, not a mobile hack — below
820px the listing card stacks; above it the gallery moves beside the spec list. That is the
correct direction.

**A measurement I had wrong.** I initially flagged 27 inline `style=` declarations
containing `px` as a fixed-width risk. Reading them: every one is a **border or shadow
offset** (`2px solid var(--line-strong)`, `4px 4px 0 0 var(--amber-lo)`) — paint, not
layout. The only inline dimensional values are `clamp(560px, 94svh, 900px)`,
`clamp(96px, 17vw, 190px)` and `minmax(280px, 1fr)`, all fluid. There is **no fixed-width
layout rule on the public page**.

INFERENCE: the amber CTA buttons carry `padding: 0.5rem 0.9rem` at `font-size: 0.83rem`,
giving roughly a **32 CSS px** control — clears the WCAG 2.2 SC 2.5.8 AA floor of 24×24
([Silktide](https://silktide.com/accessibility-guide/the-wcag-standard/2-5/input-modalities/2-5-8-target-size-minimum/))
but sits below Apple HIG's 44pt and Material's 48dp comfortable targets. Arithmetic, not a
measured render.

### 2. research.necir.ph — document-flow by design

FACT. 2,069 lines across 16 files, 5 routes, **133 distinct `--ig-*` tokens** consumed —
the most token-aligned of the operator's sites. Zero Tailwind layout classes; all layout
lives in scoped `<style>` blocks.

Per-route structure:

| Route | `@media` | grid | flex | lines |
|---|---|---|---|---|
| `/` | 0 | 0 | 2 | 208 |
| `/engines` | 0 | 0 | 0 | 207 |
| `/exhaust` | 0 | 0 | 0 | 131 |
| `/diesel-history` | 0 | 0 | 0 | 136 |
| `/r/[slug]` | **1** | 3 | 0 | 105 |

Four of five routes have no breakpoint because they have **no multi-column layout to
break** — they are single-column document flows with `ch`-based measure caps (`78ch`,
`90ch`) and page caps (`1000px`, `1400px`). A zero-breakpoint prose route is correct, not
under-done.

`/r/[slug]` is the one two-column layout —
`grid-template-columns: minmax(0, 1fr) 16rem` — and it collapses correctly:

```css
@media (max-width: 900px) {
  .report { grid-template-columns: minmax(0, 1fr); }
  .report-aside { position: static; max-height: none; order: -1; … }
}
```

**Two "defects" verified as intentional, not bugs.** `.ink-table { min-width: 780px }` sits
inside `.panel-body { overflow-x: auto }` in `QueryPanel.svelte`, which wraps the table via
`{@render children()}`. `.diagram svg { min-width: 1040px }` sits inside a `.diagram`
container that also declares `overflow-x: auto`. Both are deliberate horizontal-scroll
patterns for dense data.

Also verified benign: the single `100vh` is `max-height: calc(100vh - 2 * var(--ig-pad-xl))`
on the sticky aside — and that aside is set `position: static; max-height: none` below
900px, so the `100vh` never evaluates on a phone. The classic mobile `100vh` bug does not
apply here.

### 3. What both cross-model reviewers got wrong, and why

Both returns concluded the operator's *portfolio* site was the worst of the set and implied
the sites were breaking on phones. Both were wrong, and the brief I gave them caused it.

`openai/gpt-oss-120b` justified its ranking with a fabricated rule — "it contains 557 lines
of `app.css` that set many widths, paddings, and margins in fixed `px` (e.g.,
`.card { width: 360px; }` – unknown exact selector, but typical of a hard-coded design)".
No such rule exists; that file has **three** layout declarations total. The model flagged
its own uncertainty ("unknown exact selector") and reasoned from the invention anyway.
`groq/compound` reached the same ranking from the counts alone without inventing anything.

The root cause is mine: my brief tabulated `@media` and `clamp()` counts from CSS only.
For a Tailwind-utility site the base utility classes **are** the mobile styles, and for a
`clamp()`-driven site there is nothing to count in breakpoints. Re-measuring layout
*classes* rather than CSS at-rules reversed the conclusion. The lesson generalises: a
breakpoint census is not a responsiveness metric.

What both models got right, independently and worth keeping:

- The minimum viable guard shape (§4 below) — they converged on nearly the same five
  assertions.
- Touch targets as the most consequential unasked question (gpt-oss-120b's #7).
- `env(safe-area-inset-*)` matters **only** where an element is fixed or sticky to a screen
  edge; for pure scrolling documents its absence is not a defect. Both sites are scrolling
  documents, so this is correctly a non-issue today — it becomes one the moment either adds
  a sticky bottom bar.

### 4. The real gap: no regression guard on either site

FACT: neither project has a `playwright.config.*` or an `e2e/` directory. There is no test
that would catch a mobile regression on either subdomain.

Both reviewers converged on essentially the same minimal suite, and it is cheap for
5-route sites:

1. **No horizontal overflow** — at 390×844, assert
   `document.documentElement.scrollWidth <= window.innerWidth` per route. This is the single
   highest-value assertion and it is one line.
2. **Touch-target floor** — for every `a`, `button`, `[role=button]`, assert
   `boundingBox()` height and width ≥ 24 (AA floor), reporting anything under 44.
3. **Primary content visible** — assert the `h1` of each route is in the viewport on load.
4. **Deliberate scroll containers stay deliberate** — on `research.necir.ph`, assert that
   any element with `scrollWidth > clientWidth` has an ancestor with `overflow-x: auto`.
   This is the assertion that distinguishes the intentional table pattern from an accidental
   regression, and it is the one neither model proposed.
5. Optionally one baseline screenshot per route at 390px — low maintenance at 5 routes each.

## Risks & Caveats

- **Touch-target figures are arithmetic, not measured renders.** The ~32px diesel button
  needs confirming in a real browser before it justifies a change.
- **`research.necir.ph`'s tables are a UX question, not a layout bug.** Horizontal scroll is
  a legitimate pattern, but a 780px table on a 390px screen means the reader sees under half
  the columns at once, with a sticky `thead` that only helps vertically. Whether that is
  acceptable depends on whether phone readers are a real audience for engine spec tables —
  a product decision, not a technical one. No source found on scroll-affordance discovery
  rates for this pattern; **insufficient data found**.
- **The four diesel artboard routes were excluded on my judgement.** They render at fixed
  1080px and will overflow if visited on a phone. Both reviewers flagged this: correct *if*
  those routes are never navigated to on mobile, a defect if they are linked from anywhere
  public. Unverified — worth one check of whether anything links to them.
- **`(hover: hover) and (pointer: fine)` on diesel deliberately excludes hybrids.** A
  touchscreen laptop with a trackpad reports `hover: hover`, so the effects do apply there —
  which is correct. Noted only because the inverse gate is the common mistake.
- Neither site's theme matches the upstream token set exactly (diesel uses its own
  amber-led vars and `border-radius: 999px` pills; research consumes 133 `--ig-*`). That is
  deliberate divergence and, per both reviewers, **orthogonal to the mobile work** — bundling
  a token unification into this would be scope creep with no e2e suite to catch regressions.

## Recommendation

1. **Do not rewrite either site's layout.** Both are fluid-first and the measured evidence
   does not support a responsive overhaul. The premise that they need one came from counting
   breakpoints on sites that legitimately have few.

2. **Add the five-assertion mobile guard to both projects first** — especially assertion 4,
   which encodes `research.necir.ph`'s intentional scroll containers so a future change
   cannot silently turn them into overflow bugs. This is the only work here with lasting
   value, and it is maybe an hour per site at 5 routes each.

3. **Then verify touch targets on a real render** at 390×844 and raise anything under 24px.
   Do not pre-emptively move to 44px — that is a density decision against a deliberately
   compact design language, and should be taken with numbers in hand.

4. **Two small things worth checking while you are in there:** whether anything public links
   to diesel's `/banner`, `/marquee`, `/poster`, `/social` artboard routes, and whether the
   `research.necir.ph` table scroll containers have a visible affordance on touch — an edge
   fade or a visible scrollbar — since neither site currently signals that a table scrolls.

`env(safe-area-inset-*)` needs nothing today. Revisit the moment either site gains a sticky
header or bottom bar.

## Sources

1. **WCAG 2.5.8 Target Size (Minimum), Silktide** — https://silktide.com/accessibility-guide/the-wcag-standard/2-5/input-modalities/2-5-8-target-size-minimum/ — 24×24 CSS px AA floor — undated
2. **WCAG 2.5.8 Implementation Guide, AllAccessible** — https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide — Apple 44pt / Material 48dp comfortable targets — undated
3. **CSS dvh, svh, lvh: Mobile Viewport Height Fix** — https://modern-css.com/mobile-viewport-height-without-100vh-hack/ — why `svh` is the stable choice over `dvh`, as diesel already uses — 2026
4. **Playwright — Emulation** — https://playwright.dev/docs/emulation — device descriptors for the proposed guard — current

Cross-model returns in `returns/`: `r1-gptoss120b.md` (full contract),
`r2-compound.md` (questions 1/3/5/7). Brief in `00-BRIEF.md`.

In-repo measurements cited inline, taken 2026-09-15 against the working trees at
`~/projects/rebel-diesel` and `~/projects/research-reports`.

## Methodology

- Sites in scope: 2 (`diesel.necir.ph`, `research.necir.ph`); `necir.ph` measured then
  dropped at the user's direction
- In-repo measurements: 18 greps/counts across both working trees
- Cross-model review: 1 brief, 2 returns from 2 models
- Mode: direct (no agents)
- Flags:
  - **The brief's own metric was invalid** and produced a wrong ranking in both returns.
    Corrected by re-measuring Tailwind layout classes and inline style contents.
  - **One model fabricated a CSS rule** (`.card { width: 360px }`) while flagging it as
    unknown, and reasoned from it. Discarded.
  - **Two suspected defects verified as intentional** (research's `min-width` tables and
    diagrams, both inside `overflow-x: auto`).
  - **One of my own assumptions corrected** — diesel's 27 inline `px` values are borders and
    shadow offsets, not layout.
  - Unverified: whether anything public links to diesel's artboard routes; scroll-affordance
    discovery for the research tables.
