#!/usr/bin/env bash
# generate-background.sh — bake the Lime Glass GRUB background + thumb
#
# Abstract "digital" wash in ghost lime's perceptual complement.
# Ghost lime #A8E635 is OKLCH(0.85, 0.205, 127.7°); rotating hue 180° gives
# violet-purple at h≈308° — between the Indigo heritage accent (275°) and
# magenta. All tones are baked DARK (max L≈0.34 OKLab at the glow core) so
# the translucent glass pill, accent lines, and labels drawn straight onto
# the background keep their contrast (worst pair, #d1d5db on the glow core,
# stays >8:1 WCAG).
#
# Composition (deterministic, no randomness — reproducible bake):
#   1. Shepards multi-point wash — violet glow upper-right, cool echo low-left
#   2. Two blurred diagonal beams (screen-composited light streaks)
#   3. Concentric signal arcs radiating from the glow origin
#   4. Sparse node-dot field along the arcs (digital constellation)
#   5. Vignette pulling every edge back toward #07080A
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
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ─── OKLCH h≈308° dark ramp (see header) ───
DEEP='#0A0810'      # near-black violet floor
BASE='#110919'      # base tint         L=0.16
SHADE='#22132E'     # shade             L=0.22
MID='#331D45'       # mid               L=0.28
GLOW='#45285D'      # glow core         L=0.34 (luminance ceiling)
ECHO_COOL='#211939' # −14° toward indigo heritage
ECHO_WARM='#2C1430' # +14° toward magenta

# 1. Multi-point wash: inverse-distance blend of anchored tones. Anchors top
#    out at MID — the GLOW ceiling is reserved for the radial bloom and beams.
magick -size ${W}x${H} xc: -colorspace sRGB \
  -sparse-color Inverse \
    "2080,220 $MID  2480,60 $SHADE  1500,520 $BASE \
     640,420 $ECHO_COOL  300,1340 $DEEP  1280,980 $BASE \
     2260,1240 $ECHO_WARM  60,80 $DEEP" \
  "$TMP/wash.png"

# 2. Radial bloom at the composition origin + two soft diagonal beams.
#    Beams are GLOW-tinted slabs at low alpha, blurred, then composited OVER
#    (not screen) so the result can never exceed the GLOW ceiling.
magick -size 1600x1600 radial-gradient:'rgba(69,40,93,0.65)-none' \
  "$TMP/bloom.png"
magick -size ${W}x${H} xc:none \
  -fill 'rgba(69,40,93,0.50)' \
  -draw "polygon 480,-100 820,-100 2660,1140 2320,1140" \
  -fill 'rgba(33,25,57,0.55)' \
  -draw "polygon -100,640 -100,900 1560,1540 1180,1540" \
  -blur 0x70 \
  "$TMP/beams.png"
magick "$TMP/wash.png" \
  "$TMP/bloom.png" -geometry +1280-580 -compose over -composite \
  "$TMP/beams.png" -geometry +0+0 -compose over -composite \
  "$TMP/stage2.png"

# 3. Concentric signal arcs centred on the glow origin (2080,220).
ARCS="$TMP/arcs.mvg"
{
  echo "fill none"
  for r in 340 520 700 880 1060; do
    echo "stroke-width 2 stroke rgba(139,92,184,0.16)"
    echo "ellipse 2080,220 $r,$r 40,230"
  done
} > "$ARCS"
magick "$TMP/stage2.png" -draw "@$ARCS" "$TMP/stage3.png"

# 4. Node dots where arcs would carry "signals" — fixed constellation.
DOTS="$TMP/dots.mvg"
{
  echo "stroke none"
  # (x, y, radius, alpha) — hand-placed along/between the arcs
  for spec in "1856,470,4,0.35" "2300,540,3,0.28" "1600,300,3,0.25" \
              "1380,640,4,0.30" "2470,880,3,0.22" "1100,420,2,0.20" \
              "1940,860,3,0.25" "980,880,2,0.18"  "2200,1080,2,0.18" \
              "760,640,2,0.15"  "1520,1060,2,0.15"; do
    IFS=, read -r x y r a <<< "$spec"
    echo "fill rgba(168,230,53,$a)"   # ghost-lime motes — the accent's echo
    echo "circle $x,$y $((x+r)),$y"
  done
} > "$DOTS"
magick "$TMP/stage3.png" -draw "@$DOTS" "$TMP/stage4.png"

# 5. Vignette: multiply edges back toward the deep floor.
magick -size ${W}x${H} radial-gradient:'white-rgb(30%,30%,36%)' \
  "$TMP/vig.png"
magick "$TMP/stage4.png" "$TMP/vig.png" -compose multiply -composite \
  -quality 92 -sampling-factor 4:2:0 -strip "$OUT_DIR/background.jpg"

# Thumb for pickers / simulator manifest.
magick "$OUT_DIR/background.jpg" -resize 320x180 -quality 85 -strip \
  "$OUT_DIR/thumb.jpg"

echo "Baked: $OUT_DIR/background.jpg + thumb.jpg"
magick identify "$OUT_DIR/background.jpg" "$OUT_DIR/thumb.jpg"
