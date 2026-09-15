**1. Scope read – does a `:root` token remap really have *no* layout effect?**  

Yes **and no**.  

| Mechanism | How it can affect layout/space on a phone | Example (if it existed) |
|-----------|-------------------------------------------|--------------------------|
| **Custom‑property substitution in layout‑related declarations** – many sites expose a “spacing token” (`--space-base`, `--grid-gap`, etc.) that is later used in `margin`, `padding`, `gap`, `grid-template‑columns`, etc. If your userstyle overwrites **any** of those tokens (even unintentionally) the resulting layout changes. | `:root { --space-base: 0; }` → all `margin: var(--space-base)` collapse. |
| **Cascade & specificity** – the `@-moz-document` block is a *user* stylesheet with *author‑level* precedence (the same as the page’s own author CSS). An `!important` rule in the userstyle can override the page’s own responsive layout rules. | `@-moz-document url-prefix("https://example.com") { :root { --color-primary: #111 !important; } }` may also unintentionally override `:root { --grid-columns: 12 !important; }`. |
| **`color-scheme: dark`** – on mobile browsers this toggles the UA default **scroll‑bar thickness**, **form‑control styling**, and **system UI colors** (e.g. the background of the address bar). Those defaults occupy space (overlay scrollbars vs. gutter scrollbars) and can trigger overflow. | `html { color-scheme: dark; }` → Safari shows a 15 px gutter scroll‑bar, Chrome shows a 12 px overlay that disappears on scroll. |
| **`font‑size‑adjust` / `size‑adjust`** – if a userstyle sets any of these (even indirectly through a token that the page later maps to `font-size`), it interferes with the browser’s text‑inflation algorithm, which changes line‑box height and may push content off‑screen. | `:root { --font-adjust: 1; }` → `body { font-size: calc(1rem * var(--font-adjust)); }`. |
| **`@media (prefers‑reduced‑motion)`** – a colour‑only style that also flips `animation: none` can suppress layout‑affecting transitions (e.g. a CSS‑grid auto‑placement that runs only after a transition). | `@media (prefers-reduced-motion) { * { animation: none !important; } }`. |

If *none* of the tokens you touch are ever referenced in a layout‑related declaration, the userstyle truly has no layout opinion. Verify that by grepping the target sites for any of the custom‑property names you set.

---

**2. What *does* break on mobile that a colour‑only userstyle *does* own?**  

| Feature | Mobile‑specific breakage caused by the colour‑only userstyle | Concrete selector/property/value |
|---------|--------------------------------------------------------------|----------------------------------|
| **`color-scheme: dark`** on mobile UA widgets | System form controls (checkboxes, select arrows) switch to dark UI which may become low‑contrast against your opaque dark surfaces; overlay scrollbars appear/disappear, changing layout width. | `html { color-scheme: dark; }` |
| **Scrollbar styling** (`::-webkit-scrollbar`) | Mobile browsers often ignore custom scrollbar tracks, but a `color-scheme` change can expose the default *gutter* scrollbar (Safari) that adds ~15 px to the content box, causing horizontal overflow. | `::-webkit-scrollbar { width: 8px; }` (if present) |
| **`::selection` background** | Mobile touch selection handles are drawn on top of the `::selection` colour; a dark selection colour can make the handles invisible or cause the browser to enlarge the hit‑area, shifting layout. | `::selection { background: var(--selection-bg); }` |
| **Focus‑ring styling under `@media (pointer: coarse)`** | If the userstyle forces a thin focus outline (`outline: 2px solid ...`) that is too small for a finger, the browser may synthesize a larger *focus‑ring* that adds extra padding, pushing content. | `*:focus { outline: 2px solid var(--focus); }` |
| **`font-size-adjust` / `size-adjust`** interacting with mobile text‑inflation | Setting `font-size-adjust: none` (or a fixed `size-adjust`) disables the browser’s automatic inflation, causing long strings to overflow and the page to require horizontal scrolling. | `html { font-size-adjust: none; }` |
| **`@-moz-document` specificity** | On Android Firefox the userstyle runs *after* the page’s own CSS, so an `!important` declaration in the userstyle can override a mobile‑only media query that would otherwise hide a large banner. | `@-moz-document url-prefix("https://example.com") { .banner { display: none !important; } }` |

---

**3. Attack the Google fix – is `@media (min-width: …)` the right gate?**  

*Problem*: `min-width` gates on **viewport width**, not on *device class* or *input modality*. Mobile browsers can be forced into a “desktop‑width” viewport (e.g., Chrome’s “Desktop site” toggle, tablet landscape, or a user‑zoomed‑in page). In those cases the rule would stay **enabled** even though the underlying DOM (`#center_col` grid layout) is still the mobile‑optimized markup, leading to layout breakage.

**Better signals**

| Signal | Why it’s safer | Example CSS |
|--------|----------------|-------------|
| `@media (hover: none) and (pointer: coarse)` | Targets touch‑only devices; desktop browsers (even in responsive mode) report `hover: hover` and `pointer: fine`. | ```css @media (hover: none) and (pointer: coarse) { /* no grid‑column override */ } ``` |
| `@media (max-width: 600px)` **or** `@media (width: 0px) to (width: 599px)` | Directly excludes typical phone viewports (≤ ~600 px). Tablet portrait/landscape can be handled with a higher breakpoint if needed. | ```css @media (min-width: 901px) { #rcnt:not(:has(#rhs)) #center_col { grid-column: 4 / span 15 !important; } } ``` |
| Feature‑query on **layout element existence** using `:has()` (if supported) – only apply when the desktop‑only wrapper exists. | Guarantees the rule runs only on the DOM shape that only appears on desktop. | ```css @media (min-width: 901px) { body:has(#rcnt:not(:has(#rhs))) #center_col { grid-column: 4 / span 15 !important; } } ``` |
| `@media (any-pointer: fine)` – excludes touch‑only devices but still applies on hybrid devices (e.g., Surface) that have a mouse. | Works for tablets with a stylus/trackpad. | ```css @media (any-pointer: fine) { … } ``` |

**What can break with the alternative?**  
* Tablet in landscape*: `pointer: fine` may be true, but the viewport can be > 900 px, so the rule would fire (desired – the desktop layout is appropriate).  
* “Desktop site” toggle on phone: `hover: none` stays *none*, so the rule would still be blocked – which is what you want (the page is still mobile‑optimized markup).  

Thus, **gate on input modality (`pointer`/`hover`) *or* an explicit width breakpoint that matches typical phone widths, not merely `min-width`.**

---

**4. Attack the harness plan – CDP `setDeviceMetricsOverride` pitfalls**  

| Rank | Pitfall (most likely to give a *false clean* result) | Why it matters for this project |
|------|----------------------------------------------------|---------------------------------|
| 1 | **Text‑inflation / `font-size-adjust` is not reproduced**. CDP’s emulation does **not** trigger the browser’s *mobile text‑size inflation* algorithm, so overflow caused by suppressed inflation will be missed. |
| 2 | **`100vh` vs. real‑device view‑port units**. `setDeviceMetricsOverride` reports a *virtual* viewport that includes the URL bar, but on a real phone `100vh` often equals *window‑inner‑height* (excluding the UI chrome), causing the layout to be taller and overflow. |
| 3 | **Safe‑area insets (notch, home‑indicator)**. CDP does not emulate the `env(safe-area-inset-*)` values that affect padding on iOS/Android browsers; a layout that overflows only when those insets are present will be invisible in the test. |
| 4 | **Coarse‑pointer media queries** (`pointer: coarse`, `any-hover: none`). Emulation can be forced to `pointer: fine`, so rules that only apply to touch devices won’t be exercised. |
| 5 | **Scrollbar width differences**. Desktop Edge reports overlay scrollbars (zero gutter) while mobile browsers (Safari, Chrome) may show a gutter scrollbar, affecting horizontal overflow detection. |

If you want a *clean* pass, supplement CDP with **real‑device manual testing** (or a device‑farm that runs the same Playwright script on an actual Android Chrome/Firefox). At minimum, add a separate Playwright project that sets `viewport` to a phone size **and** toggles `mobile: true` *and* forces `deviceScaleFactor` to the phone’s DPR; then verify that the page respects `100svh`/`100dvh` and that text‑inflation is applied (e.g., by checking `computedStyle.fontSize` vs. `rem`).  

---

**5. Simulator – five highest‑value changes (order of impact)**  

| # | Change (CSS selector & rule) | Reason (mobile impact) |
|---|------------------------------|------------------------|
| 1 | ```css html { height: 100svh; } /* replace 100vh */ ``` | `svh` stays constant when the browser UI collapses/expands, preventing the “content taller than screen” overflow that broke the editor panes. |
| 2 | ```css nav[role="navigation"] { flex-wrap: wrap; gap: 4px; } @media (max-width: 480px) { nav[role="navigation"] { justify-content: center; } } ``` | Allows the 8‑tab header to wrap or centre on phones, eliminating the horizontal overflow caused by a single‑row flex that can’t shrink below the combined tab width. |
| 3 | ```css .sidebar { width: min(90vw, 320px); min-width: 200px; } @media (max-width: 600px) { .sidebar { width: 0; display: none; } } ``` |
