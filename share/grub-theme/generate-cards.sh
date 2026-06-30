#!/usr/bin/env bash
# generate-cards.sh — bake Lime Glass GRUB stat cards from live system info
#
# Usage:
#   bash generate-cards.sh [output-dir]
#
# Output: card_os.png, card_kernel.png, card_hardware.png in $output-dir/assets/
# Defaults to ./assets next to this script.
#
# Deps: ImageMagick (magick), SF Pro Display font, optional fastfetch.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${1:-$SCRIPT_DIR/assets}"
SF_PRO="/usr/local/share/fonts/s/SF_Pro_Display_Regular.otf"

if [[ ! -f "$SF_PRO" ]]; then
  echo "ERROR: SF Pro Display font missing at $SF_PRO" >&2
  exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "ERROR: ImageMagick 'magick' missing" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# --- Detect system facts (fastfetch-style) ---

# OS pretty name (Nobara Linux 43)
OS_NAME=$(grep -E '^PRETTY_NAME=' /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"' | head -1)
OS_NAME="${OS_NAME:-Linux}"
# Truncate version-extras
OS_DISPLAY=$(echo "$OS_NAME" | sed -E 's/ \(.*\)//')

# DE / WM detection
DE_NAME=""
if [[ -n "${XDG_CURRENT_DESKTOP:-}" ]]; then
  case "$XDG_CURRENT_DESKTOP" in
    *KDE*)  DE_NAME="KDE Plasma $(plasmashell --version 2>/dev/null | awk '{print $NF}')" ;;
    *GNOME*) DE_NAME="GNOME $(gnome-shell --version 2>/dev/null | awk '{print $NF}')" ;;
    *) DE_NAME="$XDG_CURRENT_DESKTOP" ;;
  esac
fi
DE_NAME="${DE_NAME:-Desktop}"

# Kernel
KERNEL_FULL=$(uname -r)
# Extract MAJOR.MINOR.PATCH only
KERNEL_VER=$(echo "$KERNEL_FULL" | grep -oE '^[0-9]+\.[0-9]+\.[0-9]+' || echo "$KERNEL_FULL")
KERNEL_SUB=$(echo "$KERNEL_FULL" | sed -E "s|^${KERNEL_VER}-?||" | sed 's/\.x86_64/ · x86_64/' | sed 's/\.fc/ · fc/')
KERNEL_SUB="${KERNEL_SUB:-Linux}"

# CPU model (compact)
CPU_FULL=$(grep -m1 "model name" /proc/cpuinfo 2>/dev/null | cut -d: -f2- | sed 's/^ *//;s/  */ /g')
# Strip "AMD ", "Intel(R) Core(TM)", " CPU @ 3.5GHz" etc
CPU_SHORT=$(echo "$CPU_FULL" | sed -E 's/AMD //; s/Intel\(R\) //; s/Core\(TM\) //; s/ Processor//; s/ CPU @.*//; s/ @ .*//; s/\(R\)//g' | head -c 30)
CPU_SHORT="${CPU_SHORT:-CPU}"

# GPU detection (prefer discrete)
GPU_SHORT=""
if command -v lspci >/dev/null 2>&1; then
  GPU_LINE=$(lspci -mm 2>/dev/null | grep -iE 'vga|3d|display' | head -1)
  if [[ -n "$GPU_LINE" ]]; then
    # Format: 03:00.0 "VGA compatible controller" "Advanced Micro Devices, Inc. [AMD/ATI]" "Navi 33 [Radeon RX 7600 XT]" ...
    GPU_SHORT=$(echo "$GPU_LINE" | awk -F'"' '{print $6}' | sed -E 's/.*\[([^]]+)\].*/\1/; s/Advanced Micro Devices, Inc\. \[AMD\/ATI\] //')
  fi
fi
GPU_SHORT="${GPU_SHORT:-GPU}"
# Trim
GPU_SHORT=$(echo "$GPU_SHORT" | head -c 30)

echo "OS:       $OS_DISPLAY ($DE_NAME)"
echo "Kernel:   $KERNEL_VER ($KERNEL_SUB)"
echo "CPU:      $CPU_SHORT"
echo "GPU:      $GPU_SHORT"

# --- Card baking helper ---
make_card() {
  local out="$1" label="$2" big="$3" sub="$4" big_size="${5:-36}"
  magick -size 360x140 xc:'rgba(31,32,40,0.75)' \
    -fill '#5E6AD2' -draw "roundrectangle 20,14 80,18 2,2" \
    -fill none -stroke 'rgba(129,140,248,0.20)' -strokewidth 1 \
    -draw "roundrectangle 0,0 359,139 8,8" \
    -fill '#818CF8' -font "$SF_PRO" -pointsize 18 -gravity northwest \
    -annotate +20+32 "$label" \
    -fill '#F8F8F8' -pointsize "$big_size" -annotate +20+50 "$big" \
    -fill '#6B7280' -pointsize 16 -annotate +20+108 "$sub" \
    PNG32:"$OUT_DIR/_raw.png"
  magick -size 360x140 xc:none -fill white \
    -draw "roundrectangle 0,0 359,139 8,8" \
    PNG32:"$OUT_DIR/_mask.png"
  magick "$OUT_DIR/_raw.png" "$OUT_DIR/_mask.png" \
    -alpha off -compose CopyOpacity -composite PNG32:"$out"
  rm -f "$OUT_DIR/_raw.png" "$OUT_DIR/_mask.png"
}

# --- Bake cards ---
make_card "$OUT_DIR/card_os.png" "OS" "$OS_DISPLAY" "$DE_NAME" 36
make_card "$OUT_DIR/card_kernel.png" "KERNEL" "$KERNEL_VER" "$KERNEL_SUB" 42
make_card "$OUT_DIR/card_hardware.png" "HARDWARE" "$CPU_SHORT" "$GPU_SHORT" 30

echo ""
echo "Cards baked to: $OUT_DIR"
ls -la "$OUT_DIR/card_"*.png
