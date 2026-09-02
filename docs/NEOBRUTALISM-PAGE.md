# `/neobrutalism/` — the implementation audit page

A single simulator route that renders **every** component in
[`ekmas/neobrutalism-components`](https://github.com/ekmas/neobrutalism-components)
plus every styling page, in Sage Ink tokens, laid out so one capture is a
complete review artefact. Built to be handed to another frontier model for a
second opinion — see [cross-model audit reports](../research-reports/).

## Why it exists

`README.md` claims Sage Ink is "audited against the actual neobrutalism.dev
reference, not folk-knowledge neobrutalist styling". Before this page that
claim rested on prose. Now it rests on 46 rendered specimens and a ledger of
every place the two disagree, with the reasoning attached to each one.

## Layout

| File | Role |
| :--- | :--- |
| `simulator/src/routes/neobrutalism/+page.svelte` | Page shell, review brief, contents |
| `simulator/src/lib/nb/nb-core.css` | Token bridge + controls — **the implementation under review** |
| `simulator/src/lib/nb/nb-surfaces.css` | Overlays, menus, navigation, chart |
| `simulator/src/lib/nb/Specimen.svelte` | One labelled cell; `span` controls grid width |
| `simulator/src/lib/nb/Section.svelte` | A titled band of specimens |
| `simulator/src/lib/nb/liveTokens.ts` | Canvas-resolved token values, so labels cannot drift |
| `simulator/src/lib/nb/roster.ts` | The reference's component list, shared with the e2e test |
| `simulator/src/lib/nb/sections/*.svelte` | Markup over the two stylesheets |

The two CSS files use the reference's **own variable names**
(`--main`, `--border`, `--shadow`, `--secondary-background`, …) so a reviewer
can diff schema against schema. Only the values are bound to `--ig-*`. Every
value that is not a straight re-point carries a `DIVERGENCE:` comment, and
each of those is restated in the on-page ledger.

## Conventions the page must keep

- **Nothing is `position: fixed`.** Dialogs, sheets, menus, tooltips and
  toasts render in flow and forced open, because a screenshot cannot hover.
  Enforced by `e2e/neobrutalism.spec.ts`.
- **Labels are resolved at runtime**, never typed. `liveTokens.ts` paints one
  canvas pixel to get sRGB, because `getComputedStyle().color` round-trips an
  `oklch()` token unchanged and a naive numeric parse reads L/C/H as R/G/B.
- **Every contrast ratio names its pairing.** A bare number against an
  implicit background is an a11y claim that reads as rigour and means nothing.
- **The page obeys the same guards as the rest of the repo.**
  `scripts/check-palette-drift.sh` scans `simulator/` for `--material` and
  `--alpha`: no frosted material, no non-zero shadow blur, no translucency
  outside Tier A. Disabled states use `opacity:`, and the only alpha on the
  page is `--overlay` on the modal scrim.

## Regenerating the capture

```bash
cd simulator
npm run build
node scripts/shoot-neobrutalism.mjs            # 2x full + 1x tiles + 1x sections
node scripts/shoot-neobrutalism.mjs --width 1560 --scale 2
```

Writes to `simulator/screenshots/neobrutalism/` (gitignored):

- `tile-NN.png` — **upload these.** Contiguous 1x bands of the whole page,
  each under the 8000px / 3.75MP limit that Anthropic, ChatGPT and Gemini all
  enforce, overlapping 40px so nothing lands in a seam.
- `<section>.png` — one per section, split the same way; for "review just the
  buttons".
- `full.png` — the archival master at `--scale`. Deliberately over every
  upload limit; use the tiles instead.

## The single-file export

```bash
cd simulator && npm run build
node scripts/bundle-single-file.mjs
# -> screenshots/neobrutalism/indigo-glass-simulator-neobrutalism.html  (214 KB)
```

**This is the artefact to hand to anyone outside this machine.** One file:
stylesheets inlined, the three fonts subset to the glyphs the page actually
draws and embedded as woff2 (3,109 KB of TTF → 54 KB), every script stripped.
It renders offline with zero network requests, and it carries both the pixels
and the source — a screenshot loses the CSS, and a directory loses
portability.

`adapter-static` alone will not do this. `+layout.ts` sets `ssr = false`, so
prerendering emits a 2 KB JS-dependent shell with zero specimens in it; and
even with SSR on, the token labels come from `liveTokens.ts`, which needs a
real browser (`getComputedStyle` plus a canvas to convert `oklch()` to sRGB).
The bundler is therefore a post-build step: render in Playwright, wait for
hydration so the computed labels bake into the DOM, then inline and strip.

`vite-plugin-singlefile` is the toolchain alternative and is worse here — it
inlines the JS bundle, so the file still has to execute to render, and it does
not subset fonts (~4 MB).

## Measuring the page

```bash
cd simulator && node scripts/dump-computed.mjs > /path/to/computed.tsv
```

Dumps the computed style of one live instance of every `.nb-*` primitive,
plus the contrast table the page computed for itself. Pair it with the
reference's own Tailwind class strings and the gap between the two is where a
fidelity bug lives — this is what caught `.nb-badge--tag` rendering with no
fill, and `--overlay` mislabelling itself by one unit of red.

## Self-audit

The page measures itself on load and publishes the result, including the
number it does worst on. `src/lib/nb/measureEdges.ts` asks the only question
that tests the material claim: for a component with **no shadow**, is there
anything to see the boundary by? A component whose fill is within 1.5:1 of the
page *and* whose stroke is within 1.5:1 of its own fill has no silhouette,
however correct its CSS is.

```bash
cd simulator && node scripts/measure-edges.mjs
```

The 2026-09-02 cross-model audit found **23 of 42** shadowless bordered
components failing this — every neutral surface in the system, leaving the
sage shadow to carry both silhouette and elevation. `nb-core.css` now
overrides `--border` to a candidate `#5E5E63` (3.11:1 vs base), which takes it
to **0 of 42**. That override is local to this page on purpose:
`border_strong` feeds Klassy, GTK, VSCode, Konsole and the KDE colour schemes,
and promoting it is gated on a round-2 review.

## Tests

```bash
cd simulator && npx playwright test e2e/neobrutalism.spec.ts
```

Five guards:

- every entry in `roster.ts` has a specimen
- the live token resolver returns the right hexes
- no overlay is `position: fixed`
- **no specimen overflows the page horizontally** — `grid-column: span 99` on
  a `repeat(auto-fill, …)` grid makes it materialise 99 tracks, which shipped
  once during construction and only a screenshot caught it
- **computed styles match a reviewed baseline** (`e2e/golden.spec.ts`)

The golden baseline exists because the page resolves and prints its own token
values at runtime, which is good for freshness and bad for evidence: if the
resolver or the cascade is wrong, the specimen and the label it is judged by
are wrong *together*, and the audit endorses the regression. So that guard
deliberately does the dumbest possible thing — stores raw `getComputedStyle`
strings and compares them as strings, with no colour conversion or arithmetic
that could be wrong in the same way the page is. Demonstrated: changing
`--ig-radius-xs` from 2px to 6px passes all four other tests and is caught
only by this one.

```bash
UPDATE_GOLDEN=1 npx playwright test e2e/golden.spec.ts   # then review the diff
```

## Specimen status vocabulary

`variant` on each cell makes four distinct claims, because a single "match"
overstated fidelity — the tooltip was labelled a match while its type size
differed from the reference:

| Status | Meaning |
| :--- | :--- |
| `equivalent` | The reference's own rules, re-expressed |
| `divergence` | Knowingly different; there is a ledger row for it |
| `accommodation` | The reference ships no styling here (behaviour-only wrapper, or a cover over Recharts/Vaul/cmdk/Embla/day-picker), so this surface was invented and proves nothing about fidelity |
| `extends` | Sage Ink adds something the reference has no concept of |

Overlays are rendered in flow and forced open, so their **positioning,
collision handling and stacking are not under test** — only fill, stroke,
shadow, radius and typography are. The page says so on itself.

## Audit history

[research-reports/neobrutalism-page-audit-2026-09-02/](../research-reports/neobrutalism-page-audit-2026-09-02/)
— GPT and Gemini, independently, on the single-file export. Brief, verbatim
returns, synthesis, and predictions with recorded outcomes.

> The roster is the reference's `registry.json` `items` minus the eight `n*`
> duplicates (dependency-free rebuilds of components already listed), plus
> `combobox` and `data-table`, which the docs site documents as composed
> pages with no styling of their own. 46 entries.

## See also

- [PHILOSOPHY.md](PHILOSOPHY.md) — why the material is what it is
- [STATE_GRAMMAR.md](STATE_GRAMMAR.md) — the Tier A/B/C/D rule the ledger keeps invoking
- [TYPOGRAPHY.md](TYPOGRAPHY.md) — the pt-based scale the page renders
