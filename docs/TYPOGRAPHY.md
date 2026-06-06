# Indigo Glass - Typography

> Single canonical scale. No more flip-flop commits on font size.

## Scale (minor third = 1.2x)

Anchor: **body = 11pt** at reference DPI 109 (Nobara 27" 1440p).

| Step | pt | Use |
|:---:|:---:|------|
| -2 | 8  | Hint text, badge numbers |
| -1 | 9  | Caption, smallest readable |
| 0 (anchor) | 11 | Body, list items, menus, mono code |
| +1 | 13 | Heading small, section label |
| +2 | 16 | Heading medium |
| +3 | 19 | Heading large |
| +4 | 23 | Hero only (rare) |

Never use sizes between these steps (no 10, 12, 14, 15). Steps are canon.

## Role -> Size

| Role | Step | pt @ ref DPI | Notes |
|------|:---:|:---:|-------|
| **Body / app content** | 0  | 11 | Carlito. The default. |
| **Monospace / code** | 0 | 11 | Iosevka Custom Condensed. Matches body cap-height visually because Iosevka is narrower. |
| **Menu / context menu** | 0 | 11 | SF Pro Display |
| **Window title** | 0 | 11 | SF Pro Display, weight 500 |
| **Toolbar button label** | -1 | 9 | SF Pro Display. Compact toolbars. |
| **Tooltip / caption** | -1 | 9 | SF Pro Display |
| **Badge / hint** | -2 | 8 | Mono, dim color |
| **Section heading** | +1 | 13 | SF Pro Display, weight 600 |
| **Page heading** | +2 | 16 | SF Pro Display, weight 600 |
| **Hero / splash** | +4 | 23 | SF Pro Display, weight 700 |

## Per-host scaling

Reference DPI = 109 (Nobara 27" 1440p). Other hosts scale all pt values by `host_dpi / 109`, rounded to nearest int.

| Host | DPI | Scale | Body | Mono | Toolbar | Caption |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| `_default` (27" 1440p) | 109 | 1.00 | 11 | 11 | 10 | 9 |
| `aspire5-14-1080p` | 157 | 1.27 | 14 | 14 | 12 | 11 |
| 15.6" 1080p | 141 | 1.30 | 14 | 14 | 13 | 12 |
| 24" 4K @ 100% | 184 | 1.69 | 19 | 19 | 17 | 15 |
| 27" 4K @ 100% | 163 | 1.50 | 16 | 16 | 15 | 13 |
| 32" 4K @ 100% | 138 | 1.27 | 14 | 14 | 13 | 12 |

DO NOT use Win/KDE display scaling. Scale fonts directly so layout density stays consistent.

## Font families (per role)

| Role | Family stack |
|------|-----|
| Prose | `Carlito, SF Pro Display, -apple-system, system-ui, sans-serif` |
| Chrome (window title/menu/toolbar) | `SF Pro Display, -apple-system, Inter, system-ui, sans-serif` |
| Mono | `Iosevka Custom Condensed, Iosevka Custom, MesloLGS NF, JetBrainsMono Nerd Font, Cascadia Code, Fira Code, Consolas, monospace` |

**Loop-tail g/a:** Carlito = double-storey (correct). SF Pro Display = single-storey (Apple house). Iosevka Custom Condensed = double-storey (ss18 build pin). For surfaces that use SF Pro Display + want loop-tail g/a: use the `IndigoLoopTail` / `SFProWithLoopTail` `@font-face` w/ `unicode-range: U+0061, U+0067 -> Carlito`. Already in VSCode + Stylus.

## Line height

| Use | Value |
|-----|:---:|
| Tight: compact list rows, button labels | 1.20 |
| Default: body prose, menus | 1.40 |
| Long-form prose: documentation, README rendering | 1.55 |

## Weight

| Role | Weight |
|------|:---:|
| Body | 400 |
| Strong / heading | 600 |
| Hero | 700 |
| Caption / dim | 400 |
| Toolbar | 500 (denser, slightly bolder for legibility at small size) |

## Anti-patterns

- **Different sizes in same surface.** If a panel uses body=11, all sub-text rounds to one of {8, 9, 11}. No 10. No 12.
- **Italic for emphasis.** Use weight (bold) or color (indigo), not italic. Italic in dark UIs reads as faded.
- **Underline.** Reserve for links. Never on hover state.
- **All-caps section headings.** Linear discipline avoids decorative typography.

## Rules for changing this scale

1. Open a PR with a clear "why" (e.g. ergonomic study, accessibility audit, OLED render testing)
2. Update **all** pt values everywhere via `tokens/codegen.py`
3. Update this doc + `tokens/indigo-glass.tokens.toml` [type.scale]
4. Update host profiles in `hosts/*.toml`
5. Single commit, single message, no flip-flop

## See also

- `tokens/indigo-glass.tokens.toml` [type.*]
- [DENSITY.md](DENSITY.md) - spacing pairs w/ typography
- [REFERENCE.md](REFERENCE.md) - per-layer concrete values
