"""Emit the shipping fastfetch art for the Sage Ink mark (drop + vein).

Authored geometry -> body/shadow masks rendered at the exact terminal grid ->
coverage quantisation. Grid is W x H raster pixels = W cols x H/2 half-block rows.
Colour is left as $1 (body) / $2 (shadow) for fastfetch to substitute.
"""
import subprocess, math
from PIL import Image

def taper(c1, r1, c2, r2):
    """Convex hull of two circles: a drop with a rounded tip."""
    (x1, y1), (x2, y2) = c1, c2
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy); a = math.atan2(dy, dx); t = math.acos((r1 - r2) / d)
    p = lambda c, r, ang: (c[0] + r * math.cos(ang), c[1] + r * math.sin(ang))
    A = p(c1, r1, a + t); B = p(c2, r2, a + t)
    C = p(c2, r2, a - t); D = p(c1, r1, a - t)
    return ("M%.2f %.2f L%.2f %.2f A%.2f %.2f 0 0 0 %.2f %.2f "
            "L%.2f %.2f A%.2f %.2f 0 1 0 %.2f %.2f Z"
            % (A[0], A[1], B[0], B[1], r2, r2, C[0], C[1],
               D[0], D[1], r1, r1, A[0], A[1]))

BODY_C, TIP_C, BODY_R, TIP_R = (136, 142), (56, 62), 74, 16
DROP = taper(BODY_C, BODY_R, TIP_C, TIP_R)
VEIN_W = 28
# Vein runs along the drop's 45 deg axis, expressed as a fraction of the axis so
# it can be inset per grid: its round cap lands mid-pixel at some sizes, which
# quantises as speckle on the silhouette edge. Tuned per size in SIZES below.
AXIS = (TIP_C, BODY_C)

def vein(t0, t1):
    (x0, y0), (x1, y1) = AXIS
    p = lambda t: (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)
    a, b = p(t0), p(t1)
    return "M%.2f %.2f L%.2f %.2f" % (a[0], a[1], b[0], b[1])

VEIN = vein(0.55, 1.10)
BBOX = (40, 46, 170, 170)          # x, y, w, h of the drop incl. tip cap

def shape(vein_d):
    return ('<path d="%s" fill="#fff" stroke="none"/>'
            '<path d="%s" fill="none" stroke="#000" stroke-width="%d" stroke-linecap="round"/>'
            % (DROP, vein_d, VEIN_W))

SHAPE = shape(VEIN)

def mask_png(path, W, H, unit, dx, dy, shape_d):
    x, y, w, h = BBOX
    vw = w + unit                                    # room for the shadow offset
    vh = vw * H / W                                  # viewBox aspect must equal the grid's
    vb = (x - unit, y - (vh - h) / 2, vw, vh)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
           'viewBox="%.2f %.2f %.2f %.2f">'
           '<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" fill="#000"/>'
           '<g transform="translate(%.2f,%.2f)">%s</g></svg>'
           % (W * 8, H * 8, vb[0], vb[1], vb[2], vb[3],
              vb[0], vb[1], vb[2], vb[3], dx, dy, shape_d))
    open(path, "w").write(svg)
    png = path.replace(".svg", ".png")
    subprocess.run(["inkscape", path, "-o", png, "-w", str(W * 8), "-h", str(H * 8)],
                   check=True, capture_output=True)
    im = Image.open(png).convert("L").resize((W, H), Image.BOX)
    return [[1 if im.getpixel((px, py)) >= 128 else 0 for px in range(W)] for py in range(H)]

def art(W, H, vein_t0=0.55, offset_px=1):
    shape_d = shape(vein(vein_t0, 1.10))
    unit = BBOX[2] / (W - offset_px)                 # canvas units per raster pixel
    body = mask_png("renders/_ship-body.svg",   W, H, unit, 0, 0, shape_d)
    shad = mask_png("renders/_ship-shadow.svg", W, H, unit, unit * offset_px, unit * offset_px, shape_d)
    out = []
    for y in range(0, H, 2):
        line = ''
        for x in range(W):
            t = 1 if body[y][x] else (2 if shad[y][x] else 0)
            b = (1 if body[y + 1][x] else (2 if shad[y + 1][x] else 0)) if y + 1 < H else 0
            if t == 0 and b == 0:   line += ' '
            elif t == b:            line += '$%d█' % t
            elif b == 0:            line += '$%d▀' % t
            elif t == 0:            line += '$%d▄' % b
            else:                   line += '$%d▀' % t
        out.append(line.rstrip())
    while out and not out[0].strip():  out.pop(0)
    while out and not out[-1].strip(): out.pop()
    return out

# (cols, raster rows, vein inset, output name). The vein inset is tuned per size:
# its round cap lands mid-pixel at some grids and quantises as edge speckle.
SIZES = ((30, 32, 0.54, "sage-ink-mark.txt"),
         (24, 26, 0.58, "sage-ink-mark-small.txt"))

OUT = "../../config/fastfetch/"

if __name__ == "__main__":
    for W, H, t0, name in SIZES:
        a = art(W, H, vein_t0=t0)
        open(OUT + name, "w").write("\n".join(a) + "\n")
        print("### %s — %d cols, %d rows" % (name, W, len(a)))
        for l in a:
            print(l.replace('$1', '').replace('$2', ''))
