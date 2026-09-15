**4. Harness plan – false‑clean risk**

- **Viewport emulation vs. real mobile UA** – `setDeviceMetricsOverride` forces CSS pixels but does **not** change the user‑agent string, device‑pixel‑ratio‑dependent media queries (`@media (min-resolution: …)`) or UA‑dependent feature flags. Anything gated on `navigator.userAgent` or `devicePixelRatio` will be missed.  
- **Touch‑action & coarse pointer** – The override sets `mobile: true` but does not synthesize `pointer: coarse` or the default `touch-action` handling that browsers apply on real touch devices. Styles that rely on `@media (pointer: coarse)` or `touch-action` will appear fine in the harness but break on phone.  
- **Viewport‑relative units** – `dvh/svh/lvh` behave differently when the on‑screen keyboard appears. CDP emulation keeps the viewport static, so overflow or height‑driven layout bugs (e.g., the five `100vh` usages) are invisible.  
- **Scroll‑bar styling** – Mobile browsers use overlay scrollbars; the harness still renders a desktop‑style scrollbar, so any `::-webkit-scrollbar` rules or `color-scheme: dark`‑driven scrollbar contrast checks are not exercised.  
- **Resource‑loading heuristics** – Image src‑set selection, font‑display fallback, and lazy‑load thresholds differ on mobile. The harness runs the desktop network stack, potentially masking layout shifts caused by late‑loading assets.

**Likelihood of false‑clean (high → low):**  
1. Pointer‑coarse/media‑query mismatch – **high**  
2. `dvh`/keyboard‑induced height changes – **high**  
3. UA‑string‑dependent logic – **medium**  
4. Scrollbar overlay differences – **medium**  
5. Resource‑loading heuristics – **low**

**Bottom line:** The current harness will *often* report a clean pass while the real mobile experience still suffers from overflow, touch‑target shrinkage, and height‑driven layout collapse.

---

**6. What you’re not asking but must ask**

*How will the Sage Ink userstyles interact with other extensions or native mobile UI layers (e.g., Android’s system UI, Chrome’s “force dark” mode, or accessibility overlays)?*  

Conflicts can silently override your `color-scheme: dark`, `::selection`, or `font-size-adjust` rules, re‑introducing the very contrast and touch‑target regressions you’re trying to audit. A dedicated compatibility matrix (userstyle × common mobile extensions) is essential before declaring the system “mobile‑friendly.”
