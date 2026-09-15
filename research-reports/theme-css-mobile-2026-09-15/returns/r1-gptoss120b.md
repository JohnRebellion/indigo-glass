**1. Is `@media (pointer: coarse)` the right gate for a *token* file?**  

*What it gets wrong*  

| Situation | `pointer: coarse` result | Why it’s inaccurate |
|-----------|--------------------------|----------------------|
| Touch‑screen laptop (Surface, MacBook Pro Touch Bar) used with a mouse/trackpad | **true** (the primary “coarse” pointer exists) → the media query fires even though the user is interacting with a fine pointer. | The media feature only checks *presence* of a coarse input, not *which* pointer is actually in use. |
| Tablet with an attached stylus or a Bluetooth mouse | **true** → same problem as above. |
| Desktop with a touch‑screen monitor (e.g. Dell XPS with touch) but the user prefers mouse | **true** → touch overrides are applied even though the user never touches. |
| Device that reports `any-pointer: coarse` but also `any-pointer: fine` (most hybrids) | The spec recommends **combining** the two: `@media (any-pointer: coarse) and (any-hover: none)` if you want “no fine hover”. | Using only `pointer: coarse` will over‑apply; using only `any-pointer` will under‑apply on devices that expose both. |

*What to gate on instead*  

- **Composite query**: `@media (any-pointer: coarse) and (any-hover: none)` – catches “the user has no fine hover device” while still allowing a mouse/trackpad to win on hybrids.  
- **User‑agent class**: many apps add `.is-touch` / `.is-mobile` (Obsidian does). Relying on that lets the host decide, but it defeats the “token‑only” goal because you now depend on a host‑specific convention.  
- **CSS custom property switch**: expose a token like `--ig-pointer-type: fine|coarse` and let the host set it via inline style or class. This adds a tiny runtime cost (one extra declaration) but gives precise control.

*Cost*  

- Composite query is still pure CSS, but you must duplicate the token block for the combined condition (or nest a second `@media` inside the first).  
- Adding a host‑controlled class forces every downstream consumer to add that class to `<html>` or `<body>`, breaking the “no call‑site change” promise.  
- A custom property switch adds a runtime write (JS or server‑side) and a tiny cascade‑resolution cost, but it guarantees the correct token set on hybrids.

**Bottom line:** `pointer: coarse` alone is too blunt for a token API that must work on unknown downstreams. Use the composite query or a host‑controlled flag; otherwise you will unintentionally apply touch‑specific spacings on fine‑pointer interactions.

---

**2. “Redeclare `--ig-*` inside a media query” – build‑time vs runtime consumers**  

| Consumer | How it reads tokens | What breaks when the override lives only in a `@media` block |
|----------|--------------------|--------------------------------------------------------------|
| **Tailwind @theme** (generates utilities at build time) | Reads the **static** `:root` custom‑property values via `theme()`; the generated CSS contains those literal numbers (e.g. `--ig-button-pad-y: 4px`). | The generated utility classes (`.p-y-4`) are baked with the *desktop* value. When the page loads on a coarse‑pointer device, the `@media` block changes the runtime value, but Tailwind’s generated classes still reference the original 4 px (they do **not** recompute). Result: touch targets stay too small. |
| **SCSS `scss-vars.*.scss`** (imported at compile time) | Uses `$ig-button-pad-y: var(--ig-button-pad-y)` or `map-get($tokens, button_pad_y)`. The SCSS compiler substitutes the literal value from the token file, not the runtime CSS variable. | The compiled CSS contains the desktop literal (`4px`). The later `@media (pointer: coarse)` block only re‑assigns the *CSS variable*, but any SCSS‑generated `calc()` or `margin: $ig-button-pad-y` has already been resolved to the desktop size, so the touch override is lost. |
| **JSON token export** (used by design‑token libraries) | Reads the JSON file once and caches the numbers. | The JSON never contains the media‑specific overrides, so any JS that builds component styles from the JSON will never see the larger touch values. |

*Why the mechanism fails*  

- **Static extraction**: any tool that materialises the token value at build time (Tailwind, SCSS, JSON) discards the *dynamic* nature of a CSS custom property. The `@media` block only works for **runtime** consumption (native CSS, inline style, or JS reading `getComputedStyle`).  
- **Drift guard**: `check-palette-drift.sh` compares *literal* values in the generated files against the source TOML. It will flag the new `@media` block as a drift (because the literals differ) unless you extend the script to ignore or validate media‑specific sections, adding complexity and a new source of false positives.

**Result:** downstream projects that rely on compile‑time token extraction will silently ignore the touch overrides, defeating the purpose of the new axis.

---

**3. Is a *px‑valued* spacing scale the actual problem?**  

*Arguments for moving to `rem`*  

- `rem` ties spacing to the root font size, which already reflects the type‑scale anchor (`anchor_pt=11`). If a user changes the browser’s default font size (or you expose a UI scale), spacing scales automatically.  
- Accessibility zoom (Ctrl + ) enlarges `rem`‑based layouts proportionally, preserving the intended visual rhythm.  
- The drift guard can still compare literals (`--ig-pad-md: 0.375rem`) against the token file (store the value in `rem`). No extra machinery needed.

*Arguments against*  

- The design language is *fixed* (no fluidity, no radius, hard shadows). Introducing `rem` adds an implicit dependency on the root font size, which may vary across host apps (Obsidian, VSCode, GTK) and break the “exact literal” guarantee the drift guard enforces.  
- Existing hand‑written themes already use `px` throughout; switching to `rem` forces a wholesale rewrite or conversion script.  

*Arguments for a fluid `clamp()`*  

- Could satisfy both desktop tightness and touch minimum in a single token: `--ig-button-pad-y: clamp(4px, 0.25rem + 0.5vw, 12px)`.  
- However, the system’s **hard‑coded, non‑variant** design (no responsive breakpoints) conflicts with a fluid token; you’d be adding a new responsive axis without explicit token support, increasing drift‑check complexity.

**Conclusion:** The *px* scale is *not* the core issue; the missing touch‑target floor is. Switching to `rem` would improve scalability but introduces a new drift‑guard dimension and a cross‑host inconsistency risk. If you keep `px`, you must add a **separate token** for “minimum touch size” rather than repurposing existing spacing tokens.

---

**4. The 24 px floor**  

- Current token `button_pad_y = 4` (4 px) + an 11 pt (~14.7 px) label → ≈ 23 px total height, just below the WCAG AA floor.  
- Raising the *token* value to, say, `button_pad_y = 6` (6 px) would push every button (including dense UI elements in GTK, VSCode, KDE panels) up by 2 px across *all* platforms, breaking the *tight* visual language and potentially causing layout overflow in dense toolbars.  

*Where the floor belongs*  

| Layer | Reason to enforce locally | Reason to keep token unchanged |
|-------|---------------------------|--------------------------------|
| **Desktop apps** (GTK, VSCode, KDE) | They rarely run on touch‑only hardware; designers have deliberately chosen tighter paddings for screen‑real‑estate. | Changing the shared token would force a visual redesign of existing themes. |
| **Mobile‑first hosts** (Obsidian mobile, potential future VSCode Web) | They can apply a **host‑specific override** (`.is-mobile .button { min-height: 44px; }`) without touching the shared token. | The shared token stays the single source of truth for desktop, preserving the intended brutalist aesthetic. |

**Therefore:** Do **not** raise the floor at the token level. Provide a **derived token** (`target_size_min_px = 44`) and let each consumer merge it with its own layout logic (`@media (any-pointer: coarse) { min-height: var(--ig-target-size-min-px); }`). This avoids breaking desktop layers while still satisfying WCAG on touch devices.

---

**5. What’s mis‑identified as in‑scope / out‑of‑scope?**  

1. **“Vencord/Spicetify/VSCode/GTK are desktop‑only, therefore excluded.”**  
   - **Vencord** runs inside the *desktop* Discord client, but Discord also has a *mobile* web client that can load user scripts via the “BetterDiscord” compatibility layer. If a user injects Vencord’s CSS on mobile web, the touch overrides become relevant.  
   - **Spicetify** themes are applied to the *desktop* Spotify client, yet Spotify also offers a **web player** that can be wrapped in a mobile‑friendly PWAs; CSS is still processed.  
   - **VSCode** has a *Web* variant (`vscode.dev`) and an *iPad*/Android “code‑server” deployment where the same CSS is consumed.  
   - **GTK** runs on devices like the **Surface Pro**, **Lenovo Yoga**, or **Steam Deck**—all hybrid touch‑enabled Linux machines. The assumption that they never see a coarse pointer is false.  

   Consequently, the “desktop‑only” exclusion is **incorrect**; touch considerations may surface in any of those environments.

2. **Treating `density.css` as the sole “space‑utilisation lever.”**  
   - `density.css` only toggles a **compact mode** (`.ig-density-on`). Many components have *hard‑coded* paddings or margins directly in the host‑app CSS (e.g., VSCode’s `.monaco-editor .margin`). Those will not respect `density.css` and therefore will also ignore any touch‑floor safeguards.  
   - Moreover, **gap** utilities (`gap_xs`, `gap_md`) and **list‑row** paddings (`list_row_pad_y`) are used throughout the generated theme files *outside* `density.css`. Ignoring them underestimates the overall spacing impact.  

   So, `density.css` is just *one* knob; the real space‑utilisation surface spans **every** token that contributes to hit‑target size (`button_pad_*`, `icon_button_pad`, `list_row_*`, etc.). Ignoring these makes the touch‑axis incomplete.

---

**6. What I’m not asking but should be (most consequential)**  

> **How will the new touch‑axis affect downstream build‑time token pipelines, and what concrete strategy (e.g., a separate “touch‑tokens.json
