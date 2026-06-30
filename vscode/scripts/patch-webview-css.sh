#!/usr/bin/env bash
# patch-webview-css.sh — append Lime Glass retint to Claude Code webview CSS
#
# Why: VSCode webview iframe is isolated. apc-extension is broken on
# Insiders 1.124+. Workbench-level patches don't reach the iframe.
# Direct append to the extension's own CSS is the only working path.
#
# Idempotent: re-running replaces the existing block. Re-apply after
# every Claude Code extension upgrade (paths embed version number).
#
# Usage:
#   bash scripts/patch-webview-css.sh           # patch detected ext
#   bash scripts/patch-webview-css.sh --revert  # strip block

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSS_FILE="$SCRIPT_DIR/../css/claude-code-indigo.css"
MARKER_START="/* indigo-glass:start */"
MARKER_END="/* indigo-glass:end */"

# Detect Code variant + Claude Code ext
for ext_root in \
  "$HOME/.vscode-insiders/extensions" \
  "$HOME/.vscode/extensions"; do
  if [[ -d "$ext_root" ]]; then
    CC_DIR=$(find "$ext_root" -maxdepth 1 -type d -name 'anthropic.claude-code-*' 2>/dev/null | sort | tail -1)
    if [[ -n "${CC_DIR:-}" ]]; then
      break
    fi
  fi
done

if [[ -z "${CC_DIR:-}" || ! -d "$CC_DIR" ]]; then
  echo "ERROR: Claude Code extension not found under ~/.vscode-insiders/extensions or ~/.vscode/extensions" >&2
  exit 1
fi

WEBVIEW_CSS="$CC_DIR/webview/index.css"
if [[ ! -f "$WEBVIEW_CSS" ]]; then
  echo "ERROR: $WEBVIEW_CSS not found" >&2
  exit 2
fi

if [[ ! -w "$WEBVIEW_CSS" ]]; then
  echo "ERROR: $WEBVIEW_CSS not writable" >&2
  exit 3
fi

# Revert path
if [[ "${1:-}" == "--revert" || "${1:-}" == "revert" ]]; then
  python3 - "$WEBVIEW_CSS" "$MARKER_START" "$MARKER_END" <<'PY'
import re, sys
path, start, end = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
if start in s and end in s:
    pat = re.escape(start) + r'.*?' + re.escape(end) + r'\n?'
    s = re.sub(pat, '', s, flags=re.DOTALL)
    open(path, 'w').write(s)
    print(f'Reverted: {path}')
else:
    print('No patch block found — nothing to revert.')
PY
  exit 0
fi

if [[ ! -f "$CSS_FILE" ]]; then
  echo "ERROR: CSS file missing: $CSS_FILE" >&2
  exit 4
fi

CSS_CONTENT=$(cat "$CSS_FILE")

# Build appended block
INJECT_BLOCK=$(cat <<EOF


$MARKER_START
$CSS_CONTENT
$MARKER_END
EOF
)

python3 - "$WEBVIEW_CSS" "$MARKER_START" "$MARKER_END" "$INJECT_BLOCK" <<'PY'
import re, sys
path, start, end, block = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
s = open(path).read()
pat = re.escape(start) + r'.*?' + re.escape(end)
if re.search(pat, s, flags=re.DOTALL):
    s = re.sub(pat, lambda _: (start + block.split(start,1)[1].rsplit(end,1)[0] + end), s, flags=re.DOTALL)
else:
    s = s + block
open(path, 'w').write(s)
print(f'Patched: {path}')
PY

echo "Reload VSCode: Ctrl+Shift+P → Developer: Reload Window"
