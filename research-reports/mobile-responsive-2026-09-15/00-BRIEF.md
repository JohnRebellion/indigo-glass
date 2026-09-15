# Review request: making a personal design system's web surfaces mobile-friendly

You are reviewing a **finding and a proposed scope decision**, not a proposal to
build something new. Assume competence. Skip generic advice ("use media
queries", "test on real devices", "consider mobile-first"). I want the failure
modes and the wrong assumptions a careful outside reviewer sees.

## Context

A single operator maintains a personal design system ("Sage Ink") applied across
a Linux desktop and the browser. Colour is authored once in OKLCH; codegen emits
per-layer configs; a drift guard fails the build when a layer's literals diverge.

Two web surfaces exist:

**A. Stylus per-site userstyles — 14 third-party sites.**
Each is a `.user.css` with `@-moz-document` blocks that redeclare the *site's own*
CSS custom properties at `:root` (Primer ~1260 tokens, Facebook 982, Atlassian
649, Fluent 526, Copilot 409, Codex 193). Plus radius zeroing and `color-scheme:
dark`. Google is the exception: it publishes no design tokens, so it is styled
with structural selectors against obfuscated per-build class hashes.

Design language is fixed and not up for review: opaque surfaces only, radius 0,
colour-as-elevation, no blur/gradient/translucency, squircles ruled out.

**Measured fact:** across all 14 files, the total count of layout-affecting
declarations (padding/margin/width/height/font-size/grid/display/position/gap/
inset, excluding custom-property definitions) is **one**:

```css
/* google.user.css — scoped by negative lookahead to exclude Images/Video/Shopping tabs */
@-moz-document regexp("https?://(www|encrypted)\\.google\\.[a-z]{2,3}(\\.[a-z]{2})?/search\\?(?!.*(udm=2|udm=7|udm=28|tbm=isch|tbm=vid|tbm=shop)).*") {
  #rcnt:not(:has(#rhs)) #center_col {
    grid-column: 4 / span 15 !important;   /* 15 tracks = 820px, starts at track 4 */
  }
}
```

Zero `@media` queries exist in any of the 14 files.

History: four earlier guessed structural rules shipped broken (a `max-width` on
a grid item collapsed Google's Images masonry into one 290px column and wrapped
result titles one word per line; three selectors matched nothing at all). A
Playwright/CDP harness was built in response — it injects a style into the real
system Edge, screenshots, and reports surviving radii, off-palette fills,
contrast (rest + real Tab-press focus pass), disabled-control contrast, and
saturated SVG brand paint. It already runs a **900px narrow pass** and flags
style-introduced horizontal overflow and >1.5x/<0.6x document-height change.

**B. A SvelteKit "simulator" site — the operator's own web property.**
8 routes (Overview, Browser, VSCode, Claude Code, GRUB, Neobrutalism, Density,
Palettes), 2670 lines of Svelte. Current responsive state, measured:

- `@media` blocks in `src/`: **3 total** — `prefers-reduced-motion` x2,
  `color-gamut: p3` x1 — plus exactly **one** viewport query,
  `@media (max-width: 1080px)` collapsing the palettes stage to one column.
- `@container`: **one** (`max-width: 520px` on a palette-window card grid).
- `100vh` used in **5** places including the app shell `min-height` and two
  `calc(100vh - 36px)` editor panes.
- Hard desktop widths: VSCode sidebar `320px`, command palette `560px`,
  palettes stage `grid-template-columns: minmax(0,1fr) 320px`, page caps
  720/920/1100/1200/1420/1560px.
- Header nav is 8 tabs in a single flex row with `margin-left: auto`, tab
  padding `3px 10px`, font-size `10pt`.
- `playwright.config.ts` pins `viewport: { width: 1400, height: 900 }`,
  one project: `Desktop Chrome`. Visual snapshot tests exist at that size only.

## Research findings I am acting on

1. Stylus is genuinely available on Firefox for Android (AMO Android listing,
   v2.4.13, 132,922 users, updated 2026-09-14). Firefox for Android opened to
   the full AMO catalogue on 2023-12-14. So the userstyles *do* reach phones.
2. WCAG 2.2 SC 2.5.8 target minimum is 24x24 CSS px; Material 48dp, Apple 44pt.
3. `dvh`/`svh`/`lvh` are Baseline since 2022-23; `svh` avoids dvh's reflow churn.
4. `text-size-adjust` — mobile text inflation; MDN warns `none` is only safe on
   a genuinely responsive page.

## The scope decision I have provisionally made

The user asked to "have all our websites with sage-ink theme mobile friendly or
better suited (layout and space utilization)". I read the measured evidence as:

- **The 14 Stylus styles are already viewport-agnostic by construction.** A
  `:root` custom-property remap has no layout opinion; the site's own responsive
  CSS continues to run. There is nothing to "make mobile friendly" there, and
  adding structural/space-utilisation rules to other people's responsive sites
  is precisely the change class that produced all four historical breakages.
  Proposed work is therefore *defensive only*: (a) gate the single Google
  `grid-column` rule behind a `@media (min-width: …)` so it cannot fire on the
  mobile SERP DOM, (b) extend the harness narrow pass from 900px to a real
  phone viewport (e.g. 390x844, `isMobile`/`hasTouch`/mobile UA via CDP
  `Emulation.setDeviceMetricsOverride`), (c) add a touch-target audit at that
  width to catch places the retint made a control read smaller than it is.
- **The real mobile work is the simulator** — that is where fixed 320px rails,
  a 5-way `100vh`, an 8-tab single-row header, and a desktop-only Playwright
  project actually break on a phone.

## Response contract — answer exactly these, in this order, numbered

1. **Is the scope read wrong?** Specifically: is "a `:root` token remap has no
   layout opinion" actually true, or are there real mechanisms by which a
   colour-only userstyle changes layout or space utilisation on a phone? Name
   the mechanisms concretely. If you think there are none, say so plainly.
2. **What breaks on mobile that a colour-only userstyle *does* own?** Consider
   `color-scheme: dark` on mobile UA widgets, scrollbar rules on overlay
   scrollbars, `::selection` vs touch selection handles, focus-ring rules under
   `pointer: coarse`, font metric overrides (`size-adjust`/`ascent-override`)
   interacting with mobile text inflation.
3. **Attack the Google fix.** Is `@media (min-width: …)` the right gate for a
   rule keyed to a desktop-only DOM, or is it the wrong signal? What would you
   use instead, and what breaks in a tablet/landscape/desktop-mode-request case?
4. **Attack the harness plan.** What does CDP `setDeviceMetricsOverride` with
   `mobile: true` against a *real logged-in Edge profile* fail to reproduce that
   matters here? Rank by how likely it is to produce a false clean result.
5. **Simulator: name the 5 highest-value changes**, in order, with the specific
   CSS. Constraints: opaque surfaces, radius 0, no blur/gradient, no squircle,
   and the existing visual-snapshot tests must not be silently invalidated.
6. **What am I not asking that I should be?** One item. Most consequential.

Be specific and terse. Cite the exact selector/property/value where you assert a
fix. If you don't know something, write "unknown" rather than inventing.
