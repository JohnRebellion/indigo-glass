#!/usr/bin/env bash
# Indigo Glass - build Bibata cursor variant w/ indigo accent
#
# Bibata source: https://github.com/ful1e5/Bibata_Cursor
# Replaces the bright accent color (default light blue / orange) with
# Indigo Glass primary #5E6AD2.
#
# Output: out/Bibata-IndigoGlass/  (XCursor format, drop into
#         ~/.local/share/icons/ or /usr/share/icons/)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/out"
WORK_DIR="$SCRIPT_DIR/.work"
ACCENT_HEX="#5E6AD2"
ACCENT_RGB="94,106,210"
BASE_DARK="#0F0F12"
SECONDARY="#818CF8"

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: need $1 ($2)" >&2; exit 1; }
}

require git "system git"
require python3 "python3.10+"
require xcursorgen "x11-apps / xcursorgen"

if ! python3 -c "import clickgen" 2>/dev/null; then
  echo "Installing clickgen via pip..."
  python3 -m pip install --user --upgrade clickgen
fi

mkdir -p "$OUT_DIR"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

cd "$WORK_DIR"
echo "Cloning Bibata source..."
git clone --depth 1 https://github.com/ful1e5/Bibata_Cursor.git
cd Bibata_Cursor

# Bibata uses build.toml + SVG sources under svg/
# Easiest recolor: sed-replace the default accent everywhere in svg/
echo "Recoloring SVGs..."
find svg -name "*.svg" -print0 | xargs -0 sed -i "s|#80B4FF|$ACCENT_HEX|gi"   # Modern accent
find svg -name "*.svg" -print0 | xargs -0 sed -i "s|#3F8AE5|$ACCENT_HEX|gi"
find svg -name "*.svg" -print0 | xargs -0 sed -i "s|#1A4F7F|$SECONDARY|gi"

# Build via clickgen
echo "Building XCursor (this takes ~3-5 min)..."
ctgen build.toml -p x11

# Output is in themes/Bibata-Modern-Classic/ or similar
THEME_DIR=$(find themes -maxdepth 1 -type d -name "Bibata-Modern-*" | head -1)
if [[ -z "$THEME_DIR" ]]; then
  echo "ERROR: build produced no theme dir under themes/" >&2
  exit 2
fi

# Rename + copy
FINAL_DIR="$OUT_DIR/Bibata-IndigoGlass"
rm -rf "$FINAL_DIR"
cp -r "$THEME_DIR" "$FINAL_DIR"

# Patch index.theme
cat > "$FINAL_DIR/index.theme" <<EOF
[Icon Theme]
Name=Bibata Indigo Glass
Comment=Bibata cursor recolored with Indigo Glass accent ($ACCENT_HEX)
Inherits=Bibata-Modern-Classic
EOF

echo ""
echo "Built: $FINAL_DIR"
echo ""
echo "Install (per-user):"
echo "  cp -r $FINAL_DIR ~/.local/share/icons/"
echo "  kwriteconfig6 --file kcminputrc --group Mouse --key cursorTheme 'Bibata-IndigoGlass'"
echo "  # Restart Plasma session"
