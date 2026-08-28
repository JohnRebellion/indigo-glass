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
# Usage:
#   scripts/check-palette-drift.sh              # colour + material
#   scripts/check-palette-drift.sh --colour     # colour only
#   scripts/check-palette-drift.sh --material   # material only
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

echo ""
if [ "$FOUND" -eq 0 ]; then
  echo "clean — no colour or material drift"
  exit 0
else
  echo "DRIFT FOUND — see file:line above."
  echo "  colour   -> regenerate from tokens/out/* instead of hand-editing"
  echo "  material -> Sage Ink is opaque: drop the blur, flatten the fill,"
  echo "              use --ig-shadow-ink (hard offset) for elevation"
  exit 1
fi
