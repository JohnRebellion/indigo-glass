#!/usr/bin/env python3
"""
Sage Ink - token codegen.

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

# Deployables that ship FULLY generated - no hand-merge step, no partial.
# Written from the exact same build_outputs() content as tokens/out/*, so
# there is exactly one code path producing each byte. Added 2026-09-01 after
# a cross-model audit found 20 stale hand-typed occurrences of a value that
# had already changed in tokens.toml and in every tokens/out/* artefact -
# the two-step "generate a partial, hand-merge the rest" workflow was the
# root cause, not a scanning gap. See emit_kde_colors' docstring.
SHIPPED_KDE_SCHEMES = {
    "sage": [
        REPO_ROOT / "share" / "color-schemes" / "SageInk.colors",
        # Same 12-section schema, confirmed value-identical to the file
        # above before this was wired (2026-09-01) - a second copy living
        # inside the plasma-theme package, sage-locked by its own directory
        # name (not a user-selectable option like share/color-schemes/*).
        # Documented as "live-deployed" and independently hand-patched once
        # already (docs/OUTLINE-SWEEP-2026-08-30.md) - a second instance of
        # exactly the bug class this generation path exists to remove.
        REPO_ROOT / "config" / "plasma-theme" / "SageInk" / "colors",
    ],
    "indigo": [REPO_ROOT / "share" / "color-schemes" / "IndigoGlass.colors"],
}
# Legacy filename (repo predates the sage rename) - ships the ACTIVE variant,
# not "indigo". install.ps1 logs "Injected Sage Ink scheme" and the file's
# own "name" field says "Sage Ink", not "Indigo Glass".
SHIPPED_WT_SCHEME = REPO_ROOT / "windows" / "terminal" / "indigo-glass.scheme.json"


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


def _composite_hex(fg_hex: str, alpha: float, bg_hex: str) -> str:
    """Alpha-composite fg_hex over bg_hex at `alpha`, returning an OPAQUE
    #RRGGBB. Used for tokens that used to ship as translucent RGBA "glass
    edge" values - Sage Ink has no glass, so any alpha-derived divider must
    resolve to a real solid color before it reaches a layer config, instead
    of shipping the alpha channel itself. See [palette.composite]."""
    fg = [int(fg_hex.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4)]
    bg = [int(bg_hex.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4)]
    out = [round(b + (f - b) * alpha) for f, b in zip(fg, bg)]
    return "#" + "".join(f"{c:02X}" for c in out)


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
    # Alpha entries: base can be a palette key or a literal hex. True alpha -
    # the result genuinely needs a translucent channel (a modal scrim).
    for key, (base, alpha) in t["palette"]["alpha"].items():
        base_hex = pal[base]["hex"] if base in pal else base
        h = rgba_hex(base_hex, alpha)
        pal[key] = {"hex": h, "p3": h, "oklch": h}  # alpha not gamut-mapped
    # Composite entries: [fg, alpha, bg_key] resolved to an OPAQUE hex at
    # emit time - see [palette.composite] and _composite_hex above.
    for key, (fg, alpha, bg_key) in t["palette"].get("composite", {}).items():
        fg_hex = pal[fg]["hex"] if fg in pal else fg
        bg_hex = pal[bg_key]["hex"]
        h = _composite_hex(fg_hex, alpha, bg_hex)
        pal[key] = {"hex": h, "p3": h, "oklch": h}
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

    lines.extend(["", "  /* Border */"])
    for k, v in t["border"].items():
        lines.append(f"  --ig-border-{k.replace('_', '-')}: {v}px;")

    lines.extend(["", "  /* Radius */"])
    for k, v in t["radius"].items():
        if isinstance(v, dict):
            continue  # radius.squircle subtable handled in glass.css
        lines.append(f"  --ig-radius-{k}: {v}px;")
    # Squircle helper values
    sq = t["radius"].get("squircle", {})
    if sq.get("enabled"):
        lines.append(f"  --ig-squircle-n: {sq['superellipse_n']};")

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
    # Reverted to 4px (2026-08-28, same day as the doubling): this token
    # feeds CSS/web output, which renders on arbitrary screens, not the
    # 27in 1440p monitor the doubling was justified for. See [shadow] in the
    # tokens file for the full note; the native Klassy shadow stays doubled.
    ink_accent = f"4px 4px 0 0 {pal['accent_alt']['hex']}"
    # ink/ink_lg/ink_press: same accent_alt-derived colour as ink_accent, per
    # user request (sage shadow instead of black, so it reads clearly against
    # a dark foreground instead of vanishing into it). Same doc-placeholder
    # pattern as ink_accent - toml keeps a literal hex only as a fallback
    # comment, actual value always comes from the active variant here.
    ink = f"4px 4px 0 0 {pal['accent_alt']['hex']}"
    ink_lg = f"7px 7px 0 0 {pal['accent_alt']['hex']}"
    ink_press = f"0 0 0 0 {pal['accent_alt']['hex']}"
    for k, v in t["shadow"].items():
        if k == "accent_glow":
            v = accent_glow
        elif k == "accent_glow_lg":
            v = accent_glow_lg
        elif k == "ink_accent":
            v = ink_accent
        elif k == "ink":
            v = ink
        elif k == "ink_lg":
            v = ink_lg
        elif k == "ink_press":
            v = ink_press
        lines.append(f"  --ig-shadow-{k.replace('_', '-')}: {v};")
    # On-light constants: the reference's own black border/shadow, correct
    # only where the backdrop (and, for the border, the fill too) is light.
    # Emitted verbatim - unlike ink/ink_lg above these are NOT variant-derived,
    # because black is black regardless of which accent is active.
    for k, v in t.get("on_light", {}).items():
        lines.append(f"  --ig-on-light-{k.replace('_', '-')}: {v};")

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

    lines.extend(["", "  /* Font weight */"])
    for k, v in t["type"]["weight"].items():
        lines.append(f"  --ig-weight-{k}: {v};")

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

    # No prefers-reduced-transparency branch is emitted any more (v5).
    # It existed to flatten glass for users who ask for less transparency.
    # Ink is already opaque for everyone, so the branch had nothing left to
    # do but redefine deleted vars - and its mere presence had become a trap:
    # three shipped themes kept their glass in the DEFAULT state and relied on
    # this media query as the "opaque version", i.e. correct rendering was
    # gated behind an accessibility preference. Opacity is unconditional now.
    lines.extend([
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


# KDE decoration-effect settings. Not palette data - these three sections
# never varied by variant (verified 2026-09-01: byte-identical across the
# sage and indigo shipped files before this function generated them) - so
# they're fixed constants here rather than invented TOML tokens for values
# that were never meant to vary.
_KDE_INVARIANT_SECTIONS = """
[ColorEffects:Disabled]
Color=56,56,56
ColorAmount=0
ColorEffect=0
ContrastAmount=0.65
ContrastEffect=1
IntensityAmount=0.1
IntensityEffect=2

[ColorEffects:Inactive]
ChangeSelectionColor=true
Color=112,111,110
ColorAmount=0.025
ColorEffect=2
ContrastAmount=0.1
ContrastEffect=2
Enable=false
IntensityAmount=0
IntensityEffect=0

[KDE]
contrast=4
frameContrast=0.2
""".strip("\n")


def emit_kde_colors(t: dict, variant: str | None = None) -> str:
    """Complete, installable KDE colour scheme - not a partial. Previously
    emitted only [General]/[Colors:Window]/[Colors:Selection]/[Colors:View]/
    [Colors:Button]/[Colors:Tooltip]/[WM] and relied on share/color-schemes/*
    to hand-merge the rest ([Colors:Complementary], [Colors:Header],
    [ColorEffects:*], [KDE]) - which is exactly the drift class a 2026-09-01
    cross-model audit found live (20 stale occurrences of a since-changed
    `positive` value, and IndigoGlass.colors frozen at its initial-release
    commit, missing a whole later accessibility fix). This now emits every
    section install.sh deploys, so share/color-schemes/*.colors becomes a
    build artefact (see build_outputs' SHIPPED_KDE_SCHEMES) instead of a
    hand-maintained file with a comment asking someone to keep it in sync.

    KDE cannot parse oklch() - uses derived RGB throughout.
    """
    pal = derive_palette(t, variant or active_variant(t))
    p = {k: v["hex"] for k, v in pal.items()}

    vname = t["variants"][variant or active_variant(t)]["name"]
    scheme_id = vname.replace(" ", "")  # e.g. "SageInk"

    # [Colors:Complementary] and [Colors:Header] are identical to each other
    # and distinct from [Colors:Window]/[Colors:View] in exactly one way,
    # confirmed against BOTH shipped variants before encoding this: they use
    # the same accent (accent_alt / p['violet']) for ForegroundLink AND
    # ForegroundVisited, where Window/View distinguish the two
    # (accent_hi for Link, accent_alt for Visited). DecorationFocus is
    # neutral (p['text']), matching the post-outline-sweep intent Window
    # already carries - IndigoGlass.colors had NOT been brought forward to
    # this fix in either section before this function started generating it.
    complementary_header = "\n".join([
        f"BackgroundAlternate={hex_to_rgb(p['surface'])}",
        f"BackgroundNormal={hex_to_rgb(p['base'])}",
        f"DecorationFocus={hex_to_rgb(p['text'])}",
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
        f"ForegroundActive={hex_to_rgb(p['indigo_hi'])}",
        f"ForegroundInactive={hex_to_rgb(p['text_muted'])}",
        f"ForegroundLink={hex_to_rgb(p['violet'])}",
        f"ForegroundNegative={hex_to_rgb(p['negative'])}",
        f"ForegroundNeutral={hex_to_rgb(p['amber'])}",
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        f"ForegroundPositive={hex_to_rgb(p['positive'])}",
        f"ForegroundVisited={hex_to_rgb(p['violet'])}",
    ])

    # Foreground{Negative,Neutral,Positive} are the semantic error/warning/
    # success colours - confirmed identical (mapped straight from
    # negative/amber/positive) in EVERY section of BOTH shipped variants
    # before this pass, so safe to derive everywhere.
    semantic_negative_neutral_positive = "\n".join([
        f"ForegroundNegative={hex_to_rgb(p['negative'])}",
        f"ForegroundNeutral={hex_to_rgb(p['amber'])}",
        f"ForegroundPositive={hex_to_rgb(p['positive'])}",
    ])

    # ForegroundVisited=130,153,255 (Button, Tooltip) and =189,195,199
    # (Selection) do not correspond to ANY current semantic token - checked
    # against accent/accent_hi/accent_alt/text/text_muted/negative/amber/
    # positive for both shipped variants (2026-09-01). Both are byte-
    # identical across sage AND indigo despite every other accent-derived
    # value differing between them, which is the signature of an
    # uncustomized default inherited from whatever base KDE scheme this was
    # originally exported from, not a deliberate design choice under this
    # token system. Preserved as literals rather than invented a mapping -
    # changing what a value like this SHOULD be is a design decision, not a
    # drift fix, and out of scope here.
    _VISITED_UNMAPPED_LINK = "130,153,255"
    _VISITED_UNMAPPED_SELECTION = "189,195,199"

    # Window's accent_hi/accent_alt split for Link/Visited was cross-checked
    # against every OTHER section in both variants (2026-09-01): sage is
    # consistent everywhere (Window+View -> accent_hi, Button+Tooltip ->
    # accent_alt); indigo's View was the ONE section that broke its own
    # pattern (accent_alt where Window/Button/Tooltip all use accent_hi).
    # Standardised on Window's mapping - the section parity has already
    # verified as correct - since indigo's View is already established as
    # the stale/frozen file in this codebase (see the DecorationFocus and
    # ForegroundPositive fixes above), not a deliberately-forked design.

    lines = [
        f"# {vname} - KDE color scheme",
        f"# Generated in full by tokens/codegen.py - do not hand-edit.",
        "",
        "[General]",
        f"ColorScheme={scheme_id}",
        f"Name={vname}",
        "shadeSortColumn=true",
        "",
        "[Colors:Button]",
        f"BackgroundNormal={hex_to_rgb(p['surface_alt'])}",
        f"BackgroundAlternate={hex_to_rgb(p['surface'])}",
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        f"ForegroundInactive={hex_to_rgb(p['text_muted'])}",
        f"ForegroundActive={hex_to_rgb(p['indigo_hi'])}",
        f"ForegroundLink={hex_to_rgb(p['violet'])}",
        f"ForegroundVisited={_VISITED_UNMAPPED_LINK}",
        semantic_negative_neutral_positive,
        f"DecorationFocus={hex_to_rgb(p['text'])}",  # white(ish), not accent - a focus outline on a near-black surface needs a neutral that contrasts, matching --ring: white in the reference's dark mode
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
        "",
        "[Colors:Complementary]",
        complementary_header,
        "",
        "[Colors:Header]",
        complementary_header,
        "",
        "[Colors:Selection]",
        f"BackgroundNormal={hex_to_rgb(p['indigo'])}",
        f"BackgroundAlternate={hex_to_rgb(p['indigo_hi'])}",
        # Foreground picked by WCAG contrast against the selection accent:
        # white on a dark accent (indigo), near-black on a light one (lime).
        f"ForegroundNormal={hex_to_rgb(readable_on(p['indigo'], p['base']))}",
        f"ForegroundActive={hex_to_rgb(readable_on(p['indigo'], p['base']))}",
        f"ForegroundInactive={hex_to_rgb(p['text_muted'])}",
        f"ForegroundLink={hex_to_rgb(p['violet'])}",
        f"ForegroundVisited={_VISITED_UNMAPPED_SELECTION}",
        semantic_negative_neutral_positive,
        f"DecorationFocus={hex_to_rgb(p['text'])}",  # white(ish), not accent - see the Colors:Window note above
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
        "",
        "[Colors:Tooltip]",
        f"BackgroundNormal={hex_to_rgb(p['surface_alt'])}",
        f"BackgroundAlternate={hex_to_rgb(p['surface'])}",
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        f"ForegroundInactive={hex_to_rgb(p['text_muted'])}",
        f"ForegroundActive={hex_to_rgb(p['indigo_hi'])}",
        f"ForegroundLink={hex_to_rgb(p['violet'])}",
        f"ForegroundVisited={_VISITED_UNMAPPED_LINK}",
        semantic_negative_neutral_positive,
        f"DecorationFocus={hex_to_rgb(p['text'])}",  # white(ish), not accent - see the Colors:Window note above
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
        "",
        "[Colors:View]",
        f"BackgroundNormal={hex_to_rgb(p['base'])}",
        f"BackgroundAlternate={hex_to_rgb(p['surface'])}",
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        f"ForegroundInactive={hex_to_rgb(p['text_muted'])}",
        f"ForegroundActive={hex_to_rgb(p['indigo_hi'])}",
        f"ForegroundLink={hex_to_rgb(p['indigo_hi'])}",  # standardised on Window's mapping - see note above
        f"ForegroundVisited={hex_to_rgb(p['violet'])}",
        semantic_negative_neutral_positive,
        f"DecorationFocus={hex_to_rgb(p['text'])}",  # white(ish), not accent - see the Colors:Window note above
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
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
        f"DecorationFocus={hex_to_rgb(p['text'])}",  # white(ish), not accent - see the Colors:Window note above
        f"DecorationHover={hex_to_rgb(p['indigo_hi'])}",
        "",
        _KDE_INVARIANT_SECTIONS,
        "",
        "[WM]",
        f"activeBackground={hex_to_rgb(p['surface'])}",
        f"activeForeground={hex_to_rgb(p['text'])}",
        f"inactiveBackground={hex_to_rgb(p['sidebar'])}",
        f"inactiveForeground={hex_to_rgb(p['text_muted'])}",
        f"activeBlend={hex_to_rgb(p['indigo'])}",
        f"inactiveBlend={hex_to_rgb(p['text_dim'])}",
        # Titlebar font - byte-identical across both shipped variants, so a
        # genuine invariant, not palette data. Dropped entirely by an
        # earlier version of this function (2026-09-01) before the omission
        # was caught by diffing against the pre-generation file - see
        # SHIPPED_KDE_SCHEMES.
        "activeFont=SF Pro Display,10,-1,5,400,0,0,0,0,0,0,0,0,0,0,1",
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


def emit_kwin_blur(t: dict) -> str:
    """KWin compositor snippet. Merge into ~/.config/kwinrc.

    Sage Ink v5 (2026-08-28): the long-PENDING blur decision is now RESOLVED.
    Ink has no translucent surface anywhere, so there is nothing for a
    compositor blur pass to blur - the effect is switched OFF outright rather
    than left enabled at strength 0. This also retires the reason the resume
    watchdog (scripts/kwin-blur-watchdog.sh) existed: it re-armed a blur
    effect that no longer needs to survive anything.

    Consequently this no longer reads [blur] or [glass.render] - both token
    tables were deleted along with the glass material. The only token this
    still consumes is radius.default, for the decoration corner."""
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
        # BorderSize controls only the invisible resize-border thickness
        # around a window - NOT button position (that's ButtonsOnLeft/Right
        # above). Was "None" for a cleaner macOS-style edge; discovered live
        # 2026-08-28 that BorderSize=None also suppresses the decoration's
        # shadow ENTIRELY in this Klassy build, independent of ShadowSize/
        # Strength/Color - empirically verified (None -> zero shadow on
        # every preset from ShadowSmall to ShadowVeryLarge; Normal -> shadow
        # renders correctly). No known way to keep None and get a shadow.
        "BorderSize=Normal",
        "BorderSizeAuto=false",
        "",
        "[Plugins]",
        # Both blur effects OFF - ink is opaque, there is nothing to blur.
        # Historically better_blur_dx was enabled at BlurStrength=0, which is
        # a dormant effect rather than an absent one; it still cost a
        # compositor pass and still needed the resume watchdog to re-arm it.
        "blurEnabled=false",
        "better_blur_dxEnabled=false",
        # Background Contrast (blur+contrast under any client-marked region,
        # e.g. every Plasma popup/panel) is a third, independent translucency
        # source from the two above - ink is opaque, nothing to contrast.
        "backgroundcontrastEnabled=false",
        "fadedesktopEnabled=true",
        "truely-maximizedEnabled=true",
        "kwin4_effect_shapecornersEnabled=false",
        "",
        # No [Effect-better-blur-dx] section is emitted any more. The effect is
        # disabled above, so tuning keys (BlurStrength/NoiseStrength/Corner-
        # Radius/ForceContrastParams) would be inert config noise implying a
        # glass material that no longer exists. Existing keys already in a
        # user's kwinrc are harmless once the plugin is off.
        f"# decoration corner radius (radius.default) = {float(radius)}",
        "",
        "[Windows]",
        "BorderlessMaximizedWindows=true",
        "",
    ]
    return "\n".join(lines)


def emit_klassy_radius(t: dict) -> str:
    """Klassy window-decoration corner-radius + shadow-style partial.
    Sage Ink v4: radius.default is 0 (sharp ink corner, not a glass-clip
    match) - the "share one radius with the blur clip" rationale is v3
    history now that there's no blur clip to match. Kept sourcing from the
    same token because a single corner-radius source of truth is still
    correct, just for a different reason (consistency, not glass geometry).

    [ShadowStyle] comes from shadow.klassy - see the tokens file comment.
    Stock Klassy's window shadow had no offset control at all (soft blurred
    presets only), so this pairs with a source patch to
    ~/src/klassy/kdecoration/breezedecoration.cpp's s_shadowParams[1]
    ("Small") that renders a hard-ish offset(4,4)/radius(0)/opacity(1.0)
    layer instead - as close to the CSS ink shadow as a KWin decoration
    shadow can get. Requires that patched org.kde.klassy.so to be built +
    installed; this ini alone only selects/colours the preset. Merge into
    ~/.config/klassyrc."""
    radius = t["radius"]["default"]
    sh = t["shadow"]["klassy"]
    # ShadowColor is DERIVED from the active variant's accent_alt, same
    # pattern as ink_accent in emit_css_vars - do not read shadow.klassy.color
    # (doc placeholder only). KConfigXT's Color type wants "r, g, b" with
    # spaces, matching the kcfg's own <default>0, 0, 0</default>.
    pal = derive_palette(t, active_variant(t))
    accent_alt_hex = pal["accent_alt"]["hex"]
    r, g, b = (int(accent_alt_hex.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    shadow_color = f"{r}, {g}, {b}"
    lines = [
        f"# {t['meta']['name']} - Klassy corner-radius + shadow-style partial",
        "# Generated by tokens/codegen.py - merge into ~/.config/klassyrc",
        "# [Windeco] sourced from radius.default; [ShadowStyle] from shadow.klassy",
        "# (ShadowColor derived from the active variant's accent_alt).",
        "",
        "[Windeco]",
        f"WindowCornerRadius={radius}",
        "",
        "[ShadowStyle]",
        f"ShadowSize={sh['size']}",
        f"ShadowStrength={sh['strength']}",
        f"ShadowColor={shadow_color}",
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
    outputs = build_outputs(t)

    # {target path: content} — tokens/out/* plus every fully-generated
    # shipped deployable, all resolved from the same `outputs` dict so a
    # shipped file and its tokens/out/ counterpart can never disagree.
    targets: dict[Path, str] = {OUT_DIR / fname: content
                                 for fname, content in outputs.items()}
    for variant, paths in SHIPPED_KDE_SCHEMES.items():
        for path in paths:
            targets[path] = outputs[f"kde-palette.{variant}.colors"]
    targets[SHIPPED_WT_SCHEME] = outputs["wt-scheme.json"]

    rc = 0
    for target, new in targets.items():
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
