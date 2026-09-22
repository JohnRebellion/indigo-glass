### 1. M1 Fix: QML Selected Text Illegibility

#### Analysis & Optimal Solution

Kirigami and QML components sample `KColorScheme` directly from the `[Colors:Selection]` group in your `.colors` file, bypassing `QStyle::polish()`. Because `ForegroundNormal` was set to `7,8,10` (`#07080A`), QML items with un-filled outline selections render dark text on a dark background.

The most robust fix—requiring **zero Kirigami/qqc2 system library patches**—is to invert the palette responsibility:

1. **Set `ForegroundNormal` in `.colors` to `#F8F8F8` (`248,248,248`)**. This makes text `#F8F8F8` by default across all selection contexts system-wide (QML sidebar rows, Qt Widget item views, and Kirigami lists).
2. **Handle filled text selections (Tier A widgets) inside Klassy's `polish()**`. Since `QLineEdit`, `QTextEdit`, and `QPlainTextEdit` draw a solid `#A6C9A6` fill on text selection, explicitly set `QPalette::HighlightedText` to `#07080A` on those specific input classes inside `polish()`.

#### Code Changes

**In `SageInk.colors` (`[Colors:Selection]`):**

```ini
[Colors:Selection]
BackgroundNormal=166,201,166
BackgroundAlternate=192,227,192
ForegroundNormal=248,248,248
ForegroundActive=248,248,248
ForegroundInactive=107,114,128

```

**In Klassy C++ (`polish()` patch):**

```cpp
// Sage Ink: Set HighlightedText := #07080A ONLY for filled input widgets,
// allowing global selection text to stay #F8F8F8 for Tier C outlines in QML and ItemViews.
if (qobject_cast<QLineEdit*>(widget) || 
    qobject_cast<QTextEdit*>(widget) || 
    qobject_cast<QPlainTextEdit*>(widget)) {
    QPalette p = widget->palette();
    p.setColor(QPalette::Active, QPalette::HighlightedText, QColor(7, 8, 10));
    p.setColor(QPalette::Inactive, QPalette::HighlightedText, QColor(7, 8, 10));
    widget->setPalette(p);
}

```

---

### 2. M9 Fix: Web Userstyle Strategy (Borders & Hard Shadows)

Adding 2px `border_strong` (`#5E5E60`) and 4px hard offset shadows (`4px 4px 0 0 #89A889`) to web pages via Stylus is achievable without breaking page layouts if applied with layout-aware constraints:

#### 1. Border Mechanics (`2px solid #5E5E60`)

* **Problem:** Altering `border-width` from 1px to 2px on elements with explicit pixel heights or `content-box` sizing causes layout jitter, misalignment, or scrollbars.
* **Fix:** Use inset box-shadows or outlines for borders on structural web components:
```css
/* For inputs and structural cards where border-width shifts metrics */
input, textarea, select, .card, .Box {
  border: 1px solid transparent !important;
  box-shadow: inset 0 0 0 2px #5E5E60 !important;
  border-radius: 0 !important;
}

```



#### 2. Hard Offset Shadows (`4px 4px 0 0 #89A889`)

* **Problem:** Applying `box-shadow: 4px 4px 0 0 #89A889` inside parent containers with `overflow: hidden` clips the shadow on the right and bottom edges.
* **Fix:** Target elevated surfaces selectively (buttons, modals, floating menus, standalone cards) and add compensating margin or force parent overflow visibility:
```css
/* Primary buttons & standalone cards */
.btn-primary, button[type="submit"], .Box--overlay, [role="dialog"] {
  box-shadow: 4px 4px 0 0 #89A889 !important;
  margin-right: 4px !important;
  margin-bottom: 4px !important;
}

/* Prevent shadow clipping on parent list items */
.js-navigation-container, .Box-body {
  overflow: visible !important;
}

```



---

### 3. Direct Remediation for GTK3, Edge, and Klassy Findings

#### GTK3 Theme (`gtk-dark.css`) Fixes

1. **Eliminate Translucency (M2):** Replace all `rgba(137, 168, 137, 0.9)` with `#89A889` and `rgba(7, 8, 10, 0.9)` with `#07080A`.
2. **Correct Border Token (M3):**
```css
@define-color borders #5E5E60;
@define-color unfocused_borders #5E5E60;

```


3. **Enforce 2px Borders System-Wide (M4):** Update `entry`, `checkbutton check`, `radiobutton radio`, `switch`, and `headerbar button` to use `2px solid @borders`.
4. **Remove Un-tokened Fills and Translucent Hovers (M5):**
```css
/* Switch track */
switch {
  background-color: #121216; /* surface-alt */
  border: 2px solid @borders;
  border-radius: 9999px;
}

/* Headerbar button hover: flat opaque fill, no alpha() */
headerbar button:hover, .titlebar button:hover {
  background-color: #191c1e;
  border-color: @borders;
}

```



#### MS Edge Chrome & NTP Pre-Compensation (`manifest.json`)

Chromium lifts dark frame colors non-linearly. To render target Sage Ink tokens on screen, apply pre-compensated RGB inputs in `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Sage Ink — Edge Theme",
  "version": "1.3.2",
  "theme": {
    "colors": {
      "frame":                      [10, 10, 15],  /* Renders exact surface_alt #121216 */
      "frame_inactive":             [6, 6, 9],     /* Renders exact surface #0D0D10 */
      "frame_incognito":            [4, 4, 6],     /* Renders exact sidebar #0A0A0D */
      "frame_incognito_inactive":   [1, 2, 3],     /* Renders exact base #07080A */

      "toolbar":                    [10, 10, 15],  /* Renders #121216 */
      "toolbar_text":               [248, 248, 248],

      "tab_text":                   [248, 248, 248],
      "tab_background_text":        [165, 169, 178],

      "omnibox_background":        [1, 2, 3],     /* Pre-compensated for base #07080A */
      "omnibox_text":              [248, 248, 248],

      "ntp_background":             [1, 2, 3],     /* Fixes M7: Forces NTP background to #07080A */
      "button_background":          [10, 10, 15]
    }
  }
}

```

#### Klassy Window Titlebar Buttons (`klassyrc`)

Fix M10 by changing titlebar button colors from `AccentTrafficLights` red/amber/green to single-accent Sage Ink window controls:

```ini
[ButtonColors]
ButtonBackgroundColorsActive=TitleBarTextAuto
ButtonBackgroundColorsInactive=TitleBarTextAuto
ButtonBackgroundOpacityActive=100
ButtonBackgroundOpacityInactive=100

[Windeco]
ButtonShape=ShapeSmallCircle
ColorizeWindowOutlineWithButton=false

```