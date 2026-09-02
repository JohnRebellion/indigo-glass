# Sage Ink × neobrutalism.dev — implementation review — Round 1 brief

You are reviewing a **design-system implementation page** as an outside
expert. You have no repository access; everything you need is in this brief
and the attached files. Read them, then answer the numbered questions in the
exact format at the end.

I am asking a second frontier model the same questions independently. Where
you disagree with it, that disagreement is the point — do not hedge toward a
consensus answer, and **do not soften findings to be agreeable.**

---

## 0. The attachment

**`indigo-glass-simulator-neobrutalism.html`** is the artefact under review
and the only file you need. Open it in a browser.

It is the entire page as one self-contained file: every stylesheet inlined,
the three fonts subset to the 112 glyphs it draws and embedded as woff2,
every script stripped. It renders offline and makes **zero** network
requests. Nothing about it is a summary — the CSS you can read inside it is
the code that produced the pixels you can see.

**Read it three ways, because the review is the comparison between them:**

1. **As rendered output.** Scroll it. Does it look like the reference library
   would look if the reference had this palette?
2. **As source.** The `<style>` block is the implementation, 893 lines. Class
   names mirror the reference's component and `data-slot` names, so
   `.nb-select-trigger` is `SelectTrigger`, `.nb-button--reverse` is the
   `reverse` cva variant, and so on.
3. **As its own claims.** Every hex, ratio, size and duration printed on the
   page was read out of the live CSSOM at render time, not typed. If a label
   disagrees with the CSS beside it, that is a finding.

If your tooling cannot open HTML, say so in the caveats section and work from
`tile-01..05.png` — five contiguous strips of the same page. The visual half
of the review survives; the source half does not.

**Optional supporting files**, only if you want to check fidelity against the
reference without relying on your own recall of it:

| File | What it is |
| :--- | :--- |
| `01-APPENDIX-A-reference-classes.md` | The reference library's Tailwind class strings, verbatim from its source — ground truth for Q1 |
| `01-APPENDIX-B-implementation.css` | The same 893 lines of CSS as a standalone file, if a 219 KB HTML is awkward to parse |
| `measure/computed.tsv` | Computed style of one live instance of all 113 `.nb-*` primitives, plus the page's own contrast table |

---

## 1. What this is

**Sage Ink** is a cross-platform *neobrutalist* design system for one
developer's Linux workstation (Fedora 44, KDE Plasma 6.6, Wayland). One
palette applied across desktop, terminal, editor, browser, bootloader, login
screen, and a web/Tailwind theme.

Material grammar: **opaque flat surfaces, hard offset shadow (zero blur
radius), corner radius 0, colour-as-elevation.** No glass, no gradient, no
translucency outside a documented allowlist.

The system's README claims it is *"audited against the actual
neobrutalism.dev reference implementation (`ekmas/neobrutalism-components`),
not folk-knowledge neobrutalist styling."* **The page you are reviewing exists
to make that claim checkable.** Before it, the claim rested on prose.

**History matters for reading the code.** The system was *Lime Glass*
(visionOS glass, blur, soft elevation), became *Indigo Glass*, and in August
2026 moved glass → ink. The repo directory and token file are still named
`indigo-glass`. Some apparent inconsistency is migration residue.

## 2. Who maintains it, and what not to say

Solo developer, ~9 years professional, full-stack. Personal project, evenings
and weekends. No users but the author, no backwards-compatibility obligation,
no design-system team, no Figma workflow, no component-library release
process. Advice premised on any of those does not apply.

**Assume competence.** Do not recommend: "use design tokens" (there are 463
lines of them), "check your contrast" (every ratio on the page is computed at
runtime and labelled with its pairing), "write documentation" (7 docs files),
"add tests" (they exist — see §6), "consider accessibility" (it is measured).
Recommend changes to *this* artefact.

## 3. What the page is

One route, `/neobrutalism/`, that renders **every component in the reference
library** plus every styling page, in Sage Ink tokens, on a single page laid
out so one capture is a complete review artefact.

- **46 components.** The reference's `registry.json` has 44 `items` after
  removing eight `n*` entries (dependency-free rebuilds of components already
  listed); `combobox` and `data-table` are added because the docs site
  documents them as composed pages. 66 specimens cover the 46.
- **Everything interactive is forced open and rendered in flow.** Dialogs,
  sheets, drawers, popovers, tooltips, menus, toasts and open selects are
  never `position: fixed` — a screenshot cannot hover, and a fixed overlay
  would be captured once, on top of whatever was under it.
- **Styling pages**: the reference variable schema, full palette, chart
  slots, type scale, weights, families, line heights, shadow, radius, border,
  spacing, motion, and the project's own state grammar.
- **It ends in a 13-row divergence ledger** — every knowing departure from
  the reference, each with the value on both sides, the reason, and **the
  open question it raises**. Those questions are Q2–Q4 below.

## 4. How the page is built

```
simulator/src/routes/neobrutalism/+page.svelte   page shell, review brief, contents
simulator/src/lib/nb/nb-core.css                 token bridge + controls   ] inlined in
simulator/src/lib/nb/nb-surfaces.css             overlays, menus, nav      ] the attachment
simulator/src/lib/nb/Specimen.svelte             one labelled cell; `span` sets grid width
simulator/src/lib/nb/Section.svelte              a titled band of specimens
simulator/src/lib/nb/liveTokens.ts               runtime token resolution
simulator/src/lib/nb/roster.ts                   the component list, shared with the test
simulator/src/lib/nb/sections/*.svelte           7 files of markup over the two stylesheets
```

SvelteKit 2 + Svelte 5 (runes), static adapter, no CSS framework — the
reference is Tailwind v4 + React + Radix; **none of that is available here**,
so every component is reimplemented as hand-written CSS against the same
variable schema. That reimplementation is the main thing to review.

**Three deliberate architectural choices, each of which may be wrong:**

1. **The two stylesheets use the reference's own variable names**
   (`--main`, `--border`, `--shadow`, `--secondary-background`,
   `--main-foreground`, `--ring`, `--overlay`) rather than the project's
   `--ig-*` names, so a reviewer can diff schema against schema. Only the
   *values* bind to `--ig-*`. Every value that is not a straight re-point
   carries a `DIVERGENCE:` comment.
2. **Class names mirror the reference's component and `data-slot` names**
   (`.nb-button--reverse`, `.nb-select-trigger`, `.nb-accordion-content`),
   and state is expressed with the same `data-*` attributes Radix emits
   (`data-state="checked"`, `data-highlighted`), so the CSS selector reads
   the same on both sides.
3. **Labels are resolved at runtime, never typed.** Every hex, ratio, size
   and duration on the page is read out of the live CSSOM on mount. A
   hand-typed table would drift from the tokens; this one relabels itself.

## 5. The measurement that matters

Colour tokens are authored in OKLCH. `getComputedStyle().color` preserves
the authored colour space in Chrome, so an `oklch()` token round-trips
unchanged, and a naive numeric parse reads L/C/H as if they were R/G/B.

**The first version of this page shipped that bug** — it labelled `#07080A`
as `#000106` and reported every contrast ratio as a failure. It is now
resolved through a canvas, and there is a regression test. This is disclosed
because it is the exact class of error the page exists to catch, and it got
past a first review. **Assume there are more.**

Selected rows from `measure/computed.tsv` (full file attached):

```
selector                 background-color          border   radius  box-shadow
.nb-button--default      oklch(0.8 0.06 145)       2px      0px     rgb(137,168,137) 4px 4px 0 0
.nb-button--noShadow     oklch(0.8 0.06 145)       2px      0px     none
.nb-card                 oklch(0.134 0.0051 262)   2px      0px     rgb(137,168,137) 4px 4px 0 0
.nb-tabs-list            oklch(0.134 0.0051 262)   2px      0px     none
.nb-select-trigger       oklch(0.8 0.06 145)       2px      0px     none
.nb-popover              oklch(0.8 0.06 145)       2px      0px     none
.nb-checkbox             rgba(0,0,0,0)             0px*     0px     none      (*outline-2, not border)
.nb-switch-thumb         oklch(0.9791 0 89.88)     2px      9999px  none
```

Contrast, as the page computes it at runtime:

```
--foreground on --background                18.87:1  AAA
--foreground on --secondary-background      17.59:1  AAA
--main-foreground on --main                 11.00:1  AAA
--ring on --background                      18.87:1  AAA
--border on --background                     1.31:1  fail   <- see Q2
--overlay                                   n/a, alpha by design
```

## 6. Guards that already pass

- `scripts/check-palette-drift.sh` — repo-wide guard over four dimensions:
  **colour** (no off-variant hex), **material** (no backdrop filter, no
  box-shadow with a non-zero blur radius), **alpha** (no `rgba(a<1)`,
  `#RRGGBBAA`, or `color-mix(…, transparent)` outside a documented Tier A
  allowlist), **parity** (deployed files byte-match their generated
  counterparts). Clean, with this page in scope for material and alpha.
- `svelte-check` — 0 errors, 0 warnings across 350 files.
- 3 Playwright tests on this page: every roster entry has a specimen; the
  token resolver returns the right hexes; **no overlay is `position: fixed`**.

## 7. Already decided — do not re-litigate

- **Dark only.** No light variant will be added. The token file has one
  surface ladder and `opacity.window_active = 1.00`.
- **Sage `#A6C9A6` is fill-only.** It is 1.72:1 against the text colour and
  will never carry body text. That is a constraint, not an oversight.
- **Radius 0** is the canonical match to the KDE window decoration. Changing
  it means rebuilding a patched window-decoration library from source.
- **The reimplementation is hand-written CSS.** Adopting Tailwind, React or
  Radix to get closer to the reference is not on the table.
- **The single-file HTML is the primary artefact.** Tiles are a fallback.
- The eight `n*` registry entries are intentionally not counted separately.

## 8. Questions

Answer all eight. Q1 and Q5–Q7 are about execution; Q2–Q4 are the design
questions the page was built to get adjudicated.

**Q1 — Fidelity.** Comparing the reference's intent (Appendix A, or your own
knowledge of the library) against the CSS inside the attachment and what it
actually paints: **which components are wrong in a way the divergence ledger
at the bottom of the page does not already claim as deliberate?** Those are
bugs, not choices. Be specific — name the component and the property. If you
find none, say so plainly rather than manufacturing a finding.

**Q2 — The border/shadow contradiction.** The reference paints `--border` and
the drop shadow **pure black in both light and dark modes**. On a `#07080A`
page a black stroke is invisible, so this implementation lifts the border to
`#252528` (1.31:1 against the page) and colours the shadow with the accent's
darker step `#89A889`. **But the project's web/Tailwind layer kept the
reference's black.** Two answers ship simultaneously. Which is right, and is
`1.31:1` a border or an absence of one?

**Q3 — The press trigger contradiction.** The reference translates an element
into its own shadow on `:hover`. The project's philosophy document specifies
`:active`, 60 ms, `steps(2, end)` — "a stamp, not a spring". Both are wired on
this page. For a **desktop-first** system where hover is cheap and click is
committal, which is correct, and what breaks if the wrong one is chosen?

**Q4 — Has the material survived the palette?** Neobrutalism's canonical read
is **loud, saturated, flat colour on light**. This is a **dark-only** system
whose accent is `oklch(80% 0.06 145)` — near-achromatic sage, chroma 0.06
against the reference's 0.17. Looking at the rendered page: **is this still
neobrutalism, or is it a different material wearing the borders?** If the
latter, name the single change that would most recover the style without
abandoning the dark palette.

**Q5 — What is missing.** What does a well-built version of this audit page
have that this one does not? Consider what a reviewer needs that is absent,
not what a component gallery conventionally contains.

**Q6 — What is actively harmful.** Which of the three architectural choices
in §4, or which page conventions, are **actively harmful** as opposed to
merely useless? Distinguish the two. "Mirroring the reference's variable
names" and "resolving labels at runtime" are both defensible and both have a
cost; say what the cost is.

**Q7 — What breaks next.** The intent is to keep this page as the permanent
fidelity check and regenerate it whenever tokens change. **What would you
expect to break first**, and what guard is missing that would catch it?

**Q8 — What measurement would change your answer?** For each of Q2, Q3 and
Q4, name a specific measurement or test that would settle it. If you are
guessing, this is where to say so.

---

## 9. Response format

Reply in exactly this markdown skeleton. Keep prose tight; no preamble.

```markdown
## Q1 — Fidelity
| # | Component | Property | Reference | This page | Severity |
|---|-----------|----------|-----------|-----------|----------|
(one row per real defect; empty table plus one sentence if none)

## Q2 — Border and shadow colour
**Position:** <one sentence — which side wins>
**Reasoning:** <=150 words
**On the 1.31:1 border:** <verdict>

## Q3 — Press trigger
**Position:** <hover | active | both, scoped how>
**Reasoning:** <=150 words
**What breaks if wrong:**

## Q4 — Material vs palette
**Verdict:** <still neobrutalism | not>
**Reasoning:** <=200 words
**Single highest-leverage change:**

## Q5 — What is missing
1. ...  (ranked, most valuable first, max 6)

## Q6 — Actively harmful vs merely useless
**Actively harmful:**
**Merely useless:**
**Cost of the two defensible choices:**

## Q7 — What breaks first
**Prediction:**
**Missing guard:**

## Q8 — Measurements that would change your answer
| Question | Measurement | What result would flip you |
|----------|-------------|----------------------------|

## Confidence and caveats
Where you are guessing. What you would need to see to be sure. Say plainly if
a question was underspecified or if you could not open an attachment — do not
invent detail to fill the format.
```

Do not soften findings to be agreeable — a second model is being asked these
same questions independently for exactly that reason.
