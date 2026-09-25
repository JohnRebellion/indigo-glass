# Sage Ink - PowerShell profile (Win11 + PowerShell 7)
#
# Mirrors the Linux Starship/Iosevka setup. Copy to one of:
#   $HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1            (pwsh 7+)
#   $HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1     (pwsh 5)
#
# Pre-reqs:
#   winget install Starship.Starship
#   winget install JanDeDobbeleer.OhMyPosh   # optional fallback
#
# Shared config (mirror of ~/.config/starship.toml on Linux):
$env:STARSHIP_CONFIG = "$HOME\.config\starship.toml"

if (Get-Command starship -ErrorAction SilentlyContinue) {
  Invoke-Expression (& starship init powershell)
}
elseif (Get-Command oh-my-posh -ErrorAction SilentlyContinue) {
  oh-my-posh init pwsh | Invoke-Expression
}

# PSReadLine - Sage Ink token colors
if (Get-Module -ListAvailable -Name PSReadLine) {
  Set-PSReadLineOption -EditMode Emacs
  Set-PSReadLineOption -PredictionSource HistoryAndPlugin
  Set-PSReadLineOption -PredictionViewStyle ListView
  Set-PSReadLineOption -HistoryNoDuplicates
  Set-PSReadLineOption -HistorySaveStyle SaveIncrementally
  Set-PSReadLineOption -Colors @{
    Command            = '#C0E3C0'  # accent_hi
    Parameter          = '#89A889'  # accent_alt
    String             = '#3FFABB'  # positive
    Number             = '#89A889'
    Variable           = '#F8F8F8'
    Keyword            = '#A6C9A6'  # accent primary
    Operator           = '#C0E3C0'
    Comment            = '#7F8695'  # muted
    Type               = '#89A889'
    Default            = '#F8F8F8'
    # was a 48;2 background in the retired Lime Glass accent, not this
    # theme's, plus a 4th "alpha" parameter ANSI truecolor SGR (ESC[48;2;R;G;Bm)
    # has no such parameter, so it was either ignored or corrupted the
    # sequence — and Sage Ink is opaque ink, no translucency anyway. Fixed
    # 2026-09-25 to base-on-accent, matching Konsole's CustomCursorColor/
    # CustomCursorTextColor pair (share/konsole/SageInk.profile).
    Selection          = "`e[38;2;7;8;10m`e[48;2;166;201;166m"
    Error              = '#F42E53'
    InlinePrediction   = '#7F8695'
  }
  Set-PSReadLineKeyHandler -Key Tab           -Function MenuComplete
  Set-PSReadLineKeyHandler -Key UpArrow       -Function HistorySearchBackward
  Set-PSReadLineKeyHandler -Key DownArrow     -Function HistorySearchForward
}

# Chocolatey tab-completion (preserve existing user pattern)
$ChocolateyProfile = "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
if (Test-Path($ChocolateyProfile)) {
  Import-Module "$ChocolateyProfile"
}

# Optional: zoxide (smart cd) + fnm (Node version manager)
if (Get-Command zoxide -ErrorAction SilentlyContinue) {
  Invoke-Expression (& { (zoxide init powershell | Out-String) })
}
if (Get-Command fnm -ErrorAction SilentlyContinue) {
  fnm env --use-on-cd | Out-String | Invoke-Expression
}
