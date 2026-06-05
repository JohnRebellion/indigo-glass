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

    # Read font's internal family + style name from name table (record 1 + 2)
    # so the registry key matches what Windows expects (not the filename).
    Add-Type -AssemblyName 'PresentationCore'

    # Win32 AddFontResource + WM_FONTCHANGE broadcast - forces immediate
    # registration without logout. New fonts become usable in same session.
    if (-not ([System.Management.Automation.PSTypeName]'IndigoGlass.FontLoader').Type) {
      Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
namespace IndigoGlass {
  public class FontLoader {
    [DllImport("gdi32.dll", CharSet=CharSet.Unicode)]
    public static extern int AddFontResourceEx(string lpszFilename, uint fl, IntPtr pdv);
    [DllImport("user32.dll")]
    public static extern int SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    public const uint FR_PRIVATE = 0x10;
    public const uint WM_FONTCHANGE = 0x1D;
    public static readonly IntPtr HWND_BROADCAST = new IntPtr(0xFFFF);
  }
}
"@
    }
    function Get-FontInternalName {
      param([string]$Path)
      try {
        $uri = New-Object System.Uri($Path)
        $fonts = [Windows.Media.GlyphTypeface]::new($uri)
        $family = $fonts.Win32FamilyNames.Values | Select-Object -First 1
        $face = $fonts.Win32FaceNames.Values | Select-Object -First 1
        if ($face -and $face -ne 'Regular') { return "$family $face" }
        return $family
      } catch {
        return $null
      }
    }

    $installed = 0
    $skipped = 0
    $locked = 0
    $unnamed = 0
    Get-ChildItem -Path "$RepoRoot\share\fonts\indigo-glass-fonts" -Recurse -Include *.ttf,*.otf -ErrorAction SilentlyContinue | ForEach-Object {
      $src = $_
      $dest = Join-Path $fontDir $src.Name

      # Read internal name from the source file (before copy)
      $internalName = Get-FontInternalName -Path $src.FullName
      if (-not $internalName) {
        $internalName = [System.IO.Path]::GetFileNameWithoutExtension($src.Name)
        $unnamed++
      }
      $kind = if ($src.Extension -ieq '.otf') { '(OpenType)' } else { '(TrueType)' }
      $regName = "$internalName $kind"

      # Skip copy if dest exists w/ same size; just ensure registry + load
      if ((Test-Path $dest) -and ((Get-Item $dest).Length -eq $src.Length)) {
        Set-ItemProperty -Path $regKey -Name $regName -Value $dest -ErrorAction SilentlyContinue
        [IndigoGlass.FontLoader]::AddFontResourceEx($dest, 0, [IntPtr]::Zero) | Out-Null
        $skipped++
        return
      }

      try {
        Copy-Item -Path $src.FullName -Destination $dest -Force -ErrorAction Stop
        Set-ItemProperty -Path $regKey -Name $regName -Value $dest
        [IndigoGlass.FontLoader]::AddFontResourceEx($dest, 0, [IntPtr]::Zero) | Out-Null
        $installed++
      } catch [System.IO.IOException] {
        if (Test-Path $dest) {
          Set-ItemProperty -Path $regKey -Name $regName -Value $dest -ErrorAction SilentlyContinue
          [IndigoGlass.FontLoader]::AddFontResourceEx($dest, 0, [IntPtr]::Zero) | Out-Null
        }
        $locked++
      }
    }

    # Broadcast WM_FONTCHANGE so running apps (Win Terminal, VSCode, etc.)
    # refresh their font list without requiring logout.
    [IndigoGlass.FontLoader]::SendMessage(
      [IndigoGlass.FontLoader]::HWND_BROADCAST,
      [IndigoGlass.FontLoader]::WM_FONTCHANGE,
      [IntPtr]::Zero, [IntPtr]::Zero
    ) | Out-Null

    # Remove stale filename-based registry entries from earlier install.ps1 runs.
    # Matches: "Carlito-Bold (TrueType)", "IosevkaCustom-Condensed (TrueType)" etc.
    # Keep proper entries like "Carlito Bold (TrueType)", "Iosevka Custom Condensed (TrueType)"
    Get-Item -Path $regKey | Select-Object -ExpandProperty Property |
      Where-Object { $_ -match '^(IosevkaCustom-|Carlito-)' } |
      ForEach-Object {
        Write-Host "  cleaned stale registry: $_" -ForegroundColor DarkYellow
        Remove-ItemProperty -Path $regKey -Name $_ -ErrorAction SilentlyContinue
      }
    Write-Host "  Installed: $installed  | Already present: $skipped  | Locked (in use): $locked" -ForegroundColor Green
    if ($unnamed -gt 0) {
      Write-Host "  Note: $unnamed font(s) had no readable internal name; registered by filename." -ForegroundColor DarkGray
    }
    if ($locked -gt 0) {
      Write-Host "  Locked fonts kept their existing copy + got HKCU registry entry." -ForegroundColor DarkGray
      Write-Host "  To replace locked fonts: log out + back in, then re-run." -ForegroundColor DarkGray
    } else {
      Write-Host "  Cache refresh: log out + back in, or open Notepad once" -ForegroundColor DarkGray
    }
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
