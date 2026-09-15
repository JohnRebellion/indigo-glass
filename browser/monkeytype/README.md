# Monkeytype theme

Generated from `tokens/indigo-glass.tokens.toml` — do not hand-edit the JSON here,
regenerate with `python3 tokens/codegen.py`.

| File | What it is |
|---|---|
| `indigo-glass.json` | the ten-slot custom theme, active variant |
| `indigo-glass.settings.json` | full settings export: that theme + the display settings below |
| `tokens/out/monkeytype.<variant>.json` | the same theme for every other variant |
| `tokens/out/monkeytype-settings.<variant>.json` | the same settings export per variant |

The active variant is `meta.default_variant` in the token file; today that is
Sage Ink. Every other brand hue is already emitted — pick the variant file if you
want Orchid Ink, Rust Ink, or the light pair.

## Slots

| Slot | Token | Role |
|---|---|---|
| background | `base` | Raycast-deep base |
| main | `accent` | typed-correct text — the brand hue |
| text | `text` | future text (highest-contrast neutral) |
| sub | `text_muted` | muted hint text |
| sub alt | `surface_alt` | elevated surface (key blocks, modals) |
| caret | `accent_hi` | accent+1 — visible blink against typed text |
| error | `negative` | typed-wrong |
| extra error | derived | one step further from base: brighter on the dark variants, darker on a light one |

`colorful error` / `colorful extra error` repeat error / extra error — an ink
palette has exactly one red, so colorful mode and plain mode agree.

Contrast against each variant's own background (sage): main 11.00:1, text 18.87:1,
sub 4.14:1, error 4.75:1, extra error 6.39:1, caret 14.30:1. The legacy `indigo`
variant is the weak one at 4.07:1 on main — large text only.

---

## Install

### Option 1 — import full settings JSON (preferred)

Settings → **import settings** → paste the contents of `indigo-glass.settings.json`.
Carries the theme plus block caret, word highlight and Iosevka Custom Condensed.

This replaces *every* Monkeytype setting, not just the colors. Export your current
settings first if you want them back.

### Option 2 — paste hex values

1. Open Monkeytype → ⚙ → **theme**
2. Set **theme** to `custom`
3. Type the hex codes from `indigo-glass.json` into the matching fields
4. **save as new** → name it after the variant (`sage_ink`)

### Option 3 — browser console

Monkeytype keeps the custom theme in localStorage. At monkeytype.com, in DevTools,
paste the object from `indigo-glass.json` minus its `name` key:

```js
localStorage.setItem('customTheme', JSON.stringify(/* paste here */));
location.reload();
```

Then set **theme = custom**.

### Option 4 — share URL

Monkeytype encodes a custom theme into a shareable URL. After saving the theme
locally, click **share** in the theme panel. Paste the URL here when you have one.

---

## Display settings

Carried by the settings export; set by hand if you installed colors only.

- **caret style:** block (matches Konsole / Iosevka)
- **highlight mode:** word (the focused-word visionOS-style emphasis)
- **smooth caret:** medium
- **font family:** `Iosevka Custom Condensed` (settings → advanced, type it into the font field)
- **font size:** 2 — 1.5 is the floor at which the loop-tail g still reads
- **outline focused words:** on, if your Monkeytype build has it — it predates
  the settings keys in the export, so it is not carried
