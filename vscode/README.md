# Lime Glass — VSCode Theme

brutalist-glass + Linear dark discipline + Neumorphism 2.0 — ported to VSCode color tokens.

Ships **two color themes** (Dark + Light) sharing the same canonical Lime Glass palette as the KDE/Konsole/GRUB sister themes in this repo.

> Full design rationale: [../docs/PHILOSOPHY.md](../docs/PHILOSOPHY.md) · Cross-platform reference: [../docs/REFERENCE.md](../docs/REFERENCE.md)

---

## Palette mapping

| Token | Dark | Light | Role |
|---|---|---|---|
| `editor.background` | `#07080A` | `#FFFFFF` | Linear-deep / paper |
| `sideBar.background` | `#07080A` | `#F8F8F8` | Chrome |
| `tab.activeBackground` | `#121216` | `#FFFFFF` | Elevated surface |
| Selection | `#A8E63550` | `#4E700430` | Lime tint, never solid |
| `button.background` | `#A8E635` | `#4E7004` | Canonical primary |
| `button.hoverBackground` | `#C1FF58` | `#5C8305` | Hover accent |
| Strings | `#71F79F` | `#15803D` | Positive |
| Keywords | `#C1FF58` | `#4E7004` | Accent hi |
| Types / classes | `#8BC406` | `#5C8305` | Accent alt |
| Functions | `#FBBF24` | `#B45309` | Amber semantic |
| Errors | `#ED254E` | `#C81D45` | Negative |
| Comments | `#6B7280` | `#6B7280` | Muted (italic) |

The Dark theme uses the canonical lime palette. The **Light** theme cannot: ghost-lime `#A8E635` is illegible on white, so it uses a **darker lime ladder** (primary `#4E7004`, hover `#5C8305`, accent-alt `#5C8305`) for AA contrast on paper. Positive/negative also darken (`#15803D`, `#C81D45`). Same hue, dropped lightness.

Design discipline carried from KDE rules:
- **One accent.** Lime `#A8E635`. No rainbow UI chrome.
- **Tint, don't fill.** Selections use `#A8E63550` alpha overlay — glass tint, not solid block.
- **Linear left-bar.** Active tab marked by 1px top border, not background fill.
- **Three text colors only.** `#F8F8F8` primary, `#6B7280` muted, accent-color highlight.

---

## Install (local, no Marketplace)

### Option A — symlink (live edits)

```bash
ln -sf ~/projects/indigo-glass/vscode ~/.vscode/extensions/indigo-glass-0.1.0
```

Restart VSCode → `Ctrl+K Ctrl+T` → **Lime Glass Dark** or **Lime Glass Light**.

### Option B — vsix package

```bash
cd ~/projects/indigo-glass/vscode
npx --yes @vscode/vsce package --no-dependencies --skip-license
code --install-extension indigo-glass-0.1.0.vsix
```

---

## Recommended settings

See `settings.snippet.json` in this directory. Paste into `~/.config/Code/User/settings.json`.

Key picks:
- **Auto theme follow OS** via `window.autoDetectColorScheme` + `preferredDarkColorTheme` / `preferredLightColorTheme`
- **Smooth cursor + scrolling** for visionOS-style motion
- **Bracket pair colorization on** — uses the lime→accent-alt→green→amber rotation
- **Semantic highlighting on**
- **Font family NOT set** — user's monospace pick is preserved

---

## Variants comparison

```
Dark (default)            Light
─────────────────         ─────────────────
bg     #07080A            bg     #FFFFFF
text   #F8F8F8            text   #07080A
sel    #A8E63550          sel    #4E700430
fn     #FBBF24            fn     #B45309
type   #8BC406            type   #5C8305
str    #71F79F            str    #15803D
err    #ED254E            err    #C81D45
```

Both inherit single-accent + tint-not-fill from the parent Linear/visionOS rules in `../docs/PHILOSOPHY.md`.

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

| Anthropic brand var | Default | Lime Glass |
|---|---|---|
| `--app-claude-orange` | `#d97757` | `#A8E635` |
| `--app-claude-clay-button-orange` | `#c6613f` | `#A8E635` |
| `--app-claude-ivory` | `#faf9f5` | `#F8F8F8` (light: `#07080A`) |
| `--app-claude-slate` | `#141413` | `#07080A` (light: `#FFFFFF`) |
| `--app-banner-tint` | `#4a63af` | `#A8E635` |
| `--app-modal-background` | `#000000bf` | `#07080Acc` |
| `--app-spinner-foreground` | inherits | `#A8E635` |

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
| Claude Code recording border | ✓ theme-controlled (lime via editorMarkerNavigationInfo) |
| Claude Code webview retint CSS | ✓ via workbench.html hand-patch (scripts/patch-workbench.sh) |
| Claude Code mono font | ✓ inherits via --vscode-editor-font-family |
| Product icon theme | deferred — Codicons inherit `icon.foreground` |
| File icon theme | not planned (use Material Icons or vscode-icons) |
| Marketplace publish | not planned (local install only) |
