#!/bin/bash
# sync-browser-theme.sh — Lime Glass browser theme parity
#
# Clones the "perfect" Personal Edge profile's extension settings
# (Stylus + Dark Reader) into the MTUSA, SIDA4, and Tyremax profiles
# so all four render the identical Lime Glass browser layer.
#
# Personal is the SOURCE OF TRUTH and is never written to.
#
# LevelDB (the extension settings store) MUST NOT be copied while Edge is
# running — Edge holds the state in memory and will clobber the copy on flush,
# and a half-written copy can corrupt the profile. This script refuses to run
# if any Edge process is alive.
#
# Every target dir is backed up to <dir>.bak-<stamp> before being replaced.
#
# Usage:
#   1. Close ALL Edge windows (every profile).
#   2. ./scripts/sync-browser-theme.sh          # dry-run: shows what it will do
#   3. ./scripts/sync-browser-theme.sh --apply  # perform the copy

set -euo pipefail

CFG="$HOME/.config"

# Extension IDs (Chrome Web Store)
STYLUS="clngdbkpkpeebahjckkjfobafhncgmne"
DARKREADER="ifoakfbpdcdoeenechcleahebpibofpc"

# Source (never modified)
SRC_DIR="$CFG/edge-personal/Default"

# Targets: "label|profile-root/profile-subdir"
# NOTE: Tyremax shares the edge-sida4 data dir but lives in "Profile 1".
TARGETS=(
  "MTUSA|edge-mtusa/Default"
  "SIDA4|edge-sida4/Default"
  "Tyremax|edge-sida4/Profile 1"
)

APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

# Timestamp comes from the shell, not the script, so re-runs get distinct backups.
STAMP="$(date +%Y%m%d-%H%M%S)"

log()  { printf '%s\n' "$*"; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# --- Safety: no Edge may be running -----------------------------------------
if pgrep -x msedge >/dev/null 2>&1 || pgrep -f '/opt/microsoft/msedge/msedge ' >/dev/null 2>&1; then
  die "Edge is running. Close ALL Edge windows (every profile) and retry."
fi

[[ -d "$SRC_DIR" ]] || die "Source profile not found: $SRC_DIR"

sync_ext() {
  local label="$1" tgt_profile="$2" extid="$3" extname="$4"
  local src="$SRC_DIR/Local Extension Settings/$extid"
  local dst_base="$CFG/$tgt_profile"
  local dst="$dst_base/Local Extension Settings/$extid"

  [[ -d "$src" ]] || { log "  [$label] source $extname missing — skip"; return; }
  [[ -d "$dst_base" ]] || { log "  [$label] target profile dir missing ($dst_base) — skip"; return; }

  local srcsize; srcsize="$(du -sh "$src" 2>/dev/null | cut -f1)"
  if [[ $APPLY -eq 1 ]]; then
    # Re-check Edge right before touching this profile: the single startup
    # pgrep is a TOCTOU window — Edge may have launched mid-run, and writing a
    # live extension-settings dir corrupts it.
    if pgrep -x msedge >/dev/null 2>&1 || pgrep -f '/opt/microsoft/msedge/msedge ' >/dev/null 2>&1; then
      die "Edge started mid-sync. Close ALL Edge windows and retry."
    fi
    # Stage into a temp dir, then swap: copy first (slow part), and only once
    # it's fully in place do we move the old dir aside and the new one in. A
    # kill between steps leaves either the old dir or a .tmp/.bak — never a
    # missing settings dir.
    mkdir -p "$(dirname "$dst")"
    local tmp="${dst}.tmp-$STAMP"
    rm -rf "$tmp"
    cp -a "$src" "$tmp"
    if [[ -d "$dst" ]]; then
      mv "$dst" "${dst}.bak-$STAMP"
      log "  [$label] $extname: backed up -> $(basename "${dst}.bak-$STAMP")"
    fi
    mv "$tmp" "$dst"
    log "  [$label] $extname: cloned ($srcsize)"
  else
    log "  [$label] $extname: WOULD clone ($srcsize) -> $dst"
    [[ -d "$dst" ]] && log "  [$label]   (existing target would be backed up first)"
  fi
}

log "=== Lime Glass browser theme sync ==="
log "Source: $SRC_DIR (Personal — read only)"
[[ $APPLY -eq 1 ]] && log "MODE: APPLY" || log "MODE: DRY-RUN (pass --apply to execute)"
log ""

for t in "${TARGETS[@]}"; do
  label="${t%%|*}"; profile="${t##*|}"
  log "-> $label ($profile)"
  sync_ext "$label" "$profile" "$STYLUS"     "Stylus"
  sync_ext "$label" "$profile" "$DARKREADER" "Dark Reader"
done

log ""
if [[ $APPLY -eq 1 ]]; then
  log "Done. Reopen each profile; Stylus styles should now match Personal."
  log "Backups: <profile>/Local Extension Settings/<id>.bak-$STAMP"
else
  log "Dry-run only. Re-run with --apply (Edge closed) to perform the copy."
fi
