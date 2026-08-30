#!/usr/bin/env bash
# generate-background.sh — bake the Sage Ink GRUB background + thumb
#
# Flat neobrutalist geometry: solid deep-black base (#07080A), hard-edged
# sage corner brackets, zero blur/gradient/glow/vignette. Was a soft violet
# "digital wash" (radial bloom, blurred diagonal beams, node-dot
# constellation, vignette) in the h≈325° perceptual-complement-of-sage hue —
# a glass-era aesthetic, and the wrong colour family entirely (violet, not
# sage). See background-prompt.md for an AI-image-gen alternative if a more
# organic/illustrated background is wanted instead of flat vector geometry.
#
# Layout safety: matches theme.txt's real layout, not a stylistic guess.
# The 5 stat-card labels sit at top=130-300 (x from 107 onward); the
# "BOOT PICKER" header + boot menu span top=360 through height=880 (x from
# 80 onward). All geometry below stays inside a thin edge margin (roughly
# x<80 or x>2480, y<130 or y>1350) so nothing drawn here can ever sit behind
# a label or the boot menu.
#
# Usage:
#   bash generate-background.sh [output-dir]   # defaults to script dir
#
# Deps: ImageMagick (magick).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${1:-$SCRIPT_DIR}"

if ! command -v magick >/dev/null 2>&1; then
  echo "ERROR: ImageMagick 'magick' missing" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
W=2560 H=1440

BASE='#07080A'
SAGE='#A6C9A6'
SAGE_ALT='#89A889'
MINT='#3FFABB'

# Solid flat base, then hard-edged corner brackets only — no fill anywhere
# near the content zone. Top-left and bottom-right get the full bracket
# treatment (a thick outer L + a thinner inner L); top-right and
# bottom-left get a single thin corner tick for balance without adding
# visual weight near the boot menu's left edge.
magick -size ${W}x${H} xc:"$BASE" \
  -fill "$SAGE_ALT" \
  -draw "rectangle 0,0 480,10" \
  -draw "rectangle 0,0 10,380" \
  -fill "$SAGE" \
  -draw "rectangle 0,40 260,50" \
  -draw "rectangle 40,0 50,220" \
  -fill "$SAGE_ALT" \
  -draw "rectangle $((W-480)),$((H-10)) $W,$H" \
  -draw "rectangle $((W-10)),$((H-380)) $W,$H" \
  -fill "$SAGE" \
  -draw "rectangle $((W-260)),$((H-50)) $((W-40)),$((H-40))" \
  -draw "rectangle $((W-50)),$((H-220)) $((W-40)),$H" \
  -fill "$SAGE_ALT" \
  -draw "rectangle $((W-160)),0 $W,8" \
  -draw "rectangle $((W-8)),0 $W,120" \
  -draw "rectangle 0,$((H-120)) 8,$H" \
  -draw "rectangle 0,$((H-8)) 160,$H" \
  -fill "$MINT" \
  -draw "rectangle 0,0 20,20" \
  -draw "rectangle $((W-20)),$((H-20)) $W,$H" \
  -quality 92 -sampling-factor 4:2:0 -strip "$OUT_DIR/background.jpg"

# Thumb for pickers / simulator manifest.
magick "$OUT_DIR/background.jpg" -resize 320x180 -quality 85 -strip \
  "$OUT_DIR/thumb.jpg"

echo "Baked: $OUT_DIR/background.jpg + thumb.jpg"
magick identify "$OUT_DIR/background.jpg" "$OUT_DIR/thumb.jpg"
