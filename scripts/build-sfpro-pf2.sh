#!/usr/bin/env bash
# Sage Ink — build the SF Pro Display GRUB bitmap fonts locally.
#
# SF Pro Display is Apple proprietary and has no redistribution licence, so the
# repo ships neither the .otf files nor the sfpro-*.pf2 bitmaps rendered from
# them (both gitignored since 2026-09-25). The theme still USES SF Pro: every
# GRUB theme.txt names "SF Pro Display Regular <N>". This script renders those
# sizes from YOUR installed copy with grub2-mkfont, into each directory that
# needs them:
#
#   share/grub-theme/                 (real boot; sync-grub-parity.sh --deploy)
#   simulator/static/presets/<id>/    (the /grub/ studio's PFF2 renderer)
#
# Sizes come from the directory's own theme.txt and manifest.json, so the list
# never drifts from what is referenced. Output is byte-identical to the files
# that used to be committed (checked 2026-09-25 against SF_Pro_Display_Regular.otf).
#
# Font lookup: $SFPRO_OTF, else fontconfig "SF Pro Display:style=Regular", else
# share/fonts/indigo-glass-fonts/SFProDisplay/SF-Pro-Display-Regular.otf
# (a local, gitignored drop-in). Get the font from developer.apple.com/fonts.
#
# Usage:
#   bash scripts/build-sfpro-pf2.sh            # build missing sizes
#   bash scripts/build-sfpro-pf2.sh --force    # rebuild every size
#   bash scripts/build-sfpro-pf2.sh --check    # exit 1 if any size is missing
# Without SF Pro it exits 3 and changes nothing: GRUB then falls back to its
# built-in font for those labels, and the simulator draws them with a browser
# fallback and says so.
set -euo pipefail

FORCE=false
CHECK=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    --check) CHECK=true ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIRS=("$REPO_DIR/share/grub-theme")
for d in "$REPO_DIR"/simulator/static/presets/*/; do DIRS+=("${d%/}"); done

sizes_for() {
  local d="$1"
  {
    [ -f "$d/theme.txt" ] && grep -ohE 'SF Pro Display Regular [0-9]+' "$d/theme.txt" | awk '{print $NF}'
    [ -f "$d/manifest.json" ] && grep -ohE 'sfpro-[0-9]+\.pf2' "$d/manifest.json" | sed -E 's/^sfpro-([0-9]+)\.pf2$/\1/'
    true
  } | sort -nu
}

missing=()
for d in "${DIRS[@]}"; do
  for n in $(sizes_for "$d"); do
    out="$d/sfpro-$n.pf2"
    if [ "$FORCE" = true ] || [ ! -s "$out" ]; then missing+=("$out"); fi
  done
done

if [ "$CHECK" = true ]; then
  if [ "${#missing[@]}" -gt 0 ]; then
    printf '  ✗ missing %s\n' "${missing[@]#"$REPO_DIR"/}"
    exit 1
  fi
  echo "  ✓ every referenced sfpro-*.pf2 is present"
  exit 0
fi

[ "${#missing[@]}" -eq 0 ] && { echo "  ✓ SF Pro GRUB fonts up to date"; exit 0; }

find_otf() {
  if [ -n "${SFPRO_OTF:-}" ]; then echo "$SFPRO_OTF"; return; fi
  if command -v fc-match >/dev/null 2>&1; then
    local fam file
    fam="$(fc-match -f '%{family}' 'SF Pro Display:style=Regular' 2>/dev/null || true)"
    file="$(fc-match -f '%{file}' 'SF Pro Display:style=Regular' 2>/dev/null || true)"
    # fc-match always answers with SOMETHING; only trust it if it is SF Pro.
    if [[ "$fam" == *"SF Pro Display"* && -f "$file" ]]; then echo "$file"; return; fi
  fi
  local local_copy="$REPO_DIR/share/fonts/indigo-glass-fonts/SFProDisplay/SF-Pro-Display-Regular.otf"
  [ -f "$local_copy" ] && echo "$local_copy"
  return 0
}

OTF="$(find_otf)"
if [ -z "$OTF" ] || [ ! -f "$OTF" ]; then
  echo "  ⚠ SF Pro Display not found (Apple proprietary; not bundled)." >&2
  echo "    Install it from https://developer.apple.com/fonts/ or set SFPRO_OTF=/path/SF-Pro-Display-Regular.otf" >&2
  echo "    ${#missing[@]} GRUB font file(s) left unbuilt; GRUB and the simulator use a fallback font." >&2
  exit 3
fi

MKFONT=""
for c in grub2-mkfont grub-mkfont; do
  command -v "$c" >/dev/null 2>&1 && { MKFONT="$c"; break; }
done
[ -n "$MKFONT" ] || { echo "  ✗ grub2-mkfont / grub-mkfont not installed" >&2; exit 1; }

echo "▶ Building ${#missing[@]} SF Pro GRUB font(s) from $OTF"
for out in "${missing[@]}"; do
  n="${out##*/sfpro-}"; n="${n%.pf2}"
  # grub-mkfont warns once per unsupported OpenType feature (dozens of lines
  # for SF Pro); the output is unaffected, so keep only real errors.
  "$MKFONT" -s "$n" -o "$out.tmp" "$OTF" 2> >(grep -v 'unsupported font feature' >&2)
  mv "$out.tmp" "$out"
  echo "  + ${out#"$REPO_DIR"/}"
done
