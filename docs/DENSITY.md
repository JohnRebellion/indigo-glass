# Sage Ink - Density Manifesto

> Compact, legible, no padding unless necessary. Margins between elements only when they group content.

## Why compact?

Linear's discipline demands information density, and ink has no material reason to spend space: an opaque flat field earns nothing from being larger. Default OS chrome (KDE, GNOME, Win, macOS) is tuned for new users + touchscreens. Power users on 1440p/4K want more on screen.

**Rule: legibility first, padding second.** Letters never crowd. But there is no extra padding "for breathing room" when none is needed.

## Three padding tiers

| Tier | Use | Y / X (px) | Examples |
|------|-----|:---:|----------|
| **Tight**  | List rows, sidebar items, table cells   | 3 / 8  | File tree, Stylus list, KDE Dolphin row |
| **Compact** | Buttons, inputs, toolbar items         | 4 / 10 | Save button, search box, ribbon |
| **Standard** | Modal headers, panels, cards          | 8 / 12 | Settings dialog, notification toast |

NEVER use `pad >= 16px` on anything smaller than a full section/card — `[spacing].pad_xl = 16` is annotated "section padding only" in the token file.

> Tight maps to `list_row_pad_y` / `list_row_pad_x` (3 / 8) and Compact to `button_pad_y` / `button_pad_x` (4 / 10). The Standard tier has no single matching token pair: `[spacing]` offers `pad_lg = 10` and `pad_xl = 16` for inner padding, while 8 and 12 are the `gap_md` / `gap_lg` outer-margin values. Treat 8 / 12 as an editorial convention for large containers, not as a derived value.

## Margins (gaps between elements)

| Tier | Use | px | Examples |
|------|-----|:---:|----------|
| **Flush** | Repeating rows of same kind | 1-2 | List rows in dropdown |
| **Cluster** | Items in same group | 4 | Icon-row in toolbar, form fields |
| **Section** | Sections within panel | 8-12 | Form section to form section |
| **Region** | Major page regions | 20 | Sidebar to main content |

NEVER 24-32px gaps. Looks like wireframe placeholder.

## Buttons

| State | Vertical | Horizontal | Notes |
|-------|:---:|:---:|-------|
| Icon-only | 4 | 4 | Square. `icon_button_pad = 4`. Hover bg = `border_strong` (rgba white 10%) |
| Icon + label | 4 | 10 | The canonical pair — `button_pad_y` / `button_pad_x` |
| Primary CTA | 6 | 12 | Slightly larger for emphasis, NOT 16px. Not token-backed — see note |
| Toolbar tool | 3 | 6 | Lego-tight |

**Asymmetric padding:** less vertical, more horizontal. Buttons read left-to-right, not top-to-bottom.

**Corners are square, not pills.** `[radius].default = 0` — every button is a rectangle. The pill shape (`[radius].full = 9999`) is reserved for circles and *the* primary pill CTA; `xs = 2` is for tags and small badges. There is no intermediate radius to reach for.

> Only the icon-only and icon+label rows correspond to `[spacing]` keys. Primary CTA (6 / 12) and Toolbar tool (3 / 6) combine values that exist in the table for other purposes (`pad_md`, `gap_lg`, `list_row_pad_y`); they are conventions this document sets, not tokens codegen emits.

## Inputs

```
y = 4px, x = 8px
```

No top/bottom border, only a bottom 1px `border` colour. Removes 4px of visual weight per input. Linear field style, and the ink-compatible one — a hairline rule rather than a boxed frame.

## What gets the padding budget

| Element | Budget |
|---------|--------|
| Modals + dialogs | Standard tier (8/12) |
| Notification toasts | Standard |
| Form sections | Standard |
| Settings card | Standard |
| Everything else | Tight or Compact |

## Examples - before/after

### KDE button (Klassy default)

```
BEFORE: padding: 8px 16px        ← 8/16, too tall
AFTER:  padding: 4px 10px        ← 4/10
```

### VSCode tab

```
BEFORE: tab.height auto (~32px)
AFTER:  tab.height: 26px
```

### Stylus list row

```
BEFORE: padding: 8px; margin-bottom: 4px;
AFTER:  padding: 3px 8px; margin: 0;
```

## Anti-patterns

- **"Generous whitespace"** as a virtue. Whitespace is the OS chrome, not a design statement.
- **24px+ gap between header and content.** Header IS part of the content region.
- **Padding above + below text in a button.** Asymmetric only.
- **Empty space inside icon buttons.** 4px around 16x16 icon = 24x24 button. Done.

## How density interacts with ink

Ink changes what padding is *for*. Under glass, generous padding bought you visible backdrop — the tint read through, so space was part of the material. Under ink the fill is opaque, so interior padding buys nothing but distance between a border and a glyph. Spend it only where legibility needs it.

What ink *does* need space for is **outside** the box. `[shadow].ink` is `8px 8px 0 0` and `ink_lg` is `14px 14px 0 0` — hard offsets with zero blur, cast down and right. That silhouette occupies real layout area:

- Reserve clearance to the right and below any inked element. An 8px shadow inside a 4px gap reads as a collision, not as depth.
- Adjacent inked elements need at least the shadow offset between them, or the upper one's shadow lands on the lower one's fill. `[shadow].ink` is 8, so `gap_md` (8) is the exact floor between inked cards and `gap_lg` (12) the comfortable one. `ink_lg` is 14, which no gap step clears except `gap_xl` (20) — use it, and note this is the one place the spacing ladder does not have a snug answer.
- Flush repeating rows (`list_row_gap = 1`) must not be inked individually. They are ink *inside* one inked container, separated by `[shadow].hairline` where a divider is needed at all — "quiet dividers where even ink is too loud", as the token file puts it.

Compact density and hard shadows are not in tension; they just move the budget from inside the element to around it.

## See also

- [PHILOSOPHY.md](PHILOSOPHY.md) - design intent
- [TYPOGRAPHY.md](TYPOGRAPHY.md) - type scale + roles
- [REFERENCE.md](REFERENCE.md) - layer-by-layer values
- `tokens/indigo-glass.tokens.toml` - canonical numeric values
