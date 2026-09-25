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
import colorsys
import json
import math
import re
import sys
from pathlib import Path

try:
    import tomllib  # Python 3.11+
except ImportError:
    print("ERROR: Python 3.11+ required (need tomllib).", file=sys.stderr)
    sys.exit(1)


sys.path.insert(0, str(Path(__file__).resolve().parent))  # sibling: vscode_roles

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
SHIPPED_MONKEYTYPE = REPO_ROOT / "browser" / "monkeytype" / "indigo-glass.json"
SHIPPED_MONKEYTYPE_SETTINGS = (
    REPO_ROOT / "browser" / "monkeytype" / "indigo-glass.settings.json"
)


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
    #
    # A variant may declare any of these keys itself as an OKLCH triple, in
    # which case the variant wins and no compositing happens. Needed because
    # the global composite builds border/border_strong as white over `surface`:
    # on a dark surface that is a lift, but on a light variant surface IS
    # #FFFFFF, so both composite to white and measure 1.00:1. The token file
    # had already identified per-variant derivation as the correct fix.
    variant_keys = t["variants"][variant]
    for key, (fg, alpha, bg_key) in t["palette"].get("composite", {}).items():
        override = variant_keys.get(key)
        if isinstance(override, list) and len(override) == 3:
            L, C, H = override
            pal[key] = {
                "hex": oklch_to_hex(L, C, H),
                "p3": oklch_to_p3(L, C, H),
                "oklch": oklch_css(L, C, H),
            }
            continue
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
        if isinstance(v, dict):
            # [shadow.klassy] is a subtable for the kdecoration partial; it
            # used to leak into CSS as `--ig-shadow-klassy: {'size': ...}`.
            continue
        if k == "ink_accent":
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

    # Prose / long-form reading layer. A SECOND scale beside [type.scale];
    # see the [prose] comment in the token file for why the chrome scale
    # cannot carry a document. .get() so older token files still emit.
    prose = t.get("prose")
    if prose:
        lines.extend(["", "  /* Prose - long-form reading */"])
        lines.append(f"  --ig-prose-ratio: {prose['ratio']};")
        lines.append(f"  --ig-prose-anchor: {prose['anchor_rem']}rem;")
        lines.append(f"  --ig-prose-measure: {prose['measure_ch']}ch;")
        lines.append(f"  --ig-prose-measure-min: {prose['measure_min_ch']}ch;")
        lines.append(f"  --ig-prose-measure-max: {prose['measure_max_ch']}ch;")
        for k, v in prose.get("scale_rem", {}).items():
            lines.append(f"  --ig-prose-{k}: {v}rem;")
        for k, v in prose.get("line_height", {}).items():
            lines.append(f"  --ig-prose-lh-{k}: {v};")
        for k, v in prose.get("rhythm_em", {}).items():
            lines.append(f"  --ig-prose-{k.replace('_', '-')}: {v}em;")
        for k, v in prose.get("scroll", {}).items():
            unit = "rem" if k.endswith("_rem") else ""
            key = k.replace("_rem", "").replace("_", "-")
            lines.append(f"  --ig-prose-scroll-{key}: {v}{unit};")

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
        # Foreground is TEXT, not "readable on the accent". Under the Tier C
        # grammar (docs/STATE_GRAMMAR.md) a selected list row is an outline
        # over an UNFILLED background, and Kirigami/QML delegates paint their
        # selected label in this role (Kirigami.Theme.highlightedTextColor)
        # with no QWidget for Klassy's polish() to intercept. Dark ink here
        # rendered the System Settings sidebar selection invisible (#07080A on
        # #07080A, live audit 2026-09-22). The genuinely FILLED cases - text
        # selection in QLineEdit/QTextEdit/QPlainTextEdit - get dark ink back
        # per widget in config/klassy/tierc-outline.patch.
        f"ForegroundNormal={hex_to_rgb(p['text'])}",
        f"ForegroundActive={hex_to_rgb(p['text'])}",
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


# One step brighter than `negative`, shared by the Windows Terminal bright
# ramp and Monkeytype's extra-error slot so the two cannot drift apart.
_BRIGHT_RED = "#FF5272"


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
        "brightRed":     _BRIGHT_RED,
        "brightGreen":   "#8CFFB4",
        "brightYellow":  "#FFD250",
        "brightBlue":    p["indigo_hi"],
        "brightPurple":  "#C8B5FF",
        "brightCyan":    "#A5F3FC",
        "brightWhite":   "#FFFFFF",
    }
    return json.dumps(scheme, indent=2) + "\n"


# Monkeytype ships two artifacts from one palette: the ten-slot custom theme
# (what the theme panel edits) and a full settings export that carries that
# theme plus the display settings the design system asks for.
#
# Slot -> token, as rendered by the theme panel's own field labels:
#
#   bg         base          the page
#   main       _mt_accent    typed-correct text - MONKEYTYPE's own yellow
#   caret      _mt_accent    one step up so the caret reads against typed text
#   sub        text_muted    untyped/hint text
#   sub alt    surface_alt   key blocks, modals, the elevated plane
#   text       text          future text (the highest-contrast neutral)
#   error      negative      typed-wrong
#   extra err  _extra_error  red stacked on error, one step further from base
#                            (see _extra_error - brighter on dark, darker on light)
#
# colorfulError{,Extra} repeat error/extra: they are what colorful mode swaps
# in, and an ink palette has exactly one red, so the two modes agree.

# Display settings that belong to the design system rather than to taste:
# block caret and word highlight are the Konsole/visionOS reading posture, and
# the font is the one the type scale is drawn for. Everything else here is a
# plain Monkeytype default, present because `import settings` replaces the
# whole object - an omitted key is a reset, not a no-op.
MONKEYTYPE_SETTINGS: dict = {
    "theme": "serika_dark",
    "themeLight": "serika",
    "themeDark": "serika_dark",
    "autoSwitchTheme": False,
    "customTheme": True,
    "customThemeColors": None,  # filled per variant by emit_monkeytype_settings
    "favThemes": [],
    "showKeyTips": True,
    "smoothCaret": "medium",
    "codeUnindentOnBackspace": False,
    "quickRestart": "off",
    "punctuation": False,
    "numbers": False,
    "words": 10,
    "time": 15,
    "mode": "words",
    "quoteLength": [1],
    "language": "english",
    "fontSize": 2,
    "freedomMode": False,
    "difficulty": "normal",
    "blindMode": False,
    "quickEnd": False,
    "caretStyle": "block",
    "paceCaretStyle": "default",
    "flipTestColors": False,
    "layout": "default",
    "funbox": [],
    "confidenceMode": "off",
    "indicateTypos": "off",
    "compositionDisplay": "replace",
    "timerStyle": "mini",
    "liveSpeedStyle": "off",
    "liveAccStyle": "off",
    "liveBurstStyle": "off",
    "colorfulMode": False,
    "randomTheme": "off",
    "timerColor": "main",
    "timerOpacity": "1",
    "stopOnError": "off",
    "deleteOnError": "off",
    "showAllLines": False,
    "keymapMode": "off",
    "keymapStyle": "staggered",
    "keymapLegendStyle": "lowercase",
    "keymapLayout": "overrideSync",
    "keymapKeys": "minimal",
    "keymapSize": 1,
    "fontFamily": "Iosevka_Custom_Condensed",
    "smoothLineScroll": False,
    "alwaysShowDecimalPlaces": False,
    "alwaysShowWordsHistory": False,
    "singleListCommandLine": "on",
    "capsLockWarning": True,
    "playSoundOnError": "off",
    "playSoundOnClick": "off",
    "soundVolume": 0.5,
    "startGraphsAtZero": True,
    "showOutOfFocusWarning": True,
    "paceCaret": "off",
    "paceCaretCustomSpeed": 100,
    "repeatedPace": True,
    "accountChart": ["on", "on", "on", "on"],
    "minWpm": "off",
    "minWpmCustomSpeed": 100,
    "highlightMode": "word",
    "typedEffect": "keep",
    "typingSpeedUnit": "wpm",
    "ads": "result",
    "hideExtraLetters": False,
    "strictSpace": False,
    "minAcc": "off",
    "minAccCustom": 90,
    "monkey": False,
    "repeatQuotes": "off",
    "resultSaving": True,
    "oppositeShiftMode": "off",
    "customBackground": "",
    "customBackgroundSize": "cover",
    "customBackgroundFilter": [0, 1, 1, 1],
    "customLayoutfluid": ["qwerty", "dvorak", "colemak"],
    "customPolyglot": ["english", "spanish", "french", "german"],
    "monkeyPowerLevel": "off",
    "minBurst": "off",
    "minBurstCustomSpeed": 100,
    "burstHeatmap": False,
    "britishEnglish": False,
    "lazyMode": False,
    "showAverage": "off",
    "showPb": False,
    "tapeMode": "off",
    "tapeMargin": 50,
    "maxLineWidth": 0,
    "playTimeWarning": "off",
}


def _monkeytype_slug(t: dict, variant: str) -> str:
    """Theme name Monkeytype shows in its list: "Orchid Ink" -> orchid_ink."""
    return t["variants"][variant]["name"].lower().replace(" ", "_")


# Monkeytype keeps its own hue, same rule the per-site Stylus styles follow
# (browser/stylus/sites/README.md): the structure is ours - ink surfaces, our
# neutrals, our red - and the hue is theirs. Monkeytype's is the serika yellow
# its default theme and wordmark are painted in, #E2B714, which is hue 91.25 in
# OKLCH. Only the hue is taken; the raw lightness and chroma are not, because a
# vendor swatch cut for a white page is not cut for this ladder.
_MONKEYTYPE_HUE = 91.25

# Where that hue sits on the ladder. Dark bases use the per-site cut of
# L 0.82 / 0.74 at C 0.11. A light base inverts it - accent DARKENS on hover
# there, exactly as [variants.orchid_light] does - and needs the lower
# lightnesses to clear its own page: 5.75:1 and 8.05:1 against #FAFAFC, where
# the dark cut measures 2.22:1.
_MONKEYTYPE_CUT = {          # base_is_light: (main L, C), (caret L, C)
    False: ((0.74, 0.11), (0.82, 0.11)),
    True:  ((0.50, 0.13), (0.42, 0.14)),
}


def _base_is_light(t: dict, variant: str) -> bool:
    return _relative_luminance(derive_palette(t, variant)["base"]["hex"]) > 0.5


def _extra_error(t: dict, variant: str) -> str:
    """The extra-error red: one step FURTHER FROM the variant's own base.

    On the dark variants that step is brighter, and it is the same literal the
    Windows Terminal bright ramp uses. On a light variant brighter is wrong -
    #FF5272 measures ~3.3:1 on #FAFAFC, below the `negative` it is supposed to
    escalate from - so the step goes darker instead, derived from that
    variant's own negative so the hue stays put.
    """
    L, C, H = resolve_variant(t, variant)["negative"]
    return (oklch_to_hex(L - 0.12, C, H) if _base_is_light(t, variant)
            else _BRIGHT_RED)


def _monkeytype_slots(t: dict, variant: str) -> dict[str, str]:
    p = {k: v["hex"] for k, v in derive_palette(t, variant).items()}
    extra_error = _extra_error(t, variant)
    (main_L, main_C), (caret_L, caret_C) = _MONKEYTYPE_CUT[_base_is_light(t, variant)]
    return {
        "bgColor": p["base"],
        "mainColor": oklch_to_hex(main_L, main_C, _MONKEYTYPE_HUE),
        "subColor": p["text_muted"],
        "subAltColor": p["surface_alt"],
        "textColor": p["text"],
        "errorColor": p["negative"],
        "errorExtraColor": extra_error,
        "colorfulErrorColor": p["negative"],
        "colorfulErrorExtraColor": extra_error,
        "caretColor": oklch_to_hex(caret_L, caret_C, _MONKEYTYPE_HUE),
    }


def emit_monkeytype(t: dict, variant: str | None = None) -> str:
    """Monkeytype custom theme - the ten slots its theme panel edits."""
    variant = variant or active_variant(t)
    theme = {"name": _monkeytype_slug(t, variant), **_monkeytype_slots(t, variant)}
    return json.dumps(theme, indent=2) + "\n"


def emit_monkeytype_settings(t: dict, variant: str | None = None) -> str:
    """Full Monkeytype settings export carrying the theme above.

    customThemeColors is a positional array, not an object: Monkeytype reads it
    as [bg, main, caret, sub, subAlt, text, error, extraError, colorfulError,
    colorfulExtraError]. Order verified against a serika_dark export.
    """
    variant = variant or active_variant(t)
    s = _monkeytype_slots(t, variant)
    settings = dict(MONKEYTYPE_SETTINGS)
    settings["customThemeColors"] = [
        s["bgColor"], s["mainColor"], s["caretColor"], s["subColor"],
        s["subAltColor"], s["textColor"], s["errorColor"], s["errorExtraColor"],
        s["colorfulErrorColor"], s["colorfulErrorExtraColor"],
    ]
    return json.dumps(settings, indent=2) + "\n"


def emit_vlcrc(t: dict, variant: str | None = None) -> str:
    """VLC 3.x Qt-interface partial. Merge into ~/.config/vlc/vlcrc with
    scripts/apply-vlc.py - NOT kwriteconfig6: vlcrc repeats section names
    ([file] three times, [ps]/[es]/[mp4]/...) and KConfig merges, reorders
    and strips them (4811 lines -> 46 on a live copy, 2026-09-24).

    VLC 3 has no colour-theme file. The window already reads the SageInk
    palette through plasma-integration-qt5; what this covers is the three
    places VLC paints on its own:
      qt-dark-palette   stays 0 - 1 swaps the KDE palette for VLC's own greys
                        (qt.cpp applyDarkPalette).
      qt-fs-opacity     fullscreen controller defaults to 0.8. Ink is opaque.
      qt-slider-colours the "shiny" volume slider's four gradient stops (0,
                        100%-5, 100%+5, max - input_slider.cpp). All four are
                        accent, so it paints flat. vlc/vlc-qt-interface.ini
                        drops the shiny widgets entirely; this only matters
                        if someone re-enables them in the toolbar editor.
    """
    variant = variant or active_variant(t)
    pal = derive_palette(t, variant)
    stop = hex_to_rgb(pal["accent"]["hex"]).replace(",", ";")
    lines = [
        f"# {t['meta']['name']} ({variant}) - VLC 3.x Qt interface snippet",
        "# Generated by tokens/codegen.py - DO NOT EDIT (edit tokens, regenerate)",
        "# Apply with: python3 scripts/apply-vlc.py",
        "",
        "[qt]",
        "qt-dark-palette=0",
        f"qt-fs-opacity={float(t['opacity']['window_active']):.6f}",
        f"qt-slider-colours={';'.join([stop] * 4)}",
        "",
    ]
    return "\n".join(lines)


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
    ("Small") that renders a hard offset(8,8)/radius(0)/opacity(1.0) layer
    instead - as close to the CSS ink shadow as a KWin decoration shadow can
    get (calculateBlurRadius clamps to a 2px floor). The patch lives at
    config/klassy/ink-shadow.patch and is applied by install.sh; this ini
    alone only selects and colours the preset, so BOTH are required.
    Merge into ~/.config/klassyrc AND ~/.config/klassy/klassyrc - Klassy 6.5+
    reads the latter."""
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
        # PARAMETERISED KEYS. Klassy's kcfg declares these as
        # ShadowSize$(ShadowSizeActive) etc., so the real key names are
        # ShadowSizeActive / ShadowSizeInactive -- there is no bare
        # "ShadowSize" key at all. Writing the bare names (as this emitter did
        # until 2026-09-02) means Klassy finds nothing and silently falls back
        # to its own defaults: ShadowSize=ShadowLarge and ShadowColor=0,0,0.
        # That routes the decoration to s_shadowParams[3] (the soft blurred
        # Large preset) instead of the patched [1] "Small", and paints it black
        # at 1.05:1 on this palette -- i.e. no visible shadow, and a source
        # patch that appears to do nothing however correct it is.
        f"ShadowSizeActive={sh['size']}",
        f"ShadowSizeInactive={sh['size']}",
        f"ShadowStrengthActive={sh['strength']}",
        f"ShadowStrengthInactive={sh['strength']}",
        f"ShadowColorActive={shadow_color}",
        f"ShadowColorInactive={shadow_color}",
        "",
    ]
    return "\n".join(lines)


# =============================================================================
# VSCode colour themes (dark + light) - generated from tokens/vscode_roles.py
#
# Added 2026-09-22. Before this the two theme files were hand-typed, and the
# drift guard could not see them because it hunts SUPERSEDED accents, not
# arbitrary off-palette literals. That gap had let the light theme keep 27
# occurrences of a violet (#7C3AED) on types, classes, numbers, links and
# button hover - a colour from no Sage Ink variant, documented nowhere, and
# contradicted by vscode/README.md which claimed a sage ladder instead.
# Generating both files from one role map is what makes the two agree.
# =============================================================================

def ansi_palette(t: dict, variant: str) -> dict:
    """The 16 ANSI slots for a variant, as hex. See [variants.<v>.ansi]."""
    v = t["variants"][variant]
    if "ansi" not in v:
        raise KeyError(
            f"variant {variant!r} ships a VSCode theme but declares no "
            f"[variants.{variant}.ansi] block"
        )
    return {slot: oklch_to_hex(*lch) for slot, lch in v["ansi"].items()}


# Neutral ladder above `surface`: scrollbars, hover fills, pinned-tab borders.
# Not palette roles because they carry no meaning - they are the same surface
# a step further from the canvas. The step is applied to `surface`'s own OKLCH
# so each variant keeps its own hue, and it is SIGNED: on a dark canvas "up"
# is lighter, on a light canvas it is darker.
_LIFT_STEPS = {"lift1": 0.03, "lift2": 0.09, "lift3": 0.14}


def _lift(t: dict, variant: str, name: str) -> str:
    L, C, H = t["variants"][variant]["surface"]
    delta = _LIFT_STEPS[name] * (-1 if _base_is_light(t, variant) else 1)
    return oklch_to_hex(max(0.0, min(1.0, L + delta)), C, H)


def _orange(t: dict, variant: str) -> str:
    """Derived: amber's lightness and chroma at the hue midway between amber
    and negative. The palette has no orange role, but `invalid.deprecated` and
    charts.orange both need one that is not simply amber again."""
    aL, aC, aH = t["variants"][variant]["amber"]
    _, _, nH = t["variants"][variant]["negative"]
    return oklch_to_hex(aL, aC, (aH + nH) / 2)


def _on_accent(t: dict, variant: str, pal: dict) -> str:
    """Text/icon legible on an `accent` FILL - button labels, badge counts.

    The hand-typed dark theme used #FFFFFF here, which measured 1.68:1 on the
    sage fill it sat on: button.foreground was effectively invisible. Picking
    the best of {text, white, black} by measured contrast fixes that, and on
    the light variant independently arrives at white (6.06:1)."""
    fill = pal["accent"]["hex"]
    return max((pal["text"]["hex"], "#FFFFFF", "#000000"),
               key=lambda c: contrast_ratio(c, fill))


def _resolve_role(t: dict, variant: str, pal: dict, ansi: dict, expr: str) -> str:
    """Resolve one role expression from tokens/vscode_roles.py to hex.
    Grammar is documented in that module's docstring."""
    # `tint:` carries its own fractional alpha, so it is matched on the FULL
    # expression before the trailing-alpha split below would eat it.
    if expr.startswith("tint:"):
        # tint:negative@0.12 - composited over `base` to an OPAQUE hex, the
        # same discipline [palette.composite] applies: no consumer of this
        # theme ever receives a real alpha channel for a status FILL.
        role_name, _, frac = expr[5:].partition("@")
        return _composite_hex(pal[role_name]["hex"], float(frac), pal["base"]["hex"])
    body, _, alpha = expr.partition("@")
    if body == "transparent":
        return "#00000000"
    if body.startswith("ansi:"):
        slot = body[5:]
        if slot not in ansi:
            raise KeyError(f"{variant}: no ANSI slot {slot!r}")
        hexv = ansi[slot]
    elif body in _LIFT_STEPS:
        hexv = _lift(t, variant, body)
    elif body == "marker":
        # Maximum contrast against the canvas: focus rings and active borders
        # must win against every surface, so they take the extreme, not `text`.
        hexv = "#000000" if _base_is_light(t, variant) else "#FFFFFF"
    elif body == "on_accent":
        hexv = _on_accent(t, variant, pal)
    elif body == "outline_hard":
        # The silhouette the ink material projects its hard shadow from.
        # Black on BOTH variants on purpose - neobrutalism.dev's reference
        # library borders every surface in black on a light canvas too.
        hexv = "#000000"
    elif body == "orange":
        hexv = _orange(t, variant)
    elif body in pal:
        hexv = pal[body]["hex"]
    else:
        raise KeyError(f"{variant}: unknown role expression {expr!r}")
    return f"{hexv}{alpha}" if alpha else hexv


# Contrast pairs asserted at emit time. A colour theme is the one artifact in
# this repo where a wrong value is invisible to every other guard: the drift
# scan proves a hex came from the palette, not that the pair it forms is
# legible. The hand-typed theme this replaced shipped button.foreground at
# 1.68:1 on its own fill for months, and no scan could have caught it.
#
# Tiers are the honest ones, not aspirational: TEXT is body copy and must
# clear WCAG AA 4.5:1; MUTED is deliberately secondary (comments, line
# numbers, inactive tabs) and is held at 4.0 because `text_muted` measures
# 4.14:1 on the sage dark base - a known, documented shortfall of the token
# itself, not of this theme. Raising it is a palette-wide change touching
# every layer, so it is reported rather than silently patched here.
_CONTRAST_TEXT = [
    ("editor.foreground", "editor.background"),
    ("button.foreground", "button.background"),
    ("button.secondaryForeground", "button.secondaryBackground"),
    ("sideBar.foreground", "sideBar.background"),
    ("statusBar.foreground", "statusBar.background"),
    ("activityBar.foreground", "activityBar.background"),
    ("badge.foreground", "badge.background"),
    ("tab.activeForeground", "tab.activeBackground"),
    ("input.foreground", "input.background"),
    ("dropdown.foreground", "dropdown.background"),
    ("titleBar.activeForeground", "titleBar.activeBackground"),
    ("notifications.foreground", "notifications.background"),
    ("terminal.foreground", "terminal.background"),
    ("quickInput.foreground", "quickInput.background"),
    ("menu.foreground", "menu.background"),
    ("statusBarItem.errorForeground", "statusBarItem.errorBackground"),
]
_CONTRAST_MUTED = [
    ("tab.inactiveForeground", "tab.inactiveBackground"),
    ("editorLineNumber.foreground", "editor.background"),
    ("descriptionForeground", "editor.background"),
]


def _assert_vscode_contrast(variant: str, colors: dict, token_colors: list) -> None:
    bad = []
    for pairs, floor, tier in ((_CONTRAST_TEXT, 4.5, "text"),
                               (_CONTRAST_MUTED, 4.0, "muted")):
        for fg, bg in pairs:
            if fg not in colors or bg not in colors:
                continue
            ratio = contrast_ratio(colors[fg][:7], colors[bg][:7])
            if ratio < floor:
                bad.append(f"{variant}: {fg} on {bg} = {ratio:.2f}:1 "
                           f"(<{floor} for {tier})")
    editor_bg = colors["editor.background"][:7]
    for rule in token_colors:
        fg = rule["settings"].get("foreground")
        if not fg:
            continue
        ratio = contrast_ratio(fg[:7], editor_bg)
        if ratio < 4.0:
            bad.append(f"{variant}: syntax {rule.get('name')!r} = "
                       f"{ratio:.2f}:1 on the editor canvas (<4.0)")
    if bad:
        raise SystemExit("VSCode theme contrast check FAILED:\n  "
                         + "\n  ".join(bad))


def emit_vscode_theme(t: dict, variant: str, label: str, ui: str) -> str:
    """One VSCode colour theme. `ui` is VSCode's own light/dark switch."""
    from vscode_roles import VSCODE_COLORS, VSCODE_TOKEN_COLORS, VSCODE_SEMANTIC

    pal = derive_palette(t, variant)
    ansi = ansi_palette(t, variant)
    r = lambda e: _resolve_role(t, variant, pal, ansi, e)

    token_colors = []
    for rule in VSCODE_TOKEN_COLORS:
        settings = dict(rule["settings"])
        if "foreground" in settings:
            settings["foreground"] = r(settings["foreground"])
        entry = {}
        if rule.get("name"):
            entry["name"] = rule["name"]
        entry["scope"] = rule["scope"]
        entry["settings"] = settings
        token_colors.append(entry)

    semantic = {}
    for key, val in VSCODE_SEMANTIC.items():
        if isinstance(val, str):
            semantic[key] = r(val)
        else:
            v = dict(val)
            if "foreground" in v:
                v["foreground"] = r(v["foreground"])
            semantic[key] = v

    colors = {k: r(v) for k, v in VSCODE_COLORS.items()}
    _assert_vscode_contrast(variant, colors, token_colors)

    theme = {
        "$schema": "vscode://schemas/color-theme",
        "_generated": (
            "DO NOT EDIT - generated by tokens/codegen.py from "
            "tokens/indigo-glass.tokens.toml + tokens/vscode_roles.py. "
            "Run `python3 tokens/codegen.py` after any token change."
        ),
        "name": label,
        "type": ui,
        "semanticHighlighting": True,
        "colors": colors,
        "semanticTokenColors": semantic,
        "tokenColors": token_colors,
    }
    return json.dumps(theme, indent=4, ensure_ascii=False) + "\n"


# Shipped VSCode themes: (output stem, variant, package.json label, ui kind).
# Filenames are load-bearing - vscode/package.json resolves themes by path,
# and the repo rule is never to rename an existing path to match current
# naming, so these keep their legacy indigo-glass-* stems.
VSCODE_THEMES = [
    ("vscode-theme-dark.json", "sage", "Sage Ink Dark", "dark"),
    ("vscode-theme-light.json", "sage_light", "Sage Ink Light", "light"),
]
SHIPPED_VSCODE = {
    "vscode-theme-dark.json": REPO_ROOT / "vscode" / "themes" / "indigo-glass-dark.json",
    "vscode-theme-light.json": REPO_ROOT / "vscode" / "themes" / "indigo-glass-light.json",
}


# =============================================================================
# Edge profiles - per-profile browser layer (see [edge_profiles] in the token
# file). Every Edge profile keeps the Sage Ink surface ladder and carries its
# own brand accent triple. Three artifacts per profile:
#
#   browser/edge-theme/edge-<profile>/manifest.json   theme extension (committed)
#   browser/darkreader/darkreader.<profile>.json      Dark Reader import (committed)
#   browser/stylus/out/stylus-import.<profile>.json   Stylus bundle (untracked,
#                                                     like the personal bundle -
#                                                     see .gitignore)
#
# "personal" is emitted too, for uniformity — its substitution is the
# identity (sage -> sage), so it differs from the canonical personal files
# only in the [Personal] name tag and the stripped @updateURL. The canonical
# files (browser/stylus/*.user.css, browser/darkreader/indigo-glass.json)
# remain the source these emitters substitute FROM.
# =============================================================================

SHIPPED_EDGE_THEME_DIR = REPO_ROOT / "browser" / "edge-theme"
SHIPPED_DARKREADER_DIR = REPO_ROOT / "browser" / "darkreader"
DARKREADER_TEMPLATE = SHIPPED_DARKREADER_DIR / "indigo-glass.json"  # personal import file
STYLUS_OUT_DIR = REPO_ROOT / "browser" / "stylus" / "out"
STYLUS_SRC_GLOBS = ["browser/stylus/*.user.css", "browser/stylus/sites/*.user.css"]

# Edge lifts near-black theme colours non-linearly before painting them
# (measured on Edge 153 by pixel-sampling probe themes - the full curve and
# raw data live in browser/edge-theme/README.md). These RGB triples are the
# measured compensations that RENDER as the sage surface ladder; they are
# deliberately NOT the token hex, so never "fix" them to match tokens.
# _assert_edge_surfaces() below ties them back to the tokens through the
# forward lift curve, so a silent token change still fails the build.
_EDGE_LIFT_CURVE = [(0, 0), (1, 6), (2, 9), (3, 11), (4, 12), (7, 16),
                    (10, 18), (15, 22), (18, 25), (30, 35), (40, 44), (48, 51)]
_EDGE_SURFACES = {          # token key -> compensated manifest RGB
    "surface_alt": [10, 10, 15],   # renders #121216 - frame/toolbar/buttons
    "surface":     [5, 5, 7],      # renders ~#0D0D10 - frame_inactive
    "sidebar":     [2, 2, 4],      # renders ~#0A0A0D - frame_incognito
    "base":        [1, 2, 3],      # renders ~#07080A - incognito_inactive/omnibox
}
_EDGE_TEXT = [248, 248, 248]                  # text #F8F8F8, uncompensated
_EDGE_TAB_BG_TEXT = [165, 169, 178]           # hand-tuned inactive tab text
_EDGE_TAB_BG_TEXT_INACTIVE = [120, 122, 130]  # hand-tuned, see README
_EDGE_THEME_VERSION = "1.5.0"  # first generated series; 1.4.0 was hand-kept
# Fixed so codegen output is deterministic (--check compares bytes). Stylus
# only displays this date; 2026-09-24 UTC = the day the bundles became
# generated. (First shipped as 1758672000000 = 2025-09-24 - a year off -
# which Stylus dutifully displayed as "1 year ago".)
_STYLUS_INSTALL_DATE = 1790208000000


def _edge_rendered(v: int) -> float:
    """Forward-interpolate the measured lift curve: manifest value -> what
    Edge actually paints. Linear between measured points."""
    pts = _EDGE_LIFT_CURVE
    if v <= pts[0][0]:
        return float(pts[0][1])
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if v <= x1:
            return y0 + (y1 - y0) * (v - x0) / (x1 - x0)
    return float(pts[-1][1])


def _assert_edge_surfaces(t: dict) -> None:
    """The compensated RGB constants must still render the sage ladder. If a
    sage surface token moves, this fails instead of shipping a stale seam."""
    pal = derive_palette(t, "sage")
    for key, rgb in _EDGE_SURFACES.items():
        want = pal[key]["hex"].lstrip("#")
        want_rgb = [int(want[i:i + 2], 16) for i in (0, 2, 4)]
        for ch, (inp, target) in enumerate(zip(rgb, want_rgb)):
            got = _edge_rendered(inp)
            if abs(got - target) > 2:
                raise SystemExit(
                    f"edge surface drift: _EDGE_SURFACES[{key!r}] channel {ch} "
                    f"renders {got:.1f}, token says {target}. Re-measure the "
                    f"lift curve or update the constant (see edge-theme README).")


def _edge_profile_hexes(t: dict, profile: str) -> dict[str, str]:
    """Resolve a profile's brand triple to hex. `accent = \"<variant>\"`
    inherits that variant's triple; otherwise the profile declares all three."""
    spec = t["edge_profiles"][profile]
    if isinstance(spec["accent"], str):
        v = resolve_variant(t, spec["accent"])
        triples = {k: v[k] for k in ("accent", "accent_hi", "accent_alt")}
    else:
        triples = {k: spec[k] for k in ("accent", "accent_hi", "accent_alt")}
    return {k: oklch_to_hex(*lch) for k, lch in triples.items()}


def _hls_tint(hex_color: str) -> list[float]:
    """Chromium theme tint triple [h, s, l] (0-1, 2dp) for a hex colour -
    the format `theme.tints.buttons` takes. Matches the hand-computed sage
    value: #C0E3C0 -> [0.33, 0.38, 0.82]."""
    r, g, b = (int(hex_color.lstrip("#")[i:i + 2], 16) / 255 for i in (0, 2, 4))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return [round(h, 2), round(s, 2), round(l, 2)]


def emit_edge_theme(t: dict, profile: str) -> str:
    """Per-profile Edge theme manifest. Surfaces identical across profiles
    (the Klassy-seam contract); only the toolbar icon tint carries the brand
    hue. Edge 153 ignores omnibox_background - kept for Chromium proper."""
    _assert_edge_surfaces(t)
    label = t["edge_profiles"][profile]["label"]
    hexes = _edge_profile_hexes(t, profile)
    s = _EDGE_SURFACES
    manifest = {
        "manifest_version": 3,
        "name": f"Sage Ink — {label}",
        "short_name": "Sage Ink",
        "version": _EDGE_THEME_VERSION,
        "description": (
            f"Sage Ink chrome for the {label} Edge profile - shared ink "
            f"surfaces, {label}-brand toolbar icon tint. Generated by "
            "tokens/codegen.py; do not hand-edit."),
        "author": "John Rebellion",
        "theme": {
            "colors": {
                "frame": s["surface_alt"],
                "frame_inactive": s["surface"],
                "frame_incognito": s["sidebar"],
                "frame_incognito_inactive": s["base"],
                "toolbar": s["surface_alt"],
                "toolbar_text": _EDGE_TEXT,
                "tab_text": _EDGE_TEXT,
                "tab_background_text": _EDGE_TAB_BG_TEXT,
                "tab_background_text_inactive": _EDGE_TAB_BG_TEXT_INACTIVE,
                "bookmark_text": _EDGE_TEXT,
                "omnibox_background": s["base"],
                "omnibox_text": _EDGE_TEXT,
                "button_background": s["surface_alt"],
            },
            "tints": {
                "buttons": _hls_tint(hexes["accent_hi"]),
                "frame": [-1, -1, -1],
                "background_tab": [-1, -1, -1],
            },
        },
    }
    return json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"


def _accent_substitutions(t: dict, profile: str) -> dict[str, str]:
    """sage accent literal -> profile accent literal, in every form the
    browser layer actually writes: #RRGGBB (either case) and the decimal
    triple with and without spaces (rgba() bodies)."""
    sage = derive_palette(t, "sage")
    prof = _edge_profile_hexes(t, profile)
    subs: dict[str, str] = {}
    for key in ("accent", "accent_hi", "accent_alt"):
        s_hex = sage[key]["hex"].lstrip("#")
        p_hex = prof[key].lstrip("#")
        sr, sg, sb = (int(s_hex[i:i + 2], 16) for i in (0, 2, 4))
        pr, pg, pb = (int(p_hex[i:i + 2], 16) for i in (0, 2, 4))
        subs[s_hex] = p_hex
        subs[s_hex.lower()] = p_hex
        subs[f"{sr}, {sg}, {sb}"] = f"{pr}, {pg}, {pb}"
        subs[f"{sr},{sg},{sb}"] = f"{pr},{pg},{pb}"
    return subs


def _substitute(text: str, subs: dict[str, str]) -> str:
    for old, new in subs.items():
        text = text.replace(old, new)
    return text


def emit_darkreader(t: dict, profile: str) -> str:
    """Per-profile Dark Reader import: the personal import file with the sage
    accents swapped for the profile's brand triple. Dark Reader has no update
    URL - re-import after regenerating (see browser/README.md)."""
    label = t["edge_profiles"][profile]["label"]
    template = DARKREADER_TEMPLATE.read_text()
    sage_accent = derive_palette(t, "sage")["accent"]["hex"].lstrip("#")
    if sage_accent not in template:
        raise SystemExit(
            f"darkreader template {DARKREADER_TEMPLATE} no longer carries the "
            f"sage accent #{sage_accent} - substitution basis is stale.")
    out = _substitute(template, _accent_substitutions(t, profile))
    return out.replace('"name": "Sage Ink"', f'"name": "Sage Ink — {label}"')


def emit_stylus_bundle(t: dict, profile: str) -> str:
    """Per-profile Stylus import bundle, built from the same .user.css files
    as the personal bundle (scripts/style-check/README.md snippet - the
    personal export is byte-identical to those files), with the brand triple
    substituted. @updateURL is STRIPPED: Stylus's update check re-fetches the
    sage originals from raw.githubusercontent.com and would silently revert
    the brand hue on its next poll. Re-import after regenerating instead."""
    label = t["edge_profiles"][profile]["label"]
    subs = _accent_substitutions(t, profile)
    files = sorted((REPO_ROOT).glob(STYLUS_SRC_GLOBS[0])) + \
        sorted((REPO_ROOT).glob(STYLUS_SRC_GLOBS[1]))
    if not files:
        raise SystemExit("no browser/stylus/**/*.user.css sources found")
    out = []
    meta_keys = ("name", "namespace", "version", "description", "author",
                 "homepageURL", "updateURL", "license", "preprocessor")
    for path in files:
        src = path.read_text()
        src = _substitute(src, subs)
        src = re.sub(r"^@updateURL\s+\S+\n", "", src, flags=re.M)
        # Site files mix em dash and ASCII hyphen after "Sage Ink"; tag the
        # profile right after the brand so both forms are covered.
        src = re.sub(r"^@name(\s+)Sage Ink",
                     f"@name\\g<1>Sage Ink [{label}]", src, flags=re.M)
        meta = {}
        for k in meta_keys:
            m = re.search(rf"^@{k}\s+(.+)$", src, re.M)
            meta[k] = m.group(1).strip() if m else None
        out.append({
            "enabled": True,
            "name": meta["name"],
            "updateUrl": None,
            "url": meta["homepageURL"],
            "installDate": _STYLUS_INSTALL_DATE,
            "sourceCode": src,
            "_usercss": True,
            "usercssData": {**meta,
                            "preprocessor": meta["preprocessor"] or "default",
                            "vars": {}},
        })
    return json.dumps(out, indent=1, ensure_ascii=False)


# Per-variant emitters: emitted once per variant. Canonical filename (no
# variant suffix) = the default variant, for back-compat with consumers that
# read e.g. tokens/out/css-vars.css. Plus a <stem>.<variant>.<ext> for each.
VARIANT_WRITERS = [
    ("css-vars.css", emit_css_vars),
    ("scss-vars.scss", emit_scss_vars),
    ("kde-palette.colors", emit_kde_colors),
    ("wt-scheme.json", emit_wt_scheme),
    ("monkeytype.json", emit_monkeytype),
    ("monkeytype-settings.json", emit_monkeytype_settings),
    ("vlcrc.ini", emit_vlcrc),
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


def emit_css_theme_pair(t: dict, dark: str, light: str) -> str:
    """One self-contained stylesheet carrying BOTH palettes of a theme pair.

    Consumers need three states from two palettes, and no single generated
    per-variant file can express them because every one declares plain `:root`:

        default            dark
        OS prefers light   light
        reader chose       whichever they picked, overriding the OS

    A media query cannot express "the reader clicked a button", and a cascade
    layer cannot change a selector, so the attribute-scoped copy has to be
    emitted with the selector already on it. Doing that here keeps it generated
    — an app hand-scoping a copy of a generated file is exactly the drift this
    token pipeline exists to prevent.

    Emits, in order:
      :root                                  dark  (baseline)
      @media (prefers-color-scheme: light)   light (OS)
      :root[data-theme='light']              light (explicit)
      :root[data-theme='dark']               dark  (explicit, beats the media
                                                    query by coming later at
                                                    equal specificity)
    """
    def palette_lines(variant: str, indent: str) -> list[str]:
        pal = derive_palette(t, variant)
        return [f"{indent}--ig-{k.replace('_', '-')}: {v['hex']};"
                for k, v in pal.items()]

    lines = [
        f"/* {t['meta']['name']} - theme pair: {dark} (dark) / {light} (light) */",
        "/* Generated by tokens/codegen.py from tokens/indigo-glass.tokens.toml */",
        "/* DO NOT EDIT - regenerate via `python3 tokens/codegen.py` */",
        "",
        "/* Baseline: dark. Applies when nothing else does. */",
        ":root {",
        "  color-scheme: dark;",
        *palette_lines(dark, "  "),
        "}",
        "",
        "/* The OS asked for light. */",
        "@media (prefers-color-scheme: light) {",
        "  :root {",
        "    color-scheme: light;",
        *palette_lines(light, "    "),
        "  }",
        "}",
        "",
        "/* The reader chose light. Equal specificity to the media rule above",
        "   but later in source order, so it wins on an OS-dark machine. */",
        ":root[data-theme='light'] {",
        "  color-scheme: light;",
        *palette_lines(light, "  "),
        "}",
        "",
        "/* The reader chose dark. Must restate the dark palette: the media",
        "   query above may have applied light, and this has to beat it. */",
        ":root[data-theme='dark'] {",
        "  color-scheme: dark;",
        *palette_lines(dark, "  "),
        "}",
        "",
    ]
    return "\n".join(lines)


# Dark variant -> its light counterpart. Only pairs listed here get a
# combined css-theme.<dark>.css; a variant with no light sibling is unaffected.
THEME_PAIRS = [("orchid", "orchid_light"), ("sage", "sage_light")]


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
    for fname, v, label, ui in VSCODE_THEMES:
        out[fname] = emit_vscode_theme(t, v, label, ui)
    # Theme pairs: a dark variant and its light counterpart in one file.
    for dark, light in THEME_PAIRS:
        if dark in t["variants"] and light in t["variants"]:
            out[f"css-theme.{dark}.css"] = emit_css_theme_pair(t, dark, light)
    # Edge profiles: theme manifest + Dark Reader import for every profile
    # (personal's substitution is the identity - see the emitter block).
    # Stylus bundles are NOT in this dict - they ship to the untracked
    # browser/stylus/out/ only, never to committed tokens/out/ (main() adds
    # them straight to the shipped-targets map).
    for profile in t.get("edge_profiles", {}):
        out[f"edge-theme.{profile}.json"] = emit_edge_theme(t, profile)
        out[f"darkreader.{profile}.json"] = emit_darkreader(t, profile)
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
    targets[SHIPPED_MONKEYTYPE] = outputs["monkeytype.json"]
    targets[SHIPPED_MONKEYTYPE_SETTINGS] = outputs["monkeytype-settings.json"]
    for fname, path in SHIPPED_VSCODE.items():
        targets[path] = outputs[fname]
    for profile in t.get("edge_profiles", {}):
        targets[SHIPPED_EDGE_THEME_DIR / f"edge-{profile}" / "manifest.json"] = \
            outputs[f"edge-theme.{profile}.json"]
        targets[SHIPPED_DARKREADER_DIR / f"darkreader.{profile}.json"] = \
            outputs[f"darkreader.{profile}.json"]
        # Untracked, like the hand-exported personal bundle (.gitignore
        # browser/stylus/out/).
        targets[STYLUS_OUT_DIR / f"stylus-import.{profile}.json"] = \
            emit_stylus_bundle(t, profile)

    rc = 0
    for target, new in targets.items():
        if args.check:
            if not target.exists() or target.read_text() != new:
                print(f"OUT-OF-DATE: {target}")
                rc = 1
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(new)
        print(f"wrote {target}")

    sys.exit(rc)


if __name__ == "__main__":
    main()
