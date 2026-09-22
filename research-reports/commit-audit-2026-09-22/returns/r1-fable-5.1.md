# r1 — Claude Fable 5.1 (fresh session, in-harness, 2026-09-22)

Reviewer had filesystem access and ran the measurements in the brief itself. Where
a claim below rests on a measurement, the file under `measure/` is named.

## Q1 Commit hygiene

`6bf824d` is authored as the employer address on a personal repo, and it is pushed.
Only a rewrite changes the object; `.mailmap` fixes `git shortlog` output and nothing
GitHub shows. With one contributor, a rewrite of three commits plus one merge is
cheap. Do it with `git rebase -r 2e4dbed --exec 'git commit --amend --no-edit
--author="John Rebellion <johnnecirrebellion@gmail.com>"'` then `git push
--force-with-lease`. Rewriting only `6bf824d` is enough in principle, but the three
commits above it change SHA either way.

What breaks: `~/.local/share/chezmoi-externals/indigo-glass` on **both** hosts is a
clone that chezmoi refreshes with a fast-forward pull. After the force-push that pull
fails until the directory is deleted and re-cloned. The install hook then skips with
"external not present" until the next `chezmoi apply`. That is a two-line cleanup per
host, and the doc in `6bf824d` already names the directory.

If the employer address is a verified secondary email on the `JohnRebellion` GitHub
account, the visible damage is nil and this drops to cosmetic. I could not check that.

## Q2 Guard correctness

**The CURRENCY scan is built on a wrong model of the tokens, and the self-test cannot
see it.** `accent_literals_for()` derives `accent_hi` and `accent_alt` from `accent`
as `L+0.08` and `L-0.10` at the same chroma and hue. The TOML does not work that way:
every variant block defines `accent_hi` and `accent_alt` as independent triples.
Comparing the guard's hunted literals against what `codegen.py` actually emits:

| Variant | Guard hunts (accent, hi, alt) | `tokens/out/css-vars.<v>.css` emits |
|---|---|---|
| sage | `#A6C9A6 #C0E3C0 #88A988` | `#A6C9A6 #C0E3C0 #89A889` |
| indigo | `#5E6AD2 #7483ED #444CB1` | `#5E6AD2 #818CF8 #A78BFA` |
| lime | `#A8E635 #C1FF58 #89C500` | `#A8E635 #C1FF58 #8BC406` |

Two measured consequences (`measure/guard-experiment-*.txt`, throwaway worktrees at HEAD):

- **Experiment B — change only `accent_alt`** (line 118, L 0.70 → 0.72), regenerate.
  Generated files move to `#8FAF8F`. 31 deployable files still carry `#89A889`
  (`share/grub-theme` ×3, `config/plasma-theme/SageInk/**` ×12, `vscode/themes` ×2,
  `windows/terminal`, `windows/powershell`, `vscode/css`, …). Guard: exit 0,
  `clean — no colour, currency, material, alpha, parity, or shadow drift`. That is
  the v4 failure mode `507d75c` says it closes, reproduced on the third member of the
  same triple.
- **Experiment A — change only `accent` hue** (line 116, as the self-test does).
  Guard exits 1 and names 29 files — but 96 of the reported lines are hits on
  `#C0E3C0`, which codegen still emits unchanged. Those are false positives: the
  derived "before" set contained `#C0E3C0` as accent-hi-of-old-accent, the derived
  "after" set contains hi-of-new-accent, so the still-current hi is reported as
  superseded. `config/fastfetch/config.jsonc` is named in this run for that reason.

The self-test passes because the four files it asserts on also carry `#A6C9A6`,
which *is* superseded in its scenario. It never perturbs `accent_hi` or `accent_alt`,
never asserts that an unchanged literal is *not* reported, and never covers the
non-active variants — for indigo the guard's COLOUR scan has been hunting two hexes
that exist nowhere since before this commit. Today no deployable carries indigo or
lime hi/alt (measured), so there is no live drift; the hole bites on the next
`accent_alt` edit.

Fix: parse `accent_hi` and `accent_alt` from the variant block when present and fall
back to derivation only when absent; add experiment B and a no-false-positive
assertion to `test-drift-guard.sh`; run it red then green.

Smaller holes, code-read only:

- Baseline `HEAD~1` is a one-commit window. A token change committed with
  `--no-verify`, or from a clone that never set `core.hooksPath` (the docs say every
  fresh clone starts that way), goes silent after one more commit. Baseline should be
  the parent of the last commit that touched the tokens file.
- `for v in indigo lime sage` is hardcoded; the TOML also has `rust`, `orchid`,
  `orchid_light`. Token-only today, so no live impact.
- Merge commits: `HEAD~1` is the first parent, which is the right side for this
  repo's workflow. Fine.
- `comm` on two `sort -u` streams in the same shell — same locale, fine.

## Q3 Host-specific docs

`docs/INSTALL-AND-UPDATE.md` is an honest dated log (its Provenance section says
Fedora 44, 2026-09-16) written as if it were a universal runbook. On `nobara-pc`:
the clone is `~/projects/indigo-glass` (`~/indigo-glass` does not exist);
`qdbus6` is not on PATH (`qdbus-qt6` and `qdbus` are); `~/.config/chezmoi/key.txt`
*is* present; Discord is installed so its row is UNDEPLOYED, not "absent"; SDDM is
installed and UNDEPLOYED. The chezmoi hook path, its `--themes-only` invocation and
the external clone path are all correct.

Misleading enough to fix: `~/indigo-glass` (five occurrences, including the rollback
and reset commands — a copy-paste on this host fails) and `qdbus6`. Fine as a log:
`key.txt` and the absent-app list, if the sentence says "on the Fedora laptop".
Host facts belong in `~/.claude/docs/estate/ESTATE-MACHINES.md`, which already
records the clone move; the doc should point there and define `REPO=` once. The
doc is also not linked from the README documentation index, unlike ARCHITECTURE.md.

## Q4 Reset script

Does what its doc says at the level of "moves, never deletes, refuses while
plasmashell runs". The globs sweep more than the doc's plain-English list conveys.
On this host `~/.config/kwin*` also matches `kwinoutputconfig.json` (monitor
arrangement and scale), `kwinrulesrc` (window rules) and four `kwinrc.bak.*`;
`~/.config/plasma*` also matches `plasma-localerc` (`LANG=en_GB.utf8` — formats and
region), `plasma-nm`, `plasmanotifyrc`. Monitor layout and locale are the two a user
would not expect to lose from a "theme reset". Name them in the doc, or exclude
`kwinoutputconfig.json` and `plasma-localerc` from the sweep since neither carries
theme state.

`/tmp` as the backup: the doc itself says `/tmp` clears on reboot. On Fedora `/tmp`
is tmpfs, so a reboot instead of the documented `systemctl restart sddm` destroys
the only copy of a config tree the script exists to preserve. Use
`${XDG_STATE_HOME:-$HOME/.local/state}/kde-reset-<stamp>`. The `mv` into tmpfs is
also a copy-and-delete across filesystems, so the "never deletes" claim is true of
intent, not of syscalls — harmless, but worth knowing when `~/.cache/plasma*` is
large.

Minor: refusing only on `plasmashell` misses a session where the shell crashed but
`kwin_wayland` still holds the files. Low.

## Q5 Wikipedia 0.2.0

Verified as claimed: the 397 sub-4px radii are gone (`stillRounded` 397 → 0); the
infobox header band is fixed (`#C0C0C0` ×6 → `#121216`); the comparison-tables page
is clean; the footer plates are the one deliberate off-palette fill and are documented.

Not as claimed: the harness renders `<html class="… skin-theme-clientpref-day …">`
(Wikipedia's anonymous default; `emulateMedia dark` does not change the client
preference). The new prefixed rule `html:is(.skin-theme-clientpref-os,
.skin-theme-clientpref-night) …` therefore never matches in the harness, and the
infobox fix that landed came from adding `.infobox-header` to the unprefixed rule.
`.navbox-group` and `.navbox-list` are only in the prefixed rule, so the article
still shows 34 off-palette cells (`th.navbox-group` `#E6E6FF` ×14 and `#DDDDFF` ×10,
`td.navbox-list` `#F7F7F7` ×10) — identical to 0.1.0. The README's "one deliberate
off-palette fill" is false as measured. The `#DDDDFF` comes from the navbox
stylesheet, not the wikitext (inline style is `width:1%`), so a plain class rule
with `!important` wins.

Separately, `contrast.mjs` reports 12 infobox cells (`div.infobox-caption`,
`td.infobox-data`, `th.infobox-label`) at `rgb(0,0,0)` on `rgb(7,8,10)`, ratio 1.05,
in **both** 0.1.0 and 0.2.0. Unreadable content in the page's primary data block,
pre-existing, unmentioned. I did not trace where the black is set.

Whether the owner's real browser runs Wikipedia in night mode is unknown; if it does,
the prefixed rule applies there and the navbox finding becomes "the harness does not
render the owner's mode". Either way the style should not depend on the mode: the
userstyle already forces the dark surface at `:root` in every mode, so its table rules
should too. Minimal edit: add `.navbox-group`, `.navbox-list`, `.navbox-abovebelow`
to the unprefixed rule (background `#0D0D10` for lists, `#121216` for groups). Then
find the black and fix it. I would not commit a version bump whose README says
"audited" while the harness shows 34 fills and 12 unreadable cells; do it as 0.2.0
before committing, or commit and follow with 0.2.1 the same day — but say which.

Unverified: the `--color-neutral` / `#C8CCD1` icon claim. Neither today's contrast
run nor the 0.1.0 baseline contains `rgb(200,204,209)`. Plausible; not reproduced.

## Q6 Fastfetch mark

Commit: `config/fastfetch/config.jsonc`, both `.txt` marks, the three `install.sh`
lines (they copy both files; `~` in `logo.source` is expanded by fastfetch — verified
by rendering), and the `docs/REFERENCE.md` row with the widths corrected to 29 and 23
(measured; the doc says 30 and 24).

The comment in `config.jsonc` points at `research-reports/sage-ink-mark-2026-09-17/`,
which is untracked. Commit that directory's documents and generators (REPORT,
CONSTRAINTS, the three stage files, both prompts, the `mk_svg*.py` / `ship*.py`
generators, the Groq return) and add `research-reports/sage-ink-mark-*/renders/` to
`.gitignore`: 2.3 MB of 122 regenerable PNG/SVG, the same call the repo already made
for `neobrutalism-live-audit-*/`. If the four final SVGs matter, commit only those.

Colour literals: `#C0E3C0` / `#89A889` match the active tokens today, and
`config/` is inside `COLOUR_DIRS`, so once Q2's derivation bug is fixed CURRENCY
covers them on the next accent move. Do not make fastfetch a codegen target for
this; a guard that actually hunts the right hex is enough.

## Q7 What is missing

- A negative case in `test-drift-guard.sh` (unchanged literal must not be reported)
  and a case per member of the accent triple. The commit that added the test proves
  one path and asserts on files that would be named for the wrong reason.
- The pre-commit hook does not run `test-drift-guard.sh` when
  `check-palette-drift.sh` is in the staged set. One `git diff --cached --name-only`
  check makes the guard's own coverage guarded.
- Line counts in `ARCHITECTURE.md` (`install.sh` "535 lines" is already 538). They
  rot on every edit and prove nothing; drop them or generate them.
- `docs/INSTALL-AND-UPDATE.md` in the README documentation index.
- A `.mailmap`, regardless of whether history is rewritten.

## Q8 What measurement would change your answer

- Owner's Wikipedia theme preference (night / os / day). Night downgrades the
  navbox finding from "style gap" to "harness fidelity gap".
- Whether the employer email is verified on the `JohnRebellion` GitHub account.
  Yes → Q1 drops to cosmetic and `.mailmap` is enough.
- Where the infobox black comes from (inline `color` vs template class). Inline →
  one `!important` rule; class → a scoped one.
- `git grep -il` for indigo and lime hi/alt in deployables after the next variant
  work. Today zero, so Q2's live impact is zero and its future impact is certain.

## Ranked findings

1. HIGH | `scripts/check-palette-drift.sh` `accent_literals_for()` | guard hunts derived hi/alt (`#88A988`) not emitted ones (`#89A889`); accent_alt change → 31 stale deployables, guard clean; accent change → 96 false-positive lines on unchanged `#C0E3C0` | `measure/guard-experiment-A/B`
2. HIGH | `6bf824d` | employer author email on a personal repo, pushed | `git log --format=%ae`
3. MED | `wikipedia.user.css:157-161`, `README.md:191-196` | prefixed night rule inert in the harness render; 34 navbox cells off-palette, README says one | `measure/style-check-wikipedia.json`
4. MED | `wikipedia.user.css` | 12 infobox cells at 1.05:1 in both versions | `measure/contrast-wikipedia*.txt`
5. MED | `check-palette-drift.sh` CURRENCY | `HEAD~1` one-commit window; variant list hardcoded | code read
6. MED | `scripts/reset-to-stock-kde.sh:20-35`, `INSTALL-AND-UPDATE.md` | sweeps monitor layout and locale unnamed; tmpfs backup | `ls ~/.config`
7. LOW | `docs/INSTALL-AND-UPDATE.md` | `~/indigo-glass` ×5, `qdbus6`, host facts as universals; not in README index | `ls`, `which`, `grep`
8. LOW | `config/fastfetch/config.jsonc:10` | comment points at an untracked 2.4 MB directory; `renders/` unignored | `git status`
9. LOW | `docs/REFERENCE.md:148` | 30/24 columns; measured 29/23 | `awk length`
10. LOW | `browser/stylus/sites/README.md:195` | "header comment" is a mid-file comment | `grep`
11. LOW | `docs/ARCHITECTURE.md` | `install.sh` 535 → 538; `codegen.py:71-74` → 71-73 | `wc -l`, `sed -n`

## Rejected as non-issues

- Tracked file counts per layer (14 of 14 exact), DPI arithmetic, declaration-site
  line numbers 60/68/70/75/76/77, the three simulator line references — all correct.
- No "never hand-edit" file was touched in the range; guard, parity check, self-test
  and hook all pass on the current tree.
- `Co-Authored-By: Claude Opus 5` trailers, and the +1000 / +0800 timezone split —
  two machines, consistent with the estate doc.
- `#85ABF1` link blue not being a Sage Ink token: intended, documented.
- `#F8F9FA` footer plates: decided, with the filter experiments recorded.
- `#C0E3C0` / `#89A889` in fastfetch matching the tokens today: true; the risk is
  Q2's, not the file's.
- "397 radii" claim: 383+26+9+… in the 0.1.0 baseline, 0 in 0.2.0. Verified.
- `check.mjs` thresholds cited in the README (24×12 floor, ≥4px): both in the code.
- `dc1a1c6`'s four corrections: each one checks out against the repo as it stands.

## Confidence and caveats

High confidence on Q2 (two reproductions, saved), Q5 fills and contrast (harness
runs, saved), Q1 facts (git). Medium on Q4's tmpfs point (I did not `findmnt /tmp`
on the Fedora laptop; Fedora defaults to tmpfs). Guessing on: the owner's Wikipedia
mode, GitHub email verification, the source of the infobox black, and whether the
`#C8CCD1` icon claim was ever true. I did not re-run the "31 tracked files" experiment
from the commit message; today's `git grep` finds 60 files carrying the active accent
across the whole tree, which is a different scope, not a contradiction. Same-vendor
caveat: this reviewer is Claude reviewing Claude's commits; Q1's remedy and Q4's
backup location are judgement calls where a GPT or Gemini pass would add signal.
