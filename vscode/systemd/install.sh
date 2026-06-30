#!/usr/bin/env bash
# install.sh — install Lime Glass VSCode auto-patch systemd user units
#
# Watches ~/.vscode-insiders/extensions and ~/.vscode/extensions for
# changes (extension install/upgrade) and re-runs patch-webview-css.sh.
#
# Usage:
#   bash install.sh           # install + enable + start
#   bash install.sh --remove  # stop + disable + remove

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_DIR="$HOME/.config/systemd/user"
UNITS=(indigo-glass-vscode-patch.service indigo-glass-vscode-patch.path)

if [[ "${1:-}" == "--remove" ]]; then
  for u in "${UNITS[@]}"; do
    systemctl --user stop "$u" 2>/dev/null || true
    systemctl --user disable "$u" 2>/dev/null || true
    rm -f "$UNIT_DIR/$u"
  done
  systemctl --user daemon-reload
  echo "Removed."
  exit 0
fi

mkdir -p "$UNIT_DIR"
for u in "${UNITS[@]}"; do
  cp "$SCRIPT_DIR/$u" "$UNIT_DIR/$u"
done

systemctl --user daemon-reload
systemctl --user enable --now indigo-glass-vscode-patch.path

# Run once immediately to apply current patch
systemctl --user start indigo-glass-vscode-patch.service

echo "Installed:"
systemctl --user status --no-pager indigo-glass-vscode-patch.path | head -5
echo ""
echo "Logs: journalctl --user -u indigo-glass-vscode-patch.service -f"
