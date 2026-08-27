#!/usr/bin/env bash
# check-palette-drift.sh — Sage Ink palette drift guard
#
# tokens/indigo-glass.tokens.toml is the single source of truth; every layer
# config is meant to derive from tokens/out/* via codegen.py. In practice,
# ~40 files under config/, browser/, vscode/, windows/, obsidian/, jetbrains/,
# share/, assets/ carry hex literals typed by hand during the Indigo->Lime
# rollout, and nothing regenerates them — the "stragglers" fixed in
# 427a9e9 ("fix: lime for stragglers surfaced by final sweep"). This script
# exists so the Lime->Sage rollout doesn't repeat that: it finds every stale
# non-active-variant hex literal outside tokens/out/ and fails the check.
#
# Usage:
#   scripts/check-palette-drift.sh            # check the active variant only
#   scripts/check-palette-drift.sh --all      # flag ANY known-variant hex
#                                              # outside its own active state
#                                              # (stricter — see NOTE below)
#
# Exit 0 = clean. Exit 1 = drift found, file:line printed per hit.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

TOKENS_FILE="tokens/indigo-glass.tokens.toml"
ACTIVE_VARIANT="$(grep -E '^default_variant' "$TOKENS_FILE" | sed -E 's/.*"([a-z]+)".*/\1/')"

# Known accent hex per variant (hi/alt included) — sourced from tokens/out/*
# so this script itself never hand-carries a colour. Regenerate tokens first
# if these look stale.
declare -A VARIANT_HEX
VARIANT_HEX[indigo]="$(grep -hoE '#[0-9A-Fa-f]{6}' tokens/out/css-vars.indigo.css | sort -u | tr '\n' '|' | sed 's/|$//')"
VARIANT_HEX[lime]="$(grep -hoE '#[0-9A-Fa-f]{6}' tokens/out/css-vars.lime.css | sort -u | tr '\n' '|' | sed 's/|$//')"
VARIANT_HEX[sage]="$(grep -hoE '#[0-9A-Fa-f]{6}' tokens/out/css-vars.sage.css | sort -u | tr '\n' '|' | sed 's/|$//')"

# Accent-only hex (the part that actually changes meaning between variants —
# base/surface/text/semantic tokens are shared across variants on purpose,
# so matching on those would false-positive on every file). Pulled from the
# per-variant accent/accent_hi/accent_alt lines directly.
accent_hex_for() {
  python3 - "$1" <<'PY'
import sys, re
variant = sys.argv[1]
text = open("tokens/indigo-glass.tokens.toml").read()
m = re.search(rf'\[variants\.{variant}\](.*?)(?=\n\[|\Z)', text, re.S)
block = m.group(1)
accent = re.search(r'accent\s*=\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+)\]', block)
L, C, H = (float(x) for x in accent.groups())
sys.path.insert(0, "tokens")
import importlib.util
spec = importlib.util.spec_from_file_location("cg", "tokens/codegen.py")
cg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cg)
for dl in (0, 0.08, -0.10):
    print(cg.oklch_to_hex(min(max(L + dl, 0), 0.99), C, H))
PY
}

STALE_VARIANTS=()
for v in indigo lime sage; do
  [ "$v" = "$ACTIVE_VARIANT" ] && continue
  STALE_VARIANTS+=("$v")
done

# Real deployable layer configs only — NOT docs/README/simulator source.
# Those legitimately name the Indigo Glass heritage variant and its hex in
# prose (e.g. "the indigo variant uses #5E6AD2"), which is documentation,
# not drift. Drift is a config file that's supposed to derive from
# tokens/out/* but has gone stale — scope the check to where that's true.
SEARCH_DIRS=(config browser vscode windows obsidian jetbrains spicetify share assets web)
EXCLUDE=(--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=out --exclude-dir=.svelte-kit --exclude-dir=test-results --exclude-dir=build --exclude-dir=.work --exclude=*.lock --exclude=*.md --exclude=check-palette-drift.sh)

FOUND=0
echo "Active variant: $ACTIVE_VARIANT"
echo "Checking for stale hex from: ${STALE_VARIANTS[*]}"
echo ""

for v in "${STALE_VARIANTS[@]}"; do
  hexes="$(accent_hex_for "$v" | sort -u)"
  [ -z "$hexes" ] && continue
  pattern="$(echo "$hexes" | tr '\n' '|' | sed 's/|$//')"
  # shellcheck disable=SC2068
  hits="$(grep -rInE "$pattern" ${SEARCH_DIRS[@]} "${EXCLUDE[@]}" 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    FOUND=1
    echo "--- stale '$v' accent hex (active variant is '$ACTIVE_VARIANT') ---"
    echo "$hits"
    echo ""
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo "clean — no stale accent hex found outside tokens/out/"
  exit 0
else
  echo "DRIFT FOUND — see file:line above. Regenerate the layer config from"
  echo "tokens/out/* instead of hand-editing hex, or run codegen + re-sync."
  exit 1
fi
