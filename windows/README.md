# Indigo Glass — Windows 11 + WSL2

Cross-platform parity. Windows host gets the same chrome (palette, fonts, accent, prompt) as the KDE/Linux side. WSL2 distros run the Linux config unchanged.

## What gets applied

| Surface | File | Notes |
|---|---|---|
| Windows Terminal scheme + Iosevka | `terminal/indigo-glass.scheme.json` | Injected via `install.ps1`; default profile points at it |
| Win11 accent `#5E6AD2` + dark mode | `registry/indigo-glass-accent.reg` | HKCU only, no admin |
| PowerShell 7 profile + Starship | `powershell/Microsoft.PowerShell_profile.ps1` | Mirrors Linux `~/.config/starship.toml` |
| VSCode Claude Code retint | `vscode/patch-webview-css.ps1` | Reads repo-side `vscode/css/claude-code-indigo.css` |
| Auto-patch on ext updates | `task-scheduler/IndigoGlass-VSCodePatch.xml` | Logon trigger + hourly check (Win11 has no `systemd.path`) |
| Fonts (Iosevka, Carlito, SF Pro, Inter, JetBrains) | from `share/fonts/indigo-glass-fonts/` | Per-user install via `install.ps1`, no admin |
| Edge browser configs | already cross-platform via extension cloud sync | Stylus + Dark Reader settings sync from Linux Edge → Win Edge if signed in |

## Install (Windows host)

```pwsh
# Clone the repo on Windows side
cd $env:USERPROFILE\projects
git clone https://github.com/JohnRebellion/indigo-glass
cd indigo-glass

# Full install — fonts, scheme, accent, pwsh profile, vscode patch
pwsh -File windows\install.ps1

# Skip stages
pwsh -File windows\install.ps1 -Skip fonts,reg

# Dry-run (no writes)
pwsh -File windows\install.ps1 -DryRun
```

Pre-reqs (winget):

```pwsh
winget install Microsoft.PowerShell        # pwsh 7+
winget install Starship.Starship           # prompt
winget install JanDeDobbeleer.OhMyPosh     # fallback prompt
```

After install:
- Reload Windows Terminal (close + reopen)
- Reload VSCode (`Ctrl+Shift+P` → `Developer: Reload Window`)
- Full accent effect: sign out + back in

## Auto-patch VSCode on Claude Code updates

```pwsh
schtasks /create /tn "IndigoGlass\IndigoGlass-VSCodePatch" /xml windows\task-scheduler\IndigoGlass-VSCodePatch.xml /f
```

Triggers:
- Logon
- Hourly
- Always available on-demand via Task Scheduler GUI

Win11 has no filesystem-watch task trigger — we poll hourly. Linux side uses `systemd.path` for instant trigger.

Unregister:

```pwsh
schtasks /delete /tn "IndigoGlass\IndigoGlass-VSCodePatch" /f
```

## WSL2 distros

WSL2 runs the Linux config verbatim. Inside the WSL2 distro shell:

```bash
git clone https://github.com/JohnRebellion/indigo-glass ~/projects/indigo-glass
cd ~/projects/indigo-glass

# Same scripts as native Linux
bash vscode/scripts/patch-webview-css.sh       # if Claude Code installed in WSL2
bash vscode/systemd/install.sh                  # systemd.path auto-patch
```

Skip on WSL2:
- GRUB theme (no GRUB in WSL2)
- KDE/Plasma config (no Plasma in WSL2 unless using WSLg + KDE distro)
- Konsole profile (use Windows Terminal instead)

The browser layer (Stylus + Dark Reader) lives on the Windows host's Edge, not inside WSL2. No WSL action needed there.

## Edge browser

Already cross-platform via Edge sync. Signed in on both Linux Edge and Win11 Edge:
- Stylus styles auto-sync
- Dark Reader settings auto-sync (`syncSettings: true` already set)

Not signed in? Manually re-import:
- Stylus: install from raw URL `https://raw.githubusercontent.com/JohnRebellion/indigo-glass/main/browser/stylus/indigo-glass.user.css`
- Dark Reader: import `browser/darkreader/indigo-glass.json`
- Monkeytype: paste values from `browser/monkeytype/indigo-glass.json`

## Layer diagram

```
Win11 host
  ├── Windows Terminal      palette + Iosevka
  ├── PowerShell 7          Starship prompt, indigo PSReadLine colors
  ├── VSCode                theme JSON + Claude Code webview patch
  ├── Edge browser          Stylus + Dark Reader, cloud-synced
  ├── System chrome         accent #5E6AD2 + dark mode via registry
  └── Fonts                 Iosevka, Carlito, SF Pro, Inter, JetBrainsMono

WSL2 distro
  ├── Bash / Zsh            Starship from shared $HOME/.config/starship.toml
  ├── VSCode-server         same patch script as native Linux
  └── Konsole-like terms    replaced by Windows Terminal on host
```

Same canonical palette flows boot → desktop → editor → browser → terminal across Linux + Win11 + WSL2 without color drift.
