# Predictions — recorded 2026-09-22, before any behaviour-changing edit

Revised after round 1. P5 and P6 as first written assumed the day-mode measurement
was authoritative; the night-mode run overturned that, so both are restated against
the correct baseline. Baselines are in `measure/`; each prediction names the
threshold that makes it wrong.

| # | Change | Prediction | Wrong if |
|---|---|---|---|
| P1 | Guard reads `accent_hi`/`accent_alt` from the TOML variant block | Experiment B (sage `accent_alt` L 0.70→0.72) exits 1 and names ≥ 31 files including `share/grub-theme/*` and `config/plasma-theme/SageInk/**/*.svg` | exit 0, or fewer than 31 files, or grub/plasma-theme absent |
| P2 | Same | Experiment A (sage `accent` hue +10) reports 0 lines containing `#C0E3C0` | any reported line contains `C0E3C0` |
| P3 | Same | Unmodified checkout: guard exit 0. `test-drift-guard.sh` passes with the two new cases, 5 checks total | any FAIL, or fewer than 5 checks |
| P4 | Baseline = parent of the last tokens-touching commit | Token change committed with `--no-verify`, then one unrelated commit: guard still exits 1 | exit 0 after the second commit |
| P5 | `check.mjs` audits Wikipedia in both modes (`?vectornightmode=1` added) | The night rows report `skin-theme-clientpref-night`; the 0.2.0 tables page shows `td.table-proprietary` ×29 and nothing else off-palette bar the unlabelled inline `td.` cells | any night row reports `clientpref-day`; or a `table-yes`/`table-no`/`table-partial` entry appears |
| P6 | `table-proprietary` added to the template-class rules | Night-mode tables page: 0 `table-proprietary` cells off-palette; black-text elements 31 → ≤ 8 (the unlabelled inline cells the policy excludes) | any `table-proprietary` fill remains, or black-text > 8 |
| P6b | Table and navbox rules unprefixed | Day-mode article: 0 `navbox-group` / `navbox-list` fills; `contrast.mjs` rest failures 12 → 0. Night mode unchanged from P6 | any navbox fill in day mode, any rest failure, or any night-mode regression |
| P7 | Reset backup under `~/.local/state`, namespaced by source root | Script still refuses under plasmashell; `moved N` equals matched paths; no `plasmashell`/`plasma-systemmonitor`/`kwin` nesting; nothing under `/tmp/kde-reset-*`; documented rollback restores each root to its own destination | any nested duplicate, any path left in `/tmp`, or a rollback that writes `~/.local/share` content into `~/.config` |
| P8 | `.gitignore` renders rule (**applied**) | `git status --short --untracked-files=all research-reports/sage-ink-mark-2026-09-17` lists no image; the `.md`/`.py` files still show | any image listed |
| P9 | Identity pre-commit guard | A commit attempted with `GIT_AUTHOR_EMAIL=John.Rebellion@mtusa.com` is refused; a normal commit is unaffected | the employer-address commit succeeds, or a normal commit is blocked |
| P10 | Author rewrite + force-push | `git log --format=%ae 2e4dbed^..main \| sort -u` prints one address; `chezmoi apply` fails once per host with a non-fast-forward until the external is re-cloned, then succeeds | two addresses remain; or chezmoi succeeds with no re-clone, which would mean the external never pulled |

## Result of P8 (already applied)

`git status --short --untracked-files=all research-reports/sage-ink-mark-2026-09-17`
lists 17 entries, 0 of them `.png`/`.jpeg`/`.svg`. Holds.

---

# Results — all changes applied and verified 2026-09-22

| # | Outcome | Evidence |
|---|---|---|
| P1 | **Held.** Experiment B is now reported: `changed accent_alt + regenerate is reported as drift` (exit 1) and `names the deployables left on the stale accent_alt` both pass, asserting on `share/grub-theme` and `config/plasma-theme/SageInk` | `scripts/test-drift-guard.sh` cases 5–6 |
| P2 | **Held, by a better assertion.** Grepping the report for `#C0E3C0` was the wrong test: a reported line usually carries several literals, and the genuinely stale accent drags the current accent_hi into the same output line. Re-stated against a file — `config/fastfetch/config.jsonc` carries hi and alt and no accent, so nothing in it is stale — and it is no longer named | `test-drift-guard.sh` case 4 |
| P3 | **Held, 6 checks not 5.** Clean checkout passes; the whole suite is green on the new guard and red on the old one (3 failures), so the regression is proven both ways | `bash scripts/test-drift-guard.sh` |
| P4 | **Held.** Baseline now resolves to `<last-tokens-commit>^` rather than `HEAD~1`; the guard prints the sha it compared against | `Currency scan: superseded accents vs 71a1d16…^` |
| P5 | **Held.** All four URLs report their intended mode and the night rows are clean | `measure/style-check-wikipedia-after.json` |
| P6 | **Held.** `table-proprietary` added to the negative-template group; night-mode tables page has zero off-palette fills | same |
| P6b | **Held, and it took two more rules than predicted.** Adding `clientpref-day` to the prefix fixed the navbox headers but not the body stripes (`.navbox-list` at `#F7F7F7`) or the infobox text, both of which Vector only recolours in night mode. Day-mode article: off-palette fills 34 → 0, rest-contrast failures 12 → 0 | `measure/contrast-wikipedia-after.txt` |
| P7 | **Held.** Refuses under plasmashell; sandbox run moved 9 of 9, filed under `config/`, `local-share/`, `cache/`; `kwin` and `plasmashell` no longer nest; nothing written to `/tmp`; rollback prints one destination per root | sandboxed `HOME` run |
| P8 | **Held.** No image listed; the 17 documents and generators still show | `git status --untracked-files=all` |
| P9 | **Held.** `GIT_AUTHOR_EMAIL=John.Rebellion@mtusa.com` → exit 1 with the remedy printed; personal address → exit 0 | `scripts/git-hooks/pre-commit` |
| P10 | **Not attempted.** History rewrite and force-push are the owner's call and were left alone | — |

## Found while applying, not predicted

- **`obsidian/Indigo Glass/theme.css:218` still painted its example/quote
  callouts Lime Glass's `accent_alt`** — the one callout role the sage migration
  missed. Invisible to every guard version until the derivation fix, because v5
  hunted a derived `#89C500` and the file carries the emitted `#8BC406`. Now
  `137, 168, 137`. This is the first real drift the corrected guard caught, and
  it was caught within a minute of the fix landing.
- **The self-test validated HEAD, not the working tree.** It copied only the
  guard and the generator into its throwaway worktree, so a guard fix that also
  required a layer fix failed its own baseline: `clean checkout passes` reported
  the very drift the uncommitted change was fixing. It now replays
  `git diff HEAD` into the worktree.
- **`div.vector-menu-heading` fails contrast at 4.14:1** (`#6B7280`
  `--color-base--subtle` on the base, minimum 4.5). Pre-existing and unchanged
  by this work — the token is byte-identical at `HEAD` — and only visible when
  the Appearance panel happens to be pinned in the render. Left alone: moving a
  shared subtle-text token is a design decision, not a drive-by.
