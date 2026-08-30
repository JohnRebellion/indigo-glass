# Sage Ink

> Cross-platform design system for KDE Plasma 6.6+ — neobrutalist ink (opaque flat surfaces, hard offset shadow, colour-as-elevation) audited against the actual [neobrutalism.dev](https://neobrutalism.dev) reference (`ekmas/neobrutalism-components`), not folk-knowledge "neobrutalist" styling.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Plasma](https://img.shields.io/badge/KDE_Plasma-6.6%2B-1d99f3.svg)
![Wayland](https://img.shields.io/badge/Wayland-supported-A6C9A6.svg)

---

## What it is

A complete, cohesive visual identity that spans:

- **KDE Plasma desktop** — Klassy window decoration (built from source), a custom SageInk Plasma widget theme, SageInk colour scheme
- **GTK applications** — a custom SageInk GTK3/GTK4 theme (own theme package, not a third-party one)
- **Konsole terminal** — SageInk profile, Iosevka Custom Condensed
- **Shell prompt** — Starship config with sage segments
- **System info** — Fastfetch with minimal sage display
- **GRUB bootloader** (optional) — matching sage-on-ink theme with SF Pro fonts
- **Web frontend** (bonus) — Tailwind v4 `@theme` block following the neobrutalism.dev customizer's own variable schema

All layers reference the **same color tokens**, so terminal accents match window selections match GTK buttons match webapp buttons. The default variant is **Sage Ink**; **Indigo Glass** ships alongside as a selectable variant (see [Variants](#variants)).

---

## Color palette

Default variant — **Sage Ink** (values from `tokens/out/css-vars.sage.css`):

```
Base           #07080A     Raycast-deep near-black (OLED-safe)
Surface        #0D0D10     Window bg
Surface+1      #121216     Elevated panels, opaque ink fill
Sidebar        #0A0A0D     Sidebar bg

Accent         #A6C9A6     Sage primary — selection, buttons
Accent+1       #C0E3C0     Hover, focus, active link
Accent-alt     #89A889     Active, decoration, visited link
Amber          #FBBF24     Semantic warning
Positive       #3FFABB     Success
Negative       #ED254E     Error, destructive

Text primary   #F8F8F8
Text muted     #6B7280
```

Sage `#A6C9A6` on base `#07080A` = **11.00:1** (AAA). Sage is fill-only — it
cannot carry body text (1.72:1 against `--text`), so text stays neutral
throughout; only fills, borders, and icons take the accent.

The Indigo Glass heritage variant (`#5E6AD2` accent, `#0F0F12` base) ships
alongside — see [Variants](#variants).

---

## Material

Opaque flat ink. No blur, no gradient, no translucent glass anywhere:

- Every surface is a solid fill; elevation is colour + a hard offset shadow
  (zero blur radius), never softness.
- `border-2` (2px solid) on every shadow-bearing surface — matches the
  neobrutalism.dev reference's own universal border rule.
- Radius ladder is `0 / 2 / 9999` — sharp corners everywhere except the
  deliberate pill/circle exception (badges, literal round CTAs).
- On-select/focus state on a clickable list-like item (row, tab, menu item)
  is a solid-colour **outline**, never a translucent or filled highlight —
  fill means identity (badges/buttons keep theirs), outline means state.
  See [`docs/STATE_GRAMMAR.md`](docs/STATE_GRAMMAR.md) for the full rule and
  [`docs/OUTLINE-SWEEP-2026-08-30.md`](docs/OUTLINE-SWEEP-2026-08-30.md) for
  the audit that enforced it across every layer.

---

## Web portfolio adoption (bonus)

If you have a SvelteKit / Next.js / Astro portfolio with Tailwind v4, copy
`web/app.css.example` into your main CSS file. It follows the
neobrutalism.dev customizer's own output schema **verbatim** — same variable
names (`--main` / `--border` / `--shadow` / `--background` /
`--secondary-background` / `--foreground` / `--main-foreground` / `--ring` /
`--overlay` / `--chart-*`) — with only the hue changed to Sage Ink's accent
(OKLCH hue 145°). Dark-only (no light variant is authored). Provides:

- `@theme inline` mapping wired to Tailwind's `font-base` / `font-heading`
  weight utilities and a `--shadow-shadow` token
- A hard 4px offset shadow (`--shadow: 4px 4px 0px 0px var(--border)`) —
  literal black border/shadow here specifically, matching the reference
  exactly; every other Sage Ink surface (GTK, Klassy/KWin, VSCode, SDDM)
  uses a sage `accent_alt` shadow instead — the web template deliberately
  diverges to stay schema-faithful
- A solid `outline: 2px solid var(--ring)` focus-visible ring — no
  translucent glow

```css
/* neobrutalism.dev card, ported to Sage Ink's hue */
<div class="border-2 border-border bg-secondary-background shadow-shadow p-6">
  <h2 class="font-heading text-2xl">Hello world</h2>
  <button class="border-2 border-border bg-main text-main-foreground shadow-shadow px-4 py-2">
    Click
  </button>
</div>
```

---

## Variants

The palette is multi-variant. Colors live only in `[variants.<name>]` in
`tokens/indigo-glass.tokens.toml`; everything else (spacing, radius, shadow,
type, motion) is variant-agnostic. `tokens/codegen.py` reads
`[meta].default_variant`, resolves it into the default outputs, **and** emits
one file per variant.

| Variant | Accent | Base | Status |
|---|---|---|---|
| **Sage Ink** (`sage`) | `#A6C9A6` | `#07080A` | **default** |
| **Indigo Glass** (`indigo`) | `#5E6AD2` | `#0F0F12` | installable alongside default |
| **Lime Glass** (`lime`) | `#A8E635` ghost-lime | `#07080A` | token-only — values still derive in `tokens/out/*.lime.*` for reference/regeneration, but `install.sh` ships no `LimeGlass.colors`/Konsole profile; there is currently no installable Lime Glass option |

Per-variant generated files live in `tokens/out/` as `*.sage.*` / `*.indigo.*`
/ `*.lime.*` (e.g. `css-vars.sage.css`, `kde-palette.indigo.colors`,
`wt-scheme.lime.json`). The unsuffixed files (`css-vars.css`, …) are copies
of the active default.

### Switching the default variant

1. Set `default_variant = "indigo"` in `[meta]` of `tokens/indigo-glass.tokens.toml`.
2. Regenerate: `python3 tokens/codegen.py`.
3. Re-run `bash scripts/install.sh` (or copy the per-variant files you need).

### Selecting a variant per layer (without changing the default)

- **KDE color scheme:** `plasma-apply-colorscheme SageInk` or `IndigoGlass`
  (both installed by `install.sh`).
- **Konsole:** pick the `SageInk` or `IndigoGlass` profile.
- **VSCode:** choose *Sage Ink Dark/Light* in the theme picker (the Indigo
  Glass VSCode theme has not been ported forward — Sage Ink is the only
  shipped VSCode option currently).
- **CSS/web:** import `css-vars.sage.css` or `css-vars.indigo.css` directly.

---

## Stack

| Layer | Tool |
|---|---|
| Window decoration | [Klassy](https://github.com/paulmcauley/klassy) v6.5.3 (built from source) |
| KWin blur engine | none — ink has no translucent surface anywhere, so there's nothing to blur; [kwin-effects-better-blur-dx](https://github.com/xarblu/kwin-effects-better-blur-dx) was removed from the install path (v5, 2026-08-28) |
| GTK theme | own (`config/gtk-theme/SageInk`) — was WhiteSur-Dark-purple (third-party, only ever accent-tinted, never actually ink-material); replaced 2026-08-28 |
| Icon theme | [Papirus-Dark](https://github.com/PapirusDevelopmentTeam/papirus-icon-theme) — flat, solid, high-contrast; was Tela-circle-purple-dark (soft gradient fill blended into dark backgrounds instead of reading as solid opaque colour) |
| Plasma theme | own (`config/plasma-theme/SageInk`) — re-authored from Klassy's kite-indigo companion theme: opaque throughout, sharp corners, soft shadow gradients sharpened to a hold-then-cutoff |
| Shell prompt | [Starship](https://starship.rs) |
| System info | [Fastfetch](https://github.com/fastfetch-cli/fastfetch) |
| Cursor | breeze_cursors (default); an optional Bibata-based cursor recoloured to the sage accent ships in `cursor/` (manual install, not part of `install.sh`) |

---

## Fonts

| Role | Font | Reason |
|---|---|---|
| General UI | **Carlito** | Humanist with double-storey loop-tail g — matches Iosevka mono allograph |
| Window title / Menu / Toolbar | **SF Pro Display** | Apple-system, sharp and legible at UI sizes |
| Fixed / Mono / Konsole | **Iosevka Custom Condensed** → **MesloLGS NF** → **JetBrainsMono Nerd Font** → monospace | Coding |

Two-family discipline: humanist rounded for content + geometric sharp for chrome.

### Canonical mono cascade (every coding context)

Same fallback chain everywhere code is rendered or typed:

```
Iosevka Custom Condensed   (private ss18 build — double-storey g)
→ Iosevka Custom
→ MesloLGS NF              (Powerlevel10K-default Nerd Font)
→ JetBrainsMono Nerd Font  (broad Nerd Font glyph coverage)
→ Cascadia Code
→ Fira Code
→ Consolas
→ monospace
```

Applied to:
- **VSCode** — `editor.fontFamily` (user setting)
- **VSCode Claude Code** — webview mono selectors via patch-webview-css.sh
- **Konsole** — `SageInk.profile Font=`
- **KDE / kdeglobals** — `fixed=Iosevka Custom Condensed`
- **Stylus universal** — every web `code/pre/textarea/.monaco-editor/.CodeMirror/.cm-editor/.ace_editor`, plus Monkeytype `.word`, GitHub `.blob-code`, StackOverflow `.s-code-block`
- **GRUB** — N/A (boot picker is display-only, no mono content)

The fallback chain is consistent so font installation order doesn't matter; the highest-priority installed font wins.

> **Note:** The author's personal config uses **Iosevka Custom Condensed** for monospace and **SF Pro Display** for chrome — both bundled in `share/fonts/indigo-glass-fonts/` (see `browser/README.md` for install).

---

## Known limitations (Plasma 6.6 — August 2026)

| Issue | Workaround |
|---|---|
| Kickoff popup solid (Plasma QML hardcodes background) | Wait for a future Plasma release, or use the Application Dashboard widget |
| Edge/Chromium context menu solid (Skia native widget) | Use Falkon/Firefox if matching aesthetic is critical |
| Third-party custom Plasma themes (kite-indigo, MacSonoma-Dark) trigger continuous FBO crash spam | Not an issue for the shipped `SageInk` Plasma theme itself (re-authored from kite-indigo's ideas, verified stable) — only applies if you swap in an *external* custom theme |
| KDE-Rounded-Corners plugin causes GL_INVALID_VALUE crashes | Disabled; Klassy titlebar handles top corners |
| Dolphin / KItemViews file-listing selection is a filled rect, not an outline | Compiled C++ in `libKF6ItemViews`, no config/colour-scheme/SVG hook exists to change it — documented limitation, not fixable from this repo |

See [`docs/REFERENCE.md`](docs/REFERENCE.md) for full diagnoses + recovery commands, and [`docs/OUTLINE-SWEEP-2026-08-30.md`](docs/OUTLINE-SWEEP-2026-08-30.md) §5 for every other documented "wall" (Vencord/Discord, VSCode API gaps, Edge/Chrome theme manifest limits).

---

## Documentation

- [`docs/REFERENCE.md`](docs/REFERENCE.md) — Full reference: colors, layers, install steps, known bugs, recovery
- [`docs/PHILOSOPHY.md`](docs/PHILOSOPHY.md) — Design rationale
- [`docs/STATE_GRAMMAR.md`](docs/STATE_GRAMMAR.md) — The fill-vs-outline convention and how it's enforced
- [`docs/SAGE_INK_AUDIT.md`](docs/SAGE_INK_AUDIT.md) — Exhaustive per-layer audit against the neobrutalism.dev reference

---

## Uninstall / rollback

```bash
# KDE — revert to defaults
plasma-apply-colorscheme BreezeDark
plasma-apply-lookandfeel -a org.kde.breezedark.desktop
kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "library" "org.kde.breeze"
kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "theme" "Breeze"
qdbus-qt6 org.kde.KWin /KWin reconfigure
kquitapp6 plasmashell && kstart plasmashell &

# GTK
gsettings set org.gnome.desktop.interface gtk-theme 'Adwaita-dark'
gsettings set org.gnome.desktop.interface icon-theme 'Adwaita'

# Shell — manually remove appended snippets from ~/.zshrc / ~/.bashrc / ~/.profile
```

---

## Contributing

Pull requests welcome. Particularly interested in:

- Distro-specific installer paths (Arch AUR, openSUSE, Ubuntu/Pop!\_OS)
- Web framework adapters (Astro, Next.js, Nuxt, Solid)
- Editor themes (VSCode, Neovim, JetBrains, Sublime, Zed)
- Browser themes (Firefox userChrome.css, Edge stylesheet, Vivaldi)
- Screenshots / showcases

---

## Credits

Built on top of:

- **Klassy** by Paul McAuley
- **Papirus** icon theme by the Papirus Development Team
- **Starship** prompt
- **Fastfetch**

Design philosophy audited against:

- [neobrutalism.dev](https://neobrutalism.dev) (`ekmas/neobrutalism-components`) — border widths, shadow offsets, press states, colour-block rules, typography, spacing

---

## License

MIT. Use it, fork it, remix it.
