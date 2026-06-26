#!/usr/bin/env python3
"""
Indigo Glass - token codegen.

Reads tokens/indigo-glass.tokens.toml (OKLCH-authored, schema v2) and emits
derived per-layer artifacts:

    tokens/out/css-vars.css        # CSS custom properties (web/Stylus)
    tokens/out/scss-vars.scss      # Sass equivalent
    tokens/out/json-tokens.json    # JSON (VSCode/web/JS consumers)
    tokens/out/kde-palette.colors  # KDE color scheme partial
    tokens/out/wt-scheme.json      # Windows Terminal scheme partial
    tokens/out/density.css         # Compact-density CSS rules
    tokens/out/glass.css           # Glass surface + grain + squircle + ambient

The palette source of truth is [palette.oklch]. We derive byte-identical sRGB
hex (for KDE/GTK/GRUB/Windows, which cannot parse oklch()), display-p3, and
native oklch() CSS from those values - all in one place, no color drift.

Usage:
    python3 tokens/codegen.py             # emit all
    python3 tokens/codegen.py --check     # exit 1 if any out-of-date

Requires Python 3.11+ (uses tomllib). No third-party dependencies.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

try:
    import tomllib  # Python 3.11+
except ImportError:
    print("ERROR: Python 3.11+ required (need tomllib).", file=sys.stderr)
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
TOKENS_FILE = REPO_ROOT / "tokens" / "indigo-glass.tokens.toml"
OUT_DIR = REPO_ROOT / "tokens" / "out"


# =============================================================================
# Color conversion - OKLCH <-> sRGB <-> Display-P3 (dependency-free)
# Reference: Bjorn Ottosson, https://bottosson.github.io/posts/oklab/
# =============================================================================

def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(c: float) -> float:
    return c * 12.92 if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def _oklab_to_linear_srgb(L: float, a: float, b: float) -> tuple[float, float, float]:
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    return (
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )


def _oklch_to_linear_srgb(L: float, C: float, H: float) -> tuple[float, float, float]:
    a = C * math.cos(math.radians(H))
    b = C * math.sin(math.radians(H))
    return _oklab_to_linear_srgb(L, a, b)


def oklch_to_hex(L: float, C: float, H: float) -> str:
    """Exact sRGB hex (gamut-clipped) for an OKLCH triple."""
    out = []
    for lin in _oklch_to_linear_srgb(L, C, H):
        srgb = max(0.0, min(1.0, _linear_to_srgb(lin)))
        out.append(round(srgb * 255))
    return "#{:02X}{:02X}{:02X}".format(*out)


def oklch_to_p3(L: float, C: float, H: float) -> str:
    """Display-P3 CSS color() string. Uses the same linear sRGB primaries
    re-expressed in the P3 container so wide-gamut monitors get more chroma
    while sRGB monitors clip to the identical perceptual color."""
    # Linear sRGB -> XYZ (D65) -> linear P3, then gamma-encode P3 channels.
    rl, gl, bl = _oklch_to_linear_srgb(L, C, H)
    # sRGB linear -> XYZ
    x = 0.4123908 * rl + 0.3575843 * gl + 0.1804808 * bl
    y = 0.2126390 * rl + 0.7151687 * gl + 0.0721923 * bl
    z = 0.0193308 * rl + 0.1191948 * gl + 0.9505322 * bl
    # XYZ -> linear Display-P3
    pr = 2.4934969 * x - 0.9313836 * y - 0.4027108 * z
    pg = -0.8294890 * x + 1.7626641 * y + 0.0236247 * z
    pb = 0.0358458 * x - 0.0761724 * y + 0.9568845 * z
    enc = [max(0.0, min(1.0, _linear_to_srgb(c))) for c in (pr, pg, pb)]
    return "color(display-p3 {:.4f} {:.4f} {:.4f})".format(*enc)


def oklch_css(L: float, C: float, H: float) -> str:
    """Native CSS oklch() string."""
    return f"oklch({L:.4f} {C:.4f} {H:.2f})"


def hex_to_rgb(h: str) -> str:
    h = h.lstrip("#")
    if len(h) >= 6:
        return f"{int(h[0:2],16)},{int(h[2:4],16)},{int(h[4:6],16)}"
    return "0,0,0"


def rgba_hex(base_hex: str, alpha: float) -> str:
    """#RRGGBB + alpha float -> #RRGGBBAA."""
    a = round(max(0.0, min(1.0, alpha)) * 255)
    return f"{base_hex}{a:02X}"


# =============================================================================
# Derive a flat palette (hex / p3 / oklch) from [palette.oklch] + [palette.alpha]
# =============================================================================

def derive_palette(t: dict) -> dict:
    """Returns {key: {'hex','p3','oklch'}} plus alpha-derived entries.
    Key order preserves the .toml authoring order, then alpha entries."""
    pal: dict[str, dict] = {}
    for key, (L, C, H) in t["palette"]["oklch"].items():
        pal[key] = {
            "hex": oklch_to_hex(L, C, H),
            "p3": oklch_to_p3(L, C, H),
            "oklch": oklch_css(L, C, H),
        }
    # Alpha entries: base can be a palette key or a literal hex.
    for key, (base, alpha) in t["palette"]["alpha"].items():
        base_hex = pal[base]["hex"] if base in pal else base
        h = rgba_hex(base_hex, alpha)
        pal[key] = {"hex": h, "p3": h, "oklch": h}  # alpha not gamut-mapped
    return pal


# =============================================================================
# Emitters
# =============================================================================

def emit_css_vars(t: dict) -> str:
    pal = derive_palette(t)
    lines = [
        "/* Indigo Glass design tokens - CSS custom properties */",
        "/* Generated by tokens/codegen.py from tokens/indigo-glass.tokens.toml */",
        "/* DO NOT EDIT - regenerate via `python3 tokens/codegen.py` */",
        "",
        ":root {",
        "  /* Palette - sRGB hex (universal fallback) */",
    ]
    for k, v in pal.items():
        lines.append(f"  --ig-{k.replace('_', '-')}: {v['hex']};")

    lines.extend(["", "  /* Spacing */"])
    for k, v in t["spacing"].items():
        lines.append(f"  --ig-{k.replace('_', '-')}: {v}px;")

    lines.extend(["", "  /* Radius */"])
    for k, v in t["radius"].items():
        if isinstance(v, dict):
            continue  # radius.squircle subtable handled in glass.css
        lines.append(f"  --ig-radius-{k}: {v}px;")
    # Squircle helper values
    sq = t["radius"].get("squircle", {})
    if sq.get("enabled"):
        lines.append(f"  --ig-squircle-n: {sq['superellipse_n']};")

    lines.extend(["", "  /* Blur */"])
    for k, v in t["blur"].items():
        lines.append(f"  --ig-blur-{k}: {v}px;")

    lines.extend(["", "  /* Opacity */"])
    for k, v in t["opacity"].items():
        lines.append(f"  --ig-opacity-{k.replace('_', '-')}: {v};")

    lines.extend(["", "  /* Shadow */"])
    for k, v in t["shadow"].items():
        lines.append(f"  --ig-shadow-{k.replace('_', '-')}: {v};")

    lines.extend(["", "  /* Type scale (pt) */"])
    for k, v in t["type"]["scale"].items():
        if isinstance(v, (int, float)) and k.endswith("_pt"):
            lines.append(f"  --ig-type-{k.replace('_pt', '').replace('_', '-')}-pt: {v}pt;")

    lines.extend(["", "  /* Type roles (pt) */"])
    for k, v in t["type"]["roles"].items():
        lines.append(f"  --ig-{k.replace('_pt', '').replace('_', '-')}-pt: {v}pt;")

    lines.extend(["", "  /* Line height */"])
    for k, v in t["type"]["line_height"].items():
        lines.append(f"  --ig-lh-{k}: {v};")

    lines.extend(["", "  /* Motion */"])
    for k, v in t["motion"]["duration_ms"].items():
        lines.append(f"  --ig-dur-{k}: {v}ms;")
    for k, v in t["motion"]["easing"].items():
        lines.append(f"  --ig-ease-{k}: {v};")
    # Semantic motion roles -> ready-to-use transition shorthand fragments.
    for role, (dur, ease) in t["motion"].get("roles", {}).items():
        rname = role.replace("_", "-")
        lines.append(
            f"  --ig-motion-{rname}: var(--ig-dur-{dur}) var(--ig-ease-{ease});"
        )

    # Accent-derivation helpers (relative color syntax, single-hue shifts)
    d = t["palette"].get("derive", {})
    if d:
        lines.extend(["", "  /* Accent lightness-shift deltas (for relative color) */"])
        for k, v in d.items():
            lines.append(f"  --ig-{k.replace('_', '-')}: {v};")

    lines.append("}")
    lines.append("")

    # Native oklch() upgrade - applies everywhere oklch() is supported.
    lines.extend([
        "/* OKLCH native colors (perceptually uniform). All current browsers",
        "   support oklch(); this overrides the hex fallback above. */",
        "@supports (color: oklch(0% 0 0)) {",
        "  :root {",
    ])
    for k, v in t["palette"]["oklch"].items():
        lines.append(f"    --ig-{k.replace('_', '-')}: {oklch_css(*v)};")
    lines.append("  }")
    lines.append("}")
    lines.append("")

    # P3 wide-gamut overlay (brand + semantic colors only)
    lines.extend([
        "/* Display-P3 wide-gamut overlay (more chroma on capable monitors) */",
        "@media (color-gamut: p3) {",
        "  :root {",
    ])
    for k in ("indigo", "indigo_hi", "violet", "amber", "positive", "negative"):
        lines.append(f"    --ig-{k.replace('_', '-')}: {pal[k]['p3']};")
    lines.append("  }")
    lines.append("}")
    lines.append("")

    # Reduced transparency a11y branch
    lines.extend([
        "/* Reduced transparency - disable backdrop blur + raise opacity */",
        "@media (prefers-reduced-transparency: reduce) {",
        "  :root {",
        "    --ig-blur-md: 0;",
        "    --ig-blur-lg: 0;",
        "    --ig-blur-xl: 0;",
        "    --ig-opacity-glass-panel: 1.0;",
        "    --ig-opacity-glass-panel-lo: 1.0;",
        "    --ig-opacity-glass-panel-hi: 1.0;",
        "  }",
        "}",
        "",
        "/* Reduced motion - kill durations */",
        "@media (prefers-reduced-motion: reduce) {",
        "  :root {",
        "    --ig-dur-quick: 0ms;",
        "    --ig-dur-default: 0ms;",
        "    --ig-dur-slow: 0ms;",
        "    --ig-dur-hero: 0ms;",
        "  }",
        "}",
        "",
    ])

    return "\n".join(lines)


def emit_scss_vars(t: dict) -> str:
    css = emit_css_vars(t)
    out = [
        "// Indigo Glass design tokens - Sass variables",
        "// Generated by tokens/codegen.py",
        "",
    ]
    seen = set()
    for line in css.split("\n"):
        s = line.strip()
        if s.startswith("--ig-") and ":" in s:
            k, v = s.split(":", 1)
            k = k.replace("--", "$").strip()
            v = v.rstrip(";").strip()
            if k in seen:  # oklch @supports re-declares; keep first (hex)
                continue
            seen.add(k)
            out.append(f"{k}: {v};")
    return "\n".join(out) + "\n"


def emit_json(t: dict) -> str:
    """Emit the raw tokens plus a derived flat palette for JS consumers."""
    out = dict(t)
    pal = derive_palette(t)
    out["_derived"] = {
        "palette": pal,
        "note": "hex/p3/oklch derived from [palette.oklch] by codegen.py",
    }
    return json.dumps(out, indent=2) + "\n"


def emit_kde_colors(t: dict) -> str:
    """KDE color scheme partial. Merge into IndigoGlass.colors.
    KDE cannot parse oklch() - uses derived RGB."""
    pal = derive_palette(t)
    p = {k: v["hex"] for k, v in pal.items()}

    lines = [
        "# Indigo Glass - KDE color scheme partial",
        "# Generated by tokens/codegen.py - merge into IndigoGlass.colors",
        "",
        "[General]",
        "Name=IndigoGlass",
        "shadeSortColumn=true",
        "",
        "[Colors:Window]",
        f"BackgroundNormal={hex_to_rgb(p['surface'])}",
        f"BackgroundAlternate={hex_to_rgb(p['surface_alt'])}",
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        f"ForegroundInactive={hex_to_rgb(p['text_muted'])}",
        f"ForegroundActive={hex_to_rgb(p['indigo_hi'])}",
        f"ForegroundLink={hex_to_rgb(p['indigo_hi'])}",
        f"ForegroundVisited={hex_to_rgb(p['violet'])}",
        f"ForegroundNegative={hex_to_rgb(p['negative'])}",
        f"ForegroundPositive={hex_to_rgb(p['positive'])}",
        f"ForegroundNeutral={hex_to_rgb(p['amber'])}",
        f"DecorationFocus={hex_to_rgb(p['indigo'])}",
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
        "",
        "[Colors:Selection]",
        f"BackgroundNormal={hex_to_rgb(p['indigo'])}",
        f"BackgroundAlternate={hex_to_rgb(p['indigo_hi'])}",
        "ForegroundNormal=255,255,255",
        f"ForegroundActive={hex_to_rgb(p['text'])}",
        "",
        "[Colors:View]",
        f"BackgroundNormal={hex_to_rgb(p['base'])}",
        f"BackgroundAlternate={hex_to_rgb(p['surface'])}",
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        f"ForegroundInactive={hex_to_rgb(p['text_muted'])}",
        f"ForegroundActive={hex_to_rgb(p['indigo_hi'])}",
        f"DecorationFocus={hex_to_rgb(p['indigo'])}",
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
        "",
        "[Colors:Button]",
        f"BackgroundNormal={hex_to_rgb(p['surface_alt'])}",
        f"BackgroundAlternate={hex_to_rgb(p['surface'])}",
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        f"DecorationFocus={hex_to_rgb(p['indigo_hi'])}",
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
        "",
        "[Colors:Tooltip]",
        f"BackgroundNormal={hex_to_rgb(p['surface_alt'])}",
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        "",
        "[WM]",
        f"activeBackground={hex_to_rgb(p['surface'])}",
        f"activeForeground={hex_to_rgb(p['text'])}",
        f"inactiveBackground={hex_to_rgb(p['sidebar'])}",
        f"inactiveForeground={hex_to_rgb(p['text_muted'])}",
        f"activeBlend={hex_to_rgb(p['indigo'])}",
        f"inactiveBlend={hex_to_rgb(p['text_dim'])}",
        "",
    ]
    return "\n".join(lines)


def emit_wt_scheme(t: dict) -> str:
    """Windows Terminal scheme. Uses derived hex (no oklch support)."""
    pal = derive_palette(t)
    p = {k: v["hex"] for k, v in pal.items()}
    scheme = {
        "name": "Indigo Glass",
        "background": p["base"],
        "foreground": p["text"],
        "cursorColor": p["indigo_hi"],
        "selectionBackground": p["indigo"],
        "black":         p["sidebar"],
        "red":           p["negative"],
        "green":         p["positive"],
        "yellow":        p["amber"],
        "blue":          p["indigo"],
        "purple":        p["violet"],
        "cyan":          "#67E8F9",
        "white":         p["text"],
        "brightBlack":   p["text_muted"],
        "brightRed":     "#FF5272",
        "brightGreen":   "#8CFFB4",
        "brightYellow":  "#FFD250",
        "brightBlue":    p["indigo_hi"],
        "brightPurple":  "#C8B5FF",
        "brightCyan":    "#A5F3FC",
        "brightWhite":   "#FFFFFF",
    }
    return json.dumps(scheme, indent=2) + "\n"


def emit_density_css(t: dict) -> str:
    s = t["spacing"]
    lines = [
        "/* Indigo Glass - compact density rules */",
        "/* Generated by tokens/codegen.py - see docs/DENSITY.md */",
        "",
        "/* Density is OPT-IN. Apps add `.ig-density-on` to <html> (or any",
        " * ancestor) to activate. Default rendering preserves site-native",
        " * padding so we don't collapse Facebook/Outlook/Discord layouts. */",
        "",
        ":root {",
        f"  --ig-density-button-pad-y: {s['button_pad_y']}px;",
        f"  --ig-density-button-pad-x: {s['button_pad_x']}px;",
        f"  --ig-density-input-pad-y: {s['input_pad_y']}px;",
        f"  --ig-density-input-pad-x: {s['input_pad_x']}px;",
        f"  --ig-density-list-row-pad-y: {s['list_row_pad_y']}px;",
        f"  --ig-density-list-row-pad-x: {s['list_row_pad_x']}px;",
        f"  --ig-density-list-row-gap: {s['list_row_gap']}px;",
        "}",
        "",
        "/* Opt-in compact rules - scoped to .ig-density-on */",
        ".ig-density-on button:not([class*=\"icon\"]):not([class*=\"Icon\"]),",
        ".ig-density-on [role=\"button\"]:not([class*=\"icon\"]):not([class*=\"Icon\"]) {",
        "  padding: var(--ig-density-button-pad-y) var(--ig-density-button-pad-x);",
        "}",
        "",
        ".ig-density-on input[type=\"text\"],",
        ".ig-density-on input[type=\"search\"],",
        ".ig-density-on input[type=\"email\"],",
        ".ig-density-on input[type=\"url\"],",
        ".ig-density-on input[type=\"password\"],",
        ".ig-density-on input[type=\"number\"],",
        ".ig-density-on input:not([type]),",
        ".ig-density-on select,",
        ".ig-density-on textarea {",
        "  padding: var(--ig-density-input-pad-y) var(--ig-density-input-pad-x);",
        "}",
        "",
    ]
    return "\n".join(lines)


def _noise_data_uri(opacity: float, base_freq: float, octaves: int) -> str:
    """Inline SVG fractal-noise tile as a CSS url()."""
    svg = (
        "%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E"
        "%3Cfilter id='ignoise'%3E"
        f"%3CfeTurbulence type='fractalNoise' baseFrequency='{base_freq}' "
        f"numOctaves='{octaves}' stitchTiles='stitch'/%3E"
        "%3C/filter%3E"
        f"%3Crect width='100%25' height='100%25' filter='url(%23ignoise)' "
        f"opacity='{opacity}'/%3E"
        "%3C/svg%3E"
    )
    return f"url(\"data:image/svg+xml,{svg}\")"


def emit_glass_css(t: dict) -> str:
    """Glass surface recipe + grain texture + squircle + ambient orbs.
    The single canonical implementation; layers @import or copy this."""
    g = t["glass"]
    grain = g.get("grain", {})
    sq = t["radius"].get("squircle", {})
    amb = t.get("ambient", {})
    pal = derive_palette(t)

    lines = [
        "/* Indigo Glass - glass / grain / squircle / ambient (v2) */",
        "/* Generated by tokens/codegen.py - DO NOT EDIT */",
        "",
        ":root {",
        f"  --ig-glass-bg: {g['backdrop_bg']};",
        f"  --ig-glass-tint: {g['backdrop_tint']};",
        f"  --ig-glass-border: {g['border']};",
        f"  --ig-glass-blur: {g['backdrop_blur']}px;",
    ]
    if grain.get("enabled"):
        lines.append(f"  --ig-grain-opacity: {grain['opacity']};")
        lines.append(f"  --ig-grain-tile: {grain['tile_px']}px;")
        lines.append(
            f"  --ig-grain-image: {_noise_data_uri(grain['opacity'], grain['base_frequency'], grain['num_octaves'])};"
        )
    lines.append("}")
    lines.append("")

    # Glass surface with grain on top of blur
    lines.extend([
        "/* Frosted glass surface - blur + indigo tint + grain micro-texture */",
        ".ig-glass {",
        "  position: relative;",
        "  background-color: var(--ig-glass-bg);",
        "  border: 1px solid var(--ig-glass-border);",
        "  border-radius: var(--ig-radius-lg);",
        "  backdrop-filter: blur(var(--ig-glass-blur)) saturate(110%);",
        "  -webkit-backdrop-filter: blur(var(--ig-glass-blur)) saturate(110%);",
        "  isolation: isolate;",
        "  overflow: hidden;",
        "  box-shadow: var(--ig-shadow-glass);",
        "}",
        "/* indigo tint film */",
        ".ig-glass::before {",
        "  content: \"\";",
        "  position: absolute;",
        "  inset: 0;",
        "  background: var(--ig-glass-tint);",
        "  pointer-events: none;",
        "  z-index: 0;",
        "}",
    ])
    if grain.get("enabled"):
        lines.extend([
            "/* grain micro-texture ON TOP of blur (Glassmorphism 2.0) */",
            ".ig-glass::after {",
            "  content: \"\";",
            "  position: absolute;",
            "  inset: 0;",
            "  background-image: var(--ig-grain-image);",
            "  background-size: var(--ig-grain-tile) var(--ig-grain-tile);",
            "  mix-blend-mode: overlay;",
            "  pointer-events: none;",
            "  z-index: 0;",
            "}",
        ])
    lines.extend([
        ".ig-glass > * { position: relative; z-index: 1; }",
        "",
    ])

    # Standalone grain utility (apply to any surface)
    if grain.get("enabled"):
        lines.extend([
            "/* Standalone grain overlay - add to any element */",
            ".ig-grain { position: relative; }",
            ".ig-grain::after {",
            "  content: \"\";",
            "  position: absolute;",
            "  inset: 0;",
            "  background-image: var(--ig-grain-image);",
            "  background-size: var(--ig-grain-tile) var(--ig-grain-tile);",
            "  mix-blend-mode: overlay;",
            "  pointer-events: none;",
            "}",
            "",
        ])

    # Squircle corners (progressive enhancement)
    if sq.get("enabled"):
        n = sq["superellipse_n"]
        lines.extend([
            "/* Squircle corners - Chromium 139+ via corner-shape; standard",
            "   border-radius is the cross-browser fallback. */",
            ".ig-squircle {",
            "  border-radius: var(--ig-radius-lg);",
            "}",
            "@supports (corner-shape: superellipse(2)) {",
            "  .ig-squircle {",
            f"    corner-shape: superellipse({n});",
            "    border-radius: var(--ig-radius-xl);",
            "  }",
            "}",
            "",
        ])

    # Ambient orbs - canonical light-source gradients
    if amb.get("enabled"):
        def orb(colorkey: str, opacity: float, x: int, y: int) -> str:
            hexc = pal[colorkey]["hex"]
            return (
                f"radial-gradient(circle at {x}% {y}%, "
                f"color-mix(in oklab, {hexc} {round(opacity*100)}%, transparent) 0%, "
                f"transparent 55%)"
            )
        orbs = []
        posmap = {
            "orb_primary": (amb["orb_primary"], amb["orb_primary_opacity"]),
            "orb_secondary": (amb["orb_secondary"], amb["orb_secondary_opacity"]),
            "orb_tertiary": (amb["orb_tertiary"], amb["orb_tertiary_opacity"]),
        }
        for pos in amb["positions"]:
            ckey, op = posmap[pos["color"]]
            orbs.append(orb(ckey, op, pos["x"], pos["y"]))
        joined = ",\n    ".join(orbs)
        lines.extend([
            "/* Ambient light-source orbs - 'lit glass'. Single-accent hues only. */",
            ".ig-ambient {",
            "  position: relative;",
            "  background-color: var(--ig-base);",
            "}",
            ".ig-ambient::before {",
            "  content: \"\";",
            "  position: absolute;",
            "  inset: -10%;",
            "  background-image:",
            f"    {joined};",
            f"  filter: blur({amb['feather_px']}px);",
            "  pointer-events: none;",
            "  z-index: 0;",
            "}",
            ".ig-ambient > * { position: relative; z-index: 1; }",
            "",
        ])

    # a11y branches
    lines.extend([
        "@media (prefers-reduced-transparency: reduce) {",
        "  .ig-glass {",
        "    backdrop-filter: none;",
        "    -webkit-backdrop-filter: none;",
        "    background-color: var(--ig-surface-alt);",
        "  }",
        "  .ig-glass::after, .ig-grain::after { display: none; }",
        "  .ig-ambient::before { display: none; }",
        "}",
        "",
    ])
    return "\n".join(lines)


def emit_kwin_blur(t: dict) -> str:
    """KWin kwin-effects-better-blur-dx snippet, sourced from blur + glass
    render tokens + radius. Merge into ~/.config/kwinrc. The desktop
    compositor expression of the glass + grain + squircle tokens:
      BlurStrength <- blur.md, NoiseStrength <- glass.render.noise_strength,
      CornerRadius <- radius.default, Brightness/Saturation/Contrast <- render."""
    blur = t["blur"]["md"]
    r = t["glass"]["render"]
    radius = t["radius"]["default"]
    lines = [
        "# Indigo Glass - KWin config snippets",
        "# Generated by tokens/codegen.py - DO NOT EDIT (edit tokens, regenerate)",
        "# Append/merge into your existing ~/.config/kwinrc",
        "# DO NOT replace the entire file - KWin has many other settings",
        "",
        "[org.kde.kdecoration2]",
        "library=org.kde.klassy",
        "theme=Klassy",
        "ButtonsOnLeft=XAM",
        "ButtonsOnRight=I",
        "BorderSize=None",
        "BorderSizeAuto=false",
        "",
        "[Plugins]",
        "blurEnabled=false",
        "better_blur_dxEnabled=true",
        "fadedesktopEnabled=true",
        "truely-maximizedEnabled=true",
        "kwin4_effect_shapecornersEnabled=false",
        "",
        "[Effect-better-blur-dx]",
        f"BlurStrength={blur}",
        f"NoiseStrength={r['noise_strength']}",
        f"Brightness={r['brightness']}",
        f"Saturation={r['saturation']}",
        f"Contrast={r['contrast']}",
        "BlurMatching=false",
        "BlurNonMatching=true",
        "BlurDecorations=true",
        "BlurMenus=true",
        "BlurDocks=true",
        "ForceContrastParams=true",
        f"CornerRadius={float(radius)}",
        "WindowClasses=",
        "",
        "[Windows]",
        "BorderlessMaximizedWindows=true",
        "",
    ]
    return "\n".join(lines)


def emit_klassy_radius(t: dict) -> str:
    """Klassy window-decoration corner-radius partial, sourced from
    radius.default so the titlebar rounding matches the better-blur-dx
    CornerRadius (glass clip == frame clip = correct visionOS behavior).
    Klassy is the desktop approximation of the squircle corner token;
    true superellipse corners are web/Chromium-only via corner-shape.
    Merge into ~/.config/klassyrc."""
    radius = t["radius"]["default"]
    lines = [
        "# Indigo Glass - Klassy corner-radius partial",
        "# Generated by tokens/codegen.py - merge into ~/.config/klassyrc [Windeco]",
        "# Matches Effect-better-blur-dx CornerRadius so the frosted-glass clip",
        "# and the window-decoration corner share one radius (no 2px mismatch).",
        "",
        "[Windeco]",
        f"WindowCornerRadius={radius}",
        "",
    ]
    return "\n".join(lines)


WRITERS = [
    ("css-vars.css", emit_css_vars),
    ("scss-vars.scss", emit_scss_vars),
    ("json-tokens.json", emit_json),
    ("kde-palette.colors", emit_kde_colors),
    ("wt-scheme.json", emit_wt_scheme),
    ("density.css", emit_density_css),
    ("glass.css", emit_glass_css),
    ("kwinrc-blur.ini", emit_kwin_blur),
    ("klassy-radius.ini", emit_klassy_radius),
]


def load_tokens() -> dict:
    with TOKENS_FILE.open("rb") as f:
        return tomllib.load(f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if any output is out of date")
    args = ap.parse_args()

    t = load_tokens()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    rc = 0
    for fname, fn in WRITERS:
        new = fn(t)
        target = OUT_DIR / fname
        if args.check:
            if not target.exists() or target.read_text() != new:
                print(f"OUT-OF-DATE: {target}")
                rc = 1
            continue
        target.write_text(new)
        print(f"wrote {target}")

    sys.exit(rc)


if __name__ == "__main__":
    main()
