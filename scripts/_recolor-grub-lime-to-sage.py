#!/usr/bin/env python3
"""One-time pixel-level recolor: lime-hued pixels -> sage, in the GRUB theme
chrome PNGs that have no generator script. Several of these assets (select_*,
spin_center, version_chip) intentionally mix lime AND indigo pixels — a
hue-window rotation (not a blind recolor) is required so indigo pixels
(hue ~234-255 deg) are left untouched while lime pixels (hue ~81 deg,
gradients/anti-aliasing included) rotate to sage's hue AND desaturate to
match sage's muted character (lime S=0.77, sage S=0.17 - a straight hue
rotation alone would produce a vivid green, not sage).

Ad hoc — delete after the Sage Ink rollout is verified; not a general tool.
"""
import colorsys
import sys
from pathlib import Path

from PIL import Image

LIME_HUE = 81.0
SAGE_HUE = 120.0
HUE_WINDOW = 45.0  # +-45 deg around lime's hue; indigo (~234-255) is 150+ deg away, safe
MIN_SAT = 0.12  # skip near-grey/white/black anti-aliasing with no real hue
SAT_SCALE = 0.174 / 0.770  # sage_S / lime_S - desaturate matched pixels toward sage


def recolor(path: Path) -> bool:
    img = Image.open(path).convert("RGBA")
    px = img.load()
    w, h = img.size
    changed = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            hue_deg = hh * 360
            dist = min(abs(hue_deg - LIME_HUE), 360 - abs(hue_deg - LIME_HUE))
            if dist <= HUE_WINDOW and s >= MIN_SAT:
                new_r, new_g, new_b = colorsys.hsv_to_rgb(SAGE_HUE / 360, s * SAT_SCALE, v)
                px[x, y] = (round(new_r * 255), round(new_g * 255), round(new_b * 255), a)
                changed = True
    if changed:
        img.save(path)
    return changed


def main() -> int:
    files = [Path(p) for p in sys.argv[1:]]
    for f in files:
        if not f.is_file():
            print(f"skip (not found): {f}", file=sys.stderr)
            continue
        did = recolor(f)
        print(f"  {f}  {'recolored' if did else '(no lime pixels found)'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
