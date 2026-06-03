#!/usr/bin/env bash
# patch-workbench.sh — inject Indigo Glass CSS into VSCode workbench.html
#
# Why: VSCode Insiders 1.124+ broke apc-extension 0.4.1 (require.main.filename
# undefined, workbench HTML moved). Anthropic's Claude Code webview uses
# --app-claude-orange directly inline for prompt-input focus ring. No standard
# VSCode theming hook reaches that var, so we hand-patch the workbench.html
# with an inline <style> block.
#
# The patch is idempotent: re-running replaces the existing block. Survives
# until the next code-insiders package upgrade restores root ownership /
# overwrites the file.
#
# Usage:
#   bash scripts/patch-workbench.sh           # patch Insiders
#   bash scripts/patch-workbench.sh --stable  # patch stable VSCode
#   bash scripts/patch-workbench.sh --revert  # remove the patch block

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSS_FILE="$SCRIPT_DIR/../css/claude-code-indigo.css"
MARKER_START="<!-- indigo-glass:start -->"
MARKER_END="<!-- indigo-glass:end -->"

# Detect install path
VARIANT="${1:-insiders}"
case "$VARIANT" in
  --stable|stable)
    INSTALL_BASE="/usr/share/code"
    ;;
  --revert|revert)
    REVERT=1
    INSTALL_BASE="${2:-/usr/share/code-insiders}"
    ;;
  *)
    INSTALL_BASE="/usr/share/code-insiders"
    ;;
esac

# Locate workbench.html (moved across versions)
WBH=$(find "$INSTALL_BASE/resources/app/out/vs/code" -name 'workbench.html' 2>/dev/null | head -1)
if [[ -z "${WBH:-}" || ! -f "$WBH" ]]; then
  echo "ERROR: workbench.html not found under $INSTALL_BASE" >&2
  exit 1
fi

if [[ ! -w "$WBH" ]]; then
  echo "ERROR: $WBH not writable. Run as root or chown the file:" >&2
  echo "  sudo chown \$USER $WBH" >&2
  exit 2
fi

# Revert path
if [[ "${REVERT:-}" == "1" ]]; then
  if grep -q "$MARKER_START" "$WBH"; then
    python3 - "$WBH" "$MARKER_START" "$MARKER_END" <<'PY'
import re, sys
path, start, end = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
s = re.sub(re.escape(start) + r'.*?' + re.escape(end) + r'\n?', '', s, flags=re.DOTALL)
open(path, 'w').write(s)
PY
    echo "Reverted: $WBH"
  else
    echo "No patch block found — nothing to revert."
  fi
  exit 0
fi

if [[ ! -f "$CSS_FILE" ]]; then
  echo "ERROR: CSS file missing: $CSS_FILE" >&2
  exit 3
fi

CSS_CONTENT=$(cat "$CSS_FILE")

# Build injection block
INJECT_BLOCK=$(cat <<EOF
$MARKER_START
<style id="indigo-glass-injection">
$CSS_CONTENT
</style>
$MARKER_END
EOF
)

# Idempotent replace
python3 - "$WBH" "$MARKER_START" "$MARKER_END" "$INJECT_BLOCK" <<'PY'
import re, sys
path, start, end, block = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
s = open(path).read()
pattern = re.escape(start) + r'.*?' + re.escape(end)
if re.search(pattern, s, flags=re.DOTALL):
    s2 = re.sub(pattern, lambda _: block, s, flags=re.DOTALL)
else:
    # Inject before </head>
    if '</head>' not in s:
        sys.stderr.write('ERROR: no </head> in workbench.html\n')
        sys.exit(4)
    s2 = s.replace('</head>', f'\t\t{block}\n\t</head>', 1)
open(path, 'w').write(s2)
print(f'Patched: {path}')
PY
