#!/usr/bin/env python3
"""
Lime Glass - token codegen.

Reads tokens/indigo-glass.tokens.toml (OKLCH-authored, schema v3) and emits
derived per-layer artifacts. Each is written three ways: the active-variant
default (e.g. css-vars.css), plus one file per variant (css-vars.lime.css,
css-vars.indigo.css):

    tokens/out/css-vars[.variant].css    # CSS custom properties (web/Stylus)
    tokens/out/scss-vars[.variant].scss  # Sass equivalent
    tokens/out/json-tokens.json          # JSON (all variants; VSCode/web/JS)
    tokens/out/kde-palette[.variant].colors  # KDE color scheme partial
    tokens/out/wt-scheme[.variant].json  # Windows Terminal scheme partial
    tokens/out/glass[.variant].css       # Glass + grain + squircle + ambient
    tokens/out/density.css               # Compact-density CSS rules
    tokens/out/kwinrc-blur.ini           # KWin blur strength
    tokens/out/klassy-radius.ini         # Klassy corner radius

The palette source of truth is [variants.<name>] (OKLCH triples). The active
variant is [meta].default_variant. We derive byte-identical sRGB hex (for
KDE/GTK/GRUB/Windows, which cannot parse oklch()), display-p3, and native
oklch() CSS from those values - all in one place, no color drift.

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


def _relative_luminance(hex_color: str) -> float:
    """WCAG relative luminance of an sRGB hex color (0..1)."""
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))
    rl, gl, bl = (_srgb_to_linear(c) for c in (r, g, b))
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl


def contrast_ratio(fg_hex: str, bg_hex: str) -> float:
    """WCAG 2.x contrast ratio between two sRGB hex colors (1..21)."""
    l1 = _relative_luminance(fg_hex)
    l2 = _relative_luminance(bg_hex)
    lighter, darker = (l1, l2) if l1 >= l2 else (l2, l1)
    return (lighter + 0.05) / (darker + 0.05)


def readable_on(bg_hex: str, dark_hex: str, light_hex: str = "#FFFFFF") -> str:
    """Pick whichever of dark_hex / light_hex reads better on bg_hex.

    Prefers light text (the design default) when it clears WCAG AA (4.5:1);
    otherwise falls back to the dark option. On a light accent like lime
    (#A8E635) white fails at 1.50:1, so this returns the near-black base."""
    if contrast_ratio(light_hex, bg_hex) >= 4.5:
        return light_hex
    return dark_hex


# =============================================================================
# Variant resolution
# =============================================================================
# The token file carries multiple [variants.<name>] palettes. A variant uses
# generic brand keys (accent / accent_hi / accent_alt); every consumer (CSS,
# KDE, WT) historically referenced indigo / indigo_hi / violet. We alias the
# brand triple to BOTH name sets so old emitters keep working unchanged and
# the output var names stay stable regardless of which variant is active.

_BRAND_ALIAS = {  # variant key -> legacy palette keys it also populates
    "accent": ["indigo", "lime"],
    "accent_hi": ["indigo_hi", "lime_hi"],
    "accent_alt": ["violet", "lime_alt"],
}
_PALETTE_KEYS = [
    "base", "surface", "surface_alt", "sidebar",
    "accent", "accent_hi", "accent_alt",
    "amber", "positive", "negative",
    "text", "text_muted", "text_dim",
]


def resolve_variant(t: dict, name: str) -> dict:
    """Build the legacy [palette.oklch]-shaped {key: [L,C,H]} dict for one
    variant, expanding brand aliases so indigo*/lime*/violet keys all exist."""
    v = t["variants"][name]
    out: dict[str, list] = {}
    for k in _PALETTE_KEYS:
        lch = v[k]
        out[k] = lch
        if k in _BRAND_ALIAS:
            for alias in _BRAND_ALIAS[k]:
                out[alias] = lch
    return out


def active_variant(t: dict) -> str:
    return t["meta"].get("default_variant", "indigo")


# =============================================================================
# Derive a flat palette (hex / p3 / oklch) from a resolved variant + [palette.alpha]
# =============================================================================

def derive_palette(t: dict, variant: str | None = None) -> dict:
    """Returns {key: {'hex','p3','oklch'}} plus alpha-derived entries.
    `variant` defaults to meta.default_variant."""
    variant = variant or active_variant(t)
    oklch = resolve_variant(t, variant)
    pal: dict[str, dict] = {}
    for key, (L, C, H) in oklch.items():
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

def emit_css_vars(t: dict, variant: str | None = None) -> str:
    variant = variant or active_variant(t)
    pal = derive_palette(t, variant)
    lines = [
        f"/* {t['meta']['name']} design tokens - CSS custom properties */",
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
    # accent_glow{,_lg} are derived from the active accent so the focus-glow
    # matches the variant instead of shipping a hardcoded indigo rgba. The
    # legacy --ig-shadow-indigo-glow{,-lg} names are emitted as aliases for
    # back-compat (mirrors _BRAND_ALIAS behaviour for the accent triple).
    accent_rgb = hex_to_rgb(pal["accent"]["hex"])
    accent_glow = f"0 0 0 2px rgba({accent_rgb},0.30)"
    accent_glow_lg = f"0 0 24px rgba({accent_rgb},0.40)"
    # ink_accent: the hazard-coloured ink shadow (Sage Ink v4) - same idea as
    # accent_glow above, but a hard offset instead of a glow. Uses accent_alt
    # (the darker/active step) so the shadow reads as a distinct plane behind
    # the fill color, not a duplicate of it.
    ink_accent = f"4px 4px 0 0 {pal['accent_alt']['hex']}"
    for k, v in t["shadow"].items():
        if k == "accent_glow":
            v = accent_glow
        elif k == "accent_glow_lg":
            v = accent_glow_lg
        elif k == "ink_accent":
            v = ink_accent
        lines.append(f"  --ig-shadow-{k.replace('_', '-')}: {v};")
    # Legacy aliases (kept so consumers referencing indigo-glow keep working).
    lines.append(f"  --ig-shadow-indigo-glow: {accent_glow};")
    lines.append(f"  --ig-shadow-indigo-glow-lg: {accent_glow_lg};")

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
    for k, v in resolve_variant(t, variant).items():
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
    # Semantic accent names + their legacy brand aliases both get the P3
    # upgrade so no consumer is left on the sRGB-clipped value.
    p3_keys = ("accent", "accent_hi", "accent_alt", "indigo", "indigo_hi",
               "violet", "amber", "positive", "negative")
    for k in p3_keys:
        if k in pal:
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


def emit_scss_vars(t: dict, variant: str | None = None) -> str:
    css = emit_css_vars(t, variant or active_variant(t))
    out = [
        f"// {t['meta']['name']} design tokens - Sass variables",
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
    """Emit the raw tokens plus derived flat palettes (per variant) for JS."""
    out = dict(t)
    out["_derived"] = {
        "default_variant": active_variant(t),
        "palettes": {v: derive_palette(t, v) for v in t["variants"]},
        "note": "hex/p3/oklch derived from [variants.*] by codegen.py",
    }
    return json.dumps(out, indent=2) + "\n"


def emit_kde_colors(t: dict, variant: str | None = None) -> str:
    """KDE color scheme partial. Merge into the .colors scheme.
    KDE cannot parse oklch() - uses derived RGB."""
    pal = derive_palette(t, variant or active_variant(t))
    p = {k: v["hex"] for k, v in pal.items()}

    vname = t["variants"][variant or active_variant(t)]["name"]
    scheme_id = vname.replace(" ", "")  # e.g. "LimeGlass"
    lines = [
        f"# {vname} - KDE color scheme partial",
        f"# Generated by tokens/codegen.py - merge into {scheme_id}.colors",
        "",
        "[General]",
        f"Name={scheme_id}",
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
        # Foreground picked by WCAG contrast against the selection accent:
        # white on a dark accent (indigo), near-black on a light one (lime).
        f"ForegroundNormal={hex_to_rgb(readable_on(p['indigo'], p['base']))}",
        f"ForegroundActive={hex_to_rgb(readable_on(p['indigo'], p['base']))}",
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


def emit_wt_scheme(t: dict, variant: str | None = None) -> str:
    """Windows Terminal scheme. Uses derived hex (no oklch support)."""
    variant = variant or active_variant(t)
    pal = derive_palette(t, variant)
    p = {k: v["hex"] for k, v in pal.items()}
    scheme = {
        "name": t["variants"][variant]["name"],
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
        f"/* {t['meta']['name']} - compact density rules */",
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


def emit_glass_css(t: dict, variant: str | None = None) -> str:
    """Glass surface recipe + grain texture + squircle + ambient orbs.
    The single canonical implementation; layers @import or copy this."""
    variant = variant or active_variant(t)
    g = t["glass"]
    grain = g.get("grain", {})
    sq = t["radius"].get("squircle", {})
    amb = t.get("ambient", {})
    pal = derive_palette(t, variant)
    vname = t["variants"][variant]["name"]

    # Glass tint/bg derived from the active variant: accent @ tint_alpha,
    # surface_alt @ bg_alpha. Also emit the alpha values as SEPARATE runtime
    # vars so users can override glass thickness live (Apple iOS 27 pattern:
    # a slider between "clearer glass" and "more tinted glass" instead of a
    # hardcoded default). --ig-glass-tint and --ig-glass-bg remain as ready-
    # to-use rgba; --ig-glass-*-alpha are user-overridable knobs.
    accent_hex = pal["accent"]["hex"]
    surf_alt_hex = pal["surface_alt"]["hex"]
    glass_tint = rgba_hex(accent_hex, g["tint_alpha"])
    glass_bg = rgba_hex(surf_alt_hex, g["bg_alpha"])

    lines = [
        f"/* {vname} - glass / grain / squircle / ambient (v3) */",
        "/* Generated by tokens/codegen.py - DO NOT EDIT */",
        "",
        ":root {",
        f"  --ig-glass-bg: {glass_bg};",
        f"  --ig-glass-tint: {glass_tint};",
        f"  --ig-glass-border: {g['border']};",
        f"  --ig-glass-blur: {g['backdrop_blur']}px;",
        f"  /* Runtime knobs (Apple iOS 27 clarity/tint pattern) - override to taste */",
        f"  --ig-glass-tint-alpha: {g['tint_alpha']};",
        f"  --ig-glass-bg-alpha: {g['bg_alpha']};",
        f"  --ig-glass-accent-rgb: {int(accent_hex[1:3],16)}, {int(accent_hex[3:5],16)}, {int(accent_hex[5:7],16)};",
        f"  --ig-glass-surface-rgb: {int(surf_alt_hex[1:3],16)}, {int(surf_alt_hex[3:5],16)}, {int(surf_alt_hex[5:7],16)};",
    ]
    if grain.get("enabled"):
        lines.append(f"  --ig-grain-opacity: {grain['opacity']};")
        lines.append(f"  --ig-grain-tile: {grain['tile_px']}px;")
        lines.append(
            f"  --ig-grain-image: {_noise_data_uri(grain['opacity'], grain['base_frequency'], grain['num_octaves'])};"
        )
    lines.append("}")
    lines.append("")

    # Glass surface with grain on top of blur.
    # The tint uses rgba(var(--ig-glass-accent-rgb), var(--ig-glass-tint-alpha))
    # so setting :root { --ig-glass-tint-alpha: 0.10 } live re-tints without
    # any recompilation - the Apple iOS 27 "clearer <-> tinted" slider pattern.
    lines.extend([
        "/* Frosted glass surface - blur + accent tint + grain micro-texture */",
        ".ig-glass {",
        "  position: relative;",
        "  background-color: rgba(var(--ig-glass-surface-rgb), var(--ig-glass-bg-alpha));",
        "  border: 1px solid var(--ig-glass-border);",
        "  border-radius: var(--ig-radius-lg);",
        "  backdrop-filter: blur(var(--ig-glass-blur)) saturate(110%);",
        "  -webkit-backdrop-filter: blur(var(--ig-glass-blur)) saturate(110%);",
        "  isolation: isolate;",
        "  overflow: hidden;",
        "  box-shadow: var(--ig-shadow-glass);",
        "}",
        "/* accent tint film (runtime-adjustable via --ig-glass-tint-alpha) */",
        ".ig-glass::before {",
        "  content: \"\";",
        "  position: absolute;",
        "  inset: 0;",
        "  background: rgba(var(--ig-glass-accent-rgb), var(--ig-glass-tint-alpha));",
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

    # Squircle corners (progressive enhancement).
    # Apple iOS 27 changed sidebar corner radii ONLY - not every element.
    # Rule of thumb: apply squircle at HIERARCHY BOUNDARIES (sidebar, chat panel,
    # dialog, popover) - NOT inline (tabs, buttons, chips inside a container).
    # `.ig-squircle`           - general utility (any element)
    # `.ig-squircle-container` - the recommended scope: outer container edges
    if sq.get("enabled"):
        n = sq["superellipse_n"]
        lines.extend([
            "/* Squircle corners - Chromium 139+ via corner-shape; standard",
            "   border-radius is the cross-browser fallback.",
            "   Prefer .ig-squircle-container for container edges (sidebar/chat/",
            "   dialog); use .ig-squircle only for standalone shapes. */",
            ".ig-squircle,",
            ".ig-squircle-container {",
            "  border-radius: var(--ig-radius-lg);",
            "}",
            "@supports (corner-shape: superellipse(2)) {",
            "  .ig-squircle,",
            "  .ig-squircle-container {",
            f"    corner-shape: superellipse({n});",
            "    border-radius: var(--ig-radius-xl);",
            "  }",
            "  /* Inline children inside a squircle-container should NOT also be",
            "     squircled (creates a nested-radius artefact). */",
            "  .ig-squircle-container :is(button, .tab, .chip, .badge) {",
            "    corner-shape: normal;",
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

    # A11y branches — TWO signals:
    # 1. `prefers-reduced-transparency` (OS-level) — user set it in KDE/GNOME/macOS
    # 2. `[data-reduce-bright]` (app-level) — user toggled it in-app
    #    (Apple iOS 26.4 added exactly this: a separate 'Reduce Bright Effects'
    #    toggle SEPARATE from Reduce Transparency, because glossy accent glows
    #    can be uncomfortable in sunlight even when transparency is fine.)
    # Both should kill grain + ambient orbs and mute accent glow effects.
    lines.extend([
        "/* Reduce transparency — OS-level a11y setting */",
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
        "/* Reduce Bright Effects — app-level toggle (Apple iOS 26.4 pattern).",
        "   Add data-reduce-bright to <html>, or use the `prefers-reduced-motion`",
        "   heuristic as a proxy for users likely to also want dimmer effects. */",
        "[data-reduce-bright] .ig-ambient::before,",
        "[data-reduce-bright] .ig-glass::after,",
        "[data-reduce-bright] .ig-grain::after {",
        "  display: none;",
        "}",
        "[data-reduce-bright] {",
        "  --ig-glass-tint-alpha: 0;              /* kill accent tint on glass */",
        "  --ig-shadow-accent-glow: none;         /* no accent focus-glow */",
        "  --ig-shadow-accent-glow-lg: none;",
        "  --ig-shadow-indigo-glow: none;         /* legacy alias */",
        "  --ig-shadow-indigo-glow-lg: none;",
        "}",
        "",
    ])
    return "\n".join(lines)


def emit_kwin_blur(t: dict) -> str:
    """KWin kwin-effects-better-blur-dx snippet, sourced from blur + glass
    render tokens + radius. Merge into ~/.config/kwinrc.
    Sage Ink v4: blur.md is 0 (vestigial - see [blur] in the tokens file),
    so this now emits a snippet that DISABLES the effect rather than tuning
    it. Whether to actually apply that (and retire the resume watchdog) is
    an open decision - this function just reflects the token, it doesn't
    make that call. The desktop compositor expression of the tokens:
      BlurStrength <- blur.md, NoiseStrength <- glass.render.noise_strength,
      CornerRadius <- radius.default, Brightness/Saturation/Contrast <- render."""
    blur = t["blur"]["md"]
    r = t["glass"]["render"]
    radius = t["radius"]["default"]
    lines = [
        f"# {t['meta']['name']} - KWin config snippets",
        "# Generated by tokens/codegen.py - DO NOT EDIT (edit tokens, regenerate)",
        "# Append/merge into your existing ~/.config/kwinrc",
        "# DO NOT replace the entire file - KWin has many other settings",
        "",
        "[org.kde.kdecoration2]",
        "library=org.kde.klassy",
        "theme=Klassy",
        # macOS-style titlebar controls: Close, mInimize, mAximize on the LEFT
        # (Klassy button codes: X=close, I=minimize, A=maximize, M=app menu).
        # Menu button on the right keeps it available without cluttering left.
        "ButtonsOnLeft=XIA",
        "ButtonsOnRight=M",
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
        # Brightness/Saturation/Contrast are only applied when ForceContrastParams
        # is true. Historically we set them to canonical values AND set force=true,
        # which darkened blurred content (Brightness=96 -> 96% luma on blur pass);
        # combined with 12-15% window translucency this rendered as solid-black
        # blur regions on real hardware after a fresh boot. Emit force=false and
        # neutral 100/100/100 so the blur pass stays photometric-neutral. The
        # canonical brightness/saturation values remain in [glass.render] for the
        # BROWSER (Dark Reader) which honours them independently.
        f"Brightness={100 if not r.get('force_contrast_params', False) else r['brightness']}",
        f"Saturation={100 if not r.get('force_contrast_params', False) else r['saturation']}",
        f"Contrast={100 if not r.get('force_contrast_params', False) else r['contrast']}",
        "BlurMatching=false",
        "BlurNonMatching=true",
        "BlurDecorations=true",
        "BlurMenus=true",
        "BlurDocks=true",
        f"ForceContrastParams={'true' if r.get('force_contrast_params', False) else 'false'}",
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
    radius.default. Sage Ink v4: radius.default is 0 (sharp ink corner, not
    a glass-clip match) - the "share one radius with the blur clip" rationale
    is v3 history now that there's no blur clip to match. Kept sourcing from
    the same token because a single corner-radius source of truth is still
    correct, just for a different reason (consistency, not glass geometry).
    Merge into ~/.config/klassyrc."""
    radius = t["radius"]["default"]
    lines = [
        f"# {t['meta']['name']} - Klassy corner-radius partial",
        "# Generated by tokens/codegen.py - merge into ~/.config/klassyrc [Windeco]",
        "# Sourced from radius.default - single source of truth for window corners.",
        "",
        "[Windeco]",
        f"WindowCornerRadius={radius}",
        "",
    ]
    return "\n".join(lines)


# Per-variant emitters: emitted once per variant. Canonical filename (no
# variant suffix) = the default variant, for back-compat with consumers that
# read e.g. tokens/out/css-vars.css. Plus a <stem>.<variant>.<ext> for each.
VARIANT_WRITERS = [
    ("css-vars.css", emit_css_vars),
    ("scss-vars.scss", emit_scss_vars),
    ("kde-palette.colors", emit_kde_colors),
    ("wt-scheme.json", emit_wt_scheme),
    ("glass.css", emit_glass_css),
]

# Shared emitters: variant-agnostic, emitted once at the canonical name.
SHARED_WRITERS = [
    ("json-tokens.json", emit_json),
    ("density.css", emit_density_css),
    ("kwinrc-blur.ini", emit_kwin_blur),
    ("klassy-radius.ini", emit_klassy_radius),
]


def _variant_filename(stem_ext: str, variant: str) -> str:
    stem, _, ext = stem_ext.rpartition(".")
    return f"{stem}.{variant}.{ext}"


def build_outputs(t: dict) -> dict[str, str]:
    """Returns {filename: content} for every artifact (default + per-variant)."""
    variants = list(t["variants"].keys())
    default = active_variant(t)
    out: dict[str, str] = {}
    for fname, fn in VARIANT_WRITERS:
        for v in variants:
            out[_variant_filename(fname, v)] = fn(t, v)
        out[fname] = fn(t, default)  # canonical = default variant
    for fname, fn in SHARED_WRITERS:
        out[fname] = fn(t)
    return out


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
    for fname, new in build_outputs(t).items():
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
