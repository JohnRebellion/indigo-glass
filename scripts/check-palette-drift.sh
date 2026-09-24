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
#   variant. PARITY closed that gap for the two surfaces with a byte-
#   comparable generated counterpart (KDE .colors, Windows Terminal JSON).
#
#   Second pass, same day: the KV/JSON key-overlap differ this comment
#   originally described had a real gap of its own — codegen only emitted a
#   subset of keys per section, so most hand-typed duplicates of the same
#   semantic colour were invisible to it. Closed by extending
#   emit_kde_colors() to generate every section install.sh deploys (see
#   tokens/codegen.py's SHIPPED_KDE_SCHEMES), so PARITY now just runs
#   `tokens/codegen.py --check` — simpler and strictly more thorough than the
#   differ it replaced, since it's a full-file comparison, not a key overlap.
#
# v5 (2026-09-16) — added a fifth dimension, CURRENCY, after a cross-model
#   audit ran the one experiment nobody had run against this guard: change a
#   token and ask whether the repo is still consistent. Measured on v4 —
#   nudge the sage accent hue by 10deg, run codegen.py, run this script:
#   13 files regenerate, 31 tracked files keep the old #A6C9A6, and the guard
#   prints "clean" and exits 0. Among the 31 are config/gtk-3.0/gtk.css,
#   config/gtk-4.0/gtk.css, config/starship.toml and
#   share/konsole/SageInk.profile — all deployed by install.sh.
#
#   That is v1's failure mode ("guard clean, shipped themes stale") reproduced
#   by the guard written to end it. The hole is structural, not an oversight
#   in a pattern list: COLOUR hunts only a NON-ACTIVE variant's accent, so a
#   variant that keeps its name and changes its value is invisible to it;
#   PARITY covers only the surfaces with a byte-comparable generated
#   counterpart. A changed accent falls between them.
#
#   CURRENCY closes it by asking a question about history rather than about
#   the current file: which accent literals did this revision supersede, and
#   does any deployable still carry one? Baseline is HEAD when the tokens are
#   edited but uncommitted, HEAD~1 otherwise.
#
#   scripts/test-drift-guard.sh is the executable form of the paragraph above.
#   It fails against v4 and passes against v5. Run it after touching this file.
#
# Usage:
#   scripts/check-palette-drift.sh              # all six scans
#   scripts/check-palette-drift.sh --colour     # colour only
#   scripts/check-palette-drift.sh --currency   # currency only
#   scripts/check-palette-drift.sh --material   # material only
#   scripts/check-palette-drift.sh --alpha      # alpha only
#   scripts/check-palette-drift.sh --parity     # parity only
#   scripts/check-palette-drift.sh --shadow     # shadow geometry + tone only
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
  --currency)       MODE="currency" ;;
  --parity)         MODE="parity" ;;
  --shadow)         MODE="shadow" ;;
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
# backups/ holds snapshots of PAST state — Stylus exports taken before a
# profile is updated, so they contain superseded brand eras by construction.
# Scanning them reports drift that is the point of the archive.
NON_DEPLOYABLE=(docs research-reports scripts tokens backups)

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

# The simulator's /sites/<id>/ comparison pages render each Stylus target's
# STOCK elements beside the same markup under the shipped .user.css. The stock
# lane, simulator/src/lib/sites/<id>/stock.css, reproduces the vendor's own
# blur, soft shadow and translucency on purpose — it is the "before" the
# .user.css removes, and e2e/sites.spec.ts proves the "ours" lane repaints it.
# Excluded from the material-family scans only; Page.svelte and every other
# file beside it stay in scope. Added 2026-09-24.
STOCK_LANE='^simulator/src/lib/sites/[^/]+/stock\.css:'
filter_stock_lanes() { grep -vE "$STOCK_LANE" || true; }

# Per-variant installable files are SUPPOSED to carry a non-active variant's
# hex by design (e.g. share/color-schemes/IndigoGlass.colors is the indigo
# option, installed alongside the active sage scheme so either can be
# selected in KDE System Settings). Excluded from the colour check only.
VARIANT_FILE_EXCLUDE='share/color-schemes/IndigoGlass\.colors|share/konsole/IndigoGlass\.(colorscheme|profile)'
filter_variant_files() { grep -vE "$VARIANT_FILE_EXCLUDE" || true; }

# The GRUB theme declares its own variant in theme.txt's `# variant:` header
# (orchid_light since 2026-09-23 - the boot screen is light on purpose while
# the desktop stays on the active dark variant). Its generators and
# scripts/check-ink-contract.py hold every hex under share/grub-theme/ to THAT
# variant's tokens, so its accents are not stale there; any OTHER non-active
# variant's accent in those files is still drift and is still hunted below.
GRUB_THEME="share/grub-theme/theme.txt"
GRUB_VARIANT="$( [ -f "$GRUB_THEME" ] && sed -n 's/^# variant: *//p' "$GRUB_THEME" | head -1 || true)"
filter_grub_variant() { # filter_grub_variant <variant-being-hunted>
  if [ -n "$GRUB_VARIANT" ] && [ "$1" = "$GRUB_VARIANT" ]; then
    grep -vE '^share/grub-theme/' || true
  else
    cat
  fi
}

# ===========================================================================
# 1. COLOUR — stale accent from a non-active variant
# ===========================================================================
# Accent-only. base/surface/text/semantic tokens are shared across variants on
# purpose, so matching those would false-positive on every file.
# accent_literals_for <variant> [tokens-file]
# Emits the variant's accent, accent_hi and accent_alt in all three spellings
# this repo writes colours in. The optional second argument lets CURRENCY pass
# a tokens file extracted from a git ref instead of the working tree's.
# Every variant the TOML declares, in file order. Hardcoding "indigo lime sage"
# silently skipped rust, orchid and orchid_light, and would skip any variant
# added later — these scans are only as complete as this list.
mapfile -t ALL_VARIANTS < <(
  grep -oE '^\[variants\.[A-Za-z0-9_]+\]' "$TOKENS_FILE" \
    | sed -E 's/^\[variants\.(.*)\]$/\1/'
)

accent_literals_for() {
  python3 - "$1" "${2:-$TOKENS_FILE}" <<'PY'
import sys, re, importlib.util
variant = sys.argv[1]
text = open(sys.argv[2]).read()
m = re.search(rf'\[variants\.{variant}\](.*?)(?=\n\[|\Z)', text, re.S)
if not m:
    sys.exit(0)          # variant absent from this revision — nothing to compare
block = m.group(1)

def triple(key):
    """The variant block's own value for `key`, or None if it does not set one."""
    mm = re.search(rf'^{key}\s*=\s*\[\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]',
                   block, re.M)
    return tuple(float(x) for x in mm.groups()) if mm else None

base = triple('accent')
if base is None:
    sys.exit(0)
spec = importlib.util.spec_from_file_location("cg", "tokens/codegen.py")
cg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cg)

# accent_hi and accent_alt are INDEPENDENT triples in the TOML, not lightness
# offsets of accent. v5 derived them as L+0.08 / L-0.10 and so hunted hexes
# codegen never emits: sage alt was hunted as #88A988 against an emitted
# #89A889, and indigo's pair (#7483ED/#444CB1) existed nowhere at all. That
# made CURRENCY miss an accent_alt-only edit entirely (31 stale deployables,
# guard "clean") while reporting the still-current accent_hi as superseded.
# Read the block's own values; derive only for a key the block omits.
L, C, H = base
for key, fallback in (('accent',     base),
                      ('accent_hi',  (L + 0.08, C, H)),
                      ('accent_alt', (L - 0.10, C, H))):
    l, c, h = triple(key) or fallback
    hx = cg.oklch_to_hex(min(max(l, 0), 0.99), c, h)
    print(hx)                                    # #A8E635
    r, g, b = (int(hx[i:i+2], 16) for i in (1, 3, 5))
    print(f"{r},{g},{b}")                        # 168,230,53   (CSS rgba)
    print(f"{r}, {g}, {b}")                      # 168, 230, 53 (KConfigXT)
PY
}

if [ "$MODE" = "all" ] || [ "$MODE" = "colour" ]; then
  echo "Active variant: $ACTIVE_VARIANT"
  echo "Colour scan: ${#COLOUR_DIRS[@]} dirs"
  # The active variant's LIGHT COUNTERPART is not a foreign variant: it is the
  # other half of one shipped theme pair, and a light theme carries its own
  # accent ladder by necessity (sage #A6C9A6 measures 1.82:1 on white, so a
  # light build cannot reuse the dark accents and stay legible). Convention is
  # "<active>_light", matching [variants.sage_light] / [variants.orchid_light]
  # and codegen's THEME_PAIRS. Added 2026-09-22 with the generated VSCode
  # light theme, which is the first deployable to carry these literals.
  for v in "${ALL_VARIANTS[@]}"; do
    [ "$v" = "$ACTIVE_VARIANT" ] && continue
    [ "$v" = "${ACTIVE_VARIANT}_light" ] && continue
    literals="$(accent_literals_for "$v" | sort -u)"
    [ -z "$literals" ] && continue
    pattern="$(echo "$literals" | sed 's/[.[\*^$]/\\&/g' | tr '\n' '|' | sed 's/|$//')"
    # trailing `|| true`: a genuinely clean result means the last grep in
    # this pipeline matches nothing and exits 1, which set -e would treat
    # as this whole script failing before it ever prints "clean".
    hits="$(grep -rInE "$pattern" "${COLOUR_DIRS[@]}" "${EXCLUDE[@]}" 2>/dev/null | filter_allowed | filter_variant_files | filter_grub_variant "$v" || true)"
    if [ -n "$hits" ]; then
      FOUND=1
      echo ""
      echo "--- stale '$v' accent (active variant is '$ACTIVE_VARIANT') ---"
      echo "$hits"
    fi
  done
fi

# ===========================================================================
# 1b. CURRENCY — a superseded accent of ANY variant, including the active one
# ===========================================================================
# COLOUR above only hunts a NON-ACTIVE variant's accent, so it is blind to the
# case where a variant keeps its name and changes its value. PARITY only covers
# the surfaces that have a byte-comparable generated counterpart. Between the
# two sits the failure this scan exists for: edit an accent in the TOML,
# regenerate, and the 13 generated files move while every hand-typed copy of
# the old hex stays put — in GTK CSS, the Konsole profile, starship, SDDM and
# the browser themes. Measured 2026-09-16 on the v4 guard: 31 tracked files
# stale, guard "clean", exit 0.
#
# The comparison is against git, because "superseded" is a statement about
# history, not about the current file. Baseline is HEAD when the working tree
# has edited the tokens, otherwise HEAD~1 so a change that was just committed
# is still checked.
if [ "$MODE" = "all" ] || [ "$MODE" = "currency" ]; then
  echo ""
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "Currency scan: skipped (not a git checkout)"
  else
    if ! git diff --quiet HEAD -- "$TOKENS_FILE" 2>/dev/null; then
      BASE_REF="HEAD"                 # tokens edited but not yet committed
    else
      # The parent of the last commit that TOUCHED the tokens, not HEAD~1.
      # HEAD~1 is a one-commit window: land a token change, then any unrelated
      # commit, and the superseded value drops out of the comparison entirely,
      # so a stale literal introduced after that point passes silently.
      # Anchoring to the token history keeps the window open until it is fixed.
      LAST_TOKEN_COMMIT="$(git log -1 --format=%H -- "$TOKENS_FILE" 2>/dev/null)"
      if [ -n "$LAST_TOKEN_COMMIT" ]; then
        BASE_REF="${LAST_TOKEN_COMMIT}^"
      else
        BASE_REF="HEAD~1"             # no history for the file; best effort
      fi
    fi

    BASE_TOKENS="$(mktemp)"
    if git show "$BASE_REF:$TOKENS_FILE" > "$BASE_TOKENS" 2>/dev/null; then
      echo "Currency scan: superseded accents vs $BASE_REF"
      for v in "${ALL_VARIANTS[@]}"; do
        before="$(accent_literals_for "$v" "$BASE_TOKENS" | sort -u)"
        after="$(accent_literals_for "$v" "$TOKENS_FILE"  | sort -u)"
        [ -z "$before" ] && continue
        superseded="$(comm -23 <(echo "$before") <(echo "$after"))"
        [ -z "$superseded" ] && continue
        pattern="$(echo "$superseded" | sed 's/[.[\*^$]/\\&/g' | tr '\n' '|' | sed 's/|$//')"
        hits="$(grep -rInE "$pattern" "${COLOUR_DIRS[@]}" "${EXCLUDE[@]}" 2>/dev/null | filter_allowed | filter_variant_files || true)"
        if [ -n "$hits" ]; then
          FOUND=1
          echo ""
          echo "--- superseded '$v' accent still present (changed since $BASE_REF) ---"
          echo "$hits"
        fi
      done
    else
      echo "Currency scan: skipped (no $BASE_REF revision of $TOKENS_FILE)"
    fi
    rm -f "$BASE_TOKENS"
  fi
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
    | filter_allowed | filter_stock_lanes || true)"
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
)" || true
  soft="$(printf '%s\n' "$soft" | filter_stock_lanes)"
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
)" || true
  alpha_hits="$(printf '%s\n' "$alpha_hits" | filter_stock_lanes)"
  if [ -n "$alpha_hits" ]; then
    FOUND=1
    echo ""
    echo "--- translucent value outside [alpha.exempt] (glass edge / highlight wash) ---"
    echo "$alpha_hits"
  fi
fi

# ===========================================================================
# 3b. TIER C FILL — an on-select selector painted with an OPAQUE fill
# ===========================================================================
# 2026-09-04: the GTK file-chooser on-select bug (docs/STATE_GRAMMAR.md
# Tier C) was an opaque accent fill, not a translucent one - `alpha_of()`
# above only fires on values with 0 < alpha < 1, so a solid
# `background-color: @theme_selected_bg_color` on `row:selected` sailed
# through every prior scan clean. This closes that half of Tier C: a real
# on-select noun (row/treeview/list/placessidebar/nav, or the documented
# menuitem-hover-is-select case) paired with a non-transparent background
# is flagged, unless it also matches a Tier D identity-fill allowlist
# fragment (checkbox/radio/switch/button/badge/tag/chip/scrollbar) - those
# keep their fill deliberately, per STATE_GRAMMAR's own Tier D examples.
if [ "$MODE" = "all" ] || [ "$MODE" = "alpha" ]; then
  echo ""
  echo "Tier C scan: ${#MATERIAL_DIRS[@]} dirs (on-select noun + opaque fill)"

  tierc_hits="$(python3 - "${MATERIAL_DIRS[@]}" <<'PY'
import os, re, sys

SKIP_DIR = {'node_modules', '.git', 'out', '.svelte-kit', 'test-results',
            'build', '.work', 'coverage'}
SKIP_EXT = ('.png', '.jpg', '.jpeg', '.webp', '.woff2', '.woff', '.ttf',
            '.otf', '.md', '.lock', '.ico', '.svg')

def normalize(s: str) -> str:
    return re.sub(r'[-_]', '', s.lower())

# Tier D identity-fill nouns (docs/STATE_GRAMMAR.md): these keep a fill on
# purpose - a checkbox/switch/radio/button IS in that state, a badge/tag/
# chip/scrollbar-thumb is identity, not "what's happening right now".
ALLOW_FRAGMENTS = ['checkbutton', 'checkbox', 'radiobutton', 'radio',
                   'switch', 'button', 'badge', 'tag', 'chip', 'scrollbar',
                   'slider', 'progress']

# Tier C on-select nouns named explicitly in STATE_GRAMMAR.md: "a clickable
# list row / tab / menu item / nav entry". `:selected` covers the row/list/
# nav case; `menuitem:hover` / `modelbutton:hover` is this codebase's own
# documented on-select-via-hover case for menu items (a menu item's hover
# IS its on-select state - there's no separate :selected pseudo-class for
# them in GTK). Tab is excluded: both toolkits already render it as a thin
# accent indicator strip, not a fill, so it never lands here regardless.
#
# `:selected` alone over-matches two ways, both real false positives hit on
# the first run of this scan (2026-09-04):
#   - `:not(:selected)` (the documented hover-preview exception, e.g.
#     `row:hover:not(:selected)`) contains the literal substring `:selected`
#     - stripped out before matching.
#   - bare `*:selected` / `selection` (generic CSS text selection - Tier A,
#     permanently exempt, genuinely needs a real fill) isn't row/list/nav-
#     specific - a Tier C noun must ALSO be present in the same selector.
NOT_SELECTED = re.compile(r'not\(\s*:selected\s*\)')
TIERC_NOUN = re.compile(r'\b(row|treeview|list|placessidebar|sidebar|nav)\b')
TIERC_HOVER_AS_SELECT = re.compile(r'\b(menuitem|modelbutton)\s*:\s*hover\b')
BG_PROP = re.compile(r'\bbackground(?:-color)?\s*:\s*([^;]+);')
TRANSPARENT_VALUES = {'transparent', 'none', 'inherit', 'initial', 'unset'}

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
            in_block_comment = False
            ctx_stack: list[str] = []
            pending = ''
            pop_count_next = 0
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
                line = re.sub(r'(?<!:)//.*$', '', line)

                if '{' in line:
                    before = line.split('{', 1)[0]
                    ctx_stack.append((pending + ' ' + before).strip())
                    pending = ''
                else:
                    pending = (pending + ' ' + line).strip()
                selector_ctx = ' '.join(ctx_stack)
                if '}' in line:
                    pop_count_next += line.count('}')

                ctx_sans_negation = NOT_SELECTED.sub('', selector_ctx)
                has_selected = ':selected' in ctx_sans_negation and bool(TIERC_NOUN.search(selector_ctx))
                is_tierc = has_selected or bool(TIERC_HOVER_AS_SELECT.search(selector_ctx))
                if not is_tierc:
                    continue
                norm_ctx = normalize(selector_ctx)
                if any(frag in norm_ctx for frag in ALLOW_FRAGMENTS):
                    continue
                m = BG_PROP.search(line)
                if not m:
                    continue
                value = m.group(1).strip().strip('"\'').lower()
                if value in TRANSPARENT_VALUES or value.startswith('rgba(') or value.endswith(', 0)'):
                    continue  # transparent, or already caught as alpha above
                print(f"{p}:{n}:{raw.strip()[:120]}")
PY
)" || true

  tierc_hits="$(printf '%s\n' "$tierc_hits" | filter_stock_lanes)"
  if [ -n "$tierc_hits" ]; then
    FOUND=1
    echo ""
    echo "--- opaque fill on a Tier C on-select selector (outline, not fill) ---"
    echo "$tierc_hits"
  fi
fi

# ===========================================================================
# 4. PARITY — a shipped deployable disagrees with its own generated source
# ===========================================================================
# 2026-09-01, second pass: PARITY originally ran its own key-by-key KV/JSON
# differ here, documenting a real gap - codegen only emitted a SUBSET of keys
# per section (e.g. ForegroundPositive only under [Colors:Window]), so most
# of a shipped file's hand-typed duplicates of the same semantic colour were
# structurally invisible to it. That gap is closed now: emit_kde_colors
# generates every section install.sh deploys (see its docstring and
# SHIPPED_KDE_SCHEMES in tokens/codegen.py), so share/color-schemes/*.colors
# and windows/terminal/indigo-glass.scheme.json are fully generated
# deployables, not hand-merged partials. A full-file check is therefore both
# simpler AND strictly more thorough than the old key-overlap differ -
# delegate to it rather than maintain two ways of asking the same question.
if [ "$MODE" = "all" ] || [ "$MODE" = "parity" ]; then
  echo ""
  echo "Parity scan: tokens/codegen.py --check (shipped deployables vs generated)"

  parity_hits="$(python3 tokens/codegen.py --check 2>&1 || true)"
  if [ -n "$parity_hits" ]; then
    FOUND=1
    echo ""
    echo "--- shipped file disagrees with its own generated source ---"
    echo "$parity_hits"
    echo "  -> run: python3 tokens/codegen.py"
  fi
fi

# =============================================================================
# v5 (2026-09-02) - SHADOW. The fifth dimension, added after a cross-model
# audit found three defects that every existing check called clean:
#
#   1. GEOMETRY. [shadow].ink was doubled to 8px on 2026-08-28 and reverted
#      the SAME DAY. tokens.toml and every generated output went back to 4px;
#      five hand-maintained deployables (GTK3, GTK4, Obsidian, Spicetify,
#      Vencord) kept 8px for months, and docs/PHILOSOPHY.md + docs/REFERENCE.md
#      kept DOCUMENTING 8px, so the wrong value had four mutually-confirming
#      sources. MATERIAL only rejects a non-zero blur radius, and "8px 8px 0 0"
#      is a perfectly hard shadow, so it passed.
#
#   2. TONE. A shadow is a displaced copy of the object casting it, so it has
#      to separate from that object's FILL. Sage on the sage accent measures
#      1.44:1 - the shadow is simply not there. GTK's button.suggested-action
#      shipped exactly that. No prior check had any notion of which fill a
#      shadow belongs to.
#
#   3. ORPHANS. Spicetify carried #252528 as a track fill. When border_strong
#      moved 0.10 -> 0.335 alpha that literal stopped matching any token at
#      all. COLOUR only hunts FORBIDDEN old-variant accents; a value that is
#      merely unmoored from the token file is invisible to it.
#
# This check reads the offsets straight out of tokens.toml rather than
# hardcoding them, so reverting a taste call can never again leave deployables
# behind.
# =============================================================================
if [ "$MODE" = "all" ] || [ "$MODE" = "shadow" ]; then
  echo ""
  echo "Shadow scan: geometry + tone (offsets from tokens.toml, not hardcoded)"

  shadow_hits="$(python3 - "${MATERIAL_DIRS[@]}" <<'PY_SHADOW'
import os, re, sys, tomllib

SKIP_DIR = {'node_modules', '.git', 'out', '.svelte-kit', 'test-results',
            'build', '.work', 'coverage', 'screenshots'}
SKIP_EXT = ('.png', '.jpg', '.jpeg', '.webp', '.woff2', '.woff', '.ttf',
            '.otf', '.md', '.lock', '.ico', '.svg', '.pf2')

tok = tomllib.load(open('tokens/indigo-glass.tokens.toml', 'rb'))
def off(key):
    m = re.match(r'(\d+)px\s+(\d+)px', tok['shadow'][key])
    return (int(m.group(1)), int(m.group(2))) if m else None

allowed = {off('ink'), off('ink_lg')}
allowed.discard(None)
allowed |= {(0, 0)}                      # ink_press collapse
allowed |= {(2, 2)}                      # switch/slider thumb, a deliberate
                                         # half-step on a 16-20px control
HARD = re.compile(r'box-shadow:\s*(?:inset\s+)?(\d+)px\s+(\d+)px\s+0')

hits = []
for root_arg in sys.argv[1:]:
    for root, dirs, files in os.walk(root_arg):
        dirs[:] = [d for d in dirs if d not in SKIP_DIR]
        for fn in files:
            if fn.endswith(SKIP_EXT):
                continue
            p = os.path.join(root, fn)
            try:
                lines = open(p, encoding='utf-8', errors='ignore').read().split('\n')
            except OSError:
                continue
            for n, raw in enumerate(lines, 1):
                if 'drift-allow' in raw:
                    continue
                m = HARD.search(raw)
                if not m:
                    continue
                pair = (int(m.group(1)), int(m.group(2)))
                if pair not in allowed:
                    ok = ' or '.join(f'{a}px {b}px' for a, b in sorted(allowed) if (a, b) != (0, 0))
                    hits.append(f'{p}:{n}: offset {pair[0]}px {pair[1]}px is not a [shadow] token ({ok})')
for h in hits:
    print(h)
PY_SHADOW
)" || true

  shadow_hits="$(printf '%s\n' "$shadow_hits" | filter_stock_lanes)"
  if [ -n "$shadow_hits" ]; then
    FOUND=$((FOUND + 1))
    echo ""
    echo "--- shadow geometry drifted from [shadow] in tokens.toml ---"
    echo "$shadow_hits"
  fi
fi

echo ""
if [ "$FOUND" -eq 0 ]; then
  echo "clean — no colour, currency, material, alpha, parity, or shadow drift"
  exit 0
else
  echo "DRIFT FOUND — see file:line above."
  echo "  colour   -> regenerate from tokens/out/* instead of hand-editing"
  echo "  material -> Sage Ink is opaque: drop the blur, flatten the fill,"
  echo "              use --ig-shadow-ink (hard offset) for elevation"
  echo "  alpha    -> composite to an opaque hex (a real token where"
  echo "              possible), or outline instead of filling an on-select"
  echo "              state - see docs/STATE_GRAMMAR.md"
  echo "  shadow   -> use an offset from [shadow] in tokens.toml; a shadow"
  echo "              on an accent-filled surface takes the BASE colour, not"
  echo "              accent_alt - see docs/PHILOSOPHY.md 'Tone context'"
  echo "  parity   -> copy the generated value over the shipped one; if the"
  echo "              shipped file is a hand-merged partial (comment says"
  echo "              'source of truth'), regenerate it in full instead of"
  echo "              patching the one key"
  exit 1
fi
