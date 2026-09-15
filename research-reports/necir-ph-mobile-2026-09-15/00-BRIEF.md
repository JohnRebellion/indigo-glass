# Review request: mobile/responsive posture of three live SvelteKit sites

Reviewing a working, deployed system. Assume competence. Skip generic advice
("use media queries", "mobile-first", "test on real devices"). I want the failure
modes and wrong assumptions a careful outside reviewer sees.

## The three sites

All SvelteKit + Tailwind v4 (`@tailwindcss/vite`), all on one operator's domain,
all carrying a variant of a personal design system ("Sage Ink": opaque flat
surfaces, radius 0, colour-as-elevation, hard offset shadow, no glass/blur/
gradient, two font weights). All three set
`<meta name="viewport" content="width=device-width, initial-scale=1">`.

| | necir.ph (portfolio) | diesel.necir.ph | research.necir.ph |
|---|---|---|---|
| src lines (svelte+css) | 1,658 | 2,589 | 2,069 |
| routes | 5 | 5 | 5 |
| Tailwind responsive utils (`sm:`/`md:`/…) | **10**, in 5 of 13 files | **5**, in 4 of 17 | **0**, in 1 of 12 |
| viewport `@media` (min/max-width) | **0** | 1 — `min-width: 820px` | 1 — `max-width: 900px` |
| `clamp()` | **0** | **22** | 1 |
| `dvh`/`svh` | 0 | 1 | 0 |
| `100vh` | 0 | 0 | 1 |
| `env(safe-area-inset-*)` | **0** | **0** | **0** |
| `@container` | 0 | 0 | 0 |
| pointer/hover media features | 1 | 1 — `(hover: hover) and (pointer: fine)` | 0 |
| Playwright / e2e suite | **none** | **none** | **none** |

Non-responsive `@media` (present on all three) are `prefers-color-scheme`,
`prefers-reduced-motion`, `color-gamut: p3`, `print`.

## Theme implementation differs per site — deliberate, not drift

- **necir.ph**: Tailwind v4 `@theme` block, own `--color-*` names, Sage Ink hex
  hardcoded. 557-line `app.css`. Deliberately diverges from the upstream tokens:
  `--color-text-muted` raised from the token's `#6B7280` (3.96:1, fails AA) to
  `#9CA3AF` (7.5:1), same for `text-inactive`.
- **diesel.necir.ph**: own short var names (`--amber`, `--surf`, `--tx`, `--line`,
  `--line-strong`), amber-led rather than sage. Consumes **zero** `--ig-*`.
- **research.necir.ph**: consumes **133** distinct `--ig-*` variables — closest to
  the upstream token system.

## Things I have already determined are NOT defects — challenge these if wrong

1. `research.necir.ph` has `.ink-table { min-width: 780px }` and
   `.diagram svg { min-width: 1040px }`. Both sit inside an ancestor with
   `overflow-x: auto` (`.panel-body` and `.diagram` respectively). I read these as
   an intentional horizontal-scroll pattern for dense data, not overflow bugs.
2. `diesel.necir.ph` has routes `/banner`, `/marquee`, `/poster`, `/social` that
   render fixed 1080x1080 and 1080x1920 artboards for exporting social images.
   I read these as intentionally fixed-size and out of scope for mobile work.
3. `diesel.necir.ph`'s strategy — 22 `clamp()` plus a single `min-width: 820px`
   breakpoint, with hover effects correctly gated behind
   `(hover: hover) and (pointer: fine)` — I read as the most mature of the three,
   not as "only one breakpoint, therefore under-done".

## Response contract — answer exactly these, numbered, in order

1. **Which of the three is actually worst on a phone, and on what evidence?**
   The raw counts say `research.necir.ph` (zero responsive utilities). But it has
   the one genuine layout breakpoint and 133 design tokens. `necir.ph` has zero
   viewport queries AND zero `clamp()` across 1,658 lines. Argue which reading is
   right and name the metric that would settle it.
2. **Is "zero responsive utilities" ever fine?** A prose-led site of constrained
   `ch`-measure columns can be fully fluid with no breakpoints at all. State the
   conditions under which a zero-breakpoint site is genuinely correct, and the
   specific symptoms that prove it is not.
3. **Challenge my three "not a defect" calls above.** For each: right or wrong,
   and what specifically would change your mind.
4. **`env(safe-area-inset-*)` is absent from all three.** Does that matter for
   sites that are scroll-only documents with no fixed/sticky bottom bar? Name the
   exact conditions under which its absence becomes a visible defect.
5. **No e2e suite on any of the three.** What is the minimum viable mobile
   regression guard for a 5-route static-ish SvelteKit site — one that catches
   real breakage without becoming a snapshot-maintenance tax? Be concrete about
   what to assert.
6. **Three sites, three different theme implementations of one design system**
   (`@theme` + hardcoded hex / own short vars / 133 upstream `--ig-*` vars). Is
   unifying them a prerequisite for the mobile work, orthogonal to it, or an
   actively bad idea to bundle with it?
7. **What am I not asking that I should be?** One item, the most consequential.

Be specific and terse. Cite exact properties, values and file-level facts from the
table where you assert something. Write "unknown" rather than inventing.
