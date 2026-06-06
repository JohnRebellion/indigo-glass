# Indigo Glass - Density Manifesto

> Compact, legible, no padding unless necessary. Margins between elements only when they group content.

## Why compact?

Linear's discipline + visionOS chrome-recedes ethos demand information density. Default OS chrome (KDE, GNOME, Win, macOS) is tuned for new users + touchscreens. Power users on 1440p/4K want more on screen.

**Rule: legibility first, padding second.** Letters never crowd. But there is no extra padding "for breathing room" when none is needed.

## Three padding tiers

| Tier | Use | Y / X (px) | Examples |
|------|-----|:---:|----------|
| **Tight**  | List rows, sidebar items, table cells   | 3 / 8  | File tree, Stylus list, KDE Dolphin row |
| **Compact** | Buttons, inputs, toolbar items         | 4 / 10 | Save button, search box, ribbon |
| **Standard** | Modal headers, panels, cards          | 8 / 12 | Settings dialog, notification toast |

NEVER use `pad >= 16px` on anything smaller than a full section/card.

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
| Icon-only | 4 | 4 | Square. Hover bg = `border_strong` (rgba white 10%) |
| Icon + label | 4 | 10 | Linear-style pill |
| Primary CTA | 6 | 12 | Slightly larger for emphasis, NOT 16px |
| Toolbar tool | 3 | 6 | Lego-tight |

**Asymmetric padding:** less vertical, more horizontal. Buttons read left-to-right, not top-to-bottom.

## Inputs

```
y = 4px, x = 8px
```

No top/bottom border, only bottom 1px `border` color. Removes 4px of visual weight per input. Linear field style.

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

## How density interacts with translucency

Compact density + translucent glass = more background visible per element = the indigo tint reads through cleanly. Wasted padding = wasted glass canvas.

## See also

- [PHILOSOPHY.md](PHILOSOPHY.md) - design intent
- [TYPOGRAPHY.md](TYPOGRAPHY.md) - type scale + roles
- [REFERENCE.md](REFERENCE.md) - layer-by-layer values
- `tokens/indigo-glass.tokens.toml` - canonical numeric values
