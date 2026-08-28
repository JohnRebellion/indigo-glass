# Sage Ink — VSCode Theme

Neobrutalist ink — opaque, hard-shadow, colour-as-elevation — ported to VSCode color tokens.

Ships **two color themes** (Dark + Light) sharing the same canonical Sage Ink palette as the KDE/Konsole/GRUB sister themes in this repo.

> Full design rationale: [../docs/PHILOSOPHY.md](../docs/PHILOSOPHY.md) · Cross-platform reference: [../docs/REFERENCE.md](../docs/REFERENCE.md)

---

## Palette mapping

| Token | Dark | Light | Role |
|---|---|---|---|
| `editor.background` | `#07080A` | `#FFFFFF` | Ink canvas / paper |
| `sideBar.background` | `#07080A` | `#F8F8F8` | Chrome |
| `tab.activeBackground` | `#121216` | `#FFFFFF` | Elevated surface |
| Selection | `#A6C9A650` | `#4D6D4E30` | Sage tint, never solid |
| `button.background` | `#A6C9A6` | `#4D6D4E` | Canonical primary |
| `button.hoverBackground` | `#C0E3C0` | `#607E60` | Hover accent |
| Strings | `#71F79F` | `#15803D` | Positive |
| Keywords | `#C0E3C0` | `#4D6D4E` | Accent hi |
| Types / classes | `#89A889` | `#607E60` | Accent alt |
| Functions | `#FBBF24` | `#B45309` | Amber semantic |
| Errors | `#ED254E` | `#C81D45` | Negative |
| Comments | `#6B7280` | `#6B7280` | Muted (italic) |

The Dark theme uses the canonical sage palette on its 11:1-contrast dark base — safe as syntax
foreground there. The **Light** theme cannot use raw sage: `#A6C9A6` is only 1.82:1 on white, so it
uses a **darker sage ladder** (primary `#4D6D4E` at 5.81:1, hover/accent-alt `#607E60` at 4.52:1) for
AA contrast on paper — recomputed to match the original lime ladder's contrast targets (was `#4E7004`
5.76:1 / `#5C8305` 4.46:1), not just hue-swapped. Positive/negative are untouched — see note below.
Same accent hue, dropped lightness.

> Positive's OKLCH hue was nudged +12.49° (152.51°→165°) for the Sage variant only — sage's own accent
> sat only 7.5° from the old positive hue, too close to read as distinct. `#15803D`/`#C81D45` here are
> hand-picked Tailwind-adjacent values predating the OKLCH pipeline, not derived from that hue — left
> unchanged as out of scope for this pass.

Design discipline carried from KDE rules:
- **One accent.** Sage `#A6C9A6`. No rainbow UI chrome.
- **Tint, don't fill.** Selections use `#A6C9A650` alpha overlay — a translucent highlight, not a
  glass material (Sage Ink drops backdrop-blur entirely; see `../docs/PHILOSOPHY.md`). Buttons and
  other objects are solid ink: opaque, hard shadow, radius 0.
- **Linear left-bar.** Active tab marked by 1px top border, not background fill.
- **Three text colors only.** `#F8F8F8` primary, `#6B7280` muted, accent-color highlight.

---

## Install (local, no Marketplace)

### Option A — symlink (live edits)

```bash
ln -sf ~/projects/indigo-glass/vscode ~/.vscode/extensions/indigo-glass-0.2.0
```

Restart VSCode → `Ctrl+K Ctrl+T` → **Sage Ink Dark** or **Sage Ink Light**.

### Option B — vsix package

```bash
cd ~/projects/indigo-glass/vscode
npx --yes @vscode/vsce package --no-dependencies --skip-license
code --install-extension indigo-glass-0.2.0.vsix
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
bg     #07080A            bg     #FFFFFF
text   #F8F8F8            text   #07080A
sel    #A6C9A650          sel    #4D6D4E30
fn     #FBBF24            fn     #B45309
type   #89A889            type   #607E60
str    #71F79F            str    #15803D
err    #ED254E            err    #C81D45
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
| Dark color theme | ✓ shipped |
| Light color theme | ✓ shipped |
| Claude Code recording border | ✓ theme-controlled (sage via editorMarkerNavigationInfo) |
| Claude Code webview retint CSS | ✓ via workbench.html hand-patch (scripts/patch-workbench.sh) |
| Claude Code mono font | ✓ inherits via --vscode-editor-font-family |
| Product icon theme | deferred — Codicons inherit `icon.foreground` |
| File icon theme | not planned (use Material Icons or vscode-icons) |
| Marketplace publish | not planned (local install only) |
