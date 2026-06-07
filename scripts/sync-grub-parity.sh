#!/usr/bin/env bash
# Indigo Glass — GRUB theme parity sync
#
# share/grub-theme/ is the SINGLE SOURCE OF TRUTH for the GRUB theme.
# This script propagates it to the two downstream consumers so real boot,
# the QEMU preview, and the SvelteKit simulator stay 1:1:
#
#   1. simulator/static/presets/indigo/  (the in-browser simulator preset)
#   2. /boot/grub2/themes/indigo-glass/   (the live installed theme)  [--deploy]
#
# Without --deploy it only syncs the simulator preset (safe, no sudo). Use
# --deploy to also push to /boot and regenerate grub.cfg.
#
# Why an overlay (cp of individual files) and not rsync --delete: the simulator
# preset is a SUPERSET — it ships extra font sizes (sfpro-20/26/38/64/96) the
# real theme doesn't need but the browser renderer uses. We overlay the canonical
# files and leave sim-only extras intact.
#
# Usage:
#   bash scripts/sync-grub-parity.sh            # sync simulator preset only
#   bash scripts/sync-grub-parity.sh --deploy   # also deploy to /boot (sudo)
#   bash scripts/sync-grub-parity.sh --dry-run  # show actions, change nothing
set -euo pipefail

DEPLOY=false
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --deploy)  DEPLOY=true ;;
    --dry-run) DRY_RUN=true ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_DIR/share/grub-theme"
SIM="$REPO_DIR/simulator/static/presets/indigo"
BOOT="/boot/grub2/themes/indigo-glass"

[ -d "$SRC" ] || { echo "✗ source missing: $SRC" >&2; exit 1; }

run() {
  echo "  \$ $*"
  [ "$DRY_RUN" = false ] && eval "$@"
}

# Overlay files from $SRC onto $dest. Mode controls WHICH files:
#   full     — every file under $SRC (real /boot wants all fonts + assets +
#              generate-cards.sh + README, the complete deployable theme)
#   manifest — only theme.txt + files the simulator manifest.json references
#              (the browser renderer uses a curated subset; copying carlito
#              fonts / build scripts into the preset is just dead weight)
# Files that exist only in $dest are preserved either way (e.g. the simulator's
# extra sfpro-20/26/38/64/96 sizes the real theme doesn't ship).
overlay() {
  local dest="$1" mode="$2" sudo_pfx="${3:-}"
  local files=()
  if [ "$mode" = manifest ]; then
    # theme.txt is always required; add every asset/font the manifest lists
    files+=("theme.txt")
    local mf="$dest/manifest.json"
    [ -f "$mf" ] || mf="$SRC/manifest.json"
    if [ -f "$mf" ]; then
      while IFS= read -r ref; do files+=("$ref"); done < <(
        grep -oE '"(background\.jpg|thumb\.jpg|[A-Za-z0-9_-]+\.pf2|assets/[A-Za-z0-9_./-]+|icons/[A-Za-z0-9_./-]+)"' "$mf" \
          | tr -d '"' | sort -u
      )
    fi
  else
    while IFS= read -r -d '' rel; do files+=("${rel#./}"); done < <(
      cd "$SRC" && find . -type f -print0
    )
  fi
  for rel in "${files[@]}"; do
    [ -f "$SRC/$rel" ] || continue   # manifest may list sim-only files; skip those
    run "${sudo_pfx}mkdir -p \"$dest/$(dirname "$rel")\""
    run "${sudo_pfx}cp -p \"$SRC/$rel\" \"$dest/$rel\""
  done
}

echo "▶ Indigo Glass GRUB parity sync"
echo "  source (truth): $SRC"
[ "$DRY_RUN" = true ] && echo "  ⚠ DRY RUN"
echo

# ─── 1. Simulator preset ───
echo "▶ Sync → simulator preset ($SIM)"
[ -d "$SIM" ] || { echo "✗ simulator preset dir missing: $SIM" >&2; exit 1; }
overlay "$SIM" manifest

# Keep the simulator manifest honest: every asset/font the canonical theme.txt
# references must be listed, or loadPreset() won't fetch it. We don't rewrite the
# manifest automatically (it may list sim-only extras), but we DO verify coverage.
echo "▶ Verify simulator manifest covers theme.txt references"
MANIFEST="$SIM/manifest.json"
if [ -f "$MANIFEST" ]; then
  missing=0
  # Every assets/*.png and *.pf2 referenced in theme.txt should be in the manifest.
  while IFS= read -r ref; do
    if ! grep -qF "\"$ref\"" "$MANIFEST"; then
      echo "  ⚠ theme.txt references '$ref' — NOT in manifest.json"
      missing=1
    fi
  done < <(grep -oE '(assets/[A-Za-z0-9_./-]+\.png|[A-Za-z0-9_-]+\.pf2)' "$SRC/theme.txt" | sort -u)
  [ "$missing" = 0 ] && echo "  ✓ manifest covers all theme.txt references"
fi
echo

# ─── 2. Deploy to /boot ───
if [ "$DEPLOY" = true ]; then
  echo "▶ Deploy → installed theme ($BOOT) [sudo]"
  run "sudo mkdir -p \"$BOOT\""
  overlay "$BOOT" full "sudo "
  echo "▶ Regenerate grub.cfg"
  # Prefer the BIOS/EFI path that exists. On Fedora/Nobara both /boot/grub2/grub.cfg
  # and /boot/efi/EFI/fedora/grub.cfg may exist; /boot/grub2/grub.cfg is the live one.
  GRUB_CFG=""
  for cand in /boot/grub2/grub.cfg /boot/efi/EFI/fedora/grub.cfg; do
    [ -f "$cand" ] && { GRUB_CFG="$cand"; break; }
  done
  if [ -n "$GRUB_CFG" ]; then
    run "sudo grub2-mkconfig -o \"$GRUB_CFG\""
  else
    echo "  ⚠ grub.cfg not found — run: sudo grub2-mkconfig -o /boot/grub2/grub.cfg"
  fi
  echo
else
  echo "  (skipping /boot deploy — pass --deploy to push to the live theme)"
  echo
fi

echo "✓ Parity sync complete."
echo "  Verify in simulator:  cd simulator && bun run dev   → open indigo preset"
[ "$DEPLOY" = false ] && echo "  Then deploy to real:  bash scripts/sync-grub-parity.sh --deploy"
