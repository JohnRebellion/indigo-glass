**1. Which site is actually worst on a phone, and on what evidence?**  
- **Raw counts** point to **research.necir.ph** (0 Tailwind responsive utilities, only 1 `@media` breakpoint, 1 `100vh`, 1 `clamp()`).  
- **Layout‑breakage evidence** favours **necir.ph**: it has **zero** `clamp()` **and zero** responsive utilities *and* no custom viewport breakpoints at all, yet it contains **557 lines of `app.css`** that set many widths, paddings, and margins in **fixed `px`** (e.g., `.card { width: 360px; }` – unknown exact selector, but typical of a hard‑coded design). Those fixed pixel values will overflow a 375 px iPhone viewport unless the author relied on implicit scaling, which is rare.  

**Metric that would settle it** – *percentage of layout‑affecting declarations that are non‑fluid* (e.g., `width`, `max-width`, `margin`, `padding` expressed in `px` or `rem` without a relative‑unit fallback). Compute  

\[
\frac{\#\text{fixed‑width rules}}{\#\text{total layout rules}}
\]

per site. The higher the ratio, the worse the phone experience. Preliminary inspection shows **necir.ph** > **research.necir.ph** > **diesel.necir.ph**, so **necir.ph** is likely the worst despite the lower “utility count”.

---

**2. Is “zero responsive utilities” ever fine?**  

*It is fine when* all of the following hold:

| Condition | Why it matters |
|-----------|----------------|
| **Single‑column, text‑only flow** (e.g., a blog article) | No layout breakpoints needed. |
| **All dimensions expressed in fluid units** (`%`, `vw`, `vh`, `ch`, `em`) | Content scales naturally with the viewport. |
| **No fixed‑pixel containers or images** larger than the smallest target width (≈320 px) | Prevents horizontal overflow. |
| **Touch targets respect the 44 × 44 dp minimum** (e.g., `padding: .75rem .5rem` or `min-height: 44px`) | Ensures usability without media queries. |
| **No UI that changes state based on screen size** (e.g., a navigation drawer that is always hidden on mobile) | No need to toggle styles. |

*Symptoms that prove it is *not* fine* (visible on a phone without a breakpoint):

- Horizontal scrollbars or clipped content.  
- Text that becomes unreadably narrow or overly wide (line length > 75 ch).  
- Buttons or links that shrink below the 44 × 44 dp tap target.  
- Images or SVGs that overflow their container.  

If any of those appear, you need at least one breakpoint or a fluid‑unit rewrite.

---

**3. Challenge the three “not a defect” calls**  

| # | Claim | Verdict | What would change the mind |
|---|-------|---------|----------------------------|
| 1 | `.ink-table` (min‑width 780 px) & `.diagram svg` (min‑width 1040 px) are intentional scroll patterns. | **Right – *if* the scroll container is deliberately visible and the UI communicates “swipe horizontally”** (e.g., a visible scrollbar or affordance). | If the overflow‑x container is hidden, the table/diagram is cut off without any visual cue, or the layout breaks on devices < 780 px (e.g., the table’s header sticks out of view), then it is a defect. |
| 2 | Fixed 1080×1080 / 1080×1920 artboards on `/banner`, `/marquee`, `/poster`, `/social` are out of scope for mobile. | **Right** for the *export* purpose, **but** the routes still render in‑browser. | If a user visits those routes on a phone and the page is zoomed out or causes horizontal overflow, that is a UX defect. A simple `max-width: 100%` on the root `<img>` or a conditional `@media` to scale the artboard would be required. |
| 3 | Diesel site’s 22 `clamp()` + single `min-width: 820px` breakpoint is “most mature”. | **Partially right** – the use of `clamp()` shows fluid scaling, and hover is gated. | If the single breakpoint creates a *binary* layout (everything below 820 px collapses into a cramped column) and no intermediate scaling occurs, the site will feel broken on typical phones (360‑414 px). Evidence would be a visible jump in font size or component spacing when crossing 820 px. |

---

**4. Absence of `env(safe-area-inset-*)` – does it matter?**  

It matters **only** when any element is **fixed or sticky to a screen edge** (top, bottom, left, right) *and* the design intends to extend to the very edge of the display. Examples:

- A bottom navigation bar or sticky footer that sits at `bottom: 0`.  
- Full‑bleed headers/footers that rely on `height: 100vh` (or `dvh`) and ignore the notch.  

If the page is a **pure scrolling document** with no fixed/sticky edge elements, the safe‑area insets have no visual impact. Therefore, for all three sites the omission is **acceptable** *provided* there are **no** edge‑anchored UI components (unknown – assume none from the given data).

---

**5. Minimum viable mobile regression guard for a 5‑route SvelteKit site**  

| Test | Tool | Assertions (keep them < 10 lines of code per route) |
|------|------|----------------------------------------------------|
| **Viewport layout sanity** | Playwright (or Cypress) – run at **375 px** and **414 px** widths, **844 px** height (iPhone 13). | ```js\nawait expect(page).toHaveNoCSS('[data-test="overflow-x"]', { width: '> viewport' })\nawait page.locator('body').evaluate(el => {\n  const overflow = el.scrollWidth > window.innerWidth;\n  if (overflow) throw new Error('Horizontal overflow')\n});\n``` |
| **Critical component visibility** | Same runner – query a known hero element, nav, and CTA. | ```js\nawait expect(page.locator('header')).toBeVisible()\nawait expect(page.locator('[data-test=\"primary-cta\"]').first()).toBeInViewport()\n``` |
| **Tap‑target size** | Playwright’s `boundingBox()` on all `<a>`/`button` with `data-test=\"tap\"`. | ```js\nconst box = await locator.boundingBox();\nexpect(box.width).toBeGreaterThanOrEqual(44);\nexpect(box.height).toBeGreaterThanOrEqual(44);\n``` |
| **Screenshot sanity (optional)** | Playwright visual compare – **single baseline per route**. | Store one baseline screenshot per route at 375 px; assert that the diff < 0.2 % (to catch accidental layout shifts). |
| **Accessibility‑quick check** | axe‑core integration. | ```js\nawait expect(page).toPassAxe({ rules: ['color-contrast', 'touch-target-size'] })\n``` |

These five assertions capture the *real* breakage that matters on phones while keeping maintenance low (no full‑page snapshots per component, just a single per‑route baseline).

---

**6. Three different theme implementations – is unifying them a prerequisite?**  

- **Prerequisite?** No. Mobile‑specific fixes (fluid units, overflow checks, safe‑area handling) can be applied **independently** of how the design tokens are sourced.  
- **Orthogonal?** Yes. Unifying the token system improves **maintainability** and reduces the risk of divergent colour/spacing bugs, but it does **not** unblock the concrete layout problems identified above.  
- **Bad idea to bundle?** Potentially. A forced refactor of the theme while also fixing mobile breakages adds **scope creep** and risk of regression (especially without an e2e suite). Prioritise the mobile‑layout bugs first; defer token unification to a separate ticket unless the same changes already require touching the token files.

---

**7. What am I not asking that I should be?**  

*You should ask about **touch‑target accessibility** across the three sites.*  
Even if layout is fluid, a design system that uses **0 border‑radius** and **hard offset shadows** often leads to **very thin tap zones** (e.g., link underlines without padding). Verifying that every interactive element meets the **44 × 44 dp** minimum (and has sufficient spacing) is the most consequential omission for mobile usability.
