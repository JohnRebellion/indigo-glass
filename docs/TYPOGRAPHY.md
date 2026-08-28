# Sage Ink - Typography

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
| **Badge / hint** | -2 | 8 | Mono, `--ig-text-dim` |
| **Section heading** | +1 | 13 | SF Pro Display, weight 600 |
| **Page heading** | +2 | 16 | SF Pro Display, weight 600 |
| **Hero / splash** | +4 | 23 | SF Pro Display, weight 700 |

## Per-host scaling

Reference DPI = 109 (Nobara 27" 1440p, `hosts/_default.toml`). Raw DPI ratio is the *starting point* for a host profile, not the answer — the scale factor is tuned in situ and then pinned in `hosts/<host>.toml`.

Only two host profiles exist. These are their actual committed values:

| Host | DPI | Scale | Body | Mono | Toolbar | Smallest |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| `_default` (27" 1440p) | 109 | 1.00 | 11 | 11 | 10 | 9 |
| `aspire5-14-1080p` (14" 1080p) | 157 | 1.27 | 14 | 14 | 13 | 11 |

Note that the Aspire's raw ratio is `157 / 109 = 1.44`, not `1.27`. The profile records why: 1.44x overflowed Plasma panel chrome and menus, 1.33x was still cramped, and 1.27x gave clean integer landings — user-confirmed 2026-06-06. **Any new host profile is expected to go through the same in-situ pass rather than shipping the raw ratio.**

Other display classes (15.6" 1080p, 4K panels at 100%) have no committed profile. Compute `host_dpi / 109` as a first guess, test it, then commit the tuned value as a new `hosts/*.toml`.

DO NOT use Win/KDE display scaling. Scale fonts directly so layout density stays consistent.

## Font families (per role)

| Role | Family stack |
|------|-----|
| Prose | `Carlito, SF Pro Display, -apple-system, system-ui, sans-serif` |
| Chrome (window title/menu/toolbar) | `SF Pro Display, -apple-system, Inter, system-ui, sans-serif` |
| Mono | `Iosevka Custom Condensed, Iosevka Custom, MesloLGS NF, JetBrainsMono Nerd Font, JetBrainsMono NF, Cascadia Code, Fira Code, Consolas, monospace` |

Canonical stacks live in `[type.families]`; the table above is abridged for reading.

**Loop-tail g/a:** Carlito = double-storey (correct). SF Pro Display = single-storey (Apple house). Iosevka Custom Condensed = double-storey (ss18 build pin). For surfaces that use SF Pro Display + want loop-tail g/a: use the `IndigoLoopTail` / `SFProWithLoopTail` `@font-face` w/ `unicode-range: U+0061, U+0067 -> Carlito`. Already in VSCode + Stylus. (The `IndigoLoopTail` name is heritage from the Indigo Glass era and is kept for compatibility — it is not a claim about the current variant.)

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

Weights are a convention of this document — `[type.*]` in the token file carries families, sizes, roles and line heights, but no weight axis. Nothing regenerates the table above.

## Anti-patterns

- **Different sizes in same surface.** If a panel uses body=11, all sub-text rounds to one of {8, 9, 11}. No 10. No 12.
- **Italic for emphasis.** Use weight (bold) or the accent colour, not italic. Italic in dark UIs reads as faded.
- **Accent as text colour.** Sage is a *fill*: `1.72:1` against `--text`. It sits behind text, never as body text. Use `--ig-text` / `--ig-text-muted` / `--ig-text-dim` and let the accent do its work as a background or a rule.
- **Underline.** Reserve for links. Never on hover state.
- **All-caps section headings.** Linear discipline avoids decorative typography. (The Verge's mono-uppercase kicker convention is a deliberate non-adoption — see PHILOSOPHY.md, "Known gap".)

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
