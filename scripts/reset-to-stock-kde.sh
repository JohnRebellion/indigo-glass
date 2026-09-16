#!/usr/bin/env bash
# Stock-KDE reset — run AFTER logging out of Plasma, from a TTY (Ctrl+Alt+F3).
# Backs up every ~/.config KDE surface to /tmp/kde-reset-<UTC>/ so nothing is
# actually deleted. On next login, Plasma rebuilds defaults; then run
# ~/indigo-glass/scripts/install.sh --themes-only to lay Sage Ink on top.
set -euo pipefail

if pgrep -x plasmashell >/dev/null; then
  echo "REFUSE: plasmashell is running. Log out first (leave the session, drop to a TTY)."
  exit 1
fi

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP=/tmp/kde-reset-$STAMP
mkdir -p "$BACKUP"
echo "backup dir: $BACKUP"

shopt -s nullglob
moved=0
for src in \
  ~/.config/plasma* \
  ~/.config/kwin* \
  ~/.config/kdeglobals \
  ~/.config/klassy \
  ~/.config/klassyrc \
  ~/.config/kscreenlockerrc \
  ~/.config/ksmserverrc \
  ~/.config/kactivitymanagerdrc \
  ~/.local/share/plasma* \
  ~/.local/share/kwin \
  ~/.local/share/color-schemes/IndigoGlass.colors \
  ~/.local/share/color-schemes/LimeGlass.colors \
  ~/.cache/plasma* \
  ~/.cache/kwin* \
  ~/.cache/ksycoca*
do
  [ -e "$src" ] || continue
  dest="$BACKUP/$(basename "$src")"
  mv -v "$src" "$dest"
  moved=$((moved+1))
done
shopt -u nullglob

echo
echo "moved $moved item(s) to $BACKUP"
kbuildsycoca6 --noincremental >/dev/null 2>&1 || true
echo "sycoca rebuilt. Log back in, then run:"
echo "  bash ~/indigo-glass/scripts/install.sh --themes-only"
