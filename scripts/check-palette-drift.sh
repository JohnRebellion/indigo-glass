#!/usr/bin/env bash
# check-palette-drift.sh — Sage Ink drift guard (colour AND material)
#
# tokens/indigo-glass.tokens.toml is the single source of truth; every layer
# config is meant to derive from tokens/out/* via codegen.py. In practice
# layer configs carry literals typed by hand, and nothing regenerates them.
# This script fails the build when a layer has drifted from the tokens.
#
# ---------------------------------------------------------------------------
# v2 (2026-08-28) — rewritten after an audit found the v1 guard was reporting
# "clean" while three shipped themes were still Lime Glass. Three holes, all
# now closed:
#
#   1. SCAN PATH.   v1's SEARCH_DIRS listed 10 dirs and silently omitted six
#                   deployable ones — cursor/ hosts/ iso/ sddm/ shell/ and
#                   vencord/. vencord/indigo-glass.theme.css contained the
#                   lime accent #A8E635 for weeks while the guard passed.
#                   The list is now derived by EXCLUSION (everything except a
#                   known non-deployable set), so a new top-level directory is
#                   scanned by default instead of being invisible by default.
#
#   2. DECIMAL RGB. v1 matched '#RRGGBB' only. Colours written as decimal
#                   tuples — rgba(168,230,53,.3) in CSS, "168,230,53" in KDE
#                   colour schemes and KConfigXT — were invisible to it. Five
#                   such lime tints survived every prior sweep in the Spicetify
#                   theme alone. Both spacing conventions are now matched.
#
#   3. MATERIAL.    v1 checked COLOUR ONLY. That asymmetry is precisely why
#                   the lime->sage migration was thorough and the glass->ink
#                   migration was not: one was enforced and the other was left
#                   to diligence. Material is a first-class constraint of this
#                   design system, not a per-surface taste call, so it is now
#                   enforced identically. Sage Ink is opaque: no backdrop
#                   blur, no grain texture, no soft shadow.
#
# v3 (2026-08-30) — added a third dimension, ALPHA: a real (non-shadow)
#   translucent value outside the [alpha.exempt] allowlist in
#   tokens/indigo-glass.tokens.toml. This is what the "outline not highlight"
#   audit found still leaking after the colour+material guards were both
#   clean: 0.22-alpha on-select washes, translucent chrome dividers, and one
#   token (`[palette.alpha] border`) that had shipped a literal "glass edge"
#   since before MATERIAL even existed as a check. See docs/STATE_GRAMMAR.md.
#
# v4 (2026-09-01) — added a fourth dimension, PARITY, after a cross-model
#   audit surfaced a live case COLOUR could never have caught: the `positive`
#   hue nudge (152.51deg -> 165deg, sage only) shipped correctly in
#   tokens.toml and every codegen output, but 20 hand-maintained deployables
#   across 7 files kept the pre-nudge hex (#71F79F / `113,247,159`) —
#   including share/color-schemes/SageInk.colors, the file install.sh
#   actually deploys, and IndigoGlass.colors, which turned out to have missed
#   an entire separate DecorationFocus accessibility fix since its initial
#   commit. COLOUR only hunts *forbidden* old-variant accents; it has no
#   notion of "this deployed value should equal that generated value" and so
#   had nothing to say about a token that changed value without changing
#   variant. PARITY closes that gap for the two surfaces with a byte-
#   comparable generated counterpart today (KDE .colors, Windows Terminal
#   JSON) — see KNOWN_PAIRS below for exactly which shipped files are
#   checked and why.
#
#   KNOWN GAP: codegen only emits a subset of keys per section (e.g.
#   ForegroundPositive only under [Colors:Window]), while the shipped KDE
#   .colors files correctly repeat the same semantic colour across 7
#   sections. PARITY can only verify the ~1 key codegen actually emits per
#   semantic colour — the other 6 hand-typed copies in the same file are
#   invisible to it. Direct generate-and-consume (extending the
#   tokens/out/*.ini -> apply_ini_to_config path already used for
#   kwinrc/klassy to emit the FULL .colors file, not a partial) removes this
#   gap entirely; PARITY is the detection floor until that lands.
#
# Usage:
#   scripts/check-palette-drift.sh              # colour + material + alpha + parity
#   scripts/check-palette-drift.sh --colour     # colour only
#   scripts/check-palette-drift.sh --material   # material only
#   scripts/check-palette-drift.sh --alpha      # alpha only
#   scripts/check-palette-drift.sh --parity     # parity only
#
# Escape hatch: append '# drift-allow' to a line to exempt it. Use sparingly
# and say why on the same line — an unexplained drift-allow is drift with a
# note attached.
#
# Exit 0 = clean. Exit 1 = drift found, file:line printed per hit.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

TOKENS_FILE="tokens/indigo-glass.tokens.toml"
ACTIVE_VARIANT="$(grep -E '^default_variant' "$TOKENS_FILE" | sed -E 's/.*"([a-z]+)".*/\1/')"

MODE="all"
case "${1:-}" in
  --colour|--color) MODE="colour" ;;
  --material)       MODE="material" ;;
  --alpha)          MODE="alpha" ;;
  --parity)         MODE="parity" ;;
  "")               MODE="all" ;;
  *) echo "unknown flag: $1" >&2; exit 2 ;;
esac

# Non-deployable: prose, tooling, generated output, and the simulator's own
# node_modules/build artefacts. Everything else in the repo is a layer config
# that ships to a real application and is therefore in scope.
#
# NOTE simulator/ IS scanned for material (it renders surfaces and is meant to
# be a faithful preview) but NOT for colour — it legitimately displays all
# three variants side by side on its /palettes route, so foreign-variant hex
# there is the feature, not drift.
NON_DEPLOYABLE=(docs research-reports scripts tokens)

mapfile -t ALL_DIRS < <(
  find . -maxdepth 1 -type d -not -name '.*' -not -name 'node_modules' \
    | sed 's|^\./||' | sort
)

COLOUR_DIRS=()
MATERIAL_DIRS=()
for d in "${ALL_DIRS[@]}"; do
  skip=0
  for nd in "${NON_DEPLOYABLE[@]}"; do
    [ "$d" = "$nd" ] && skip=1
  done
  [ "$skip" = 1 ] && continue
  MATERIAL_DIRS+=("$d")
  [ "$d" = "simulator" ] && continue
  COLOUR_DIRS+=("$d")
done

EXCLUDE=(
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=out
  --exclude-dir=.svelte-kit --exclude-dir=test-results --exclude-dir=build
  --exclude-dir=.work --exclude-dir=coverage
  --exclude=*.lock --exclude=*.md --exclude=*.png --exclude=*.jpg
  --exclude=check-palette-drift.sh
)

FOUND=0

# Drop lines carrying the escape hatch.
filter_allowed() { grep -v 'drift-allow' || true; }

# Per-variant installable files are SUPPOSED to carry a non-active variant's
# hex by design (e.g. share/color-schemes/IndigoGlass.colors is the indigo
# option, installed alongside the active sage scheme so either can be
# selected in KDE System Settings). Excluded from the colour check only.
VARIANT_FILE_EXCLUDE='share/color-schemes/IndigoGlass\.colors|share/konsole/IndigoGlass\.(colorscheme|profile)'
filter_variant_files() { grep -vE "$VARIANT_FILE_EXCLUDE" || true; }

# ===========================================================================
# 1. COLOUR — stale accent from a non-active variant
# ===========================================================================
# Accent-only. base/surface/text/semantic tokens are shared across variants on
# purpose, so matching those would false-positive on every file.
accent_literals_for() {
  python3 - "$1" <<'PY'
import sys, re, importlib.util
variant = sys.argv[1]
text = open("tokens/indigo-glass.tokens.toml").read()
block = re.search(rf'\[variants\.{variant}\](.*?)(?=\n\[|\Z)', text, re.S).group(1)
L, C, H = (float(x) for x in re.search(
    r'accent\s*=\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+)\]', block).groups())
spec = importlib.util.spec_from_file_location("cg", "tokens/codegen.py")
cg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cg)
for dl in (0, 0.08, -0.10):          # accent, accent_hi, accent_alt
    hx = cg.oklch_to_hex(min(max(L + dl, 0), 0.99), C, H)
    print(hx)                                    # #A8E635
    r, g, b = (int(hx[i:i+2], 16) for i in (1, 3, 5))
    print(f"{r},{g},{b}")                        # 168,230,53   (CSS rgba)
    print(f"{r}, {g}, {b}")                      # 168, 230, 53 (KConfigXT)
PY
}

if [ "$MODE" = "all" ] || [ "$MODE" = "colour" ]; then
  echo "Active variant: $ACTIVE_VARIANT"
  echo "Colour scan: ${#COLOUR_DIRS[@]} dirs"
  for v in indigo lime sage; do
    [ "$v" = "$ACTIVE_VARIANT" ] && continue
    literals="$(accent_literals_for "$v" | sort -u)"
    [ -z "$literals" ] && continue
    pattern="$(echo "$literals" | sed 's/[.[\*^$]/\\&/g' | tr '\n' '|' | sed 's/|$//')"
    # trailing `|| true`: a genuinely clean result means the last grep in
    # this pipeline matches nothing and exits 1, which set -e would treat
    # as this whole script failing before it ever prints "clean".
    hits="$(grep -rInE "$pattern" "${COLOUR_DIRS[@]}" "${EXCLUDE[@]}" 2>/dev/null | filter_allowed | filter_variant_files || true)"
    if [ -n "$hits" ]; then
      FOUND=1
      echo ""
      echo "--- stale '$v' accent (active variant is '$ACTIVE_VARIANT') ---"
      echo "$hits"
    fi
  done
fi

# ===========================================================================
# 2. MATERIAL — glass surviving in an ink system
# ===========================================================================
if [ "$MODE" = "all" ] || [ "$MODE" = "material" ]; then
  echo ""
  echo "Material scan: ${#MATERIAL_DIRS[@]} dirs (ink = opaque, zero blur, hard shadow)"

  # Hard fails: these have no meaning in an ink material at all.
  GLASS_PATTERNS='backdrop-filter|-webkit-backdrop-filter|feTurbulence|blur\('
  # backdrop-filter: none (and its -webkit- twin) is the CORRECT ink state,
  # not a violation - it's how a surface explicitly disclaims blur. Only
  # backdrop-filter set to an actual filter function is drift.
  hits="$(grep -rInE "$GLASS_PATTERNS" "${MATERIAL_DIRS[@]}" "${EXCLUDE[@]}" 2>/dev/null \
    | grep -vE '(-webkit-)?backdrop-filter\s*:\s*none\s*(!important)?\s*;?\s*$' \
    | filter_allowed || true)"
  if [ -n "$hits" ]; then
    FOUND=1
    echo ""
    echo "--- glass material (backdrop blur / grain texture) ---"
    echo "$hits"
  fi

  # Soft shadow: a box-shadow whose BLUR radius is non-zero. Ink's depth cue
  # is offset + colour, never softness. Parsed rather than regexed because
  # 'box-shadow: 0 0 0 2px' (a focus ring, legitimate) and
  # 'box-shadow: 0 4px 24px' (a glass shadow) differ only in one number.
  soft="$(python3 - "${MATERIAL_DIRS[@]}" <<'PY'
import os, re, sys
LEN = re.compile(r'^-?[\d.]+(px|rem|em)?$')
SKIP_DIR = {'node_modules', '.git', 'out', '.svelte-kit', 'test-results',
            'build', '.work', 'coverage'}
for root_arg in sys.argv[1:]:
    for root, dirs, files in os.walk(root_arg):
        dirs[:] = [d for d in dirs if d not in SKIP_DIR]
        for fn in files:
            if fn.endswith(('.png', '.jpg', '.webp', '.woff2', '.md', '.lock')):
                continue
            p = os.path.join(root, fn)
            try:
                lines = open(p, encoding='utf-8', errors='ignore').read().split('\n')
            except OSError:
                continue
            for n, line in enumerate(lines, 1):
                if 'box-shadow' not in line or 'drift-allow' in line:
                    continue
                m = re.search(r'box-shadow\s*:\s*([^;]+)', line)
                if not m:
                    continue
                val = m.group(1)
                # var() defers to the tokens, which are all hard now.
                if 'var(' in val or 'none' in val:
                    continue
                for shadow in val.split(','):
                    parts = [t for t in shadow.replace('inset', '').split() if t]
                    lens = [t for t in parts if LEN.match(t)]
                    # x y blur [spread] -> index 2 is the blur radius
                    if len(lens) >= 3:
                        blur = re.sub(r'[a-z]+$', '', lens[2])
                        try:
                            if float(blur) != 0:
                                print(f"{p}:{n}:{line.strip()[:120]}")
                                break
                        except ValueError:
                            pass
PY
)"
  if [ -n "$soft" ]; then
    FOUND=1
    echo ""
    echo "--- soft shadow (non-zero blur radius; ink uses offset + colour) ---"
    echo "$soft"
  fi

  # Klassy's own titlebar/button/menu opacity - completely separate from
  # KWin's blur effect and from tokens.toml's [opacity] table (which isn't
  # wired to anything live). Discovered live 2026-08-28: OpaqueTitleBar
  # defaults to false, which lets ActiveTitleBarOpacity/InactiveTitleBarOpacity
  # apply as real alpha regardless of the Override* flags - this is what
  # was actually making windows look transparent, independent of blur.
  klassy_opacity="$(grep -rnE '^(Active|Inactive)TitleBarOpacity=([0-9]|[1-9][0-9])$|^ButtonBackgroundOpacity(Active|Inactive)=([0-9]|[1-9][0-9])$|^MenuOpacity=([0-9]|[1-9][0-9])$|^OpaqueTitleBar=false$|^OpaqueMaximizedTitleBars=false$' config/klassy 2>/dev/null | filter_allowed || true)"
  if [ -n "$klassy_opacity" ]; then
    FOUND=1
    echo ""
    echo "--- Klassy opacity < 100 / OpaqueTitleBar false (ink's own transparency bug) ---"
    echo "$klassy_opacity"
  fi
fi

# ===========================================================================
# 3. ALPHA — a translucent value outside [alpha.exempt]
# ===========================================================================
# Every fill in Sage Ink is opaque and every on-select state is a solid-color
# outline (docs/STATE_GRAMMAR.md). The one real exception is alpha painted
# behind running content (selection, find-match, diff/merge, indent guides,
# drop-target previews, a modal scrim) - named in [alpha.exempt] in
# tokens/indigo-glass.tokens.toml. Runs over MATERIAL_DIRS (same scope as the
# material check, simulator included - its own canvas/CSS chrome is a real
# rendering surface, not just a palette-comparison page like /palettes).
if [ "$MODE" = "all" ] || [ "$MODE" = "alpha" ]; then
  echo ""
  echo "Alpha scan: ${#MATERIAL_DIRS[@]} dirs (opaque fills, outline-not-highlight on-select)"

  alpha_hits="$(python3 - "${MATERIAL_DIRS[@]}" <<'PY'
import os, re, sys, tomllib

SKIP_DIR = {'node_modules', '.git', 'out', '.svelte-kit', 'test-results',
            'build', '.work', 'coverage'}
# Binary/generated formats a grep-shaped scan can't safely read, plus SVG
# (fills there are checked as material/colour, not here) and font binaries
# (their compressed tables randomly contain '#xxxxxxxx'-shaped byte runs).
SKIP_EXT = ('.png', '.jpg', '.jpeg', '.webp', '.woff2', '.woff', '.ttf',
            '.otf', '.md', '.lock', '.ico', '.svg')

tokens = tomllib.load(open('tokens/indigo-glass.tokens.toml', 'rb'))

def normalize(s: str) -> str:
    # case- and separator-insensitive: "cm-indent-guide" (CSS selector),
    # "IndentGuide" (VSCode key) and "indent_guide" all reduce to the same
    # "indentguide", so one fragment list covers every naming convention in
    # the repo instead of needing a kebab/camel/snake variant of each.
    return re.sub(r'[-_]', '', s.lower())

FRAGMENTS = [normalize(f) for f in tokens['alpha']['exempt']['key_fragments']] + ['highlight', 'activeline']
# 'highlight' added unconditionally: every real hit reviewed while building
# this list (word-highlight, text-highlight-bg, wordHighlightStrong, ...) was
# content-highlighting, i.e. Tier A - the word only ever means that here.

RGBA = re.compile(r'rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*(0?\.\d+|0|1)\s*\)')
HEX8 = re.compile(r'#[0-9A-Fa-f]{8}\b')
# color-mix(in <space>, <color> N%, transparent) is functionally identical
# to rgba(<color>, N/100) - found leaking through undetected in the
# simulator's own CSS (scrollbar thumbs, chips, on-select tab/file/list rows)
# despite every rgba/hex8 instance of the same bug already being fixed.
# Only flagged when the SECOND component is literally 'transparent' -
# mixing toward another opaque color (e.g. a computed hover shade) is a
# real solid color at every point, not glass.
COLORMIX_TRANSPARENT = re.compile(
    r'color-mix\(\s*in\s+\w+\s*,[^,]+?\s(\d+(?:\.\d+)?)%\s*,\s*transparent\s*\)')
SHADOW_OR_GLOW = re.compile(r'shadow|glow', re.I)  # any hint of the property,
# not just box-/drop-/text-shadow literally - catches --ig-shadow-*-glow
# tokens and named shadow/glow variables too. Shadows are exempt everywhere
# in this codebase (established at the very start of the session); glow is
# the same idea (a soft accent halo), not a highlight wash.

def is_exempt(context: str) -> bool:
    norm = normalize(context)
    if any(frag in norm for frag in FRAGMENTS):
        return True
    # transient, non-scrollbar hover wash - established exception throughout
    # this codebase (a row/tab/item can preview its own click with a tint;
    # a persistent on-select state or a scrollbar thumb may not).
    if 'hover' in context and 'scrollbar' not in context and 'slider' not in context:
        return True
    return False

def alpha_of(match: 're.Match') -> float:
    s = match.group(0)
    if s.startswith('rgba'):
        return float(match.group(1))
    if s.startswith('color-mix'):
        return float(match.group(1)) / 100.0
    return int(s[7:9], 16) / 255.0

for root_arg in sys.argv[1:]:
    for root, dirs, files in os.walk(root_arg):
        dirs[:] = [d for d in dirs if d not in SKIP_DIR]
        for fn in files:
            if fn.endswith(SKIP_EXT):
                continue
            p = os.path.join(root, fn)
            try:
                raw_lines = open(p, encoding='utf-8', errors='ignore').read().split('\n')
            except OSError:
                continue
            in_shadow_block = False  # a shadow/glow value split across
            # multiple lines (each comma-separated layer on its own line) -
            # only the FIRST line carries the property name.
            in_block_comment = False  # /* opened without a closing */ on
            # the same line - the rest of the comment body must not be
            # scanned as if it were live code (it's usually the OLD value
            # being described, not the current one).
            # CSS/QML puts the identifying name on the selector/rule line
            # ("::selection {", ".cm-activeLine {", ".splitter_qlaBag:hover
            # {"), often one or more lines above the property that actually
            # carries the color, sometimes as a multi-line selector LIST
            # (".cm-indent-guide,\n.foo {"), and this repo's whole browser
            # Stylus files nest every rule inside one outer
            # "@-moz-document ... {" wrapper - so a flat "depth==0" check
            # isn't enough; a real stack, one entry per nesting level, is.
            ctx_stack: list[str] = []
            pending = ''       # selector text seen since the last brace event
            pop_count_next = 0  # closes seen on the previous line, applied
            # now (deferred, so that line's own matching still sees them)
            for n, raw in enumerate(raw_lines, 1):
                if 'drift-allow' in raw:
                    continue

                if pop_count_next:
                    for _ in range(pop_count_next):
                        if ctx_stack:
                            ctx_stack.pop()
                    pop_count_next = 0
                    pending = ''

                if in_block_comment:
                    end = raw.find('*/')
                    if end == -1:
                        continue
                    raw = raw[end + 2:]
                    in_block_comment = False

                # Strip comments, tracking one that opens but doesn't close
                # on this line (strip_comments alone would silently leave
                # the un-terminated comment body exposed to the regexes).
                line = raw
                while True:
                    start = line.find('/*')
                    if start == -1:
                        break
                    end = line.find('*/', start + 2)
                    if end == -1:
                        line = line[:start]
                        in_block_comment = True
                        break
                    line = line[:start] + line[end + 2:]
                line = re.sub(r'(?<!:)//.*$', '', line)  # (?<!:) keeps https://

                if '{' in line:
                    # First '{' on the line opens a new level - fold in
                    # BEFORE matching, so a one-liner sees its own :hover.
                    # (Only the first is handled: this codebase never opens
                    # two levels on one physical line.)
                    before = line.split('{', 1)[0]
                    ctx_stack.append((pending + ' ' + before).strip())
                    pending = ''
                else:
                    pending = (pending + ' ' + line).strip()
                selector_ctx = ' '.join(ctx_stack)
                if '}' in line:
                    pop_count_next += line.count('}')

                low = line.lower()
                if in_shadow_block:
                    if ';' in line:
                        in_shadow_block = False
                    continue
                if SHADOW_OR_GLOW.search(selector_ctx) or SHADOW_OR_GLOW.search(low):
                    if ';' not in line:
                        in_shadow_block = True
                    continue
                for pattern in (RGBA, HEX8, COLORMIX_TRANSPARENT):
                    m = pattern.search(line)
                    if not m:
                        continue
                    a = alpha_of(m)
                    if a <= 0 or a >= 1:
                        continue  # fully transparent or already opaque
                    if is_exempt(selector_ctx + ' ' + low):
                        continue
                    print(f"{p}:{n}:{raw.strip()[:120]}")
                    break
PY
)"
  if [ -n "$alpha_hits" ]; then
    FOUND=1
    echo ""
    echo "--- translucent value outside [alpha.exempt] (glass edge / highlight wash) ---"
    echo "$alpha_hits"
  fi
fi

# ===========================================================================
# 4. PARITY — a shipped deployable disagrees with its own generated source
# ===========================================================================
# COLOUR hunts forbidden old-variant accents. It has no notion of "this
# deployed value should equal that generated value" and so cannot catch a
# token whose value changed WITHOUT the variant changing (see v4 note above).
# PARITY does a direct equality diff, generated vs shipped, key by key.
#
# Only wired for the surfaces that have an actual generated counterpart to
# diff against today. Extending this list means extending codegen.py first,
# not adding a shipped file's guessed structure here.
if [ "$MODE" = "all" ] || [ "$MODE" = "parity" ]; then
  echo ""
  echo "Parity scan: shipped deployables vs their generated source"

  parity_hits="$(python3 - <<'PY'
import json, re

FOUND = []

def kv_sections(path):
    """Parse a KDE-style .colors/.ini file into {(section, key): value}."""
    out, cur = {}, None
    for line in open(path, encoding='utf-8').read().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if line.startswith('['):
            cur = line
        elif '=' in line and cur:
            k, v = line.split('=', 1)
            out[(cur, k)] = v
    return out

# [General] carries codegen's internal slug (Name=SageInk) vs the shipped
# file's human-readable display name (Name=Sage Ink) plus a ColorScheme= id
# codegen never emits at all — a real schema difference, not palette drift.
SKIP_SECTIONS = {'[General]'}

def check_kv_pair(generated, shipped, label):
    g, s = kv_sections(generated), kv_sections(shipped)
    for key in sorted(set(g) & set(s)):
        if key[0] in SKIP_SECTIONS:
            continue
        if g[key] != s[key]:
            FOUND.append(
                f"{shipped}: [{key[0].strip('[]')}] {key[1]} = {s[key]}  "
                f"(generated {label} says {g[key]})")

def check_json_pair(generated, shipped, label):
    g = json.load(open(generated))
    s = json.load(open(shipped))
    for key in sorted(set(g) & set(s)):
        if g[key] != s[key]:
            FOUND.append(
                f"{shipped}: \"{key}\" = {s[key]!r}  "
                f"(generated {label} says {g[key]!r})")

# KNOWN_PAIRS: (generated file, shipped deployable, human label for the
# message). The shipped file's own header/install.sh usage decides which
# generated variant it must match — see the file for the reasoning.
try:
    check_kv_pair('tokens/out/kde-palette.sage.colors',
                  'share/color-schemes/SageInk.colors', 'sage')
    check_kv_pair('tokens/out/kde-palette.indigo.colors',
                  'share/color-schemes/IndigoGlass.colors', 'indigo')
    # windows/terminal/indigo-glass.scheme.json ships the ACTIVE variant
    # (sage) under a legacy filename — install.ps1 logs "Injected Sage Ink
    # scheme" and its own content is named "Sage Ink", not "Indigo Glass".
    check_json_pair('tokens/out/wt-scheme.json',
                    'windows/terminal/indigo-glass.scheme.json',
                    'active/sage default')
except FileNotFoundError as e:
    print(f"PARITY_SKIP: {e}")

for line in FOUND:
    print(line)
PY
)"
  skip_lines="$(echo "$parity_hits" | grep '^PARITY_SKIP:' || true)"
  [ -n "$skip_lines" ] && echo "$skip_lines" >&2
  parity_hits="$(echo "$parity_hits" | grep -v '^PARITY_SKIP:' || true)"
  if [ -n "$parity_hits" ]; then
    FOUND=1
    echo ""
    echo "--- shipped file disagrees with its own generated source ---"
    echo "$parity_hits"
  fi
fi

echo ""
if [ "$FOUND" -eq 0 ]; then
  echo "clean — no colour, material, alpha, or parity drift"
  exit 0
else
  echo "DRIFT FOUND — see file:line above."
  echo "  colour   -> regenerate from tokens/out/* instead of hand-editing"
  echo "  material -> Sage Ink is opaque: drop the blur, flatten the fill,"
  echo "              use --ig-shadow-ink (hard offset) for elevation"
  echo "  alpha    -> composite to an opaque hex (a real token where"
  echo "              possible), or outline instead of filling an on-select"
  echo "              state - see docs/STATE_GRAMMAR.md"
  echo "  parity   -> copy the generated value over the shipped one; if the"
  echo "              shipped file is a hand-merged partial (comment says"
  echo "              'source of truth'), regenerate it in full instead of"
  echo "              patching the one key"
  exit 1
fi
