# Mobile-friendly layout & space utilisation for the Sage Ink web surfaces: Research Report
*Date: 2026-09-15 | Sources: 14 web + 2 cross-model returns | Overall Confidence: High on scope, Medium on remedies*

## Executive Summary

The request splits into two surfaces that need **opposite** answers. The 14 Stylus
per-site styles are already viewport-agnostic by construction: they set 625 custom
properties, every one of them colour or radius (both paint-only), and contain **zero**
`@media` queries. Only **8 declarations across all 14 files touch the box model at all**
— seven borders and one `grid-column`. There is no meaningful "space utilisation" work
available there, and adding structural rules to other people's responsive sites is
precisely the change class that produced all four breakages documented in
[scripts/style-check/README.md](scripts/style-check/README.md).

The genuine mobile work is the **simulator** — the project's own SvelteKit site. Across
2,670 lines of Svelte it has exactly **one** viewport media query and **one** container
query, uses `100vh` in five places including the app shell, hard-codes 320px/560px
desktop rails, packs eight nav tabs into a single non-wrapping flex row at ~22 CSS px
tall (below the WCAG 2.2 24px minimum), and its Playwright config pins a single
`Desktop Chrome` project at 1400×900, so no mobile regression can ever be caught.

Recommendation: treat the Stylus layer as *defensive hardening only* (gate Google's one
structural rule, extend the harness to a phone viewport), and put the actual responsive
work into the simulator.

## Codebase Context

Sage Ink is a cross-platform design system (KDE, GTK, terminal, editors, GRUB, browser)
with colour authored once in OKLCH and codegen emitting per-layer configs. The browser
layer is a universal Stylus style (typography/scrollbar/selection/focus, no colour), 14
per-site Stylus styles (full retint through each site's own design tokens), and a Dark
Reader preset as fallback. A Playwright/CDP harness (`scripts/style-check/`) verifies
styles against the real logged-in browser. The simulator (`simulator/`) is a SvelteKit
site that renders the system's surfaces for review and holds visual snapshot tests.

## Findings

### 1. Can Stylus userstyles reach a phone at all?

**Yes — and this changed recently enough that stale sources say otherwise.**

FACT: Mozilla opened Firefox for Android to the full AMO catalogue on **14 December
2023**, shipping 400+ extensions at launch and making Firefox for Android "the only
major Android browser that supports an open extension ecosystem"
([Mozilla Add-ons Blog](https://blog.mozilla.org/addons/2023/11/28/open-extensions-on-firefox-for-android-debut-december-14-but-you-can-get-a-sneak-peek-today/),
[gHacks](https://www.ghacks.net/2023/12/15/firefox-for-android-now-supports-over-450-add-ons/)).

FACT: Stylus is live on the AMO **Android** listing — v2.4.13, **132,922 users**, 4.7★
from 1,224 reviews, last updated 2026-09-14
([AMO Android](https://addons.mozilla.org/en-US/android/addon/styl-us/)).

CONTRARIAN / STALE: the project's own discussion thread
([openstyles/stylus#1197](https://github.com/openstyles/stylus/discussions/1197))
still reads "Stylus worked in mobile Firefox for quite a long time a few years ago… I
don't know what happened since," with workarounds via Firefox Nightly add-on
collections. That thread is from 2020–2021 and has been overtaken by the December 2023
change. Anyone searching this question will hit the stale thread first.

INFERENCE: On iOS there is no equivalent — Stylus has no iOS build and WebKit's
extension model does not cover it. Mobile coverage is Android/Firefox in practice.

### 2. Do the per-site styles actually have a layout opinion?

**Measured, and the answer is "almost none" — but not zero, and my first count was wrong.**

FACT (measured in-repo, 2026-09-15):

| Measure | Value |
|---|---|
| Site style files | 14 |
| `@media` queries across all 14 | **0** |
| Unique custom properties set | **625** — all colour or radius; no spacing, sizing, font-size or line-height tokens |
| Layout-affecting declarations | **8** |

The eight:

- `border-width: 2px !important` on `[role="dialog"], [role="menu"]` —
  [claude-ai.user.css:64](browser/stylus/sites/claude-ai.user.css#L64),
  [chatgpt.user.css:63](browser/stylus/sites/chatgpt.user.css#L63),
  [linear.user.css:62](browser/stylus/sites/linear.user.css#L62),
  [notion.user.css:79](browser/stylus/sites/notion.user.css#L79)
- `border: 1px solid #1C1C1E !important` —
  [google.user.css:74](browser/stylus/sites/google.user.css#L74) (the `.RNNXgb` search field),
  [facebook.user.css:229](browser/stylus/sites/facebook.user.css#L229),
  [youtube.user.css:212](browser/stylus/sites/youtube.user.css#L212)
- `grid-column: 4 / span 15 !important` on `#rcnt:not(:has(#rhs)) #center_col` —
  [google.user.css:224](browser/stylus/sites/google.user.css#L224)

**Correction earned from the cross-model pass.** My first pass reported "one
layout-affecting declaration" because the grep excluded custom-property definitions and
did not include `border`/`border-width`. The reviewing model pushed on exactly that
exclusion — "the measured zero is an artifact of excluding `--` definitions… if any of
those 1260+ tokens are non-colour, the remap IS layout." Re-grepping the 625 set
properties confirmed all are colour/radius, so the *token* half of its objection does not
land here — but re-running for box-model properties surfaced the seven border
declarations the first count missed.

INFERENCE on impact: `border-width` changes the box only under `content-box` sizing; all
seven targets are modern app surfaces that use `border-box`, so the practical effect is
near-zero. Google's `.RNNXgb` is the one worth a look — the stock field is painted
`rgb(77,81,86)` with a 26px pill radius and the rule *adds* a 1px border, so on a ~360px
SERP where the field is close to full-bleed it can contribute a 2px horizontal overflow.
Cheap to check with the harness's existing overflow warning.

### 3. What a colour-only userstyle *does* own on mobile

These are the mobile-specific surfaces the styles genuinely control. Both reviewing
models converged here; support levels vary.

- **`color-scheme: dark`** — set by every file that forces a dark surface stack, and
  already documented in [browser/stylus/sites/README.md](browser/stylus/sites/README.md)
  as a round-1 cross-model finding. On mobile it additionally drives native `<select>`,
  date and time pickers, which Firefox for Android renders as system widgets with their
  own metrics. INFERENCE (both models raise it; neither cites a measurement). Worth a
  harness probe, not a code change.
- **Scrollbar rules** — mobile uses overlay scrollbars, so the universal style's
  `scrollbar-color`/thumb rules are mostly inert on a phone. Harmless but also not the
  space win it is on desktop. FACT by construction.
- **`::selection`** — repaints the selection fill; it does **not** control the Android
  touch selection *handles*, which the UA draws from its own theme. A low-contrast
  selection fill can leave the handles as the only visible affordance. INFERENCE
  [unverified — single source].
- **Focus ring under `pointer: coarse`** — `*:focus-visible` with a `#A6C9A6` outline
  plus a 4px soft glow behaves the same on touch; the ring only appears for keyboard
  focus, so a phone user without a keyboard never sees it. No action needed, but it means
  the harness's Tab-press focus pass is testing something the mobile user will not hit.
- **Font metric overrides vs. mobile text inflation** — the universal style's
  `size-adjust: 105% / ascent-override: 90% / descent-override: 22%` on `IndigoCarlito`
  are `@font-face` descriptors and are orthogonal to `text-size-adjust`, which is a
  *separate* property controlling the browser's text-inflation algorithm
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-size-adjust)). One model
  conflated `font-size-adjust` with `text-size-adjust` and asserted the overrides disable
  inflation — **that claim is wrong** and is not carried forward. MDN's actual guidance:
  `text-size-adjust: none` is only safe on a genuinely responsive page; leave it `auto`
  otherwise. The site styles set neither, which is correct.

### 4. Gating Google's structural rule — `min-width` is the wrong signal

The rule at [google.user.css:224](browser/stylus/sites/google.user.css#L224) re-places a
grid item into 15 tracks (≈820px) starting at track 4. It is already scoped by a negative
lookahead excluding `udm=2|udm=7|udm=28|tbm=isch|tbm=vid|tbm=shop` and by
`:not(:has(#rhs))`.

INFERENCE (both models, converging): `@media (min-width: …)` gates on *viewport width*,
which is not the same question as *which DOM did Google serve*. The failure case is the
"Request desktop site" toggle: Chrome for Android sets the layout viewport to 980px in
desktop mode, so a `min-width: 960px` gate **fires** while the physical screen is 390px —
the rule lands on a desktop DOM squeezed into a phone, which is the widening bug from
v0.3.0 all over again. Firefox for Android's desktop-mode viewport width is **unknown**
and would need measuring.

The genuinely safer signals, in the order the review put them:

```css
/* input modality, not viewport width */
@media (any-pointer: fine) and (min-width: 960px) { … }
```

`any-pointer: fine` stays false on a touch-only phone even in desktop mode, and stays
true on a tablet with a trackpad or a hybrid device — which is the case where the desktop
grid is actually wanted. The `min-width` is kept as a second condition, not the only one.

CONTRARIAN: the reviewer also noted the gate may be **redundant** — on a genuine mobile
SERP, `#rcnt`/`#center_col` and the 16-track grid do not exist, so the selector cannot
match. The real risk window is not phone but **tablet landscape (768–1024px)**, where
Google may serve a grid with fewer than 19 tracks and `4 / span 15` overflows. That is a
measurable question, not a theoretical one.

### 5. What the harness can and cannot see at phone width

FACT (in-repo): [check.mjs:316-319](scripts/style-check/check.mjs#L316-L319) already runs
a **900px narrow pass** and re-audits radii and fills at that width, and
[check.mjs:301](scripts/style-check/check.mjs#L301) already flags style-introduced
horizontal overflow plus >1.5×/<0.6× document-height change. The mobile extension is an
increment on existing machinery, not new machinery.

FACT: Playwright emulates a device by setting `viewport`, `userAgent`,
`deviceScaleFactor`, `isMobile` (Chromium-only, enables meta-viewport behaviour) and
`hasTouch` ([Playwright docs](https://playwright.dev/docs/emulation)). It is
"purely software-based — it resizes the viewport, swaps the user agent, scales pixels,
and enables touch inside a desktop browser engine, and it never runs an actual iOS or
Android device" ([TestDino](https://testdino.com/blog/playwright-mobile-testing)).

Blind spots that can produce a **false clean**, from the review, ranked:

1. **Dynamic viewport height / on-screen keyboard.** CDP holds the viewport static, so
   `dvh`/`svh` differences and keyboard-induced height collapse are invisible. Directly
   relevant — the simulator has five `100vh` usages.
2. **Pointer/hover media queries.** CONTESTED: one model asserts `mobile: true` does not
   synthesize `pointer: coarse`. In Chromium, coarse pointer follows **touch emulation**
   (`hasTouch` / `Emulation.setTouchEmulationEnabled`), not the `mobile` flag — so the fix
   is to set `hasTouch` explicitly rather than to distrust the harness. Verify before
   relying on either reading.
3. **User agent.** `Emulation.setDeviceMetricsOverride` does not change the UA string —
   that is `Network.setUserAgentOverride`, a separate call. Any site that branches its DOM
   on UA (Google does) will serve the desktop DOM to a 390px viewport unless the UA is
   overridden too. **This is the single most likely cause of a misleading pass.**
4. **`env(safe-area-inset-*)`.** Not emulated; notch/home-indicator padding is invisible
   to the harness.
5. **Overlay vs gutter scrollbars.** Desktop Edge reserves a gutter mobile browsers do
   not, so overflow readings are slightly pessimistic rather than optimistic — the safe
   direction.
6. **Text inflation.** Desktop Chromium does not run the mobile inflation algorithm, so
   any inflation-driven overflow is missed. Low relevance here since nothing sets
   `text-size-adjust`.

### 6. The simulator — where the actual mobile work is

FACT (measured in-repo, 2026-09-15), across 2,670 lines of Svelte in 9 route files:

| Measure | Value |
|---|---|
| `@media` blocks in `src/` | 5 — of which **4** are `prefers-reduced-motion` / `color-gamut: p3` |
| Viewport media queries | **1** — [palettes/+page.svelte:575](simulator/src/routes/palettes/+page.svelte#L575) `@media (max-width: 1080px)` |
| `@container` queries | **1** — [palettes/+page.svelte:525](simulator/src/routes/palettes/+page.svelte#L525) |
| `100vh` usages | **5** — [+layout.svelte:57](simulator/src/routes/+layout.svelte#L57), [palettes:205](simulator/src/routes/palettes/+page.svelte#L205), [vscode:164](simulator/src/routes/vscode/+page.svelte#L164), [grub:189](simulator/src/routes/grub/+page.svelte#L189), [claude-code:112](simulator/src/routes/vscode/claude-code/+page.svelte#L112) |
| Playwright viewports | **1** — [playwright.config.ts:11](simulator/playwright.config.ts#L11) `1400×900`, project `Desktop Chrome` |

Hard desktop rails: VSCode sidebar `320px` ([vscode:389](simulator/src/routes/vscode/+page.svelte#L389)),
command palette `560px` ([vscode:499](simulator/src/routes/vscode/+page.svelte#L499)),
palettes stage `grid-template-columns: minmax(0, 1fr) 320px`
([palettes:295](simulator/src/routes/palettes/+page.svelte#L295)), page caps at
720/920/1100/1200/1420/1560px.

The shell header is eight tabs in a single flex row with `margin-left: auto`, tab padding
`3px 10px`, `font-size: 10pt` ([+layout.svelte:89-101](simulator/src/routes/+layout.svelte#L89-L101)).
INFERENCE: 10pt ≈ 13.3px at normal line-height ≈ 16px, plus 6px vertical padding ≈ **22
CSS px tall** — below the **24×24 CSS px** WCAG 2.2 SC 2.5.8 Level AA minimum
([Silktide](https://silktide.com/accessibility-guide/the-wcag-standard/2-5/input-modalities/2-5-8-target-size-minimum/)),
and far below Material's 48dp and Apple HIG's 44pt. Measurable exactly with the existing
harness; the arithmetic is an estimate until then.

Applicable modern primitives, all Baseline:

- **`svh` over `dvh` for the shell.** `dvh` tracks browser chrome in real time and
  reflows as it appears/disappears; `svh` is the worst-case stable value. The guidance is
  "use `min-height: 100svh` to guarantee content fits… avoiding dynamic reflows"
  ([modern-css](https://modern-css.com/mobile-viewport-height-without-100vh-hack/)).
  Dynamic viewport units are Baseline since 2022–23 at ~94% global usage.
- **Container queries** are Baseline widely available, supported in every major browser
  since 2023 ([modern-css](https://modern-css.com/articles/modern-css-units-you-should-know/)).
  The palettes route already proves the pattern in-repo; the VSCode and Browser routes are
  the obvious next adopters, since they are self-contained simulated chrome whose reflow
  should key off their own box, not the page.
- **`env(safe-area-inset-*)`** as bonus padding on top bars and bottom action rows,
  combined with `svh` ([modern-css](https://modern-css.com/mobile-viewport-height-without-100vh-hack/)).
- **Thumb zone.** Primary controls belong in the lower ~40% of the screen; the bottom
  third is easy for the thumb, the top is a stretch on a 6-inch phone
  ([Parachute Design](https://parachutedesign.ca/blog/thumb-zone-ux/)). The simulator's
  nav is top-anchored, which is the standard trade-off for a reference tool rather than a
  defect.

## Risks & Caveats

- **The scope reading is a judgement call, not a measurement.** "All our websites with
  sage-ink theme" could mean the 14 styled third-party sites or the project's own
  simulator. The evidence says the second is where the work exists; if the intent was the
  first, the answer is "there is almost nothing to do, and doing it is dangerous."
- **Cross-model returns contained two confident errors**, both excluded above: conflating
  `font-size-adjust` with `text-size-adjust`, and asserting mobile Safari shows a ~15px
  gutter scrollbar. Treat the unverified items in §3 accordingly.
- **The `pointer: coarse` / `mobile: true` question is genuinely contested** between the
  two returns and needs a five-minute empirical check before the harness change is
  written against either belief.
- **Firefox for Android's desktop-mode layout viewport width is unknown.** The 980px
  figure is Chrome's. The Google gate's failure case depends on it.
- **The simulator has visual snapshot tests at 1400×900.** Any change that is not
  strictly inside a narrow media/container query will invalidate them silently. Adding a
  second mobile Playwright project is additive and safe; editing shared CSS is not.
- **iOS is out of scope** and no source found suggests that changes.
- Single-source items are marked inline. Several §3 items are INFERENCE from the review
  rather than measured facts.

## Recommendation

1. **Split the work by surface, and do not "improve space utilisation" on the 14 site
   styles.** They set 625 paint-only properties and 8 box-model declarations; the layer is
   already viewport-agnostic, and structural additions to other people's responsive sites
   are the documented cause of every historical breakage. The only Stylus-side changes
   worth making are defensive: gate
   [google.user.css:224](browser/stylus/sites/google.user.css#L224) with
   `@media (any-pointer: fine) and (min-width: 960px)` rather than width alone, and
   measure whether Google's `.RNNXgb` 1px border adds overflow at 360–390px.

2. **Extend the existing harness to a real phone pass before changing anything.** The
   900px narrow pass at [check.mjs:316](scripts/style-check/check.mjs#L316) becomes a
   390×844 pass with `deviceScaleFactor: 3`, `hasTouch: true`, **and** a mobile UA
   override — the UA is the part most likely to produce a false clean, because Google
   branches its DOM on it. Add a target-size audit at that width reusing `contrast.mjs`'s
   existing "element that actually paints" traversal.

3. **Put the responsive work in the simulator, in this order:** replace the five `100vh`
   with `100svh`; make the 8-tab header wrap or scroll below ~640px with tabs raised to a
   ≥24px (preferably 44px) target; collapse the `minmax(0, 1fr) 320px` palettes stage and
   the 320px VSCode rail via container queries on their own shells rather than page-level
   media queries; add a second Playwright project at a phone device descriptor so the
   changes are actually guarded. Every rule scoped inside a narrow query, so the 1400×900
   snapshots stay byte-identical.

**One open question worth your call before implementation:** whether the simulator is in
scope at all. Everything above assumes "our websites" includes it, because that is the
only place the requested work exists.

## Sources

1. **Stylus — AMO Firefox Android listing** — https://addons.mozilla.org/en-US/android/addon/styl-us/ — proves Stylus ships on Android; v2.4.13, 132,922 users — 2026-09-14
2. **Open extensions on Firefox for Android debut December 14** — https://blog.mozilla.org/addons/2023/11/28/open-extensions-on-firefox-for-android-debut-december-14-but-you-can-get-a-sneak-peek-today/ — the policy change that made mobile userstyles viable — 2023-11-28
3. **Firefox for Android now supports over 450 add-ons** — https://www.ghacks.net/2023/12/15/firefox-for-android-now-supports-over-450-add-ons/ — independent confirmation of the launch — 2023-12-15
4. **openstyles/stylus Discussion #1197 — "Stylus for mobile?"** — https://github.com/openstyles/stylus/discussions/1197 — the stale contrarian source; useful as a warning — 2020–2021
5. **Playwright — Emulation** — https://playwright.dev/docs/emulation — viewport/isMobile/hasTouch/deviceScaleFactor/userAgent API — undated (current docs)
6. **Playwright Mobile Testing (2026 Guide), TestDino** — https://testdino.com/blog/playwright-mobile-testing — states the software-only limits of emulation — 2026
7. **WCAG 2.5.8 Target Size (Minimum), Silktide** — https://silktide.com/accessibility-guide/the-wcag-standard/2-5/input-modalities/2-5-8-target-size-minimum/ — the 24×24 CSS px AA minimum and its exceptions — undated
8. **WCAG 2.5.8 Implementation Guide, AllAccessible** — https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide — `@media (pointer: coarse)` 48×48 pattern; Apple 44pt / Material 48dp — undated
9. **CSS dvh, svh, lvh: Mobile Viewport Height Fix** — https://modern-css.com/mobile-viewport-height-without-100vh-hack/ — svh-over-dvh guidance, ~94% support since 2022 — 2026
10. **Modern CSS units you should know** — https://modern-css.com/articles/modern-css-units-you-should-know/ — container query units and Baseline status — 2026
11. **Complete Guide to Modern CSS in 2026, CSSAWWWARDS** — https://cssawwwards.com/blog/complete-guide-modern-css-2026 — container queries Baseline since 2023 — 2026
12. **MDN — text-size-adjust** — https://developer.mozilla.org/en-US/docs/Web/CSS/text-size-adjust — inflation algorithm; `none` only safe on responsive pages — current
13. **Mastering the Thumb Zone, Parachute Design** — https://parachutedesign.ca/blog/thumb-zone-ux/ — lower-40% reachability model — undated
14. **Mobile UX Design: A Complete Guide for 2026, UXCam** — https://uxcam.com/blog/mobile-ux/ — density and touch-target practice — 2026

Cross-model returns (in `returns/`): `r1-groq-big.md`, `r3-groq-big-q56.md` (openai/gpt-oss-120b);
`r4-qwen-q123.md` (qwen/qwen3.6-27b, truncated at the provider's output cap);
`r6-compound-q46.md` (groq/compound).

## Methodology

- Sub-questions investigated: 6
- Total searches run: 7
- Sources discovered: ~40; unique deep-read: 6
- In-repo measurements: 9 greps/counts across `browser/stylus/sites/`, `scripts/style-check/`, `simulator/src/`
- Cross-model review: brief in `00-BRIEF.md`, 4 returns from 3 distinct models
- Mode: direct (no agents)
- Flags:
  - **One headline finding corrected by the review** — "1 layout-affecting declaration" → 8, after the reviewer challenged the grep's exclusion of custom-property definitions.
  - Two model claims rejected as factually wrong (`font-size-adjust`/`text-size-adjust` conflation; mobile Safari gutter scrollbar).
  - One claim left CONTESTED (`mobile: true` vs `hasTouch` and `pointer: coarse`).
  - `qwen/qwen3.6-27b` could not complete a full-contract answer — the free tier's 1,000 output-tokens-per-minute cap truncated it; `openai/gpt-oss-20b` returned one line and was discarded.
  - Firefox for Android desktop-mode viewport width: **insufficient data found**.
