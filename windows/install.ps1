# Lime Glass - Windows 11 master installer
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
  [switch]$DryRun,
  [switch]$RebuildFontCache,
  [string]$HostProfile = ''
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

# Resolve host profile: explicit param > hostname match > _default
$HostsDir = Join-Path $RepoRoot 'hosts'
if (-not $HostProfile) {
  $HN = ($env:COMPUTERNAME).ToLower()
  if (Test-Path (Join-Path $HostsDir "$HN.toml")) {
    $HostProfile = $HN
  }
  elseif ($HN -match 'aspire.*5|aspire5') {
    $HostProfile = 'aspire5-14-1080p'
  }
  else {
    $HostProfile = '_default'
  }
}
$ProfilePath = Join-Path $HostsDir "$HostProfile.toml"
if (-not (Test-Path $ProfilePath)) {
  Write-Host "Host profile not found: $ProfilePath. Falling back to _default." -ForegroundColor DarkYellow
  $HostProfile = '_default'
  $ProfilePath = Join-Path $HostsDir '_default.toml'
}
Write-Host ""
Write-Host "Host profile: $HostProfile" -ForegroundColor Cyan
Write-Host "  ($ProfilePath)" -ForegroundColor DarkGray

# Minimal TOML reader for our flat int values
function Get-Toml {
  param([string]$Path, [string]$Section, [string]$Key)
  $inSection = $false
  foreach ($line in Get-Content $Path) {
    $t = $line.Trim()
    if ($t -match "^\[(.+)\]$") {
      $inSection = ($Matches[1] -eq $Section)
      continue
    }
    if (-not $inSection) { continue }
    if ($t -match "^$Key\s*=\s*([^#]+?)\s*(#.*)?$") {
      $val = $Matches[1].Trim().Trim('"')
      return $val
    }
  }
  return $null
}

$P = @{
  body_pt          = [int](Get-Toml $ProfilePath 'fonts' 'body_pt')
  mono_pt          = [int](Get-Toml $ProfilePath 'fonts' 'mono_pt')
  menu_pt          = [int](Get-Toml $ProfilePath 'fonts' 'menu_pt')
  wt_size          = [int](Get-Toml $ProfilePath 'windows_terminal' 'font_size')
  vsc_editor       = [int](Get-Toml $ProfilePath 'vscode' 'editor_fontsize')
  vsc_chat         = [int](Get-Toml $ProfilePath 'vscode' 'chat_fontsize')
  vsc_terminal     = [int](Get-Toml $ProfilePath 'vscode' 'terminal_fontsize')
}
Write-Host "  fonts: body=$($P.body_pt) mono=$($P.mono_pt) wt=$($P.wt_size) vsc_editor=$($P.vsc_editor)" -ForegroundColor DarkGray

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

# 1b. Font cache rebuild (forces DirectWrite to re-enumerate)
if ($RebuildFontCache) {
  Step 'Rebuild Win font cache'
  if ($DryRun) { Write-Host '  [dry-run] would stop FontCache, clear cache dir, restart' }
  else {
    try {
      Stop-Service FontCache -Force -ErrorAction Stop
      $cacheDir = "$env:LOCALAPPDATA\Microsoft\Windows\FontCache"
      if (Test-Path $cacheDir) {
        Get-ChildItem $cacheDir -Recurse -Force -ErrorAction SilentlyContinue |
          Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
      }
      Start-Service FontCache
      Write-Host '  Font cache rebuilt. Restart Windows Terminal + VSCode now.' -ForegroundColor Green
    } catch {
      Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
      Write-Host '  Run as admin or open Settings > Personalization > Fonts to force refresh.' -ForegroundColor DarkGray
    }
  }
}

# 2. Windows Terminal color scheme
if ($Skip -notcontains 'terminal') {
  Step 'Inject WT color scheme'
  $wtSettings = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
  $schemePath = "$ScriptDir\terminal\indigo-glass.scheme.json"

  if (-not (Test-Path $wtSettings)) {
    Skipped "$wtSettings not found"
  }
  elseif ($DryRun) {
    Write-Host "  [dry-run] inject Lime Glass scheme into $wtSettings"
  }
  else {
    $scheme = Get-Content $schemePath -Raw | ConvertFrom-Json
    $settings = Get-Content $wtSettings -Raw | ConvertFrom-Json -Depth 100

    if ($settings.schemes) {
      $settings.schemes = @($settings.schemes | Where-Object { $_.name -ne 'Lime Glass' })
      $settings.schemes += $scheme
    }
    else {
      $settings | Add-Member -NotePropertyName 'schemes' -NotePropertyValue @($scheme) -Force
    }

    if ($settings.profiles.defaults) {
      $settings.profiles.defaults | Add-Member -NotePropertyName 'colorScheme' -NotePropertyValue 'Lime Glass' -Force
      if (-not $settings.profiles.defaults.font) {
        $settings.profiles.defaults | Add-Member -NotePropertyName 'font' -NotePropertyValue ([PSCustomObject]@{
          face = 'Iosevka Custom Condensed'
          size = $P.wt_size
        }) -Force
      } else {
        $settings.profiles.defaults.font.face = 'Iosevka Custom Condensed'
        $settings.profiles.defaults.font | Add-Member -NotePropertyName 'size' -NotePropertyValue $P.wt_size -Force
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

# 6a. VSCode font sizes from host profile
if ($Skip -notcontains 'vscode') {
  Step 'Apply VSCode font sizes (host profile)'
  $vscPaths = @(
    "$env:APPDATA\Code - Insiders\User\settings.json",
    "$env:APPDATA\Code\User\settings.json"
  ) | Where-Object { Test-Path $_ }

  foreach ($vsc in $vscPaths) {
    if ($DryRun) {
      Write-Host "  [dry-run] would set editor=$($P.vsc_editor) chat=$($P.vsc_chat) terminal=$($P.vsc_terminal) in $vsc"
      continue
    }
    try {
      $raw = Get-Content $vsc -Raw
      # JSONC tolerant strip
      $clean = $raw -replace '//[^\n]*', ''
      $clean = $clean -replace ',(\s*[}\]])', '$1'
      $j = $clean | ConvertFrom-Json -Depth 100
      $j | Add-Member -NotePropertyName 'editor.fontSize' -NotePropertyValue $P.vsc_editor -Force
      $j | Add-Member -NotePropertyName 'chat.fontSize' -NotePropertyValue $P.vsc_chat -Force
      $j | Add-Member -NotePropertyName 'chat.editor.fontSize' -NotePropertyValue $P.vsc_chat -Force
      $j | Add-Member -NotePropertyName 'terminal.integrated.fontSize' -NotePropertyValue $P.vsc_terminal -Force
      $j | Add-Member -NotePropertyName 'scm.inputFontSize' -NotePropertyValue $P.vsc_chat -Force
      Copy-Item $vsc "$vsc.before-indigo-glass" -Force
      $j | ConvertTo-Json -Depth 100 | Set-Content -Path $vsc
      Write-Host "  patched $vsc" -ForegroundColor Green
    } catch {
      Write-Host "  WARN: failed to patch $vsc - $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
  }
}
else { Step 'Apply VSCode font sizes'; Skipped '-Skip vscode' }

# 6b. VSCode Claude Code webview retint
if ($Skip -notcontains 'vscode') {
  Step 'Patch Claude Code webview CSS'
  if ($DryRun) { Write-Host "  [dry-run] run patch-webview-css.ps1" }
  else {
    $shell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { 'pwsh' } else { 'powershell' }
    & $shell -ExecutionPolicy Bypass -File "$ScriptDir\vscode\patch-webview-css.ps1"
  }
}
else { Step 'Patch Claude Code webview CSS'; Skipped '-Skip vscode' }

Write-Host ""
Write-Host "Lime Glass Windows install complete." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Reload Windows Terminal (close + reopen)"
Write-Host "  - Reload VSCode: Ctrl+Shift+P then Developer: Reload Window"
Write-Host "  - Full accent effect: sign out + back in"
Write-Host "  - Edge Stylus + Dark Reader: already cloud-synced from Linux"
