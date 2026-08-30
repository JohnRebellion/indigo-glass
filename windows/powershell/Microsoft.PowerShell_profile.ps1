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
    String             = '#71F79F'  # positive
    Number             = '#89A889'
    Variable           = '#F8F8F8'
    Keyword            = '#A6C9A6'  # accent primary
    Operator           = '#C0E3C0'
    Comment            = '#6B7280'  # muted
    Type               = '#89A889'
    Default            = '#F8F8F8'
    Selection          = "`e[48;2;168;230;53;128m"
    Error              = '#ED254E'
    InlinePrediction   = '#6B7280'
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
