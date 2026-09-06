## Q1 — static-scanner blind spot

**General Shape of the Blind Spot:**
The blind spot is **runtime-state divergence from configuration state**. The current guards verify that the *source of truth* (the config files, the generated CSS/TOML) is correct. They do not verify that the *runtime environment* (the process environment, the compiled library behavior, the feature flags active at execution) actually consumes that source of truth correctly.

*   **Finding 1 (gsettings):** The config files (`settings.ini`) were correct, but the ABI boundary (GSettings/XSettings) was being shimmed by a different layer. The scanner looked at the file; the application looked at the daemon/daemon-cache.
*   **Finding 2 (KItemListView):** The config (`.colors`) was correct, but the consumer (compiled C++ code) ignores the token and performs its own arithmetic (alpha blend) that the scanner cannot intercept because it happens inside the binary.

**Class of Check to Close It:**
You need **Runtime Resolution Assertions (RNA)**. This is not "screenshot everything." This is a headless integration layer that boots the application/widgets in a controlled environment and queries the *effective* values.

**Concrete Assertion:**
For every surface that claims to use `--ring` (Tier C) or `--accent` (Tier D), the test must:
1.  **Identify the Element:** Use accessibility trees (AT-SPI for GTK, QAccessible for Qt) rather than pixel coordinates or CSS selectors, because selectors are fragile and pixels are noisy. Find the "selected row" node.
2.  **Compute Effective Style:** Instead of reading the CSS/C++ source, query the *computed* style.
    *   For GTK: Use `gtk_widget_compute_style` or inspect the CSS provider chain in a headless test app.
    *   For Qt/KDE: This is harder. You must render the widget to a `QPixmap` in a test harness, not a screenshot of the desktop. Then, extract the pixel color of the border region.
3.  **Assert Color/Geometry:**
    $$ \text{Expected} = \#F8F8F8 \text{ (2px width)} $$
    $$ \text{Actual} = \text{Sampled Pixel Value at Border Coordinate} $$
    If `Actual != Expected`, fail.

**Where it runs:**
A dedicated `tests/runtime-resolve/` directory, triggered by CI after the unit tests. It spins up a minimal `ninja`-built test binary for Qt/KDE (a `QLabel` or `QListView` with the SageInk style applied) and a minimal GTK window. It does not rely on the user's live desktop session; it relies on a clean, controlled environment where the *only* variable is the theme application logic.

## Q2 — three sources of truth for the GTK theme

**Verdict:** Converging three writable sources on install is **insufficient and brittle**. It defers the problem to the next mutation.

**Why it's not the right fix:**
`gsettings` (via D-Bus) typically overrides `settings.ini`. If any third-party app (e.g., a color scheme tool, a window manager tweak script, or `gnome-tweaks`) runs `gsettings set org.gnome.desktop.interface gtk-theme <anything>`, your `install.sh` fix is immediately nullified for any GTK4/libadwaita app. The user is left with a state where `settings.ini` says SageInk, but the desktop looks like WhiteSur. This is a "works until it doesn't" fix.

**Structurally Different Approach:**
1.  **Single Source of Truth via D-Bus Watchdog:** Instead of setting values and hoping, run a lightweight D-Bus monitor (or a systemd user service) that watches for changes to `org.gnome.desktop.interface`. If the value changes to non-SageInk, it resets it (or logs a warning) within milliseconds. This treats the setting as *immutable* from the user's perspective unless they explicitly disable the guard.
2.  **Deprecate `settings.ini` for Theme Name:** If possible, configure the distro/environment such that `settings.ini` is *read-only* for the theme name, or remove the key entirely, forcing all consumers to read GSettings. This removes the "two sources" ambiguity.
3.  **Explicit Override Flag:** If the system supports it, use a symbolic link or a specific GSettings key that is guaranteed to have the highest precedence (if such a priority concept exists in the specific GTK version). If not, the watchdog is the only robust solution.

**Recommendation:** Implement a `systemd` user service `sage-ink-theme-guard.service` that executes a script every 30 seconds (or on D-Bus signal) to verify `gsettings get ... gtk-theme` equals `SageInk`. If not, reset it and log the event. This turns a one-time initialization problem into a continuous invariant.

## Q3 — Dolphin / KItemListView

**Choice:** **(c) Find a color-role assignment that makes the composite land on a real token.**

**Why (a) is insufficient:**
Ledgering it is honest, but it leaves a visual defect that is *systemic*. Every `KItemListView` based app (Dolphin, Ark, KCustomizeTool) will show a 1px `#B7DDB7` ring instead of a 2px `#F8F8F8` ring. This breaks the "hard, crisp, opaque" aesthetic at the most granular level of interaction.

**Why (b) is viable but suboptimal:**
Patching `libKF6ItemViews` is *already an established pattern* (you build Klassy from patched source). However, `libKF6ItemViews` is a core library with a larger surface area than the window decoration. A patch here is more likely to conflict with upstream updates than the Klassy patch. It also requires shipping a patched `.so` for a specific upstream version, which increases maintenance burden.

**Why (c) is the best path, and the trap:**
**Viable Path:**
The blend is `SelectionBackground` (which is `#A6C9A6`) blended over `ViewText` or `Base`? No, the prompt says it blends with alpha over the surface.
If the selection background color is changed to `#F8F8F8` (white), the alpha blend of `#F8F8F8` over the dark surface `#121216` will result in a lighter gray, not white.
Wait, the finding says the *outline* is `#B7DDB7`.
If `libKF6ItemViews` draws a frame using `palette().highlight()` blended with opacity, can we set `highlight` to a color such that `blend(hl, surface, alpha) == #F8F8F8`?
Let's assume `blend(c_bg, fg, alpha)`.
If `c_bg` is `#F8F8F8` and `fg` is `#07080A` (base), the result is `#F8F8F8` only if `alpha = 1.0`. But the finding says it's an alpha composite *produced at paint time*.
If the code *always* applies an alpha (e.g., `QColor(1.0, 1.0, 1.0, 0.5)`), then no input color will produce an opaque output unless the input is inverted or the blending mode is different.

**The Trap:**
The trap is that **you cannot control the alpha value**. If the C++ code hardcodes `QColor(h).setAlpha(0.5)` or similar, you cannot mathematically solve for an input color that results in an *opaque* `#F8F8F8` because an alpha composite of *any* color with `alpha < 1` over a *different* background results in a mix, not the pure color.
**However**, look at the specific hex: `#B7DDB7`.
`#A6C9A6` is the accent.
If the code uses `QPalette::Highlight` for the background and `QPalette::HighlightedText` for the text, and draws a *border* using `QPalette::Highlight` with reduced alpha...

**Re-evaluating (b) vs (c):**
If the blend is linear and the alpha is hardcoded to < 1, you **cannot** achieve an opaque token color via input manipulation. The output will always be a tint.
Therefore, **(c) is a trap** if the intention is to get *perfect* token compliance.
**(b) Patching `libKF6ItemViews`** is the only path to *correctness* (100% opaque `#F8F8F8`).
**But**, is it worth it?
If you patch `libKF6ItemViews`, you must ensure the patch doesn't break other KDE apps.
**Alternative (d): Accept the "Impure Toe" and Refine the Palette.**
If you accept the blend, can you choose `SelectionBackground` such that the *blended result* is visually indistinguishable from `#F8F8F8`?
No, `#B7DDB7` is greenish. `#F8F8F8` is white. They are perceptually different.

**Decision
