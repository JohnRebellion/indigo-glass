#!/usr/bin/env bash
# test-drift-guard.sh — self-test for scripts/check-palette-drift.sh
#
# Added 2026-09-16 after a cross-model audit ran the obvious experiment nobody
# had run: change one token and ask the guard whether the repo is still
# consistent. It said "clean". Measured on the unmodified v4 guard:
#
#     sed -i '116s/145.00/155.00/' tokens/indigo-glass.tokens.toml  # sage accent
#     python3 tokens/codegen.py        -> exit 0, 13 files regenerated
#     scripts/check-palette-drift.sh   -> exit 0, "clean"
#     git grep -l '#A6C9A6'            -> 31 tracked files still on the old hex,
#                                         including config/gtk-3.0/gtk.css,
#                                         config/gtk-4.0/gtk.css, config/starship.toml
#                                         and share/konsole/SageInk.profile, all of
#                                         which install.sh deploys.
#
# That is the v1 failure mode — "guard clean, shipped themes stale" — reproduced
# by the v2/v3/v4 guard that was written to end it. COLOUR only hunts a
# NON-ACTIVE variant's accent, so it is blind to the active variant's own
# superseded value; PARITY only covers the surfaces with a byte-comparable
# generated counterpart. A changed accent falls between the two.
#
# This test asserts the guard notices. It runs against the WORKING TREE copy of
# the guard and codegen, not HEAD, so it exercises edits before they are
# committed. It never touches the real working tree: all mutation happens in a
# throwaway git worktree under $TMPDIR.
#
# Usage:  bash scripts/test-drift-guard.sh
# Exit 0 = the guard behaves correctly. Exit 1 = the guard has a hole.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
REPO="$PWD"

WT="$(mktemp -d -t drift-guard-test-XXXXXX)"
cleanup() { git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"; }
trap cleanup EXIT

git -C "$REPO" worktree add --detach "$WT" HEAD >/dev/null 2>&1

# Exercise the working-tree guard and generator, not the committed ones.
cp "$REPO/scripts/check-palette-drift.sh" "$WT/scripts/"
cp "$REPO/tokens/codegen.py"              "$WT/tokens/"

cd "$WT"

pass=0
fail=0
check() { # check <description> <expected-exit> <actual-exit>
  if [ "$2" = "$3" ]; then
    echo "  ok    $1"
    pass=$((pass + 1))
  else
    echo "  FAIL  $1 (expected exit $2, got $3)"
    fail=$((fail + 1))
  fi
}

echo "drift guard self-test"
echo ""

# --- 1. baseline: an untouched checkout must be clean -----------------------
set +e
bash scripts/check-palette-drift.sh >/dev/null 2>&1
baseline=$?
set -e
check "clean checkout passes" 0 "$baseline"

# --- 2. the regression: change the active variant's accent ------------------
ACTIVE="$(grep -E '^default_variant' tokens/indigo-glass.tokens.toml \
          | sed -E 's/.*"([a-z]+)".*/\1/')"

# Nudge the accent hue by 10 degrees inside the active variant's block only.
python3 - "$ACTIVE" <<'PY'
import re, sys
variant = sys.argv[1]
path = "tokens/indigo-glass.tokens.toml"
text = open(path).read()
m = re.search(rf'(\[variants\.{variant}\].*?)(?=\n\[|\Z)', text, re.S)
block = m.group(1)
def bump(mm):
    L, C, H = mm.group(2), mm.group(3), float(mm.group(4))
    return f"{mm.group(1)}{L}, {C}, {(H + 10.0) % 360:.2f}]"
new = re.sub(r'(accent\s*=\s*\[)\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]', bump, block, count=1)
assert new != block, f"could not find an accent in [variants.{variant}]"
open(path, "w").write(text[:m.start(1)] + new + text[m.end(1):])
PY

if ! python3 tokens/codegen.py >/dev/null 2>&1; then
  echo "  FAIL  codegen.py rejected the perturbed tokens — test fixture is broken" >&2
  exit 1
fi

set +e
bash scripts/check-palette-drift.sh >/dev/null 2>&1
after=$?
set -e
check "changed accent + regenerate is reported as drift" 1 "$after"

# --- 3. the drift it must name ----------------------------------------------
# Every deployable still carrying the superseded accent should be reported.
set +e
report="$(bash scripts/check-palette-drift.sh 2>&1)"
set -e
missing=0
for f in config/gtk-3.0/gtk.css config/gtk-4.0/gtk.css config/starship.toml \
         share/konsole/SageInk.profile; do
  grep -qF "$f" <<<"$report" || { echo "      not named: $f"; missing=1; }
done
check "names the shipped deployables left stale" 0 "$missing"

echo ""
if [ "$fail" -gt 0 ]; then
  echo "$fail failed, $pass passed — the guard has a hole"
  exit 1
fi
echo "$pass passed — guard covers superseded accents"
