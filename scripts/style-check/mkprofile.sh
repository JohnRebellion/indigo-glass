#!/usr/bin/env bash
# mkprofile.sh — build the disposable Edge profile the style-check harness runs
# against.
#
# Copies ONLY what a logged-in render needs out of the personal profile:
# the cookie jar, the profile preferences and the Local State key file. No
# history, no cache, no extensions — ~10MB instead of 4.4GB. The live profile
# is opened read-only; Edge can stay running (SQLite copies fine, the harness
# never writes back).
#
# Cookies stay encrypted at rest and are decrypted by the spawned Edge through
# the same keyring entry as the real browser, so this file never handles
# credentials in the clear. The copy lives in /tmp and dies with the boot.
#
# Usage: scripts/style-check/mkprofile.sh [source-user-data-dir] [profile-dir] [dest]
#   e.g. mkprofile.sh ~/.config/edge-sida4 Default /tmp/ig-profile-sida4
set -euo pipefail

SRC="${1:-$HOME/.config/edge-personal}"
PROF="${2:-Default}"
DST="${3:-${IG_STYLE_PROFILE:-/tmp/ig-style-profile}}"

[ -d "$SRC/$PROF" ] || { echo "no '$PROF' profile under $SRC" >&2; exit 1; }

# Always lands in the copy as "Default" — Edge opens that without a
# --profile-directory flag, so the harness needs no per-profile wiring.
rm -rf "$DST"
mkdir -p "$DST/Default"
cp "$SRC/Local State" "$DST/" 2>/dev/null || true
for f in Cookies Preferences "Secure Preferences"; do
  cp "$SRC/$PROF/$f" "$DST/Default/" 2>/dev/null || true
done

# Some apps keep their session in Local Storage rather than a cookie (AWS
# Console via SSO, ClickUp). Opt in with --with-storage; it adds ~20MB and
# more of the real profile's state, so it is off by default.
if [ "${WITH_STORAGE:-0}" = "1" ] || [ "${4:-}" = "--with-storage" ]; then
  for d in "Local Storage" "Session Storage"; do
    cp -r "$SRC/$PROF/$d" "$DST/Default/" 2>/dev/null || true
  done
fi

printf 'profile ready: %s (%s)\n' "$DST" "$(du -sh "$DST" | cut -f1)"
