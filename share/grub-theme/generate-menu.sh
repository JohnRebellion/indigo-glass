#!/usr/bin/env bash
# Bake the boot-menu 9-slice, the selected-item box and the card accent line.
#
# GRUB has no stylesheet: every surface is a pixmap sliced by filename suffix.
# This is the closest GRUB gets to neobrutalism.dev's menu components —
# a bordered container (menu_*) with a bordered selected row (select_*).
#
# Structure follows the reference (a real panel, a real per-row box); the FILL
# does not. The reference's menu is bg-main, which here would put the accent
# across 57% of a 2560x1440 screen. Sage Ink keeps surface_alt and spends the
# accent on the selection stroke instead — Tier C, outline not fill, the same
# rule the Plasma/GTK/VSCode layers use for an on-select state.
#
# Every colour is read from tokens/out/css-vars.<variant>.css, so this script
# cannot carry a literal the token file does not know about. Run codegen first.
# Two bakes, chosen by the variant's base luminance (the [on_light] rule):
#   dark  - surface_alt panel, border_strong edge, accent stroke over the
#           select_fill wash on the selected row.
#   light - neobrutalism.dev light mode as the user reads it: white page,
#           the menu is the coloured forward-facing card (card_fill), pure
#           black 2px edge and 4px hard shadow, selected row = black stroke
#           with a transparent interior.
#
# 2026-09-23 (live-audit follow-up, research-reports/sage-ink-live-audit-
# 2026-09-22): the selected-row fill was accent at 0.14 ALPHA baked into the
# PNG - the one translucent value left in the theme, and an off-token
# composite by construction. It is now the opaque `select_fill` token
# ([palette.composite]: accent 0.14 over surface_alt). The panel border was
# a hand-picked #7A7B80; it is now border_strong like every other layer.
# accent_line.png was #BEE6BE, a hex that exists in no token file; it is now
# baked here at the accent, at the 80x5 theme.txt draws it.
#
# Usage: bash share/grub-theme/generate-menu.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# `# variant: <name>` in theme.txt is the one colour switch for the whole GRUB
# theme (2026-09-23: orchid_light). generate-background.sh and
# scripts/check-ink-contract.py read the same line.
VARIANT="$(sed -n 's/^# variant: *//p' theme.txt | head -1)"
[ -n "$VARIANT" ] || { echo "ERROR: theme.txt has no '# variant:' header" >&2; exit 1; }
VARS="../../tokens/out/css-vars.${VARIANT}.css"
[ -f "$VARS" ] || { echo "ERROR: $VARS missing - run python3 tokens/codegen.py" >&2; exit 1; }
tok() {
  local v
  v="$(grep -oE "^\s*--ig-$1:\s*#[0-9A-Fa-f]{6}" "$VARS" | head -1 | grep -oE '#[0-9A-Fa-f]{6}')"
  [ -n "$v" ] || { echo "ERROR: token --ig-$1 not in $VARS" >&2; exit 1; }
  printf '%s' "$v"
}

OUT=assets
B=2                     # border.default (menu panel)
SB=4                    # selection stroke — 2px vanishes at 2560x1440
ACCENT="$(tok accent)"  # card accent line; dark variants also stroke the selection with it

# Light or dark bake? The [on_light] rule in the token file: a surface with
# relative luminance above 0.179 takes pure-black borders and shadows. The
# same threshold decides the card model here.
BASE="$(tok base)"
IS_LIGHT="$(python3 -c '
import sys
h = sys.argv[1]
def f(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
r, g, b = (int(h[i:i+2], 16) for i in (1, 3, 5))
print(int(0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) > 0.179))
' "$BASE")"

mkdir -p "$OUT"

if [ "$IS_LIGHT" = 1 ]; then
  # ── LIGHT: neobrutalism.dev light mode. White page, the boot menu is the
  #    forward-facing coloured card: card_fill (accent 0.45 over surface),
  #    2px pure-black edge, 4px pure-black hard shadow baked into the e/s/se
  #    slices. GRUB pads each side by the W/N/E/S slice's own width/height
  #    and scales the corners to match, so e and s carry border+shadow
  #    (B+SH) and the corners are cut to the pads they meet: ne is (B+SH)xB
  #    with the shadow column transparent (the shadow starts SH px down),
  #    sw is Bx(B+SH) with the shadow rows transparent (it starts SH px in),
  #    se is solid. simulator/src/lib/theme/nineSlice.ts pads the same way.
  CARD="$(tok card-fill)"
  EDGE="$(tok on-light-border)"
  INK="$(grep -oE '^\s*--ig-on-light-ink:\s*[^;]+' "$VARS" | head -1)"
  SH="$(grep -oE '[0-9]+px' <<<"$INK" | head -1 | tr -d px)"
  SHADOW="$(grep -oE '#[0-9A-Fa-f]{6}' <<<"$INK")"
  [ -n "$SH" ] && [ -n "$SHADOW" ] || { echo "ERROR: --ig-on-light-ink not parseable in $VARS" >&2; exit 1; }
  R=$((B+SH))

  magick -size ${B}x${B} xc:"$EDGE" PNG32:"$OUT/menu_nw.png"
  magick -size 1x${B}    xc:"$EDGE" PNG32:"$OUT/menu_n.png"
  magick -size ${R}x${B} xc:none -fill "$EDGE" -draw "rectangle 0,0 $((B-1)),$((B-1))" PNG32:"$OUT/menu_ne.png"
  magick -size ${B}x1    xc:"$EDGE" PNG32:"$OUT/menu_w.png"
  magick -size 1x1       xc:"$CARD" PNG32:"$OUT/menu_c.png"
  magick -size ${R}x1    xc:"$SHADOW" -fill "$EDGE" -draw "rectangle 0,0 $((B-1)),0" PNG32:"$OUT/menu_e.png"
  magick -size ${B}x${R} xc:none -fill "$EDGE" -draw "rectangle 0,0 $((B-1)),$((B-1))" PNG32:"$OUT/menu_sw.png"
  magick -size 1x${R}    xc:"$SHADOW" -fill "$EDGE" -draw "rectangle 0,0 0,$((B-1))" PNG32:"$OUT/menu_s.png"
  magick -size ${R}x${R} xc:"$SHADOW" PNG32:"$OUT/menu_se.png"

  # Selected row: Tier C, outline not fill. A 4px black stroke with a fully
  # transparent interior, so the card colour shows through; every pixel is
  # alpha 0 or 255. (The dark bake below fills the interior with the opaque
  # select_fill wash instead - on a coloured card there is nothing to wash.)
  STROKE="$EDGE"
  ROW_FILL="none"
  echo "light bake: card $CARD, edge $EDGE, shadow ${SH}px $SHADOW"
else
  # ── DARK: bordered surface_alt panel, no shadow (nothing lifts off a
  #    near-black page), selection = accent stroke over the select_fill wash.
  SURFACE_ALT="$(tok surface-alt)"
  BORDER="$(tok border-strong)"
  magick -size ${B}x${B} xc:"$BORDER" PNG32:"$OUT/menu_nw.png"
  magick -size ${B}x${B} xc:"$BORDER" PNG32:"$OUT/menu_ne.png"
  magick -size ${B}x${B} xc:"$BORDER" PNG32:"$OUT/menu_sw.png"
  magick -size ${B}x${B} xc:"$BORDER" PNG32:"$OUT/menu_se.png"
  magick -size 1x${B}    xc:"$BORDER" PNG32:"$OUT/menu_n.png"
  magick -size 1x${B}    xc:"$BORDER" PNG32:"$OUT/menu_s.png"
  magick -size ${B}x1    xc:"$BORDER" PNG32:"$OUT/menu_e.png"
  magick -size ${B}x1    xc:"$BORDER" PNG32:"$OUT/menu_w.png"
  magick -size 1x1       xc:"$SURFACE_ALT" PNG32:"$OUT/menu_c.png"
  STROKE="$ACCENT"
  ROW_FILL="$(tok select-fill)"
  echo "dark bake: panel $SURFACE_ALT, edge $BORDER, selection $STROKE on $ROW_FILL"
fi

# ── Selected item: horizontal-only slice (c/e/w), matching the existing
#    geometry GRUB is already configured for. Height is fixed at 60 to sit
#    inside item_height 72 with item_padding 12; the caps hold the left/right
#    strokes and every tile carries the top/bottom stroke so the box closes
#    however far the centre stretches.
H=60
CAP=45

magick -size 1620x${H} xc:"$ROW_FILL" \
  -fill "$STROKE" \
  -draw "rectangle 0,0 1619,$((SB-1))" \
  -draw "rectangle 0,$((H-SB)) 1619,$((H-1))" \
  PNG32:"$OUT/select_c.png"
# West cap: adds the left stroke.
magick -size ${CAP}x${H} xc:"$ROW_FILL" \
  -fill "$STROKE" \
  -draw "rectangle 0,0 $((CAP-1)),$((SB-1))" \
  -draw "rectangle 0,$((H-SB)) $((CAP-1)),$((H-1))" \
  -draw "rectangle 0,0 $((SB-1)),$((H-1))" \
  PNG32:"$OUT/select_w.png"
# East cap: adds the right stroke.
magick -size ${CAP}x${H} xc:"$ROW_FILL" \
  -fill "$STROKE" \
  -draw "rectangle 0,0 $((CAP-1)),$((SB-1))" \
  -draw "rectangle 0,$((H-SB)) $((CAP-1)),$((H-1))" \
  -draw "rectangle $((CAP-SB)),0 $((CAP-1)),$((H-1))" \
  PNG32:"$OUT/select_e.png"

# ── Card accent line: the 80x5 rule above each stat card's section label.
magick -size 80x5 xc:"$ACCENT" PNG32:"$OUT/accent_line.png"

echo "menu 9-slice, selected-item box ($STROKE stroke) and accent_line.png ($ACCENT) written to $OUT/"
