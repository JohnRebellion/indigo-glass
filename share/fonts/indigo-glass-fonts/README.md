# Indigo Glass - Font Bundle

Canonical font set used across all Indigo Glass layers (KDE, GRUB, Konsole, VSCode, browser, Windows Terminal, PowerShell).

## Bundle contents

| Folder | Family | Files | License | Notes |
|---|---|---|---|---|
| `Carlito/` | Carlito | 4 (Regular/Italic/Bold/BoldItalic) | OFL 1.1 | Loop-tail g/a source; Calibri-metric-compat |
| `Inter/` | Inter | 1 variable | OFL 1.1 | UI fallback (single-storey g default; loop-tail via cv11 OT) |
| `IosevkaCustom/` | Iosevka Custom | 1 (Regular only) | OFL 1.1 | Incomplete - see below |
| `MesloLGS/` | MesloLGS NF | 4 | MIT | Mono fallback w/ Powerline glyphs |
| `SFProDisplay/` | SF Pro Display | 6 weights | Apple proprietary | NOT redistributable - install from developer.apple.com |

## Iosevka Custom Condensed (NOT shipped)

The canonical mono font (Iosevka Custom Condensed w/ ss18 + double-storey g) is a private build, not redistributable. To rebuild:

```bash
git clone https://github.com/be5invis/Iosevka ~/Iosevka
cd ~/Iosevka
npm install

# Use the build plan from indigo-glass repo
cp /path/to/indigo-glass/share/fonts/private-build-plans.toml private-build-plans.toml

npm run build -- ttf::IosevkaCustom
# Output: dist/IosevkaCustom/TTF/IosevkaCustom-CondensedRegular.ttf + 12 more
```

Or fall back to MesloLGS NF (already in this bundle) - no loop-tail g but works as mono.

## Install

### Linux (system-wide)

```bash
sudo mkdir -p /usr/local/share/fonts/indigo-glass
sudo cp -r */ /usr/local/share/fonts/indigo-glass/
sudo fc-cache -fv
```

### Linux (per-user)

```bash
mkdir -p ~/.local/share/fonts/indigo-glass
cp -r */ ~/.local/share/fonts/indigo-glass/
fc-cache -fv
```

### Windows 11 (per-user, no admin)

```pwsh
cd $env:USERPROFILE\projects\indigo-glass
pwsh -File windows\install.ps1
```

(handled by `install.ps1` step 1; reads from this directory)

### WSL2 (symlink to Win user fonts)

```bash
mkdir -p ~/.local/share/fonts
ln -s "/mnt/c/Users/$USER/AppData/Local/Microsoft/Windows/Fonts" ~/.local/share/fonts/win-user
fc-cache -fv
fc-match "Iosevka Custom"
```

## Verify

```bash
fc-match "Carlito"                    # should match Carlito
fc-match "Iosevka Custom Condensed"   # if built, matches; else MesloLGS NF
fc-match "SF Pro Display"             # Apple proprietary, install separately
fc-match "MesloLGS NF"
fc-match "Inter"
```

## License obligations

- OFL fonts (Carlito, Inter, Iosevka, MesloLGS): bundled w/ this repo per OFL 1.1 redistribution clause
- SF Pro Display: NOT bundled. Apple proprietary. Install from developer.apple.com (free w/ Apple ID)
