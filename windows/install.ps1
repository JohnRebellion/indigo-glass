# Indigo Glass - Windows 11 master installer
#
# End-to-end: fonts, Windows Terminal scheme, Win11 accent registry,
# PowerShell profile, Starship config, VSCode Claude Code webview patch.
#
# Idempotent. Re-runnable.
#
# Usage:
#   pwsh -File install.ps1                  # full install
#   pwsh -File install.ps1 -Skip fonts,reg  # skip specific stages
#   pwsh -File install.ps1 -DryRun          # show what would change

param(
  [string[]]$Skip = @(),
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $PSCommandPath
$RepoRoot  = Split-Path -Parent $ScriptDir

function Step([string]$name) {
  Write-Host ""
  Write-Host "-- $name " -NoNewline -ForegroundColor Cyan
  Write-Host ("-" * (60 - $name.Length)) -ForegroundColor DarkGray
}

function Skipped([string]$reason) {
  Write-Host "  SKIP: $reason" -ForegroundColor DarkYellow
}

# 1. Fonts (per-user, no admin)
if ($Skip -notcontains 'fonts') {
  Step 'Install fonts'
  $fontDir = "$env:LOCALAPPDATA\Microsoft\Windows\Fonts"
  if ($DryRun) { Write-Host "  [dry-run] copy fonts to $fontDir" }
  else {
    New-Item -ItemType Directory -Path $fontDir -Force | Out-Null
    $regKey = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
    if (-not (Test-Path $regKey)) { New-Item -Path $regKey -Force | Out-Null }

    $count = 0
    Get-ChildItem -Path "$RepoRoot\share\fonts\indigo-glass-fonts" -Recurse -Include *.ttf,*.otf -ErrorAction SilentlyContinue | ForEach-Object {
      $dest = Join-Path $fontDir $_.Name
      Copy-Item -Path $_.FullName -Destination $dest -Force
      $regName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name) + ' (TrueType)'
      Set-ItemProperty -Path $regKey -Name $regName -Value $dest
      $count++
    }
    Write-Host "  Installed $count fonts to $fontDir" -ForegroundColor Green
    Write-Host "  Cache refresh: log out + back in, or open Notepad once" -ForegroundColor DarkGray
  }
}
else { Step 'Install fonts'; Skipped '-Skip fonts' }

# 2. Windows Terminal color scheme
if ($Skip -notcontains 'terminal') {
  Step 'Inject WT color scheme'
  $wtSettings = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
  $schemePath = "$ScriptDir\terminal\indigo-glass.scheme.json"

  if (-not (Test-Path $wtSettings)) {
    Skipped "$wtSettings not found"
  }
  elseif ($DryRun) {
    Write-Host "  [dry-run] inject Indigo Glass scheme into $wtSettings"
  }
  else {
    $scheme = Get-Content $schemePath -Raw | ConvertFrom-Json
    $settings = Get-Content $wtSettings -Raw | ConvertFrom-Json -Depth 100

    if ($settings.schemes) {
      $settings.schemes = @($settings.schemes | Where-Object { $_.name -ne 'Indigo Glass' })
      $settings.schemes += $scheme
    }
    else {
      $settings | Add-Member -NotePropertyName 'schemes' -NotePropertyValue @($scheme) -Force
    }

    if ($settings.profiles.defaults) {
      $settings.profiles.defaults | Add-Member -NotePropertyName 'colorScheme' -NotePropertyValue 'Indigo Glass' -Force
      if (-not $settings.profiles.defaults.font) {
        $settings.profiles.defaults | Add-Member -NotePropertyName 'font' -NotePropertyValue ([PSCustomObject]@{
          face = 'Iosevka Custom Condensed'
          size = 10
        }) -Force
      } else {
        $settings.profiles.defaults.font.face = 'Iosevka Custom Condensed'
      }
    }

    Copy-Item $wtSettings "$wtSettings.before-indigo-glass" -Force
    $settings | ConvertTo-Json -Depth 100 | Set-Content -Path $wtSettings
    Write-Host "  Injected scheme + set defaults" -ForegroundColor Green
    Write-Host "  Backup: $wtSettings.before-indigo-glass" -ForegroundColor DarkGray
  }
}
else { Step 'Inject WT color scheme'; Skipped '-Skip terminal' }

# 3. Win11 accent + dark mode (registry)
if ($Skip -notcontains 'reg') {
  Step 'Apply accent + dark mode'
  $regFile = "$ScriptDir\registry\indigo-glass-accent.reg"
  if ($DryRun) { Write-Host "  [dry-run] reg import $regFile" }
  else {
    & reg.exe import $regFile 2>&1 | ForEach-Object { Write-Host "  $_" }
    Write-Host "  Applied. Sign out + back in for full effect." -ForegroundColor Green
  }
}
else { Step 'Apply accent + dark mode'; Skipped '-Skip reg' }

# 4. PowerShell profile
if ($Skip -notcontains 'pwsh') {
  Step 'Install PowerShell profile'
  $profileSrc = "$ScriptDir\powershell\Microsoft.PowerShell_profile.ps1"
  if ($DryRun) { Write-Host "  [dry-run] copy $profileSrc to $PROFILE" }
  else {
    New-Item -ItemType Directory -Path (Split-Path $PROFILE) -Force | Out-Null
    if (Test-Path $PROFILE) {
      Copy-Item $PROFILE "$PROFILE.before-indigo-glass" -Force
    }
    Copy-Item $profileSrc $PROFILE -Force
    Write-Host "  Installed to $PROFILE" -ForegroundColor Green
  }
}
else { Step 'Install PowerShell profile'; Skipped '-Skip pwsh' }

# 5. Starship config
if ($Skip -notcontains 'starship') {
  Step 'Install Starship config'
  $starshipSrc = "$RepoRoot\config\starship.toml"
  $starshipDest = "$HOME\.config\starship.toml"
  if (-not (Test-Path $starshipSrc)) {
    Skipped "source not found: $starshipSrc"
  }
  elseif ($DryRun) {
    Write-Host "  [dry-run] copy $starshipSrc to $starshipDest"
  }
  else {
    New-Item -ItemType Directory -Path (Split-Path $starshipDest) -Force | Out-Null
    Copy-Item $starshipSrc $starshipDest -Force
    Write-Host "  Installed to $starshipDest" -ForegroundColor Green
  }
}
else { Step 'Install Starship config'; Skipped '-Skip starship' }

# 6. VSCode Claude Code webview retint
if ($Skip -notcontains 'vscode') {
  Step 'Patch Claude Code webview CSS'
  if ($DryRun) { Write-Host "  [dry-run] run patch-webview-css.ps1" }
  else {
    # Use whichever PowerShell is running this script
    $shell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { 'pwsh' } else { 'powershell' }
    & $shell -ExecutionPolicy Bypass -File "$ScriptDir\vscode\patch-webview-css.ps1"
  }
}
else { Step 'Patch Claude Code webview CSS'; Skipped '-Skip vscode' }

Write-Host ""
Write-Host "Indigo Glass Windows install complete." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Reload Windows Terminal (close + reopen)"
Write-Host "  - Reload VSCode: Ctrl+Shift+P then Developer: Reload Window"
Write-Host "  - Full accent effect: sign out + back in"
Write-Host "  - Edge Stylus + Dark Reader: already cloud-synced from Linux"
