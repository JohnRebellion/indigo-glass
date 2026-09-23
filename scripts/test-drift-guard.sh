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

# Exercise the WORKING TREE, not HEAD. Copying only the guard and the generator
# tested them against HEAD's layer files, so a guard fix that also required a
# layer fix failed its own baseline check: "clean checkout passes" reported the
# very drift the uncommitted change was fixing. Replay every tracked change.
# --binary: a plain diff describes a changed PNG as "Binary files differ" and
# `git apply` refuses it, so any pass that re-bakes a pixmap (the GRUB theme,
# a Playwright snapshot) broke this replay. Found 2026-09-23.
WT_PATCH="$WT/.working-tree.patch"
git -C "$REPO" diff HEAD --binary > "$WT_PATCH"
if [ -s "$WT_PATCH" ]; then
  git -C "$WT" apply "$WT_PATCH" \
    || { echo "  FAIL  could not replay the working tree into the test worktree" >&2; exit 1; }
fi
rm -f "$WT_PATCH"

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

# --- 4. no false positive: an UNCHANGED literal must not be reported --------
# accent_hi is its own triple in the TOML and case 2 did not touch it, so
# codegen still emits it and no file carrying it is stale. v5 derived hi/alt
# from accent, so every accent edit reported the still-current accent_hi as
# superseded — 96 lines of noise on this fixture, including
# config/fastfetch/config.jsonc, which carries hi and alt and no accent at all.
# Asserted on a FILE, not on the hex: a reported line often contains several
# literals, and the genuinely stale accent drags the still-current accent_hi
# into the same line of output. config/fastfetch/config.jsonc is the clean
# fixture — it carries accent_hi and accent_alt and no accent at all, so
# nothing in it is stale in this scenario. v5 named it anyway.
if grep -qF 'config/fastfetch/config.jsonc' <<<"$report"; then
  echo "      named though it carries only the UNCHANGED accent_hi/accent_alt"
  falsepos=1
else
  falsepos=0
fi
check "does not report a file carrying only unchanged hi/alt" 0 "$falsepos"

# --- 5. accent_alt alone: the member of the triple v5 could not see ---------
# Reset to HEAD, then move ONLY accent_alt. codegen regenerates the 13 files;
# every hand-typed copy of the old alt stays put. v5 hunted a DERIVED alt
# (sage: #88A988) that codegen never emitted, so it matched nothing and the
# scan passed clean over 31 stale deployables.
cp "$REPO/tokens/indigo-glass.tokens.toml" tokens/indigo-glass.tokens.toml
python3 tokens/codegen.py >/dev/null 2>&1

python3 - "$ACTIVE" <<'PY'
import re, sys
variant = sys.argv[1]
path = "tokens/indigo-glass.tokens.toml"
text = open(path).read()
m = re.search(rf'(\[variants\.{variant}\].*?)(?=\n\[|\Z)', text, re.S)
block = m.group(1)
def bump(mm):
    L, C, H = float(mm.group(2)), mm.group(3), mm.group(4)
    return f"{mm.group(1)}{min(L + 0.02, 0.99):.4f}, {C}, {H}]"
new = re.sub(r'(accent_alt\s*=\s*\[)\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]',
             bump, block, count=1)
assert new != block, f"could not find an accent_alt in [variants.{variant}]"
open(path, "w").write(text[:m.start(1)] + new + text[m.end(1):])
PY

if ! python3 tokens/codegen.py >/dev/null 2>&1; then
  echo "  FAIL  codegen.py rejected the accent_alt perturbation" >&2
  exit 1
fi

set +e
alt_report="$(bash scripts/check-palette-drift.sh 2>&1)"
alt_exit=$?
set -e
check "changed accent_alt + regenerate is reported as drift" 1 "$alt_exit"

# share/grub-theme was a fixture here until 2026-09-23: its generators read
# every colour from tokens/out now, so it no longer carries a hand-typed alt
# to go stale. klassyrc still does.
missing=0
for f in config/klassy/klassyrc config/plasma-theme/SageInk; do
  grep -qF "$f" <<<"$alt_report" || { echo "      not named: $f"; missing=1; }
done
check "names the deployables left on the stale accent_alt" 0 "$missing"

# --- 7. GRUB theme: its declared variant is not drift, a foreign one is ----
# theme.txt names its own variant (`# variant: orchid_light`), so the guard
# must not hunt that variant's accents under share/grub-theme/ (case 1, the
# clean baseline, already covers this: theme.txt carries #7F4995 and passes)
# while still catching any OTHER non-active variant's accent there. Inject
# rust's accent into a label and expect the file to be named.
cp "$REPO/tokens/indigo-glass.tokens.toml" tokens/indigo-glass.tokens.toml
python3 tokens/codegen.py >/dev/null 2>&1
GRUB_VARIANT="$(sed -n 's/^# variant: *//p' share/grub-theme/theme.txt | head -1)"
FOREIGN="$(grep -oE '^\[variants\.[a-z_]+\]' tokens/indigo-glass.tokens.toml \
           | sed -E 's/^\[variants\.(.*)\]$/\1/' \
           | grep -vE "^(${ACTIVE}|${ACTIVE}_light|${GRUB_VARIANT})$" | head -1)"
FOREIGN_HEX="$(grep -oE '^\s*--ig-accent:\s*#[0-9A-Fa-f]{6}' "tokens/out/css-vars.${FOREIGN}.css" \
               | head -1 | grep -oE '#[0-9A-Fa-f]{6}')"
printf '+ label { top = 1400 left = 0 width = 10 align = "left" text = "x" color = "%s" font = "SF Pro Display Regular 22" }\n' \
  "$FOREIGN_HEX" >> share/grub-theme/theme.txt
set +e
grub_report="$(bash scripts/check-palette-drift.sh 2>&1)"
grub_exit=$?
set -e
check "a foreign variant's accent ($FOREIGN) in the GRUB theme is drift" 1 "$grub_exit"
if grep -qF 'share/grub-theme/theme.txt' <<<"$grub_report"; then named=0; else named=1; fi
check "and names share/grub-theme/theme.txt" 0 "$named"

echo ""
if [ "$fail" -gt 0 ]; then
  echo "$fail failed, $pass passed — the guard has a hole"
  exit 1
fi
echo "$pass passed — guard covers every member of the accent triple and the GRUB variant switch"
