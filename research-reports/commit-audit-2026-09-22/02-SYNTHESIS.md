# Synthesis — round 1

Three returns, answered independently: `returns/r1-fable-5.1.md` (Claude Fable 5.1,
in-harness with filesystem access), `returns/r1-gpt.md` (GPT, web chat),
`returns/r1-gemini.md` (Gemini, web chat). Neither external model saw the other's
answer or Fable's. Every factual claim below was checked against the repo on
2026-09-22; evidence is in `measure/`.

## Correction to the in-harness return — read this first

**Fable's Q5 answer was measured in the wrong mode and its central claim is wrong.**
GPT said the right response was to fix the harness rather than broaden the CSS, and
that the night rule "may be correct for a real browser". GPT was right.

`?vectornightmode=1` puts Wikipedia into `skin-theme-clientpref-night` (verified
live). Gemini's proposed `?useskintheme=night` does **not** — it still renders
`clientpref-day`. Re-running both userstyle versions in real night mode
(`measure/night-mode-results.txt`, `measure/night-mode-audit.mjs`):

| Comparison-tables page, night mode | 0.1.0 | 0.2.0 |
|---|---:|---:|
| `td.table-yes` `#9EFF9E` | 1978 | 0 |
| `td.table-no` `#FFC7C7` | 1311 | 0 |
| `td.table-partial` `#FFFFBB` | 110 | 0 |
| `free` / `dropped` / `active` / `depends` | 164 | 0 |
| `td.table-proprietary` `#E7E7FF` | 29 | **29** |
| black-text elements | 3667 | **31** |

On the article page in night mode, both versions are clean and neither has a single
black-text element. So 0.2.0 does what it claims, the prefixed selector fires, and
the navbox and infobox-contrast findings in Fable's return are artefacts of auditing
`clientpref-day`. Retracted.

What survives, and is new: **`table-proprietary` is a named template class the
0.2.0 list misses** — 29 cells, `#E7E7FF`, black text, in night mode. The style
covers 26 `.table-*` classes; this is the 27th. The remaining 8 unlabelled `td.`
cells carry inline colour with no class and are excluded by the file's own stated
policy, correctly.

Second surviving point: the style darkens `.mw-page-container` unconditionally
(line 92, selector list at line 22 includes a bare `:root`) but gates the table and
navbox rules on night/os (line 157). A reader in day mode — Wikipedia's anonymous
default — therefore gets a dark page with light navboxes and black infobox text.
Either the table rules become unprefixed too, or the whole file gates on the mode.
Today it is half-and-half.

## Where the three agree

- `6bf824d`'s employer email is a real defect. Fable and GPT both say rewrite;
  Gemini says `.mailmap`. GPT's reasoning is decisive: `.mailmap` is presentation
  only and does not change the commit object, so it does not satisfy the rule it is
  meant to satisfy. All three correctly predict the chezmoi `--ff-only` pull breaks
  once and needs a re-clone.
- The CURRENCY baseline is one revision deep and can age out. GPT gave the clearest
  worked example (token change at B, stale literal introduced at D, compared against
  C). Confirmed by reading the code.
- `docs/INSTALL-AND-UPDATE.md` mixes portable procedure with host observations.
  All three name `~/indigo-glass` and `qdbus6` as the two that actually break a
  copy-paste here. GPT and Gemini both propose splitting host facts into `hosts/`.
- `reset-to-stock-kde.sh` moves rather than deletes and refuses under plasmashell,
  as documented, but the globs sweep monitor layout, window rules, locale and
  NetworkManager state that no one would call theme config.
- The fastfetch config and its two mark files must land in one commit or the
  installer is broken. The `~` path is fine and tested.

## Where they disagree, and who wins

| Question | Positions | Verdict |
|---|---|---|
| `6bf824d` remedy | Fable + GPT rewrite; Gemini `.mailmap` | **GPT/Fable.** Gemini's own stated reason for `.mailmap` — that a rewrite "permanently breaks" the update lifecycle — overstates it. The break is a one-time re-clone of a directory that is declared disposable in `.chezmoiexternal.toml` and re-created on the next apply. Still the owner's call. |
| `/tmp` backup | Gemini unacceptable; GPT acceptable for a single-session transaction | **Gemini.** `findmnt -no FSTYPE /tmp` → `tmpfs`. Gemini named this as the measurement that would decide it, and it came back against GPT. A hard reboot after an SDDM hang loses monitor layout and NetworkManager state. |
| Q5 remedy | Fable broaden the CSS; GPT fix the harness; Gemini fix the harness with `?useskintheme=night` | **GPT.** Fixing the fixture was right; Gemini's specific parameter does not work, `?vectornightmode=1` does. |

## Rejected — claims that a file read or a command refutes

- **Gemini: "`config/fastfetch` must be appended to the drift guard's search paths."**
  False. `COLOUR_DIRS` is computed as every top-level directory minus
  `docs research-reports scripts tokens backups` and `simulator`, so `config` is
  already in it. Experiment A names `config/fastfetch/config.jsonc` directly. GPT
  flagged the same worry but correctly refused to assert it without the code.
- **Gemini: the guard "cannot detect a superseded accent that was completely
  deleted" and "requires a hardcoded blacklist".** False, and backwards: deletion is
  the case it handles best. `accent_literals_for` exits silently on a missing
  variant, so the "after" set is empty and every "before" literal is reported
  superseded. Measured: 3 of 3 for a deleted variant.
- **Gemini + GPT: `LC_ALL=C` is missing and `sort`/`comm` may collapse entries.**
  The guard sets no locale and the host is `en_GB.utf8`, so the premise is right.
  The consequence is not: the function emits `#RRGGBB` plus two `r,g,b` spellings,
  no case variants and no punctuation-only differences, and
  `printf '#A6C9A6\n#a6c9a6\n' | sort -u` returns 2 lines under both locales here.
  Worth pinning as one line of hardening; not a live defect. GPT called this
  "latent, not demonstrated" — accurate.
- **Gemini: `research-reports/necir-ph-native-app-2026-09-17/` is "leaked AI
  scratch from an unrelated project" that "should have been removed".** Rejected on
  two grounds. Precedent: `research-reports/necir-ph-mobile-2026-09-15/` is already
  tracked in this repo, so cross-project audits under `research-reports/` are an
  established convention, not a boundary violation. And the owner's standing rule
  forbids deleting prior-session artefacts; the remedy for something unwanted here
  is to move it to the repo it belongs to, not to remove it.
- **GPT: the self-test should add `config/fastfetch/config.jsonc` to its expected
  stale-deployable list.** Not as written. Fastfetch carries `#C0E3C0` and
  `#89A889`, which are `accent_hi` and `accent_alt`, not `accent`. It appears in
  experiment A only because of the derivation bug below. Once that is fixed it
  belongs in the expectations for an `accent_hi`/`accent_alt` mutation, not for the
  accent-hue one the current test runs.
- **GPT: basename collisions in the reset script are possible but "the current
  measured set apparently doesn't trigger it".** Understated. Three collide today
  on this host: `plasmashell`, `plasma-systemmonitor` and `kwin` each exist under
  two of `~/.local/share`, `~/.cache`, `~/.config`. `mv` nests the second inside
  the first rather than overwriting, so nothing is lost, but the backup tree no
  longer mirrors the source layout — and the documented rollback,
  `cp -a /tmp/$STAMP/. ~/.config/`, would restore all three roots into `~/.config`.
  The rollback command is wrong independently of the collisions. Neither model
  caught that.

## The finding no external model could reach

Both web-chat models reasoned about CURRENCY's *scope* (which directories, which
commits, which locale). Neither could see that its *derivation* is wrong, because
that needs the token file and the generated output side by side.
`accent_literals_for()` computes `accent_hi` and `accent_alt` from `accent` by
lightness offset; the TOML defines all three independently:

| Variant | Guard hunts | `tokens/out/css-vars.<v>.css` emits |
|---|---|---|
| sage | `#A6C9A6 #C0E3C0 #88A988` | `#A6C9A6 #C0E3C0 #89A889` |
| indigo | `#5E6AD2 #7483ED #444CB1` | `#5E6AD2 #818CF8 #A78BFA` |
| lime | `#A8E635 #C1FF58 #89C500` | `#A8E635 #C1FF58 #8BC406` |

Change only sage `accent_alt`, regenerate: 31 deployables keep `#89A889`, guard
exits 0 "clean" (`measure/guard-experiment-B`). Change only `accent`: 96 reported
lines are hits on `#C0E3C0`, which codegen still emits unchanged
(`measure/guard-experiment-A`). This is the strongest finding in the round and it
came from the reviewer that could run the experiment. Both external models' Q8
answers asked for exactly this kind of mutation matrix without being able to run it.

## Applied in this session — safe by construction

Doc literals and one ignore rule. Nothing changes behaviour; guard still clean.

- `docs/REFERENCE.md` 30/24 → 29/23 columns.
- `browser/stylus/sites/README.md` "header comment" → the comment above the
  `#footer-icons` rule.
- `docs/ARCHITECTURE.md` `install.sh` 538 lines; `codegen.py:71-73`.
- `README.md` indexes `docs/INSTALL-AND-UPDATE.md`.
- `.gitignore` `research-reports/sage-ink-mark-*/renders/`.

## Not applied — behaviour-changing, ranked by evidence

1. **Guard derivation.** Read `accent_hi`/`accent_alt` from the variant block;
   fall back to derivation only when absent. Add experiment B and a
   no-false-positive assertion to the self-test. (P1–P3.)
2. **Harness mode.** Audit Wikipedia in both modes — add `?vectornightmode=1`
   URLs alongside the existing ones. Every claim 0.2.0 makes is only checkable
   there. (P5.)
3. **`table-proprietary`.** Add to the `.table-no`-family list, or its own rule.
   29 cells, black text, night mode. (P6.)
4. **Day-mode consistency.** Unprefix the table and navbox rules, or gate the
   whole file. Half-and-half is the current state. (P6b.)
5. **Guard baseline.** Parent of the last tokens-touching commit rather than
   `HEAD~1`; variant list from the TOML rather than hardcoded. (P4.)
6. **Reset script.** Backup under `~/.local/state`; namespace the backup by source
   root to fix the three basename collisions; fix the rollback command, which
   restores three roots into `~/.config`; name locale, monitor layout and
   NetworkManager in the doc or exclude them. (P7.)
7. **Identity guard.** GPT's suggestion: a pre-commit check rejecting a non-personal
   author email. The hook infrastructure already exists and this is the exact class
   of mistake that produced finding 2.
8. **`INSTALL-AND-UPDATE.md`.** One `REPO=` definition, `qdbus-qt6`, host facts
   moved to `hosts/`.
9. **Fastfetch.** Commit config, both marks, the `install.sh` lines and the research
   directory's documents and generators as one commit.

## Owner's decision

Rewrite `6bf824d`'s author and force-push, then re-clone the chezmoi external on
both hosts. Two of three reviewers say rewrite; the dissent rested on a consequence
that is a one-time re-clone of a disposable directory.

## Round 2

Not warranted. The disagreements that mattered were settled by measurement
(`/tmp` is tmpfs, `?vectornightmode=1` works, `?useskintheme=night` does not), and
the largest finding needs repository access rather than another opinion.
