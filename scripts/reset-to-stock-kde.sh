#!/usr/bin/env bash
# Stock-KDE reset — run AFTER logging out of Plasma, from a TTY (Ctrl+Alt+F3).
# Moves every KDE surface to a timestamped backup so nothing is deleted. On
# next login Plasma rebuilds defaults; then run scripts/install.sh --themes-only
# to lay Sage Ink on top.
#
# The globs are wider than "theme config". They also take monitor layout
# (kwinoutputconfig.json), window rules (kwinrulesrc), locale (plasma-localerc)
# and the Plasma NetworkManager applet state (plasma-nm) — anything under
# ~/.config whose name starts with kwin or plasma. That is deliberate (a
# half-reset session is worse than a full one) but it is why the backup has to
# survive a reboot.
#
# Backup location is ~/.local/state, NOT /tmp: /tmp is tmpfs on Fedora, and the
# documented next step restarts SDDM. If that hangs and the box is power-cycled
# — the exact situation this backup exists for — /tmp is gone with it.
#
# Entries are filed under the root they came from (config/, local-share/,
# cache/) because basenames collide across roots: plasmashell, plasma-
# systemmonitor and kwin each exist under two of them, and a flat backup nested
# the second inside the first.
set -euo pipefail

if pgrep -x plasmashell >/dev/null; then
  echo "REFUSE: plasmashell is running. Log out first (leave the session, drop to a TTY)."
  exit 1
fi

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP="${XDG_STATE_HOME:-$HOME/.local/state}/kde-reset-$STAMP"
mkdir -p "$BACKUP"
echo "backup dir: $BACKUP"

# Which root a path came from, so the backup mirrors the source layout and the
# rollback can put each item back where it belongs.
root_label() {
  case "$1" in
    "$HOME/.config/"*)       echo config ;;
    "$HOME/.local/share/"*)  echo local-share ;;
    "$HOME/.cache/"*)        echo cache ;;
    *)                       echo other ;;
  esac
}

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
  sub="$BACKUP/$(root_label "$src")"
  mkdir -p "$sub"
  dest="$sub/$(basename "$src")"
  if [ -e "$dest" ]; then
    echo "REFUSE: $dest already exists — refusing to merge two sources into one backup entry." >&2
    exit 1
  fi
  mv -v "$src" "$dest"
  moved=$((moved+1))
done
shopt -u nullglob

echo
echo "moved $moved item(s) to $BACKUP"
kbuildsycoca6 --noincremental >/dev/null 2>&1 || true
echo "sycoca rebuilt. Log back in, then run:"
echo "  bash $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/install.sh --themes-only"
echo ""
echo "To roll back, restore each root separately — they are NOT interchangeable:"
echo "  cp -a $BACKUP/config/.      ~/.config/"
echo "  cp -a $BACKUP/local-share/. ~/.local/share/"
echo "  cp -a $BACKUP/cache/.       ~/.cache/"
