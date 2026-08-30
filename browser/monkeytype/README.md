# Sage Ink — Monkeytype theme

Custom Monkeytype theme using the canonical Sage Ink palette.

| Slot | Hex | Role |
|---|---|---|
| background | `#07080A` | Raycast-deep base |
| main | `#A6C9A6` | typed-correct + brand sage |
| text | `#F8F8F8` | future text (high contrast) |
| sub | `#6B7280` | muted hint text |
| sub alt | `#1F2028` | elevated surface (key blocks, modals) |
| caret | `#C0E3C0` | accent+1 — visible blink against bg |
| error | `#ED254E` | typed-wrong (Sage Ink negative) |
| extra error | `#FF5272` | brighter red on top of error |

---

## Install

### Option 1 — paste hex values

1. Open Monkeytype → ⚙ → **theme**
2. Set **theme** to `custom`
3. Type in the hex codes from the table above (matches the screenshot field labels)
4. Click **save as new** → name it `sage_ink`

### Option 2 — import JSON via Stylus / browser console

Monkeytype stores themes in localStorage as `customTheme`. Paste into DevTools console at monkeytype.com:

```js
localStorage.setItem('customTheme', JSON.stringify({
  bgColor: '#07080A',
  mainColor: '#A6C9A6',
  subColor: '#6B7280',
  subAltColor: '#1F2028',
  textColor: '#F8F8F8',
  errorColor: '#ED254E',
  errorExtraColor: '#FF5272',
  colorfulErrorColor: '#ED254E',
  colorfulErrorExtraColor: '#FF5272',
  caretColor: '#C0E3C0'
}));
location.reload();
```

Then in settings: **theme = custom**.

### Option 3 — share URL

Monkeytype encodes custom themes into shareable URLs. After saving the theme locally, click **share** in the theme panel to copy a URL. Paste here when you have it for future restoration.

---

## Recommended Monkeytype settings to match

Optional, beyond colors:

- **font size:** 1.5 (large enough for Iosevka Custom Condensed to render loop-tail g cleanly)
- **smooth caret:** medium
- **highlight mode:** word (matches the focused-word visionOS-style emphasis)
- **outline focused words:** on
- **caret style:** block (matches Konsole / Iosevka)
- **font family:** custom `Iosevka Custom Condensed` (paste into the `font family` text field under settings → advanced)
