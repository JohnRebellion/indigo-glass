# Indigo Glass — VSCode Theme

visionOS spatial glass + Linear dark discipline + Neumorphism 2.0 — ported to VSCode color tokens.

Ships **two color themes** (Dark + Light) sharing the same canonical Indigo Glass palette as the KDE/Konsole/GRUB sister themes in this repo.

> Full design rationale: [../docs/PHILOSOPHY.md](../docs/PHILOSOPHY.md) · Cross-platform reference: [../docs/REFERENCE.md](../docs/REFERENCE.md)

---

## Palette mapping

| Token | Dark | Light | Role |
|---|---|---|---|
| `editor.background` | `#0F0F12` | `#FFFFFF` | Linear-deep / paper |
| `sideBar.background` | `#0F0F12` | `#F8F8F8` | Chrome |
| `tab.activeBackground` | `#1F2028` | `#FFFFFF` | Elevated surface |
| Selection | `#5E6AD250` | `#5E6AD230` | Indigo tint, never solid |
| `button.background` | `#5E6AD2` | `#5E6AD2` | Canonical primary |
| `button.hoverBackground` | `#818CF8` | `#7C3AED` | Hover accent |
| Strings | `#71F79F` | `#15803D` | Positive |
| Keywords | `#818CF8` | `#5E6AD2` | Indigo |
| Types / classes | `#A78BFA` | `#7C3AED` | Violet |
| Functions | `#FBBF24` | `#B45309` | Amber semantic |
| Errors | `#ED254E` | `#C81D45` | Negative |
| Comments | `#6B7280` | `#6B7280` | Muted (italic) |

Light variant uses **darkened** accent variants for AA contrast on white (`#7C3AED` instead of `#A78BFA`, `#15803D` instead of `#71F79F`). Indigo primary stays canonical.

Design discipline carried from KDE rules:
- **One accent.** Indigo `#5E6AD2`. No rainbow UI chrome.
- **Tint, don't fill.** Selections use `#5E6AD250` alpha overlay — glass tint, not solid block.
- **Linear left-bar.** Active tab marked by 1px top border, not background fill.
- **Three text colors only.** `#F8F8F8` primary, `#6B7280` muted, accent-color highlight.

---

## Install (local, no Marketplace)

### Option A — symlink (live edits)

```bash
ln -sf ~/projects/indigo-glass/vscode ~/.vscode/extensions/indigo-glass-0.1.0
```

Restart VSCode → `Ctrl+K Ctrl+T` → **Indigo Glass Dark** or **Indigo Glass Light**.

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
- **Bracket pair colorization on** — uses the indigo→violet→green→amber rotation
- **Semantic highlighting on**
- **Font family NOT set** — user's monospace pick is preserved

---

## Variants comparison

```
Dark (default)            Light
─────────────────         ─────────────────
bg     #0F0F12            bg     #FFFFFF
text   #F8F8F8            text   #0F0F12
sel    #5E6AD250          sel    #5E6AD230
fn     #FBBF24            fn     #B45309
type   #A78BFA            type   #7C3AED
str    #71F79F            str    #15803D
err    #ED254E            err    #C81D45
```

Both inherit single-accent + tint-not-fill from the parent Linear/visionOS rules in `../docs/PHILOSOPHY.md`.

---

## Status

| Component | Status |
|---|---|
| Dark color theme | ✓ shipped |
| Light color theme | ✓ shipped |
| Product icon theme | deferred — Codicons inherit `icon.foreground` |
| File icon theme | not planned (use Material Icons or vscode-icons) |
| Marketplace publish | not planned (local install only) |
