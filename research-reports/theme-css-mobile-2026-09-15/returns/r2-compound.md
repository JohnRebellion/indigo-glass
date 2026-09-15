**1. Is `@media (pointer: coarse)` the right gate for a token file?**  
- **What it gets wrong:**  
  *Hybrid devices* (e.g., Surface laptop, iPad Pro with mouse/trackpad) report `pointer: coarse` **and** `pointer: fine` simultaneously. A coarse‑only query will fire even when the user is using a precise pointer, causing touch‑optimized spacing to be applied unintentionally. Conversely, a device with a fine pointer but a touch screen (e.g., a desktop with a drawing tablet) will not match, so the user may receive undersized hit‑targets.  
- **Better gate:** Combine the coarse check with a *lack of hover* (`@media (pointer: coarse) and (hover: none)`) to target “touch‑only” interaction. The cost is an extra media condition and a small increase in CSS size, but it eliminates the false‑positive case where a fine pointer is also present. If you need to support “touch‑plus‑mouse” scenarios, expose an explicit token (e.g., `a11y.touch_enabled = true`) that downstream projects can toggle, at the expense of requiring a runtime flag.

---

**4. The 24 px floor.**  
- Raising the minimum target size **in the shared token set** (`a11y.target_size_px = 24` → `48 px` for a 2 px outline) forces every downstream UI to respect the floor, which will **inflate desktop controls** (e.g., GTK button padding `button_pad_y=4` → 4 px + 24 px floor ≈ 28 px). This breaks the visual density that the system deliberately provides for desktop‑only environments (KDE, VS Code, Konsole) and will cause layout regressions where fixed‑pixel spacing is assumed.  
- **Preferred placement:** Keep the floor out of the core spacing tokens and provide a **separate “touch‑size” token set** (e.g., `spacing.coarse.button_pad_y = 12`). Downstream themes can merge this set only when they detect a coarse pointer, preserving the tight desktop density while guaranteeing WCAG‑compliant hit‑targets on touch devices.

---

**5. What has been mis‑identified as in‑scope or out‑of‑scope?**  
- **Desktop‑only assumption:** Vencord, Spicetify, VS Code, and GTK are *not* strictly desktop. All run on Electron or WebView layers that can be rendered on mobile browsers or on Linux tablets (e.g., GNOME On‑Screen Keyboard, KDE Plasma Mobile). Ignoring them discards a real audience that will inherit the same token files.  
- **`density.css` as the sole space‑utilisation lever:** The system also controls spacing via the **root custom properties** (`--ig-button-pad-y`, `--ig-gap-md`, etc.) emitted in `css-vars.*.css`. Consumers can override those directly, bypassing `density.css`. Treating `density.css` as the only knob underestimates the impact of any token change on layout density across all platforms.

---

**6. What am I not asking that I should be?**  
**How will the introduction of a touch‑specific token axis affect the existing drift‑guard (`check‑palette‑drift.sh`) and any downstream build pipelines that compare literal values?**  
If the guard only validates the primary token set, the new “coarse” overrides will be invisible to the CI check, allowing accidental drift (e.g., a typo in `spacing.coarse.button_pad_y`) to go unnoticed until runtime. The reviewer must demand that the drift‑guard be extended to **compare both primary and coarse token blocks** (or be made aware of the media‑query‑generated CSS) to preserve the system’s guarantee of token‑literal fidelity.
