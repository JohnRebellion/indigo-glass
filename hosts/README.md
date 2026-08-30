# Sage Ink - Host Profiles

Per-machine font size overrides. One repo, many displays.

Canonical palette (colors, fonts, layout discipline) stays universal across all layers. What varies per host: **font point sizes**, because identical pt values render at different physical sizes on different DPIs.

## How it works

| Concept | Detail |
|---|---|
| `_default.toml` | Nobara desktop reference (27" 1440p @ 100% scale). Canonical sizes. |
| `<host>.toml` | Per-host override. Sets only fields that differ from default. |
| `apply.sh` | Reads a profile + writes values into live config files (`~/.config/kdeglobals`, GTK, Konsole, VSCode) |
| Auto-detect | `hostname -s` matched against `<name>.toml`. Falls back to `_default`. |

## Schema

```toml
[meta]
name = "..."
display_inches = 27
display_resolution = "2560x1440"
display_dpi_effective = 109
scale_factor = 1.0
description = "..."

[fonts]
body_pt = 11           # Carlito (app content)
mono_pt = 11           # Iosevka Custom Condensed
menu_pt = 11           # SF Pro Display
toolbar_pt = 10
smallest_pt = 9
window_title_pt = 11

[konsole]
font_size = 13

[vscode]
editor_fontsize = 14
chat_fontsize = 13
terminal_fontsize = 13

[windows_terminal]
font_size = 10

[kde]
panel_pt = 11

[gtk]
font_pt = 11
```

## Existing profiles

| Profile | Display | Scale ratio | When to use |
|---|---|:---:|---|
| `_default` | 27" 1440p @ 100% | 1.0 (reference) | Nobara desktop. Any 1440p / 4K-100% setup. |
| `aspire5-14-1080p` | 14" 1080p @ Win 100% | 1.44x | Acer Aspire 5. Or any 13-14" 1080p where you refuse to raise display scaling. |

## Apply

### Linux

```bash
# Auto-detect by hostname
bash hosts/apply.sh

# Force specific profile
bash hosts/apply.sh --host aspire5-14-1080p

# Dry-run
bash hosts/apply.sh --dry-run
```

### Windows

```pwsh
# Auto-detect by hostname (when -HostProfile support lands in install.ps1)
.\windows\install.ps1

# Explicit
.\windows\install.ps1 -HostProfile aspire5-14-1080p
```

## Adding a new host

1. Measure your display: physical diagonal inches + resolution
2. Compute effective DPI: `dpi = sqrt(width_px^2 + height_px^2) / diagonal_inches`
3. Compute scale ratio: `dpi / 109` (109 = reference DPI)
4. Multiply every pt size in `_default.toml` by that ratio, round to nearest int
5. Save as `<machine-shortname>.toml` (e.g. `ideapad-15-1080p.toml`)
6. Add hostname pattern to `apply.sh` + `windows/install.ps1` if you want auto-detect
7. Commit + push

## DPI quick reference

| Display | Effective DPI | Scale ratio from 109 |
|---|:---:|:---:|
| 27" 1440p | 109 | 1.0 |
| 24" 1080p | 92 | 0.84 |
| 14" 1080p | 157 | 1.44 |
| 15.6" 1080p | 141 | 1.30 |
| 13.3" 1080p | 166 | 1.52 |
| 14" 1440p | 210 | 1.93 |
| 24" 4K | 184 | 1.69 |
| 27" 4K | 163 | 1.50 |
| 32" 4K | 138 | 1.27 |

If you prefer Win/KDE display scaling instead of font scaling: set display to 1.25/1.5/2.0 and keep profile at `_default`. This repo's stance is font-level scaling: same physical text size across machines without touching display scale.
