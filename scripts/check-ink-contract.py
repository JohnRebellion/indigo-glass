#!/usr/bin/env python3
"""check-ink-contract — lint hand-typed dark layers against the ink contract.

The palette drift guard only hunts stale hex values, so it stays green while a
layer ships translucent shadows, invisible borders or invented colours (all
four found live on 2026-09-22, research-reports/sage-ink-live-audit-2026-09-22).
This checks the *contract*, not the palette:

  1. no translucent shadow  - rgba()/alpha() inside box-shadow
  2. no translucent fill    - rgba()/alpha() outside a transient hover rule
                              (STATE_GRAMMAR.md exempts hover washes, except on
                              scrollbar/slider, which are Tier D identity fills)
                              and outside Tier A ([alpha.exempt] fragments in
                              the token file: selection, scrim, overlay, ...)
  3. token-only hex         - every #RRGGBB must be a token of the variant the
                              layer ships: GTK = default (sage); GRUB = the
                              `# variant:` header in theme.txt (on_light values
                              like #000000 are not allowed in either; the
                              simulator may use them, because it renders the
                              tone context nb-surfaces.css defines)
  4. 2px on controls        - no 1px border on entry/check/radio/switch/button/
                              input/textarea/select
  5. GRUB pixmaps           - every PNG theme.txt references must have a binary
                              alpha channel (0 or 1, never a translucent fill)
                              and, when it is a flat tile, paint only tokens

A line carrying a `drift-allow` comment is skipped: that marker already means
"reviewed functional alpha" for the palette guard.

Scope (2026-09-23): widened from the GTK CSS to the simulator's hand-typed
CSS and Svelte/TS sources and to share/grub-theme, after the same audit's
follow-up found the simulator's GRUB preview painting a translucent glyph
shadow and a black border, and the GRUB theme baking a 0.14-alpha row fill.
Generated copies (tokens.css, density.css, palettes.ts, tokens/out) are not
linted here; they are codegen's responsibility.

Usage: check-ink-contract.py [FILE...]   (default: DEFAULT + SIMULATOR globs)
Exit 0 clean, 1 violations.
"""
import pathlib
import re
import subprocess
import sys
import tomllib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT = [
    "config/gtk-theme/SageInk/gtk-3.0/gtk-dark.css",
    "config/gtk-3.0/gtk.css",
    "config/gtk-4.0/gtk.css",
    "share/grub-theme/theme.txt",
    "share/grub-theme/generate-menu.sh",
    "share/grub-theme/generate-background.sh",
]
SIMULATOR_GLOBS = [
    "simulator/src/lib/nb/*.css",
    "simulator/src/lib/styles/global.css",
    "simulator/src/lib/styles/density-optin.css",
    "simulator/src/**/*.svelte",
    "simulator/src/lib/theme/*.ts",
]
# /palettes shows every variant's hues side by side on purpose (the drift
# guard makes the same exception); its hex literals are the exhibit, not fills.
# The /sites/<id>/ mock pages are the STOCK DOM of each site: their inline
# literals (avatar fills, language bars, brand tiles, Google's greys) are the
# values the shipped .user.css has to override, and the ours lane is judged by
# computed style in simulator/e2e/sites.spec.ts, not by a literal scan. The
# lane infrastructure beside them (SitePage, Pair, registry) stays token-only.
# Unit-test fixtures (*.test.ts) parse arbitrary theme.txt input and are skipped.
HEX_EXEMPT = re.compile(r"^simulator/src/routes/palettes/|^simulator/src/lib/sites/[^/]+/Page\.svelte$")
CONTROL = re.compile(r"(^|[\s,>])(entry|check|radio|switch|button|input|textarea|select)\b")
PNG_TOKEN_MAX_COLOURS = 8  # flat tiles only; icons and text bakes have hundreds
PNG_SENTINEL = "#FE01FE"   # what transparent pixels flatten onto before the colour read


def token_hexes(on_light: bool, variant: str | None = None) -> set[str]:
    name = f"css-vars.{variant}.css" if variant else "css-vars.css"
    css = (ROOT / "tokens/out" / name).read_text()
    root_block = css.split("}", 1)[0]  # default (sage) :root only
    pat = r"--ig-[\w-]+:\s*(#[0-9A-Fa-f]{6})\b" if on_light else \
        r"--ig-(?!on-light)[\w-]+:\s*(#[0-9A-Fa-f]{6})\b"
    return {h.upper() for h in re.findall(pat, root_block)}


def grub_variant() -> str | None:
    """`# variant: <name>` in theme.txt is the GRUB theme's one colour switch;
    the generators and this lint all read it, so the theme can be any variant
    (light ones included) and still be held to that variant's tokens."""
    m = re.search(r"(?m)^# variant:\s*(\w+)", (ROOT / "share/grub-theme/theme.txt").read_text())
    return m.group(1) if m else None


def variant_is_light(variant: str | None) -> bool:
    """The [on_light] rule: base luminance above 0.179 takes pure-black edges
    and shadows, so a light GRUB bake may legitimately paint #000000."""
    css = (ROOT / "tokens/out" / (f"css-vars.{variant}.css" if variant else "css-vars.css")).read_text()
    m = re.search(r"--ig-base:\s*#([0-9A-Fa-f]{6})", css)
    if not m:
        return False
    def f(c: int) -> float:
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (int(m.group(1)[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) > 0.179


def tier_a_fragments() -> list[str]:
    t = tomllib.load(open(ROOT / "tokens/indigo-glass.tokens.toml", "rb"))
    frags = t["alpha"]["exempt"]["key_fragments"] + ["highlight"]
    return [re.sub(r"[-_]", "", f.lower()) for f in frags]


def strip_comments(text: str, suffix: str) -> str:
    """Blank comments but keep line numbers. CSS block comments everywhere;
    `//` line comments in TS/Svelte; `#` comments in shell and theme.txt
    (a `#` that follows whitespace or starts the line - never a hex literal)."""
    keep_lines = lambda m: "\n" * m.group(0).count("\n")
    text = re.sub(r"/\*.*?\*/", keep_lines, text, flags=re.S)
    if suffix in (".ts", ".svelte", ".mjs"):
        text = re.sub(r"(?m)(^|(?<=\s))//(?!.*['\"`]).*$", "", text)
    if suffix in (".sh", ".txt"):
        text = re.sub(r"(?m)(^|(?<=\s))#(?![0-9A-Fa-f]{3,8}\b).*$", "", text)
    return text


def _rel(path: pathlib.Path) -> str:
    """Repo-relative for repo files; absolute for ad-hoc CLI paths (a stashed
    copy under /tmp, an old revision written out for a before/after run)."""
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def lint_text(path: pathlib.Path, allowed: set[str], frags: list[str]) -> list[str]:
    out = []
    selector = ""
    raw = path.read_text().splitlines()
    rel = _rel(path)
    check_hex = not HEX_EXEMPT.search(rel)
    for n, line in enumerate(strip_comments(path.read_text(), path.suffix).splitlines(), 1):
        if "drift-allow" in raw[n - 1]:
            continue  # reviewed functional alpha (e.g. libadwaita press-state shade)
        if "{" in line:
            selector = line.split("{", 1)[0].strip() or selector
        s = line.strip()
        where = f"{rel}:{n}"
        translucent = re.search(r"\brgba\([^)]*,\s*0?\.\d+\s*\)|\balpha\(|#[0-9A-Fa-f]{8}\b", s)
        if translucent and re.search(r"shadow", s, re.I):
            out.append(f"{where}: translucent shadow: {s}")
        elif translucent:
            ctx = re.sub(r"[-_]", "", (selector + " " + s).lower())
            hover = "hover" in selector and not re.search(r"scrollbar|slider", selector)
            tier_a = any(f in ctx for f in frags)
            if not hover and not tier_a:
                out.append(f"{where}: translucent fill outside a hover wash [{selector}]: {s}")
        if check_hex:
            for h in re.findall(r"#[0-9A-Fa-f]{6}\b", s):
                if h.upper() not in allowed:
                    out.append(f"{where}: {h} is not a token of this layer's variant: {s}")
        if re.search(r"\bborder(-width)?\s*:\s*1px", s) and CONTROL.search(selector) \
                and not re.search(r"header|separator|headerbar|titlebar|kbd", selector):
            out.append(f"{where}: 1px border on a control [{selector}] (contract: 2px)")
    return out


def _magick(*args: str) -> str:
    return subprocess.run(["magick", *args], capture_output=True, text=True, check=True).stdout


def lint_grub_pixmaps(theme: pathlib.Path, allowed: set[str]) -> list[str]:
    """Every pixmap theme.txt references: binary alpha, token-only flat fills."""
    out = []
    text = strip_comments(theme.read_text(), ".txt")
    refs: set[str] = set(re.findall(r'file\s*=\s*"([^"]+\.png)"', text))
    for pattern in re.findall(r'_pixmap_style\s*=\s*"([^"]+)"', text):
        for k in ("nw", "n", "ne", "w", "c", "e", "sw", "s", "se"):
            if (theme.parent / pattern.replace("*", k)).exists():
                refs.add(pattern.replace("*", k))
    for ref in sorted(refs):
        png = theme.parent / ref
        where = _rel(png)
        if not png.exists():
            out.append(f"{where}: referenced by theme.txt but missing")
            continue
        alphas = set(re.findall(r"\(\s*(\d+)", _magick(str(png), "-alpha", "extract", "-depth", "8",
                                                        "-unique-colors", "txt:-")))
        partial = sorted(int(a) for a in alphas if a not in ("0", "255"))
        if partial:
            out.append(f"{where}: translucent pixels (alpha {partial[0]}..{partial[-1]}/255) - "
                       f"a GRUB pixmap fill must be opaque or fully transparent")
        # Fully transparent pixels carry whatever RGB the encoder left; they are
        # not a fill. Flatten onto a sentinel and drop it from the colour list.
        colours = [c.upper() for c in re.findall(r"#([0-9A-Fa-f]{6})\b",
                                                 _magick(str(png), "-background", PNG_SENTINEL,
                                                         "-alpha", "remove", "-depth", "8",
                                                         "-unique-colors", "txt:-"))]
        if len(colours) <= PNG_TOKEN_MAX_COLOURS:
            for c in sorted(set(colours)):
                if f"#{c}" == PNG_SENTINEL:
                    continue
                if f"#{c}" not in allowed:
                    out.append(f"{where}: fill #{c} is not a token of this layer's variant")
    return out


def main() -> int:
    if sys.argv[1:]:
        files = [pathlib.Path(a).resolve() for a in sys.argv[1:]]
    else:
        files = [ROOT / f for f in DEFAULT]
        for g in SIMULATOR_GLOBS:
            files += sorted(p for p in ROOT.glob(g)
                            if "palettes.ts" not in p.name and ".test." not in p.name)
    strict, lenient = token_hexes(on_light=False), token_hexes(on_light=True)
    gv = grub_variant()
    grub = token_hexes(on_light=variant_is_light(gv), variant=gv)
    frags = tier_a_fragments()
    problems: list[str] = []
    for f in files:
        if not f.exists():
            continue
        rel = _rel(f)
        allowed = lenient if rel.startswith("simulator/") else grub if "grub" in rel else strict
        problems += lint_text(f, allowed, frags)
        if f.name == "theme.txt" and "grub" in rel:
            problems += lint_grub_pixmaps(f, grub)
    for p in problems:
        print(p)
    print(f"ink contract: {len(problems)} violation(s) in {len(files)} file(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
