"""Emit the shipping fastfetch art from the GPT concept render (gpt-01.png).

Supersedes ship.py's hand-authored SVG source: geometry now traced from the
approved render. Classification is done at native resolution (per-pixel
nearest tone), then each class's binary mask is box-downsampled to the
target grid for true area coverage — classifying AFTER a Lanczos resize
misclassifies the render's soft anti-aliased body/shadow boundary as a
flickering band of mixed cells (measured: first pass, see git history of
this file).
"""
from PIL import Image

BG = (7, 7, 8)
BODY = (192, 227, 182)
SHAD = (137, 167, 125)

def classify(px):
    d = lambda c: (px[0] - c[0]) ** 2 + (px[1] - c[1]) ** 2 + (px[2] - c[2]) ** 2
    return min(((d(BG), 0), (d(BODY), 1), (d(SHAD), 2)))[1]

def load_square(path):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    px = im.load()
    xs = [x for x in range(W) if any(classify(px[x, y]) for y in range(H))]
    ys = [y for y in range(H) if any(classify(px[x, y]) for x in range(W))]
    x0, x1, y0, y1 = xs[0], xs[-1], ys[0], ys[-1]
    crop = im.crop((x0, y0, x1 + 1, y1 + 1))
    side = max(crop.size)
    pad = Image.new("RGB", (side, side), BG)
    pad.paste(crop, ((side - crop.size[0]) // 2, (side - crop.size[1]) // 2))
    return pad

def coverage_grids(square, grid, thr=0.5):
    W, H = square.size
    cls = [[classify(square.getpixel((x, y))) for x in range(W)] for y in range(H)]
    body_mask = Image.new("F", (W, H))
    shad_mask = Image.new("F", (W, H))
    body_mask.putdata([1.0 if c == 1 else 0.0 for row in cls for c in row])
    shad_mask.putdata([1.0 if c == 2 else 0.0 for row in cls for c in row])
    body_small = body_mask.resize((grid, grid), Image.BOX)
    shad_small = shad_mask.resize((grid, grid), Image.BOX)
    out = [[0] * grid for _ in range(grid)]
    for y in range(grid):
        for x in range(grid):
            bf = body_small.getpixel((x, y))
            sf = shad_small.getpixel((x, y))
            # Both thresholds are absolute, not relative to each other: body/bg
            # anti-aliasing along the render's outer contour blends toward a
            # colour close to the shadow tone, so weak spurious shadow signal
            # (~0.01-0.06 coverage) leaks into the body interior. A floor
            # clears that noise without needing the two channels to compete.
            if bf >= thr:
                out[y][x] = 1
            elif sf >= 0.30:
                out[y][x] = 2
    return out

def art(square, grid, thr=0.5):
    g = coverage_grids(square, grid, thr)
    out = []
    for y in range(0, grid, 2):
        line = ''
        for x in range(grid):
            t = g[y][x]
            b = g[y + 1][x] if y + 1 < grid else 0
            if t == 0 and b == 0:
                line += ' '
            elif t == b:
                line += '$%d█' % t
            elif b == 0:
                line += '$%d▀' % t
            elif t == 0:
                line += '$%d▄' % b
            else:
                line += '$%d▀' % t          # top half wins the glyph on conflict
        out.append(line.rstrip())
    while out and not out[0].strip(): out.pop(0)
    while out and not out[-1].strip(): out.pop()
    return out

OUT = "../../config/fastfetch/"

if __name__ == "__main__":
    square = load_square("renders/gpt-01.png")
    for grid, name in ((30, "sage-ink-mark.txt"), (24, "sage-ink-mark-small.txt")):
        a = art(square, grid)
        open(OUT + name, "w").write("\n".join(a) + "\n")
        print("### %s — %d cols, %d rows" % (name, grid, len(a)))
        for l in a:
            print(l.replace('$1', '').replace('$2', ''))
