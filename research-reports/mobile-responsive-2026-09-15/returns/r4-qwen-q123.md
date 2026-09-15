
<think>
The user wants me to act as a hostile senior front-end reviewer answering exactly 6 contract questions. Wait, they say "Answer ONLY contract questions 1, 2 and 3." Let me re-read.

The system prompt says: "Answer ONLY contract questions 1, 2 and 3. Under 600 words total. No tables, no preamble. Disagree where you disagree."

But the user's response contract lists 6 questions. The system prompt overrides: I answer only 1, 2, and 3. Under 600 words. No tables, no preamble. Disagree where I disagree.

Let me think carefully about each:

**Q1: Is "a :root token remap has no layout opinion" true?**

Actually, it's not entirely true. Let me think about mechanisms:

- `:root` custom property remaps: if the site reads a token like `--some-color` and uses it in a `background` that affects `color-scheme` interaction... no, colour itself doesn't affect layout.
- BUT: `color-scheme: dark` IS in the userstyles. `color-scheme` affects: default form control rendering (native select dropdowns, date pickers), scrollbar colors, and crucially the default background color of the page. On mobile, `color-scheme: dark` changes how the browser chrome (address bar, etc.) renders. But that's browser chrome, not page layout.
- Does `color-scheme` affect layout? It changes the default `background-color` and `color` values the UA applies. If a site has `background: var(--bg)` and the remap changes that... no, that's still just colour.
- Wait: `color-scheme: dark` on mobile changes the appearance of native form controls. A `<select>` in dark mode may render with a different height/spacing in some engines. That's a layout-affecting mechanism.
- Also: if the userstyle sets `radius 0` (border-radius: 0), that's a layout-affecting declaration in the sense that it changes the visual bounding box, but more importantly `border-radius` doesn't affect flow layout. It's purely paint.
- Radius zeroing: `border-radius: 0` — does NOT affect layout, box model, or space utilization. It's a paint-only property. So "radius zeroing" is actually layout-neutral.
- `color-scheme: dark` — this IS a real mechanism. It changes UA-styled element appearance. On mobile Firefox for Android, native form widgets (select, input[type=date], input[type=color]) render differently in dark scheme. The select dropdown height, the date picker's internal layout — these are UA-controlled and can shift.
- Also: if the userstyle overrides a custom property that the site uses in a `min-height: calc(var(--something) * 2)` — but wait, the tokens being remapped are colour tokens (Primer, Fluent, etc. have colour tokens). Are there non-colour tokens in those systems? Primer has spacing, sizing... but the user says they're remapping *colour* tokens specifically. Let me re-read: "redeclare the site's own CSS custom properties at :root (Primer ~1260 tokens, Facebook 982...)" — these are the site's tokens. If the remap includes non-colour tokens (spacing, sizing), then YES it changes layout. But the user frames this as colour. The measured fact says "the total count of layout-affecting declarations... is one." So the user is claiming only colour properties are remapped. I should challenge this: are you SURE all 1260 Primer tokens being remapped are colour? Primer has `--spacing-*`, `--font-size-*`, `--border-radius-*` tokens. If you're remapping ALL of them, you ARE changing layout.

Actually wait — re-reading: "redeclare the site's own CSS custom properties at :root." The user says the design language is "colour-as-elevation, radius 0." So they ARE zeroing radius (which is paint-only) and remapping colours. But if the token set includes `--font-size-body` or `--spacing-4`, remapping those IS layout. The "one layout-affecting declaration" count might miss custom property definitions (the user excludes them: "excluding custom-property definitions"). So the real answer: the measured zero is an artifact of excluding `--` definitions. If any of those 1260+ tokens are non-colour, the remap IS layout.

**Mechanisms to name:**
1. `color-scheme: dark` changing UA form control metrics on mobile (select height, date picker internals).
2. If ANY remapped custom property is non-colour (font-size, spacing, line-height), it directly changes flow. The count of "one" excludes `--` definitions, which is the mechanism.
3. `border-radius: 0` is paint-only, NOT layout. So that's fine.
4. On mobile, `color-scheme: dark` changes the default scrollbar appearance (overlay vs classic), which on some mobile UAs takes layout space if the site overrides scrollbars.

**Q2: What breaks on mobile that a colour-only userstyle DOES own?**

- `color-scheme: dark` on mobile: native widget chrome (address bar, form controls) inverts. On Firefox Android, the URL bar, the select dropdown, date pickers all render dark. If the site's JS reads `getComputedStyle(document.documentElement).backgroundColor` to set a theme, it now gets the userstyle's dark value. That's a behavioural change, not layout per se.
- Scrollbar rules: if the userstyle sets `* { scrollbar-width: none }` or `::-webkit-scrollbar { display: none }` (to hide scrollbars as part of the aesthetic), on mobile this is invisible (overlay scrollbars) but if it sets `overflow` properties, that's layout. More likely: setting `scrollbar-color` doesn't affect layout. But if the userstyle forces `overflow: hidden` anywhere to prevent scrollbar appearance, THAT is layout.
- `::selection`: on mobile, the browser shows selection handles (the blue/teal blobs). `::selection { background: var(--sel-bg); color: var(--sel-fg) }` changes the handle colour but NOT their size. However, if the site's CSS uses `::selection` in a way that interacts with `user-select` or if the userstyle sets `user-select: none` (unlikely for a colour style), that changes touch interaction.
- Focus-ring under `pointer: coarse`: if the userstyle zeros out focus rings (common in "clean" aesthetics: `*:focus { outline: none }`), on a phone with a hardware keyboard or switch access, the user loses their only focus indicator. This is a WCAG 2.4.7 failure. Not layout per se but "space utilization" in the sense that the focus ring's visual box disappears.
- Font metric overrides: if the userstyle sets `font-size` on `:root` or uses `font-size-adjust` — but the user said it's colour-only. Unless... the "radius zeroing" file also contains font adjustments? The user should check.

Actually the most concrete mobile-specific break: **`color-scheme: dark` + mobile form controls.** Firefox for Android renders `<input type="date">`, `<select>`, `<input type="time">` as native widgets. In dark scheme, these widgets have different internal padding/height in some Firefox versions. This IS layout. And the userstyle OWNS setting `color-scheme: dark`.

**Q3: Attack the Google fix.**

The rule uses `@-moz-document regexp(...)` to scope to Google Search (excluding Images/Video/Shopping via negative lookahead on `udm=`/`tbm=` params). The fix is to add `@media (min-width: …)`.

Is `min-width` the right signal? NO. Here's why:

- The rule targets `#rcnt:not(:has(#rhs)) #center_col` with `grid-column: 4 / span 15`. This is a DESKTOP grid layout. On mobile, Google's SERP doesn't use this grid at all — it's a single-column flex/block layout. So the selector simply won't match on mobile. The `min-width` gate is redundant IF the DOM is genuinely different.
- BUT: tablet landscape (768-1024px) — Google MAY use a grid layout there. The `grid-column: 4 / span 15` assumes 16+ tracks. If a tablet uses a 14-track grid, track 4 + span 15 overflows. This is the real risk window, not phone.
- Desktop-mode-request: if a user sets "Desktop site" in mobile Firefox, the DOM becomes the desktop DOM but the viewport is still 390px. `@media (min-width: 960px)` would NOT fire (viewport is 390), but the desktop DOM IS present. So the rule is gated off correctly here. But wait — does `Emulation.setDeviceMetricsOverride` with desktop mode change the viewport width reported to CSS? In desktop mode on real mobile browsers, the viewport width may be set to 980px (Chrome does this). Firefox Android desktop mode — unknown. If the viewport reports 980px, `@media (min-width: 960px)` fires, the desktop DOM
