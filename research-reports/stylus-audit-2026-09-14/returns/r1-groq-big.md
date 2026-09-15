```markdown
## 1. Missing capabilities

| Failure class | Why it slips past `check.mjs` / `contrast.mjs` | Real‑world impact |
|---------------|-----------------------------------------------|-------------------|
| **Layout‑shifting side‑effects** (e.g. `display: grid` / `flex` re‑ordering, `position: absolute` on injected elements) | The two scripts only look at *paint* (border‑radius, colour, contrast) and at a very small set of geometry (surface‑size tokens). They never run a layout‑stability audit or compare DOM‑tree dimensions before/after injection. | A page that suddenly jumps, introduces scrollbars, or pushes content off‑screen. Users can lose scroll position, miss notifications, or trigger “infinite scroll” bugs. |
| **Interaction‑state leakage** (hover, active, focus‑visible, visited, disabled) | `contrast.mjs` samples only three states (rest, keyboard focus, hover) and only on the element that paints text. It never checks `:visited`, `:disabled`, `:active`, or custom UI states that the site implements (e.g. “pressed” button styles that use a different colour variable). | Links may become indistinguishable from surrounding text after a click, or disabled controls may appear enabled, breaking affordance and accessibility. |
| **Form‑control native styling** (inputs, selects, `<option>` colours, file‑picker UI) | The harness treats any element with a *text node* as the paint target; native form widgets are often rendered by the OS and do not expose a text node the script can query. | Dark mode on a site that uses a native `<input type="date">` may render a white calendar popup over a dark surface, or placeholder text may become unreadable. |
| **SVG / Canvas / WebGL colour usage** | The scripts resolve CSS‑computed colours only; colours that are baked into SVG `fill`/`stroke` attributes, Canvas drawing calls, or WebGL shaders are invisible to the CSS‑value extraction. | Inline icons, charts, or map tiles retain their original brand colours and can clash with the surrounding token‑based palette, creating “color islands”. |
| **Animations & transitions that introduce temporary colours** | Neither script steps through CSS animations or keyframe‑generated colours. | A button that fades from brand‑blue to the system accent on hover could temporarily violate contrast or introduce a brand hue that the policy forbids. |
| **Media‑query‑driven overrides** (prefers‑color‑scheme, width breakpoints) | The harness loads a single viewport size and a single OS colour‑scheme (dark). It never cycles through breakpoints or respects `prefers-reduced-motion`. | At a narrow width, a site may swap to a completely different component library with its own token set, leaving the injected `:root` variables mismatched and causing broken colours or layout glitches. |
| **Extension‑level conflicts** (other user‑styles, ad‑blockers, content‑security policies) | The harness disables all other extensions (`--disable-extensions`) to avoid Dark Reader bleed‑through. It therefore never sees a real‑world cascade where another style sheet wins specificity or where a CSP blocks `@-moz-document`. | In a normal profile a user‑installed “Ad‑block Plus” style could override the per‑site style, leaving parts of the page in the original dark‑mode, producing a “half‑styled” view that the audit never flagged. |
| **Runtime‑generated CSS variables** (JS‑injected `style` elements, CSSOM updates) | The audit runs **once** after page load, before any asynchronous UI that injects its own variables (e.g. React’s theming context that updates `document.documentElement.style.setProperty`). | A site that swaps to a “compact” view after the first interaction may re‑declare its own token values, wiping out the operator’s overrides and re‑exposing brand colours. |
| **Focus‑ring / outline visibility on custom components** | The universal Stylus layer handles focus rings, but the per‑site style may *reset* `outline` or `box-shadow` on components that rely on the default. The harness does not verify that focus indicators remain visible on every interactive element. | Keyboard users lose a visible focus indicator on a button that no longer draws a ring, violating WCAG 2.1 §2.4.7. |
| **Non‑colour visual cues** (icons, images, emojis) that are colour‑coded | The harness is colour‑centric; it never checks whether an icon that was originally blue (brand) is now rendered on a dark surface where the same hue becomes invisible. | Brand icons become “ghosted” or indistinguishable from the background, reducing recognisability. |

In short, the current harness is a *static colour‑audit*; it does **not** verify dynamic behaviour, layout stability, native widget rendering, or interactions that rely on CSS states beyond the three sampled. Those gaps are where the operator is most likely to be surprised by regressions.

---

## 2. Actively harmful decisions

| Decision | Blast radius (sites / layers) | Why it is harmful |
|----------|------------------------------|-------------------|
| **Using `!important` on `:root` custom properties** | All 14 per‑site styles, plus any future site added to the list. | `!important` forces the variable to win over any site‑internal theming, including *runtime* theme switches (e.g. a site toggling between light/dark via JS). When a site updates its token naming or adds a more specific selector (e.g. `html[data-theme="dark"]`), the `!important` rule may be overridden unintentionally, leading to *partial* restyling or, conversely, *complete* loss of the site’s native dark mode, breaking the “exactly one colour engine” invariant. |
| **Hard‑coding the token set in the drift guard and forbidding any literals** | Entire design system (desktop + browser) | While it prevents accidental colour drift, it also makes *any* legitimate one‑off colour (e.g. a status badge that needs a specific hue) impossible without a token round‑trip. The operator must constantly extend the token file, which is a source of friction that encourages shortcuts (e.g. commenting out the guard) – a known failure mode that has already caused broken builds. |
| **Relying on a *single* disposable profile that contains the real cookie jar and synced extensions** | All five browser profiles share the same underlying risk | Syncing the real extension set means that any future extension update (e.g. Dark Reader 5.x) propagates instantly into the audit environment, possibly breaking the “disable‑extensions” flag or re‑introducing hidden colour changes. Moreover, the cookie‑jar copy is a *snapshot*; if a site rolls out a new logged‑in UI behind a feature flag, the audit will never see it until the snapshot is refreshed, giving a false sense of safety. |
| **Permitting class‑hash selectors (VOLATILE) for sites that publish no tokens** | Google (0 tokens) and any future “obfuscated” site | Class‑hashes are *by definition* unstable across deployments. When Google refreshes its UI (which happens weekly), the selector will no longer match, causing the per‑site style to be a *no‑op* while Dark Reader remains active – a silent regression that defeats the “exactly one colour engine” rule and can re‑expose brand colours. |
| **Not testing with `prefers‑reduced‑motion` or other media queries** | All sites, especially those with animated UI (YouTube, GitHub) | Users who enable reduced motion will receive a different CSS cascade; the per‑site style may unintentionally inject colour‑changing keyframes that violate the policy, while the harness never observes that path. This creates a legal accessibility liability. |
| **Treating `@-moz-document` as sufficient isolation** | All per‑site styles | `@-moz-document` does not guard against *sub‑frames* (iframes) that load third‑party content (e.g. embedded YouTube videos). Those frames inherit the parent document’s colour scheme, so Dark Reader may invert them even when the parent site’s per‑site style is active, resulting in a mixed‑mode page that is visually jarring. |

These decisions are *actively harmful* because they introduce deterministic failure modes that can cascade across the entire system rather than being isolated to a single site.

---

## 3. Redesign fragility

### Expected breakage as sites evolve

| Mechanism | Typical symptom | Why it happens |
|-----------|----------------|----------------|
| **Token renaming / removal** (e.g. `--bgColor-primary` → `--color-bg-primary`) | Variables fall back to the browser default (`initial`) or to the site’s fallback values, producing bright brand colours on dark surfaces. | The per‑site style redeclares the *old* variable name at `:root`. If the site drops that variable, any `var(--old, fallback)` will resolve to the fallback (often the site’s original light‑mode colour). |
| **Additional specificity layers** (`html[data-theme="dark"]`, `.dark-mode .foo`) | Your `!important` variables are still applied, but the site’s own selectors *override* the values for specific components (buttons, modals). | `!important` on a custom property wins over normal declarations, but if a component sets a *different* custom property (e.g. `--button-bg`) that the per‑site style does **not** override, the component will render with the site’s new colour. |
| **Dynamic theme toggles via JavaScript** | The per‑site style is applied once on load; when the user clicks a “dark mode” toggle, the site swaps its own token values, and your overrides become stale, resulting in a *mixed* theme (some elements dark, some still in the original brand palette). | The per‑site CSS is static; it does not react to runtime changes to the DOM or to CSSOM updates. |
| **Introduction of new UI libraries** (e.g. a React component library that ships its own CSS custom properties) | Unstyled “new” components appear in the original site theme, breaking visual consistency. | Your per‑site file only remaps the *known* token set; new libraries bring new variables that are never overridden. |
| **Switch from CSS custom properties to SCSS‑generated static colours** | Your style silently becomes a *no‑op* because the site no longer references `var(--…)`. | The harness will still see your `:root` declarations, but nothing consumes them, so the site’s original colours show through. |
| **Changes to the site’s DOM that move elements out of the root scope** (e.g. Shadow DOM) | Styles stop applying to components rendered inside a closed shadow root. | `@-moz-document` does not pierce shadow DOM; variables defined on `:root` are not inherited into a closed shadow tree unless the site explicitly re‑exports them. |
| **Content‑Security‑Policy (CSP) tightening** that blocks `@-moz-document` or inline style injection | Your per‑site stylesheet is ignored, causing Dark Reader to take over. | The harness runs with a permissive CSP because it launches a clean profile; a real user may have a stricter CSP enforced by the site, causing silent failure. |

### Making degradation graceful

1. **Fallback to Dark Reader** – wrap each per‑site rule in a `@media (prefers-color-scheme: dark)` and also add a *fallback selector* that disables the style when any of the site’s own dark‑mode variables are missing, e.g.:

   ```css
   @-moz-document domain("github.com") {
     :root {
       --bgColor-default: var(--my-bg-default, var(--bgColor-default));
       /* If the site removed --bgColor-default, the second var() resolves to its own value,
          leaving the rule effectively inert. */
     }
   }
   ```

2. **Graceful‑degradation token mapping** – use a *double‑fallback* pattern (`var(--my-token, var(--site-token, <system‑fallback>))`) so that if the site drops the variable, the system’s own token still applies.

3. **Feature‑detect CSS‑variables** – add a tiny JS shim that, on page load, checks `CSS.supports('--test: 0') && getComputedStyle(document.documentElement).getPropertyValue('--bgColor-default')`. If the site’s variable is empty, unload the per‑site stylesheet (or let Dark Reader run).

4. **Version‑tagged selectors** – include a comment with the site’s version hash and a small script that disables the stylesheet when the page’s `<meta name="revision">` diverges.

5. **Shadow‑DOM bridging** – where feasible, inject a small `<style>` into the shadow root via the extension’s content script (only if the site’s shadow roots are open). This prevents silent “hole” in the UI.

By designing the per‑site files to *detect* missing or changed variables and to *fall back* to the default dark‑mode engine, you avoid a hard break when a redesign occurs.

---

## 4. What the harness fails to represent

1. **User‑initiated theme toggles** – The harness loads the page with the OS‑level dark scheme only. Real users can click a “light/dark” toggle that flips a site‑managed class (`.theme-dark`) *after* the initial render, causing a second cascade that the harness never observes.

2. **Multiple concurrent viewports** – The harness runs a single viewport size (likely desktop width). Responsive breakpoints can switch to a completely different component tree (e.g., mobile‑only navigation drawer) that may have its own token set. In a real session, a user resizing the window or rotating a tablet would expose those missing overrides.

3. **Network‑dependent lazy loading** – Many sites defer loading heavy components (e.g., comments, sidebars) until scrolled into view. The harness only
