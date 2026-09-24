# Sage Ink — VSCode Theme

Neobrutalist ink — opaque, hard-shadow, colour-as-elevation — ported to VSCode color tokens.

Ships **two color themes** (Dark + Light) sharing the same canonical Sage Ink palette as the KDE/Konsole/GRUB sister themes in this repo.

> Full design rationale: [../docs/PHILOSOPHY.md](../docs/PHILOSOPHY.md) · Cross-platform reference: [../docs/REFERENCE.md](../docs/REFERENCE.md)

---

## Generated — do not hand-edit

Both theme files are generated. `tokens/vscode_roles.py` holds the role MAP (which
VSCode key takes which role); `tokens/indigo-glass.tokens.toml` holds the VALUES.
Dark and light are two renderings of that one map, which is what stops them
disagreeing.

```bash
python3 tokens/codegen.py          # regenerate both themes
scripts/check-palette-drift.sh     # must pass
```

Before 2026-09-22 these files were hand-typed, and the light theme had drifted to
27 occurrences of a violet (`#7C3AED`) on types, classes, numbers, links and button
hover — a colour from no Sage Ink variant, contradicted by this very README. The
drift guard could not see it because it hunts *superseded* accents, not arbitrary
off-palette literals. Generation is the fix; the guard now checks parity too.

---

## Palette mapping

| Token | Dark | Light | Role |
|---|---|---|---|
| `editor.background` | `#07080A` | `#FAFAFC` | Ink canvas / paper |
| `editor.foreground` | `#F8F8F8` | `#23262C` | Body text |
| `sideBar.background` | `#0D0D10` | `#FFFFFF` | Chrome |
| `editor.selectionBackground` | `#A6C9A650` | `#4B6A4C50` | Sage tint, never solid |
| `button.background` | `#A6C9A6` | `#4B6A4C` | Canonical accent fill |
| `button.foreground` | `#000000` | `#FFFFFF` | Legible ON that fill |
| `button.hoverBackground` | `#C0E3C0` | `#375538` | Hover: lighter on dark, darker on light |
| `focusBorder` | `#FFFFFF` | `#000000` | Max contrast against the canvas |
| `widget.border` | `#000000` | `#000000` | Hard silhouette, both variants |
| `editorLineNumber.foreground` | `#7F8695` | `#5A5E67` | Muted |

Syntax:

| Scope | Dark | Light |
|---|---|---|
| String | `#3FFABB` | `#007E52` |
| Keyword | `#C0E3C0` | `#375538` |
| Class / Type | `#89A889` | `#5C7B5C` |
| Comment | `#7F8695` | `#5A5E67` |
| Invalid | `#F42E53` | `#BE0C39` |

The light variant is `[variants.sage_light]`. It cannot reuse the dark accents:
sage `#A6C9A6` measures 1.82:1 on white. Hue (145°) and chroma (0.06) are held
from the dark variant and only lightness moves, each step solved against a
contrast target using codegen's own `contrast_ratio()`. Hover goes **darker** on
a light canvas, not lighter.

### Contrast is asserted, not assumed

`codegen.py` fails the build if a foreground/background pair it ships is
illegible: 4.5:1 for body text, 4.0:1 for deliberately-muted roles and syntax.
This caught a real bug in the hand-typed theme — `button.foreground` was
`#FFFFFF` on a sage fill, measuring **1.68:1**. It is now black on dark (11.53:1)
and white on light (6.06:1).

Known shortfall, inherited from the palette rather than this theme: `text_muted`
measures 4.14:1 on the sage dark base, so comments, line numbers and inactive
tabs sit just under AA. Raising it is a palette-wide change touching every layer,
so it is reported here rather than silently patched.

---

## ANSI terminal slots

The integrated terminal gets all 16 slots from `[variants.<v>.ansi]`.

| Slot | Dark | Dark bright | Light | Light bright |
|---|---|---|---|---|
| `black` | `#35383E` | `#7F8695` | `#2B2E34` | `#5A5E67` |
| `red` | `#F42E53` | `#FF5D6F` | `#BE0C39` | `#A40025` |
| `green` | `#3FFABB` | `#8BFFD2` | `#007E52` | `#006740` |
| `yellow` | `#FBBF24` | `#FFD55A` | `#946900` | `#7A5300` |
| `blue` | `#84AEE3` | `#A5CAFB` | `#315C92` | `#164781` |
| `magenta` | `#CC96C6` | `#E6B5E0` | `#7C4178` | `#6A2A66` |
| `cyan` | `#71D0D5` | `#96E8EC` | `#00757A` | `#006166` |
| `white` | `#D2D4D8` | `#F8F8F8` | `#A9ABAF` | `#23262C` |

This is the one place the single-accent rule is deliberately suspended, on the
same grounds syntax highlighting already suspends it: these are colours the theme
lends to somebody else's **output**, not chrome it paints itself. The slots carry
meaning programs rely on — `ls` paints directories blue and symlinks cyan, `git`
paints diffs red and green — so a slot that cannot be told apart from its
neighbour is a broken slot, not a restrained one.

The previous hand-typed theme had `blue` = `accent_hi` and `magenta` =
`accent_alt`: two sage tones separated only by lightness. `red`/`green`/`yellow`
keep the semantic roles (`negative`/`positive`/`amber`); `blue`/`magenta`/`cyan`
get their own hues, held at sage-adjacent low chroma so the terminal reads as ink
rather than neon. `bright_*` is always the same hue at a shifted lightness.

Not yet propagated to `share/konsole/SageInk.colorscheme`, which still carries its
own hand-typed slots.

---

## Design discipline

Carried from the KDE rules:
- **One accent.** Sage `#A6C9A6`. No rainbow UI chrome. ANSI and syntax excepted, above.
- **Tint, don't fill.** Selections use an alpha overlay — a translucent highlight,
  not a glass material (Sage Ink drops backdrop-blur entirely; see
  `../docs/PHILOSOPHY.md`). Buttons and other objects are solid ink: opaque, hard
  shadow, radius 0.
- **Linear left-bar.** Active tab marked by 1px top border, not background fill.
- **Three text colors only.** Primary, muted, accent-color highlight.

---

## Install (local, no Marketplace)

### Option A — symlink (live edits)

```bash
ln -sf ~/projects/indigo-glass/vscode ~/.vscode/extensions/indigo-glass-0.3.0
```

Restart VSCode → `Ctrl+K Ctrl+T` → **Sage Ink Dark** or **Sage Ink Light**.

### Option B — vsix package

```bash
cd ~/projects/indigo-glass/vscode
npx --yes @vscode/vsce package --no-dependencies --skip-license
code --install-extension indigo-glass-0.3.0.vsix
```

---

## Recommended settings

See `settings.snippet.json` in this directory. Paste into `~/.config/Code/User/settings.json`.

Key picks:
- **Auto theme follow OS** via `window.autoDetectColorScheme` + `preferredDarkColorTheme` / `preferredLightColorTheme`
- **Smooth cursor + scrolling** — a plain editing-comfort setting, not tied to any material (Sage Ink has no glass motion to match)
- **Bracket pair colorization on** — uses the sage→accent-alt→green→amber rotation
- **Semantic highlighting on**
- **Font family NOT set** — user's monospace pick is preserved

---

## Variants comparison

```
Dark (default)            Light
─────────────────         ─────────────────
bg     #07080A            bg     #FAFAFC
text   #F8F8F8            text   #23262C
sel    #A6C9A650          sel    #4B6A4C50
accent #A6C9A6            accent #4B6A4C
type   #89A889            type   #5C7B5C
str    #3FFABB            str    #007E52
err    #F42E53            err    #BE0C39
```

Both inherit single-accent + tint-not-fill from the parent rules in `../docs/PHILOSOPHY.md`.

---

## Claude Code webview retint (direct CSS append)

Anthropic's Claude Code webview runs in an isolated VSCode iframe. apc-extension is broken on Insiders 1.124+, and `workbench.html` patches don't cascade into the iframe. The only working path: append CSS directly to the extension's own `webview/index.css`.

### Apply

```bash
bash vscode/scripts/patch-webview-css.sh           # patch
bash vscode/scripts/patch-webview-css.sh --revert  # strip block
```

The script auto-detects Claude Code under `~/.vscode-insiders/extensions/` or `~/.vscode/extensions/`. The CSS file is user-owned so no `sudo` is needed.

**Reload after patching:** `Ctrl+Shift+P` → `Developer: Reload Window`.

### What gets overridden

| Anthropic brand var | Default | Sage Ink |
|---|---|---|
| `--app-claude-orange` | `#d97757` | `#A6C9A6` |
| `--app-claude-clay-button-orange` | `#c6613f` | `#A6C9A6` |
| `--app-claude-ivory` | `#faf9f5` | `#F8F8F8` (light: `#07080A`) |
| `--app-claude-slate` | `#141413` | `#07080A` (light: `#FFFFFF`) |
| `--app-banner-tint` | `#4a63af` | `#A6C9A6` |
| `--app-modal-background` | `#000000bf` | `#07080Acc` |
| `--app-spinner-foreground` | inherits | `#A6C9A6` |

Plus targeted overrides:
- `.inputContainer_cKsPxg:focus-within` — the prompt focus ring (was the orange-red border)
- `.codeInput_Eg8KCQ:focus` — inline code editor focus
- Literal `#d97757` selectors: checkboxes, suggestion bullets, splitter, mention chips
- Status badges, button hover glow

### Fonts

Webview `body` uses `--vscode-chat-font-family` (often unset → ugly fallback). The CSS forces:

```css
body                              → var(--vscode-font-family)         /* workbench UI font */
code, pre, .monaco-editor,
[class*="monospace"|"codeBlock"|"bashOutput"]
                                  → var(--vscode-editor-font-family)  /* Iosevka */
```

This fixes bash/tool output blocks rendering in system fallback font.

### After Claude Code extension upgrades

The extension reinstalls into a new versioned directory (`anthropic.claude-code-X.Y.Z/`), wiping the patch. Re-run `bash vscode/scripts/patch-webview-css.sh`.

---

## Status

| Component | Status |
|---|---|
| Dark color theme | ✓ shipped, generated from tokens |
| Light color theme | ✓ shipped, generated from tokens |
| ANSI terminal slots | ✓ generated from `[variants.<v>.ansi]` |
| Contrast assertions | ✓ enforced at generation time, build fails on a bad pair |
| Claude Code recording border | ✓ theme-controlled (sage via editorMarkerNavigationInfo) |
| Claude Code webview retint CSS | manual — run `bash vscode/scripts/patch-webview-css.sh`, re-run after every Claude Code extension upgrade |
| Claude Code mono font | ✓ inherits via --vscode-editor-font-family |
| Konsole ANSI parity | ✗ `share/konsole/SageInk.colorscheme` still hand-typed |
| Product icon theme | deferred — Codicons inherit `icon.foreground` |
| File icon theme | not planned (use Material Icons or vscode-icons) |
| Marketplace publish | not planned (local install only) |
