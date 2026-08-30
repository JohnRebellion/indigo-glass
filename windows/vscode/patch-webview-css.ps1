# Sage Ink - Claude Code webview retint (Windows PowerShell port)
#
# Mirrors vscode/scripts/patch-webview-css.sh for Win11. Appends the
# repo's vscode/css/claude-code-indigo.css to the Anthropic Claude Code
# webview/index.css, bounded by /* indigo-glass:start */ markers.
#
# Idempotent. Re-run after every Claude Code extension upgrade.
#
# Usage:
#   pwsh -File patch-webview-css.ps1            # patch latest ext dir
#   pwsh -File patch-webview-css.ps1 -Revert    # remove block

param(
  [switch]$Revert
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $PSCommandPath
$RepoRoot  = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$CssFile   = Join-Path $RepoRoot 'vscode\css\claude-code-indigo.css'

$MarkerStart = '/* indigo-glass:start */'
$MarkerEnd   = '/* indigo-glass:end */'

# Detect Claude Code extension dir (Insiders first, then stable)
$ExtRoots = @(
  "$env:USERPROFILE\.vscode-insiders\extensions",
  "$env:USERPROFILE\.vscode\extensions"
)

$CcDir = $null
foreach ($root in $ExtRoots) {
  if (Test-Path $root) {
    $candidate = Get-ChildItem $root -Directory -Filter 'anthropic.claude-code-*' -ErrorAction SilentlyContinue |
                 Sort-Object Name |
                 Select-Object -Last 1
    if ($candidate) { $CcDir = $candidate.FullName; break }
  }
}

if (-not $CcDir) {
  Write-Error 'Claude Code extension not found under .vscode-insiders or .vscode'
  exit 1
}

$WebviewCss = Join-Path $CcDir 'webview\index.css'
if (-not (Test-Path $WebviewCss)) {
  Write-Error "webview/index.css missing at $WebviewCss"
  exit 2
}

if ($Revert) {
  $content = Get-Content $WebviewCss -Raw
  if ($content -match [regex]::Escape($MarkerStart)) {
    $pattern = [regex]::Escape($MarkerStart) + '.*?' + [regex]::Escape($MarkerEnd) + '\r?\n?'
    $newContent = [regex]::Replace($content, $pattern, '', 'Singleline')
    Set-Content -Path $WebviewCss -Value $newContent -NoNewline
    Write-Host "Reverted: $WebviewCss"
  }
  else {
    Write-Host 'No patch block found - nothing to revert.'
  }
  exit 0
}

if (-not (Test-Path $CssFile)) {
  Write-Error "CSS file missing: $CssFile"
  exit 3
}

$cssContent = Get-Content $CssFile -Raw
$block = "`n`n$MarkerStart`n$cssContent`n$MarkerEnd"

$content = Get-Content $WebviewCss -Raw
$pattern = [regex]::Escape($MarkerStart) + '.*?' + [regex]::Escape($MarkerEnd)

if ([regex]::IsMatch($content, $pattern, 'Singleline')) {
  $replacement = "$MarkerStart`n$cssContent`n$MarkerEnd"
  $newContent = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.Regex]::Escape($replacement).Replace('\$', '$'), 'Singleline')
  # Simpler: use MatchEvaluator
  $newContent = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $replacement }, 'Singleline')
}
else {
  $newContent = $content + $block
}

Set-Content -Path $WebviewCss -Value $newContent -NoNewline
Write-Host "Patched: $WebviewCss"
Write-Host 'Reload VSCode: Ctrl+Shift+P -> Developer: Reload Window'
