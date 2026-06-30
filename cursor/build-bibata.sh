#!/usr/bin/env bash
# Lime Glass - build Bibata cursor variant w/ indigo accent
#
# Bibata upstream: https://github.com/ful1e5/Bibata_Cursor
# Build pipeline (v2.0.6+):
#   1. svg/ uses color placeholders (#00FF00 outline, #0000FF base,
#      #FF0000 accent fill)
#   2. cbmp + render.json recolor + render to bitmaps/<variant>/
#   3. ctgen + configs/normal/x.build.toml compile to XCursor
#
# We add a custom "Bibata-Modern-IndigoGlass" entry to render.json
# w/ Lime Glass palette mapping, then run cbmp + ctgen for just
# that one variant.
#
# Deps:
#   xcursorgen   (sudo dnf install xcursorgen)
#   nodejs + npm (cbmp ships via npx)
#   clickgen     (pip - script auto-installs)
#
# Output: out/Bibata-IndigoGlass/ (XCursor)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/out"
WORK_DIR="$SCRIPT_DIR/.work"

# Lime Glass palette mapped to Bibata color slots:
#   match #00FF00 -> outline   = #0F0F12 (deep near-black)
#   match #0000FF -> base fill = #F8F8F8 (white-ish for cursor body)
#   match #FF0000 -> accent    = #5E6AD2 (Lime Glass primary)
ACCENT="#5E6AD2"
OUTLINE="#0F0F12"
BASE="#F8F8F8"
VARIANT="Bibata-Modern-IndigoGlass"

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: need $1 ($2)" >&2; exit 1; }
}

require xcursorgen "sudo dnf install xcursorgen"
require node "nodejs (system pkg)"
require npx "comes with node"

if ! python3 -c "import clickgen" 2>/dev/null; then
  echo "Installing clickgen via pip --user..."
  python3 -m pip install --user --upgrade clickgen
  export PATH="$HOME/.local/bin:$PATH"
fi
require ctgen "pip install --user clickgen"

mkdir -p "$OUT_DIR"

if [[ ! -d "$WORK_DIR/Bibata_Cursor" ]]; then
  mkdir -p "$WORK_DIR"
  cd "$WORK_DIR"
  echo "Cloning Bibata source..."
  git clone --depth 1 https://github.com/ful1e5/Bibata_Cursor.git
fi

cd "$WORK_DIR/Bibata_Cursor"

# Insert custom variant into render.json (idempotent)
echo "Patching render.json with Lime Glass variant..."
python3 - "$ACCENT" "$OUTLINE" "$BASE" "$VARIANT" <<'PY'
import json
import sys

accent, outline, base, variant = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

with open("render.json") as f:
    d = json.load(f)

d[variant] = {
    "dir": "svg/modern",
    "out": f"bitmaps/{variant}",
    "colors": [
        {"match": "#00FF00", "replace": outline},
        {"match": "#0000FF", "replace": base},
        {"match": "#FF0000", "replace": accent},
    ],
}

with open("render.json", "w") as f:
    json.dump(d, f, indent=2)

print(f"Added {variant} to render.json")
PY

# Render bitmaps
echo "Rendering bitmaps (cbmp - this is the slow step, ~2 min)..."
npx --yes cbmp render.json

# Build XCursor for just our variant
echo "Building XCursor binary..."
ctgen configs/normal/x.build.toml \
  -p x11 \
  -d "bitmaps/$VARIANT" \
  -n "$VARIANT" \
  -c "Lime Glass - rounded edge Bibata w/ #5E6AD2 accent (v2.0.6)"

# Locate output
THEME_DIR="themes/$VARIANT"
if [[ ! -d "$THEME_DIR" ]]; then
  echo "ERROR: ctgen produced no theme at $THEME_DIR" >&2
  ls themes/ 2>/dev/null
  exit 2
fi

# Copy + rename to Bibata-IndigoGlass (drop "Modern-" prefix in output dir)
FINAL_DIR="$OUT_DIR/Bibata-IndigoGlass"
rm -rf "$FINAL_DIR"
cp -r "$THEME_DIR" "$FINAL_DIR"

cat > "$FINAL_DIR/index.theme" <<EOF
[Icon Theme]
Name=Bibata Lime Glass
Comment=Bibata cursor recolored with Lime Glass accent ($ACCENT)
Inherits=Bibata-Modern-Classic
EOF

echo ""
echo "[ok] Built: $FINAL_DIR"
echo ""
echo "Install (per-user):"
echo "  cp -r $FINAL_DIR ~/.local/share/icons/"
echo "  kwriteconfig6 --file kcminputrc --group Mouse --key cursorTheme 'Bibata-IndigoGlass'"
echo "  # Then log out + back in, or restart Plasma"
