**1. Which site is actually the worst on a phone, and why?**  
The hard data trumps the “raw counts” argument. `necir.ph` ships **0** Tailwind responsive utilities, **0** `clamp()`, **0** viewport `@media` rules across **1,658** lines of Svelte+CSS. `research.necir.ph` also has **0** responsive utilities, but it does have a genuine breakpoint (`max‑width: 900px`) and a single `clamp()`. The decisive metric is **adaptive‑CSS‑per‑line**:  

```
adaptive‑CSS‑per‑line = (responsive‑utils + clamp + media‑breakpoints) / total‑lines
```

- `necir.ph`: (0+0+0)/1658 = **0.000**  
- `research.necir.ph`: (0+1+1)/2069 ≈ **0.001**  

Even the infinitesimal difference shows `necir.ph` provides **no** layout adaptation whatsoever. On a 360 px viewport it will inevitably overflow, truncate, or force pinch‑zoom. Verdict: **`necir.ph` is the worst**.

---

**3. Challenge the three “not a defect” claims.**  

- **Research horizontal‑scroll tables/diagrams** – *Right* only if the scroll containers are deliberately styled (e.g., `overflow-x:auto; -webkit-overflow-scrolling:touch`). Change of mind: if the scrollbars are hidden on iOS, or if the container width exceeds the viewport *and* the user cannot see the rightmost columns without manual scrolling, that’s a defect.  

- **Diesel fixed‑size artboards** – *Right* only if those routes are gated behind a “download‑only” UI that never appears on mobile. Change of mind: if a user can navigate to `/banner` or `/poster` on a phone and the 1080 × 1920 canvas forces horizontal overflow, the site breaks.  

- **Diesel clamp + single 820 px breakpoint** – *Right* insofar as the 22 `clamp()` calls keep typography fluid above 820 px. Change of mind: any element that still exceeds the viewport width below 820 px (e.g., a 900 px image or a button with `min-width: 300px` that forces scrolling) proves the single breakpoint is insufficient.

---

**5. Minimum viable mobile regression guard for a 5‑route static‑ish SvelteKit site.**  

1. **Viewport sanity** – Run each route in a headless browser at a common phone size (e.g., 390 × 844 px). Assert `document.documentElement.scrollWidth <= window.innerWidth`.  
2. **Critical UI visibility** – For each route, locate the primary heading (`h1` or `.hero-title`) and assert `getBoundingClientRect().top >= 0 && .bottom <= window.innerHeight`.  
3. **No unintended horizontal overflow** – Query all elements with `overflow-x: hidden` and ensure none have `scrollWidth > clientWidth`.  
4. **Touch‑target size** – Verify every interactive element (`a`, `button`, `[role=button]`) has a computed `height` ≥ 44 px and `width` ≥ 44 px.  
5. **Safe‑area sanity (if any fixed/footer bar exists)** – If a fixed element is present, assert `bottom >= env(safe-area-inset-bottom, 0)`.  

These five assertions catch the majority of layout breakage without the maintenance nightmare of full‑page snapshots.

---

**7. What you’re not asking but should be.**  
You completely ignored **contrast compliance**. The design system deliberately lifts `--color-text-muted` from `#6B7280` (3.96:1) to `#9CA3AF` (7.5:1), but you never verified the rest of the palette. On a phone, reduced contrast is amplified by smaller text and lower ambient lighting, leading to AA failures in body copy. A single audit of all foreground/background pairs against WCAG 2.2 AA (and AAA for large text) is the most consequential omission.
