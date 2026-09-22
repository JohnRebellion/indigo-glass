# Review brief — are these commits and this working tree "proper"?

You are reviewing five git commits and an uncommitted working tree in a personal
Linux desktop theming repository. Assume competence: the operator is an
experienced engineer, the repo has an automated drift guard with its own
self-test, a pre-commit hook, a browser-rendering audit harness, and detailed
architecture docs. Generic advice ("add CI", "write tests", "use design tokens")
is worthless here. Only findings that survive contact with the specifics below
are useful.

Do not soften findings to be agreeable. A second model is being asked these same
questions independently, for exactly that reason.

---

## 1. Context

**indigo-glass** is a personal repository (owner: one engineer, GitHub account
`JohnRebellion`) that ships a design system called **Sage Ink** to a KDE Plasma
desktop and to GTK, Konsole, browsers (via Stylus userstyles), editors, SDDM,
GRUB and Windows Terminal. It is installed on two Linux machines and one Windows
machine. There is no CI and no other contributor.

The commits under review were written by AI coding sessions (Claude Opus 5 and
Claude Sonnet 5) driven by the owner. The owner wants an independent opinion on
whether they are *proper*: correct claims, correct conventions, correct git
hygiene, nothing that will cost the owner later.

## 2. How the system works — the parts you need to reason correctly

- `tokens/indigo-glass.tokens.toml` (OKLCH, schema v6) is canonical.
  `python3 tokens/codegen.py` regenerates 13 files into `tokens/out/`,
  `share/`, `config/`, `browser/`, `windows/`. Generated output is committed on
  purpose so users install without running codegen.
- **Most layer configs are NOT generated.** They carry hex literals typed by
  hand (GTK CSS, Konsole profile, starship, SDDM, browser userstyles, fastfetch).
  Nothing regenerates them. Consistency is enforced only by
  `scripts/check-palette-drift.sh` (the "drift guard", now v5, six scans:
  colour, currency, material, alpha, parity, shadow).
- `scripts/test-drift-guard.sh` is the guard's self-test (perturbs the active
  accent in a throwaway worktree, expects the guard to fail and to name four
  shipped deployables).
- `scripts/git-hooks/pre-commit` runs the guard; wired per clone via
  `git config core.hooksPath scripts/git-hooks` (untracked local config).
- `scripts/style-check/check.mjs <site>` renders a Stylus userstyle against the
  live site in headless Edge over CDP and reports: elements still carrying a
  border-radius >= 4px (ignores elements under 24x12 px), surfaces painted
  off-palette ("fills"), and link colours. `contrast.mjs <site>` measures text
  contrast at rest / hover / focus and a "stillRounded" pass with no size floor.
- Repo conventions (from the repo's own `CLAUDE.md`): never hand-edit the
  generated files; never rename existing paths; no blur / gradient /
  translucency anywhere; never edit anything under `research-reports/` to make
  an implementation look compliant; regenerate after ANY token value change.
- Owner's git rule (from their global instructions): every personal repo commits
  as `John Rebellion <johnnecirrebellion@gmail.com>`. Never the employer
  address `John.Rebellion@mtusa.com`.
- Owner's artefact rule: never delete files a prior session produced; archive or
  ignore instead. Exceptions: leaked secrets, the task *is* the deletion, and the
  agent's own scratch.

## 3. Inventory and measurements (taken 2026-09-22 on `nobara-pc`, before writing this)

### The commits

| SHA | Date (local) | Author email | Subject | Files |
|---|---|---|---|---|
| `2e4dbed` | 2026-09-16 15:49 +1000 | personal | docs: add ARCHITECTURE.md and repo CLAUDE.md | +177 |
| `6bf824d` | 2026-09-17 03:34 +0800 | **`John.Rebellion@mtusa.com`** | docs: install/update lifecycle and a stock-KDE reset script | +219 |
| `507d75c` | 2026-09-17 04:06 +0800 | personal | fix(guard): catch a superseded accent, and test that the guard does | +210 -7 |
| `dc1a1c6` | 2026-09-17 04:07 +0800 | personal | docs: correct four claims the audit measured as false | +60 -13 |
| `8984511` | 2026-09-17 04:10 +0800 | personal | Merge remote-tracking branch 'origin/main' | — |

All five are **pushed**: `main...origin/main` is even. Fixing the author of
`6bf824d` therefore means rewriting three pushed commits plus a merge and
force-pushing. Local and global `user.email` are both the personal address now.
All four non-merge commits carry `Co-Authored-By: Claude Opus 5 (1M context)`.

### Repo state checks (all on the current working tree)

| Check | Result |
|---|---|
| `python3 tokens/codegen.py --check` | exit 0, silent |
| `scripts/check-palette-drift.sh` | `clean — no colour, currency, material, alpha, parity, or shadow drift` |
| `scripts/test-drift-guard.sh` | `3 passed — guard covers superseded accents` |
| `git config core.hooksPath` | `scripts/git-hooks` |
| Files matching the "never hand-edit" list touched in `2e4dbed^..HEAD` | none |
| `scripts/check-deployment.sh` | 5 UNDEPLOYED: edge theme, edge Stylus ("not installed"), edge Dark Reader, vencord, sddm (`Current=sweet-plasma6`). GRUB, KDE layers deployed. |
| Secret scan of patches + diff | no hits |

### Claims in the committed docs, checked

| Claim | Measured |
|---|---|
| `check-palette-drift.sh` 821 lines; `install.sh` 535; `codegen.py` 1301; `check-deployment.sh` 368 | 821 / **538** / 1301 / 368 |
| `codegen.py:60,68,70,75,76,77` declare the six shipped targets | line 60, 68, 70 correct; 75 = WT scheme, 76 = monkeytype, 77 = monkeytype settings (opening line) — correct |
| `codegen.py:71-74` documents the legacy-name nuance | lines 71-73 are the comment; 74 is the WT assignment — off by one, harmless |
| `palettes.ts:3` GENERATED header; `liveTokens.ts:5`; `density-optin.css:9` | all three lines say what the doc says |
| Tracked file counts per layer dir (share 107 … iso 0) | all 14 counts match exactly |
| "31 tracked files still on the old hex" after a 10-degree accent nudge | not re-run (the guard self-test reproduces the mechanism and passes); today `git grep -l '#A6C9A6'` finds 60 tracked files carrying the active accent |
| hosts/README: 27" 4K = 163 DPI ratio 1.50; 24" 4K = 184 DPI; 27" 1440p = 109 DPI | arithmetic checks: 163.2 / 183.6 / 108.8 |
| INSTALL-AND-UPDATE.md: working clone at `~/indigo-glass/` | on this host the clone is `~/projects/indigo-glass`; `~/indigo-glass` does not exist. The doc was written on the *other* (Fedora) host. |
| INSTALL-AND-UPDATE.md: `~/.config/chezmoi/key.txt` "missing on this fedora box" | present on `nobara-pc` |
| INSTALL-AND-UPDATE.md: chezmoi hook `run_onchange_after_60-install-indigo-glass.sh.tmpl` | exists at `~/.local/share/chezmoi/.chezmoiscripts/…`; it installs from `~/.local/share/chezmoi-externals/indigo-glass` with `install.sh --themes-only`, as documented |
| INSTALL-AND-UPDATE.md: `qdbus6 org.kde.KWin /KWin reconfigure` | `qdbus6` not on PATH here; `qdbus` and `qdbus-qt6` are |
| INSTALL-AND-UPDATE.md: "Rows marked absent are host apps not installed (Discord, Spotify, Obsidian, SDDM, JetBrains)" | here Discord is present (row is UNDEPLOYED, not absent) and SDDM is UNDEPLOYED; host-specific |
| reset-to-stock-kde.sh: "moves — never deletes"; refuses while plasmashell runs | true as written (`mv`, `pgrep -x plasmashell`) |
| reset globs `~/.config/kwin*` / `~/.config/plasma*` | on this host also match `kwinoutputconfig.json` (monitor layout), `kwinrulesrc`, `plasma-localerc` (`LANG=en_GB.utf8`), `plasma-nm`, and four `kwinrc.bak.*` files — none named in the doc's backed-up list |

### The uncommitted working tree

`git diff --stat`: 6 files, +206 -5. Plus untracked: `config/fastfetch/sage-ink-mark.txt` (15 lines), `sage-ink-mark-small.txt` (12 lines), `research-reports/necir-ph-native-app-2026-09-17/` (92 KB, brief + 5 verbatim model returns + synthesis + predictions), `research-reports/sage-ink-mark-2026-09-17/` (2.4 MB; of which `renders/` 2.3 MB = 64 PNG, 57 SVG, 1 JPEG; plus `__pycache__/`, already gitignored).

Fastfetch (installed here, v2.66.0):

| Check | Result |
|---|---|
| `logo.source: ~/.config/fastfetch/sage-ink-mark.txt` — does fastfetch expand `~`? | yes; renders the installed copy with `$1`=#C0E3C0, `$2`=#89A889 |
| `#C0E3C0` / `#89A889` in `tokens/out/css-vars.css` | yes: `--ig-accent-hi` / `--ig-accent-alt` of the active variant. Hand-typed literal in a layer config, as the repo warns; the guard is clean because they *currently* match |
| Widest row of the mark, `$n` markers stripped | **29** columns; small variant **23**. `docs/REFERENCE.md` says "30-col default, 24-col alternate" |
| `config.jsonc` comment cites `research-reports/sage-ink-mark-2026-09-17/ (ship-gpt.py, 03-INSPECTION.md)` | that directory is untracked — the reference dangles unless it is committed alongside |
| `~/.config/fastfetch/` on this host | already holds `config.jsonc`, both mark files (2026-09-17 22:45) — installed by hand or by an earlier run, before the commit |

Wikipedia userstyle 0.1.0 → 0.2.0 (`browser/stylus/sites/wikipedia.user.css`, +131 lines), measured with the repo's own harness against the live site, both versions, same day:

| Measurement | 0.1.0 (HEAD) | 0.2.0 (working tree) |
|---|---|---|
| `check.mjs` article: off-palette fills | `th.navbox-group` #E6E6FF ×14, #DDDDFF ×10; `td.navbox-list` #F7F7F7 ×10; `th.infobox-header` **#C0C0C0 ×6** | `th.navbox-group` #E6E6FF ×14, #DDDDFF ×10; `td.navbox-list` #F7F7F7 ×10; infobox-header now #121216 (fixed); footer plates #F8F9FA ×2 (deliberate, documented) |
| `check.mjs` tables page (`Comparison_of_web_browsers`): off-palette fills | none | none |
| `check.mjs` radii >= 4px | none | none |
| `contrast.mjs` stillRounded (no size floor) | 383× `a` r=2px, 26× `a.mw-redirect`, 9× `a.vector-toc-link`, … (≈397, matches the 0.2.0 comment) | **0** |
| `contrast.mjs` rest-contrast failures | **12** — `div.infobox-caption`, `td.infobox-data`, `th.infobox-label`: `rgb(0,0,0)` on `rgb(7,8,10)`, ratio 1.05 | **12** — identical |
| `contrast.mjs` hover failures | 0 | 8 (TOC digits, `coveredBy header.vector-header`; likely a harness artefact of the header overlapping the TOC during hover) |
| `<html>` class in the harness render | `skin-theme-clientpref-day` (anonymous default; harness passes `colorScheme: dark` but Wikipedia's anonymous default is day) | same |
| `th.navbox-group` inline style | `width:1%` only — the #DDDDFF comes from the navbox stylesheet, not the wikitext | same; computed bg still `rgb(221,221,255)` with 0.2.0 applied |

Consequence of the last two rows: the new night-mode rule in 0.2.0,
`html:is(.skin-theme-clientpref-os, .skin-theme-clientpref-night) :is(.infobox, .navbox, .wikitable) :is(th, .infobox-above, .infobox-header, .navbox-title, .navbox-group):not(.notheme)`,
never matches in the harness render. The infobox-header fix that *did* land came
from adding `.infobox-header` to the unprefixed rule. `.navbox-group` and
`.navbox-list` are only in the prefixed rule, so 34 light-blue/light-grey navbox
cells remain on the audited article in the mode the harness actually renders,
and the 12 black-on-ink infobox cells were never addressed in either version.
Whether the owner's real browser runs Wikipedia in night mode (where the
prefixed rule would apply) is unknown to me.

Also: `browser/stylus/sites/README.md` (uncommitted) says "the file's header
comment records the two filters that were rendered and rejected". The filter
discussion is in a mid-file comment above the `#footer-icons` rule, not in the
header.

## 4. Already decided / do not report

- The repo is called `indigo-glass` and the system `Sage Ink`; legacy paths
  keep the old name. Not renaming anything.
- Generated output is committed. Not changing that.
- No CI. The owner knows; the pre-commit hook is the chosen mechanism.
- Lime Glass is token-only and not installable. Known.
- The two footer attribution plates on Wikipedia stay at Vector's `#F8F9FA`.
  Decided, with the reasoning in the CSS comment.
- Link blue `#85ABF1` on Wikipedia is not a Sage Ink token on purpose (the
  site's own hue re-cut on the ink lightness ladder).
- `__pycache__/` is already gitignored.

## 5. Constraints

- Never edit anything under `research-reports/` to make an implementation look
  compliant. (This brief and its synthesis are new files in that tree; that is
  allowed.)
- Never delete prior-session artefacts; ignore or archive them.
- Force-pushing a rewritten `main` is an irreversible, confirm-gated action; the
  owner decides, not the reviewer.
- No blur, gradient or translucency. Do not suggest them.

## 6. Questions

Answer each under the matching heading in section 8. Rank findings by evidence,
not confidence.

1. **Commit hygiene.** Given that all five commits are pushed and the repo has
   one contributor, what is the right remedy for the `mtusa.com` author on
   `6bf824d`: rewrite and force-push, `.mailmap`, or leave it? What would you
   expect to break for a chezmoi external that pulls `main` with `--ff-only`?
2. **Correctness of the guard change (`507d75c`).** Read the CURRENCY scan and
   the self-test. What inputs make CURRENCY silently pass while the repo is
   inconsistent? (Consider: `HEAD~1` baseline when the token change is two
   commits back; a variant whose accent changes *and* whose name changes; a
   literal present only in a directory not in `COLOUR_DIRS`; the `comm`/`sort`
   locale.) What does the self-test *not* prove?
3. **Docs written on one host, read on another.** `INSTALL-AND-UPDATE.md` bakes
   in `~/indigo-glass/`, `qdbus6`, a missing `key.txt`, and a specific list of
   "absent" apps. Which of these are wrong enough to mislead the owner on the
   second machine, and which are fine as a dated log? Where should
   host-specific facts live instead?
4. **The reset script.** Does `reset-to-stock-kde.sh` do what its doc claims?
   Name every file class the globs sweep that the owner would not expect to
   lose (the measurements list some). Is `/tmp` an acceptable backup location
   given the doc says to log out first and `/tmp` may be tmpfs?
5. **The Wikipedia 0.2.0 change.** Given the harness renders `clientpref-day`
   and the prefixed rule never fires there: is the change as written correct
   for the owner's real browser, incomplete, or making a claim the harness
   cannot back? What is the minimal edit that makes the harness measurement
   and the file's own comments agree? Should the 12 black-on-ink infobox cells
   block committing 0.2.0, or be a follow-up?
6. **The fastfetch mark.** Hand-typed `#C0E3C0`/`#89A889` in `config.jsonc`,
   a `~`-path `source`, two untracked logo files, and a comment pointing at an
   untracked 2.4 MB research directory. What should be committed, what
   ignored, and how should the colour literals be tied to the tokens so the
   CURRENCY scan catches them when the accent moves?
7. **What is missing** that a well-run version of this repo would have and
   that these five commits should have included but did not?
8. **What measurement would change your answer** on any of the above?

## 7. The artefact, in full

Below: the four non-merge commits as `git format-patch` output, then the
uncommitted working-tree diff, then the two untracked fastfetch logo files.
The merge commit `8984511` has no diff of its own.


```diff
From 2e4dbed622600345802191932e201b7834efbaec Mon Sep 17 00:00:00 2001
From: John Rebellion <johnnecirrebellion@gmail.com>
Date: Wed, 16 Sep 2026 15:49:49 +1000
Subject: [PATCH 1/4] docs: add ARCHITECTURE.md and repo CLAUDE.md

- docs/ARCHITECTURE.md: token-to-theme codegen targets, drift guard, verification
- CLAUDE.md: repo-local agent conventions
- README: link ARCHITECTURE from the documentation index

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
---
 CLAUDE.md            |  70 ++++++++++++++++++++++++++++
 README.md            |   1 +
 docs/ARCHITECTURE.md | 106 +++++++++++++++++++++++++++++++++++++++++++
 3 files changed, 177 insertions(+)
 create mode 100644 CLAUDE.md
 create mode 100644 docs/ARCHITECTURE.md

diff --git a/CLAUDE.md b/CLAUDE.md
new file mode 100644
index 0000000..f7bc636
--- /dev/null
+++ b/CLAUDE.md
@@ -0,0 +1,70 @@
+# indigo-glass
+
+KDE Plasma first, plus GTK, Konsole, browsers, editors, SDDM, GRUB and Windows Terminal. Repo is `indigo-glass`; the design
+system is **Sage Ink**.
+
+## Names
+
+- **Sage Ink** — the default variant. Most shipped files use this name.
+- **Indigo Glass** — a selectable variant. The repo, and many paths, keep this name.
+- **Lime Glass** — token-only. Values generate into `tokens/out/*.lime.*`, but
+  `install.sh` ships no `LimeGlass.colors` or Konsole profile. There is no
+  installable Lime option; do not treat it as one.
+
+When generating a new path, match the surrounding directory's name, not the repo name.
+
+## Source of truth
+
+`tokens/indigo-glass.tokens.toml` (OKLCH, schema v6) is canonical.
+`tokens/codegen.py` generates from it into five directories: `tokens/`, `share/`,
+`config/`, `browser/`, `windows/`.
+
+```
+python3 tokens/codegen.py
+```
+
+Generated output **is committed on purpose** — users install without running codegen.
+
+## Never hand-edit
+
+- `tokens/out/*` — wholly generated.
+- `share/color-schemes/SageInk.colors` (`codegen.py:60`), `config/plasma-theme/SageInk/colors` (`:68`),
+  `share/color-schemes/IndigoGlass.colors` (`:70`), `windows/terminal/indigo-glass.scheme.json` (`:75`),
+  `browser/monkeytype/indigo-glass.json` (`:76`) and `.settings.json` (`:77`).
+- `simulator/src/lib/palettes.ts` — its header marks it GENERATED.
+- `cursor/.work/` — upstream vendor tree, untracked.
+- Anything under `research-reports/` — never edit an audit to make an implementation
+  look compliant.
+
+## The trap that matters most
+
+`scripts/check-palette-drift.sh:4-7` states it plainly:
+
+> "every layer config is meant to derive from `tokens/out/*` via `codegen.py`. **In
+> practice layer configs carry literals typed by hand, and nothing regenerates them.**"
+
+So you **cannot** assume a colour literal in a layer config is generated. To change a
+colour: edit the TOML → regenerate → run the drift guard → fix what it reports. Never
+find-and-replace a hex value across layers.
+
+## Verify
+
+```
+python3 tokens/codegen.py          # regenerate
+scripts/check-palette-drift.sh     # drift guard — must pass
+scripts/check-deployment.sh        # is the theme actually in use on this host
+```
+
+There is no `.github/` and no CI of any kind. Tests exist; nothing runs them but you.
+
+## Other traps
+
+- Default variant is `default_variant` in the `[meta]` block of the TOML. Change it
+  there and regenerate; do not edit output.
+- Only accent colours are variant-specific. Spacing, radius, shadow, type and motion
+  are variant-agnostic — do not create per-variant copies.
+- The simulator is a **web approximation**. Passing its Playwright tests does not
+  prove Qt/KWin or GTK rendering is correct.
+- The aesthetic is opaque flat ink: **no blur, no gradient, no translucency**. The KWin
+  blur effect was deliberately removed from the install path (v5, 2026-08-28). Do not
+  reintroduce blur or translucency as an improvement.
diff --git a/README.md b/README.md
index 7c715e3..0927452 100644
--- a/README.md
+++ b/README.md
@@ -212,6 +212,7 @@ See [`docs/REFERENCE.md`](docs/REFERENCE.md) for full diagnoses + recovery comma
 
 ## Documentation
 
+- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — How tokens become theme files: codegen targets, the drift guard, verification
 - [`docs/REFERENCE.md`](docs/REFERENCE.md) — Full reference: colors, layers, install steps, known bugs, recovery
 - [`docs/PHILOSOPHY.md`](docs/PHILOSOPHY.md) — Design rationale
 - [`docs/STATE_GRAMMAR.md`](docs/STATE_GRAMMAR.md) — The fill-vs-outline convention and how it's enforced
diff --git a/docs/ARCHITECTURE.md b/docs/ARCHITECTURE.md
new file mode 100644
index 0000000..8158fed
--- /dev/null
+++ b/docs/ARCHITECTURE.md
@@ -0,0 +1,106 @@
+# Architecture
+
+How the repository generates, ships and guards its theme assets. For the design
+rationale see [`PHILOSOPHY.md`](PHILOSOPHY.md); for colours, install steps and
+known bugs see [`REFERENCE.md`](REFERENCE.md).
+
+## Naming
+
+The repository is called `indigo-glass`; the design system is called **Sage Ink**.
+The repo predates the rename and several filenames still carry the old name
+(`windows/terminal/indigo-glass.scheme.json`, `browser/monkeytype/indigo-glass.json`)
+while shipping the *active* variant, not the Indigo Glass one. `codegen.py:71-74`
+documents this explicitly. Treat `indigo-glass` as an address, not a description.
+
+## Source of truth
+
+```
+tokens/indigo-glass.tokens.toml      schema version 6, OKLCH
+```
+
+Every layer's concrete config is meant to derive from this file.
+`tokens/codegen.py` (1301 lines) reads it and writes derived assets.
+
+Variants live only in `[variants.<name>]`. Colour is the only thing that varies —
+spacing, radius, shadow, typography and motion are variant-agnostic and shared.
+`[meta].default_variant` selects which variant resolves into the unsuffixed
+outputs; every variant also gets its own suffixed copy.
+
+## What codegen actually writes
+
+`codegen.py` writes into five top-level directories: `tokens/`, `share/`,
+`config/`, `browser/`, `windows/`.
+
+Generated token outputs land in `tokens/out/` as CSS custom properties, SCSS and
+JSON, once unsuffixed (the active default) and once per variant
+(`css-vars.sage.css`, `css-vars.indigo.css`, `css-vars.lime.css`).
+
+Named shipped targets, with their declaration sites:
+
+| Target | Declared at |
+|---|---|
+| `share/color-schemes/SageInk.colors` | `tokens/codegen.py:60` |
+| `config/plasma-theme/SageInk/colors` | `tokens/codegen.py:68` |
+| `share/color-schemes/IndigoGlass.colors` | `tokens/codegen.py:70` |
+| `windows/terminal/indigo-glass.scheme.json` | `tokens/codegen.py:75` |
+| `browser/monkeytype/indigo-glass.json` | `tokens/codegen.py:76` |
+| `browser/monkeytype/indigo-glass.settings.json` | `tokens/codegen.py:77` |
+
+**This is the load-bearing nuance:** only the files above are regenerated.
+Most layer configs carry literals typed by hand and nothing regenerates them.
+`scripts/check-palette-drift.sh:4-7` says so in its own header. Consistency
+across layers is enforced by the drift guard, *not* by the generator.
+
+All generated outputs are committed, so the installer works without ever running
+`codegen.py`.
+
+## Build and install
+
+```bash
+# 1. optional — only needed after changing [meta].default_variant
+python3 tokens/codegen.py
+
+# 2. install
+bash scripts/install.sh          # 535 lines
+```
+
+## Verification
+
+| Check | File | What it proves |
+|---|---|---|
+| Palette + material drift | `scripts/check-palette-drift.sh` (734 lines) | every layer config still matches the tokens; fails the build on mismatch |
+| Deployment | `scripts/check-deployment.sh` (368 lines) | the theme is actually live on this system |
+| Simulator | `simulator/` (SvelteKit + Playwright) | rendered palettes match the generated token files |
+
+The simulator reads generated tokens directly rather than copying them —
+`simulator/src/lib/palettes.ts:3` records that it is generated from
+`codegen.py`, `simulator/src/lib/nb/liveTokens.ts:5` reads
+`tokens/out/css-vars.css`, and `simulator/src/lib/styles/density-optin.css:9`
+maps `tokens/out/density.css` to the TOML spacing section. Passing the simulator
+is necessary but not sufficient: it cannot verify Qt/KWin or GTK rendering.
+
+The drift guard is at v2 (2026-08-28), rewritten after an audit found v1
+reporting "clean" while three shipped themes were still on Lime Glass. That
+failure is the reason the guard exists in its current form.
+
+## Invariants
+
+- `tokens/indigo-glass.tokens.toml` is the single source of truth.
+- `scripts/check-palette-drift.sh` must pass for a build to be valid.
+- Generated assets are tracked in git; those tracked files are what `install.sh`
+  installs.
+- Variants differ in accent colour only.
+- No blur, gradient or translucent surface anywhere. Because nothing is
+  translucent there is nothing to blur, so the KWin blur engine was removed from
+  the install path (v5, 2026-08-28).
+
+## Tracked file counts per layer directory
+
+```
+share 107   config 40   browser 23   vscode 13   windows 7   sddm 5
+hosts 4     shell 3     obsidian 3   spicetify 3 cursor 2    jetbrains 2
+vencord 2   iso 0
+```
+
+`iso/` carries no tracked files — the GRUB/ISO theme is built, not committed.
+`windows/` is tracked and real: the system is not KDE-only.
-- 
2.55.0

```

```diff
From 6bf824dccc7104ffe204a4185be507fbd695d6e6 Mon Sep 17 00:00:00 2001
From: John Rebellion <John.Rebellion@mtusa.com>
Date: Thu, 17 Sep 2026 03:34:56 +0800
Subject: [PATCH 2/4] docs: install/update lifecycle and a stock-KDE reset
 script
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

The chezmoi run_onchange hook rethemes the desktop on a plain `chezmoi
apply`, which is surprising when you only meant to land config. Document
the `--exclude=encrypted,scripts` escape, the missing age key.txt on the
Fedora hosts, and why config can name SageInk before the theme package
exists on disk.

reset-to-stock-kde.sh moves Plasma/KWin/Klassy config to a timestamped
/tmp backup rather than deleting it, and refuses to run while plasmashell
is alive — a live session rewrites the files as fast as you move them.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
---
 docs/INSTALL-AND-UPDATE.md    | 171 ++++++++++++++++++++++++++++++++++
 scripts/reset-to-stock-kde.sh |  48 ++++++++++
 2 files changed, 219 insertions(+)
 create mode 100644 docs/INSTALL-AND-UPDATE.md
 create mode 100755 scripts/reset-to-stock-kde.sh

diff --git a/docs/INSTALL-AND-UPDATE.md b/docs/INSTALL-AND-UPDATE.md
new file mode 100644
index 0000000..cc101d5
--- /dev/null
+++ b/docs/INSTALL-AND-UPDATE.md
@@ -0,0 +1,171 @@
+# Install & Update — Sage Ink on Fedora KDE Plasma 6
+
+The lifecycle for landing (and later re-landing) the Sage Ink stack on a
+Plasma 6 host managed by [chezmoi](https://chezmoi.io). Companion to
+[`../CLAUDE.md`](../CLAUDE.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), and
+`scripts/install.sh`.
+
+## Layout
+
+- `~/indigo-glass/` — the working clone you edit and read (repo `indigo-glass`).
+- `~/.local/share/chezmoi-externals/indigo-glass/` — the chezmoi-managed clone
+  used by the run_onchange installer. Separate from the working clone; refreshed
+  every 168 h. Do not edit here.
+- `~/.local/share/chezmoi/` — chezmoi source tree (repo `dotfiles`), holds
+  `.chezmoiexternal.toml` + the `run_onchange_after_60-install-indigo-glass.sh.tmpl`
+  script that fires the installer on chezmoi apply.
+- `~/.config/chezmoi/key.txt` — age identity, **manually copied** to each host.
+  Missing on this fedora box → all `chezmoi apply` calls exclude encrypted.
+
+## First-time install (this fedora box)
+
+The current host had **LimeGlass** applied (color scheme + Konsole profile) with
+**Klassy** decoration and **WhiteSur-Dark** GTK. The plan wipes those, lets
+Plasma rebuild defaults, then lays Sage Ink on top.
+
+### 1. Pull all sources
+
+```bash
+cd ~/.local/share/chezmoi && git pull --ff-only
+cd ~/.claude-public       && git pull --ff-only
+cd ~/indigo-glass         && git checkout main && git pull --ff-only
+cd ~/.claude              && git pull            # merge (session sync)
+```
+
+Notes:
+- `~/.claude` uses merge (not rebase) per session-sync convention. Stash local
+  session jsonl files if `pull` aborts, then pop after.
+- `~/.claude-public` vendored `claude/skills/color-expert` directly in
+  2026-08+. If a legacy nested clone still lives at
+  `claude/skills/color-expert/.git`, move it to `/tmp/` first — otherwise pull
+  aborts with "would be overwritten by merge".
+
+### 2. Land config (skip installer)
+
+```bash
+chezmoi apply --exclude=encrypted,scripts --force
+```
+
+- `encrypted` — this host has no `key.txt`; `.gnupg/*.age` and `.ssh/*.age`
+  cannot decrypt. Skipping is required.
+- `scripts` — suppresses the run_onchange installer so it does not fire during
+  the reset window (installer runs manually in step 4).
+- `--force` — accept upstream on any file that drifted since chezmoi last wrote
+  it. Any drift on `~/.config/kdeglobals` is about to be wiped anyway.
+
+This step also clones `~/.local/share/chezmoi-externals/indigo-glass` if
+missing.
+
+### 3. Reset to stock KDE (destructive; needs logout)
+
+The reset moves — never deletes — every Plasma/KWin/Klassy config to a
+timestamped `/tmp` directory, then rebuilds sycoca. On next login Plasma
+rebuilds defaults.
+
+```bash
+# from a Plasma session
+loginctl terminate-session $XDG_SESSION_ID    # or logout from menu
+# switch to TTY (Ctrl+Alt+F3), log in as johnn
+bash ~/indigo-glass/scripts/reset-to-stock-kde.sh
+sudo systemctl restart sddm                    # back to greeter
+# log in; you now have stock Breeze Dark
+```
+
+Backed up: `~/.config/plasma*`, `~/.config/kwin*`, `~/.config/kdeglobals`,
+`~/.config/klassy`, `~/.config/klassyrc`, `~/.config/kscreenlockerrc`,
+`~/.config/ksmserverrc`, `~/.config/kactivitymanagerdrc`,
+`~/.local/share/plasma*`, `~/.local/share/kwin`, the IndigoGlass/LimeGlass
+color schemes, and the Plasma/KWin caches.
+
+Backup location: `/tmp/kde-reset-<UTCstamp>/`. Keep the folder around until
+after you have confirmed the new install is behaving; `/tmp` clears on reboot,
+so copy elsewhere if you want it long-term.
+
+### 4. Install Sage Ink
+
+```bash
+bash ~/indigo-glass/scripts/install.sh --themes-only
+```
+
+Idempotent. Deploys color scheme (`SageInk.colors`), Plasma theme
+(`SageInk`), GTK 3/4 theme (`SageInk`), Konsole profile (`SageInk.profile`),
+Klassy config, starship prompt, fastfetch splash, GRUB theme. Browser and
+editor themes (Edge, VSCode, Vencord, Spicetify, Obsidian) require the host
+app to be running and are not part of `--themes-only` — see per-layer READMEs.
+
+### 5. Verify
+
+```bash
+bash ~/indigo-glass/scripts/check-deployment.sh
+```
+
+Every KDE row should say `deployed`. Rows marked `absent` are host apps that
+are not installed on the machine (Discord, Spotify, Obsidian, SDDM, JetBrains)
+— those are not failures.
+
+If a KDE row still says `UNDEPLOYED`, the file was written but the running
+Plasma session has not picked it up. Restart the affected component:
+
+```bash
+plasmashell --replace &                        # panel + widget theme
+qdbus6 org.kde.KWin /KWin reconfigure          # window deco + kwin scripts
+```
+
+## Updating later
+
+When any of these change upstream, the update cadence is:
+
+```bash
+# refresh the four sources
+cd ~/.local/share/chezmoi && git pull --ff-only
+cd ~/indigo-glass         && git pull --ff-only
+cd ~/.claude              && git pull
+cd ~/.claude-public       && git pull
+
+# land config + re-run installer via chezmoi's run_onchange hook
+chezmoi apply --exclude=encrypted
+```
+
+`--exclude=scripts` is dropped on the update path so the installer fires. The
+hook is gated on the sha of the chezmoi-external's `main` ref, so the installer
+runs iff indigo-glass has actually changed since the last apply.
+
+To force a reinstall without an upstream change:
+
+```bash
+bash ~/indigo-glass/scripts/install.sh --themes-only
+```
+
+## Rollback
+
+If the new install misbehaves:
+
+```bash
+STAMP=$(ls -1t /tmp | grep '^kde-reset-' | head -1)
+# stop plasma first (log out to TTY)
+cp -a /tmp/$STAMP/. ~/.config/                 # or mv per-directory
+kbuildsycoca6 --noincremental
+# log back in
+```
+
+The IndigoGlass and LimeGlass `.colors` and Konsole `.profile` files are
+inside the backup — the whole legacy variant is recoverable.
+
+## Other hosts
+
+- **nobara-wsl2** — no KDE session; the installer's KDE steps no-op harmlessly,
+  but running `install.sh --themes-only` still deploys GTK, Konsole (if
+  installed), starship, fastfetch. `key.txt` missing here too, so
+  `chezmoi apply --exclude=encrypted` still applies. Do not run the reset
+  script (there is no Plasma to reset).
+- **acer-a514-54** — same fedora pattern as this box. Copy `key.txt` first if
+  the machine needs decrypted sources; otherwise the same `--exclude=encrypted`
+  path works.
+- **desktop-5700x3d (nobara)** — Nobara ships its own KDE customizations; the
+  reset script backs those up too. Restore them from `/tmp/kde-reset-<stamp>/`
+  if you want the Nobara defaults back after uninstalling Sage Ink.
+
+## Provenance
+
+- 2026-09-16 — first written. Fedora 44 KDE 6 Wayland, migrating LimeGlass →
+  SageInk. Companion `~/indigo-glass/scripts/reset-to-stock-kde.sh` created same session.
diff --git a/scripts/reset-to-stock-kde.sh b/scripts/reset-to-stock-kde.sh
new file mode 100755
index 0000000..34d4ab3
--- /dev/null
+++ b/scripts/reset-to-stock-kde.sh
@@ -0,0 +1,48 @@
+#!/usr/bin/env bash
+# Stock-KDE reset — run AFTER logging out of Plasma, from a TTY (Ctrl+Alt+F3).
+# Backs up every ~/.config KDE surface to /tmp/kde-reset-<UTC>/ so nothing is
+# actually deleted. On next login, Plasma rebuilds defaults; then run
+# ~/indigo-glass/scripts/install.sh --themes-only to lay Sage Ink on top.
+set -euo pipefail
+
+if pgrep -x plasmashell >/dev/null; then
+  echo "REFUSE: plasmashell is running. Log out first (leave the session, drop to a TTY)."
+  exit 1
+fi
+
+STAMP=$(date -u +%Y%m%dT%H%M%SZ)
+BACKUP=/tmp/kde-reset-$STAMP
+mkdir -p "$BACKUP"
+echo "backup dir: $BACKUP"
+
+shopt -s nullglob
+moved=0
+for src in \
+  ~/.config/plasma* \
+  ~/.config/kwin* \
+  ~/.config/kdeglobals \
+  ~/.config/klassy \
+  ~/.config/klassyrc \
+  ~/.config/kscreenlockerrc \
+  ~/.config/ksmserverrc \
+  ~/.config/kactivitymanagerdrc \
+  ~/.local/share/plasma* \
+  ~/.local/share/kwin \
+  ~/.local/share/color-schemes/IndigoGlass.colors \
+  ~/.local/share/color-schemes/LimeGlass.colors \
+  ~/.cache/plasma* \
+  ~/.cache/kwin* \
+  ~/.cache/ksycoca*
+do
+  [ -e "$src" ] || continue
+  dest="$BACKUP/$(basename "$src")"
+  mv -v "$src" "$dest"
+  moved=$((moved+1))
+done
+shopt -u nullglob
+
+echo
+echo "moved $moved item(s) to $BACKUP"
+kbuildsycoca6 --noincremental >/dev/null 2>&1 || true
+echo "sycoca rebuilt. Log back in, then run:"
+echo "  bash ~/indigo-glass/scripts/install.sh --themes-only"
-- 
2.55.0

```

```diff
From 507d75cfbf96823581a066274519091f0131002f Mon Sep 17 00:00:00 2001
From: John Rebellion <johnnecirrebellion@gmail.com>
Date: Thu, 17 Sep 2026 04:06:56 +0800
Subject: [PATCH 3/4] fix(guard): catch a superseded accent, and test that the
 guard does

A cross-model audit ran the experiment this guard had never been subjected
to: change a token and ask whether the repo is still consistent.

    sed -i '116s/145.00/155.00/' tokens/indigo-glass.tokens.toml
    python3 tokens/codegen.py          -> exit 0, 13 files regenerated
    scripts/check-palette-drift.sh     -> exit 0, "clean"
    git grep -l '#A6C9A6'              -> 31 tracked files still on the old hex

Among the 31: config/gtk-3.0/gtk.css, config/gtk-4.0/gtk.css,
config/starship.toml and share/konsole/SageInk.profile, all deployed by
install.sh. That is v1's failure mode -- "guard clean, shipped themes
stale" -- reproduced by the guard written to end it.

The hole is structural rather than a missing pattern. COLOUR hunts only a
NON-ACTIVE variant's accent, so a variant that keeps its name and changes
its value is invisible to it. PARITY covers only the surfaces with a
byte-comparable generated counterpart. A changed accent falls between.

CURRENCY closes it by asking a question about history instead of about the
current file: which accent literals did this revision supersede, and does
any deployable still carry one? Baseline is HEAD when the tokens are edited
but uncommitted, HEAD~1 otherwise. accent_literals_for() now takes an
optional tokens path so it can read a file extracted from a git ref.

test-drift-guard.sh is the executable form of the paragraphs above: it
fails against v4 and passes against v5. Verified red before the fix and
green after; the guard still exits 0 on an unmodified checkout, so the new
scan adds no false positive.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
---
 scripts/check-palette-drift.sh | 101 ++++++++++++++++++++++++++--
 scripts/test-drift-guard.sh    | 116 +++++++++++++++++++++++++++++++++
 2 files changed, 210 insertions(+), 7 deletions(-)
 create mode 100755 scripts/test-drift-guard.sh

diff --git a/scripts/check-palette-drift.sh b/scripts/check-palette-drift.sh
index 7db27c2..6b0624a 100755
--- a/scripts/check-palette-drift.sh
+++ b/scripts/check-palette-drift.sh
@@ -64,9 +64,34 @@
 #   `tokens/codegen.py --check` — simpler and strictly more thorough than the
 #   differ it replaced, since it's a full-file comparison, not a key overlap.
 #
+# v5 (2026-09-16) — added a fifth dimension, CURRENCY, after a cross-model
+#   audit ran the one experiment nobody had run against this guard: change a
+#   token and ask whether the repo is still consistent. Measured on v4 —
+#   nudge the sage accent hue by 10deg, run codegen.py, run this script:
+#   13 files regenerate, 31 tracked files keep the old #A6C9A6, and the guard
+#   prints "clean" and exits 0. Among the 31 are config/gtk-3.0/gtk.css,
+#   config/gtk-4.0/gtk.css, config/starship.toml and
+#   share/konsole/SageInk.profile — all deployed by install.sh.
+#
+#   That is v1's failure mode ("guard clean, shipped themes stale") reproduced
+#   by the guard written to end it. The hole is structural, not an oversight
+#   in a pattern list: COLOUR hunts only a NON-ACTIVE variant's accent, so a
+#   variant that keeps its name and changes its value is invisible to it;
+#   PARITY covers only the surfaces with a byte-comparable generated
+#   counterpart. A changed accent falls between them.
+#
+#   CURRENCY closes it by asking a question about history rather than about
+#   the current file: which accent literals did this revision supersede, and
+#   does any deployable still carry one? Baseline is HEAD when the tokens are
+#   edited but uncommitted, HEAD~1 otherwise.
+#
+#   scripts/test-drift-guard.sh is the executable form of the paragraph above.
+#   It fails against v4 and passes against v5. Run it after touching this file.
+#
 # Usage:
-#   scripts/check-palette-drift.sh              # colour + material + alpha + parity
+#   scripts/check-palette-drift.sh              # all six scans
 #   scripts/check-palette-drift.sh --colour     # colour only
+#   scripts/check-palette-drift.sh --currency   # currency only
 #   scripts/check-palette-drift.sh --material   # material only
 #   scripts/check-palette-drift.sh --alpha      # alpha only
 #   scripts/check-palette-drift.sh --parity     # parity only
@@ -88,6 +113,7 @@ case "${1:-}" in
   --colour|--color) MODE="colour" ;;
   --material)       MODE="material" ;;
   --alpha)          MODE="alpha" ;;
+  --currency)       MODE="currency" ;;
   --parity)         MODE="parity" ;;
   --shadow)         MODE="shadow" ;;
   "")               MODE="all" ;;
@@ -150,14 +176,23 @@ filter_variant_files() { grep -vE "$VARIANT_FILE_EXCLUDE" || true; }
 # ===========================================================================
 # Accent-only. base/surface/text/semantic tokens are shared across variants on
 # purpose, so matching those would false-positive on every file.
+# accent_literals_for <variant> [tokens-file]
+# Emits the variant's accent, accent_hi and accent_alt in all three spellings
+# this repo writes colours in. The optional second argument lets CURRENCY pass
+# a tokens file extracted from a git ref instead of the working tree's.
 accent_literals_for() {
-  python3 - "$1" <<'PY'
+  python3 - "$1" "${2:-$TOKENS_FILE}" <<'PY'
 import sys, re, importlib.util
 variant = sys.argv[1]
-text = open("tokens/indigo-glass.tokens.toml").read()
-block = re.search(rf'\[variants\.{variant}\](.*?)(?=\n\[|\Z)', text, re.S).group(1)
-L, C, H = (float(x) for x in re.search(
-    r'accent\s*=\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+)\]', block).groups())
+text = open(sys.argv[2]).read()
+m = re.search(rf'\[variants\.{variant}\](.*?)(?=\n\[|\Z)', text, re.S)
+if not m:
+    sys.exit(0)          # variant absent from this revision — nothing to compare
+block = m.group(1)
+am = re.search(r'accent\s*=\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+)\]', block)
+if not am:
+    sys.exit(0)
+L, C, H = (float(x) for x in am.groups())
 spec = importlib.util.spec_from_file_location("cg", "tokens/codegen.py")
 cg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cg)
 for dl in (0, 0.08, -0.10):          # accent, accent_hi, accent_alt
@@ -190,6 +225,58 @@ if [ "$MODE" = "all" ] || [ "$MODE" = "colour" ]; then
   done
 fi
 
+# ===========================================================================
+# 1b. CURRENCY — a superseded accent of ANY variant, including the active one
+# ===========================================================================
+# COLOUR above only hunts a NON-ACTIVE variant's accent, so it is blind to the
+# case where a variant keeps its name and changes its value. PARITY only covers
+# the surfaces that have a byte-comparable generated counterpart. Between the
+# two sits the failure this scan exists for: edit an accent in the TOML,
+# regenerate, and the 13 generated files move while every hand-typed copy of
+# the old hex stays put — in GTK CSS, the Konsole profile, starship, SDDM and
+# the browser themes. Measured 2026-09-16 on the v4 guard: 31 tracked files
+# stale, guard "clean", exit 0.
+#
+# The comparison is against git, because "superseded" is a statement about
+# history, not about the current file. Baseline is HEAD when the working tree
+# has edited the tokens, otherwise HEAD~1 so a change that was just committed
+# is still checked.
+if [ "$MODE" = "all" ] || [ "$MODE" = "currency" ]; then
+  echo ""
+  if ! git rev-parse --git-dir >/dev/null 2>&1; then
+    echo "Currency scan: skipped (not a git checkout)"
+  else
+    if ! git diff --quiet HEAD -- "$TOKENS_FILE" 2>/dev/null; then
+      BASE_REF="HEAD"                 # tokens edited but not yet committed
+    else
+      BASE_REF="HEAD~1"               # tokens match HEAD; check the last commit
+    fi
+
+    BASE_TOKENS="$(mktemp)"
+    if git show "$BASE_REF:$TOKENS_FILE" > "$BASE_TOKENS" 2>/dev/null; then
+      echo "Currency scan: superseded accents vs $BASE_REF"
+      for v in indigo lime sage; do
+        before="$(accent_literals_for "$v" "$BASE_TOKENS" | sort -u)"
+        after="$(accent_literals_for "$v" "$TOKENS_FILE"  | sort -u)"
+        [ -z "$before" ] && continue
+        superseded="$(comm -23 <(echo "$before") <(echo "$after"))"
+        [ -z "$superseded" ] && continue
+        pattern="$(echo "$superseded" | sed 's/[.[\*^$]/\\&/g' | tr '\n' '|' | sed 's/|$//')"
+        hits="$(grep -rInE "$pattern" "${COLOUR_DIRS[@]}" "${EXCLUDE[@]}" 2>/dev/null | filter_allowed | filter_variant_files || true)"
+        if [ -n "$hits" ]; then
+          FOUND=1
+          echo ""
+          echo "--- superseded '$v' accent still present (changed since $BASE_REF) ---"
+          echo "$hits"
+        fi
+      done
+    else
+      echo "Currency scan: skipped (no $BASE_REF revision of $TOKENS_FILE)"
+    fi
+    rm -f "$BASE_TOKENS"
+  fi
+fi
+
 # ===========================================================================
 # 2. MATERIAL — glass surviving in an ink system
 # ===========================================================================
@@ -713,7 +800,7 @@ fi
 
 echo ""
 if [ "$FOUND" -eq 0 ]; then
-  echo "clean — no colour, material, alpha, parity, or shadow drift"
+  echo "clean — no colour, currency, material, alpha, parity, or shadow drift"
   exit 0
 else
   echo "DRIFT FOUND — see file:line above."
diff --git a/scripts/test-drift-guard.sh b/scripts/test-drift-guard.sh
new file mode 100755
index 0000000..f22082d
--- /dev/null
+++ b/scripts/test-drift-guard.sh
@@ -0,0 +1,116 @@
+#!/usr/bin/env bash
+# test-drift-guard.sh — self-test for scripts/check-palette-drift.sh
+#
+# Added 2026-09-16 after a cross-model audit ran the obvious experiment nobody
+# had run: change one token and ask the guard whether the repo is still
+# consistent. It said "clean". Measured on the unmodified v4 guard:
+#
+#     sed -i '116s/145.00/155.00/' tokens/indigo-glass.tokens.toml  # sage accent
+#     python3 tokens/codegen.py        -> exit 0, 13 files regenerated
+#     scripts/check-palette-drift.sh   -> exit 0, "clean"
+#     git grep -l '#A6C9A6'            -> 31 tracked files still on the old hex,
+#                                         including config/gtk-3.0/gtk.css,
+#                                         config/gtk-4.0/gtk.css, config/starship.toml
+#                                         and share/konsole/SageInk.profile, all of
+#                                         which install.sh deploys.
+#
+# That is the v1 failure mode — "guard clean, shipped themes stale" — reproduced
+# by the v2/v3/v4 guard that was written to end it. COLOUR only hunts a
+# NON-ACTIVE variant's accent, so it is blind to the active variant's own
+# superseded value; PARITY only covers the surfaces with a byte-comparable
+# generated counterpart. A changed accent falls between the two.
+#
+# This test asserts the guard notices. It runs against the WORKING TREE copy of
+# the guard and codegen, not HEAD, so it exercises edits before they are
+# committed. It never touches the real working tree: all mutation happens in a
+# throwaway git worktree under $TMPDIR.
+#
+# Usage:  bash scripts/test-drift-guard.sh
+# Exit 0 = the guard behaves correctly. Exit 1 = the guard has a hole.
+set -euo pipefail
+cd "$(dirname "${BASH_SOURCE[0]}")/.."
+REPO="$PWD"
+
+WT="$(mktemp -d -t drift-guard-test-XXXXXX)"
+cleanup() { git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1 || rm -rf "$WT"; }
+trap cleanup EXIT
+
+git -C "$REPO" worktree add --detach "$WT" HEAD >/dev/null 2>&1
+
+# Exercise the working-tree guard and generator, not the committed ones.
+cp "$REPO/scripts/check-palette-drift.sh" "$WT/scripts/"
+cp "$REPO/tokens/codegen.py"              "$WT/tokens/"
+
+cd "$WT"
+
+pass=0
+fail=0
+check() { # check <description> <expected-exit> <actual-exit>
+  if [ "$2" = "$3" ]; then
+    echo "  ok    $1"
+    pass=$((pass + 1))
+  else
+    echo "  FAIL  $1 (expected exit $2, got $3)"
+    fail=$((fail + 1))
+  fi
+}
+
+echo "drift guard self-test"
+echo ""
+
+# --- 1. baseline: an untouched checkout must be clean -----------------------
+set +e
+bash scripts/check-palette-drift.sh >/dev/null 2>&1
+baseline=$?
+set -e
+check "clean checkout passes" 0 "$baseline"
+
+# --- 2. the regression: change the active variant's accent ------------------
+ACTIVE="$(grep -E '^default_variant' tokens/indigo-glass.tokens.toml \
+          | sed -E 's/.*"([a-z]+)".*/\1/')"
+
+# Nudge the accent hue by 10 degrees inside the active variant's block only.
+python3 - "$ACTIVE" <<'PY'
+import re, sys
+variant = sys.argv[1]
+path = "tokens/indigo-glass.tokens.toml"
+text = open(path).read()
+m = re.search(rf'(\[variants\.{variant}\].*?)(?=\n\[|\Z)', text, re.S)
+block = m.group(1)
+def bump(mm):
+    L, C, H = mm.group(2), mm.group(3), float(mm.group(4))
+    return f"{mm.group(1)}{L}, {C}, {(H + 10.0) % 360:.2f}]"
+new = re.sub(r'(accent\s*=\s*\[)\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]', bump, block, count=1)
+assert new != block, f"could not find an accent in [variants.{variant}]"
+open(path, "w").write(text[:m.start(1)] + new + text[m.end(1):])
+PY
+
+if ! python3 tokens/codegen.py >/dev/null 2>&1; then
+  echo "  FAIL  codegen.py rejected the perturbed tokens — test fixture is broken" >&2
+  exit 1
+fi
+
+set +e
+bash scripts/check-palette-drift.sh >/dev/null 2>&1
+after=$?
+set -e
+check "changed accent + regenerate is reported as drift" 1 "$after"
+
+# --- 3. the drift it must name ----------------------------------------------
+# Every deployable still carrying the superseded accent should be reported.
+set +e
+report="$(bash scripts/check-palette-drift.sh 2>&1)"
+set -e
+missing=0
+for f in config/gtk-3.0/gtk.css config/gtk-4.0/gtk.css config/starship.toml \
+         share/konsole/SageInk.profile; do
+  grep -qF "$f" <<<"$report" || { echo "      not named: $f"; missing=1; }
+done
+check "names the shipped deployables left stale" 0 "$missing"
+
+echo ""
+if [ "$fail" -gt 0 ]; then
+  echo "$fail failed, $pass passed — the guard has a hole"
+  exit 1
+fi
+echo "$pass passed — guard covers superseded accents"
-- 
2.55.0

```

```diff
From dc1a1c6a58d0cd08aecd7f335e2adb7087240357 Mon Sep 17 00:00:00 2001
From: John Rebellion <johnnecirrebellion@gmail.com>
Date: Thu, 17 Sep 2026 04:07:38 +0800
Subject: [PATCH 4/4] docs: correct four claims the audit measured as false

ARCHITECTURE.md said regenerating was "optional -- only needed after
changing [meta].default_variant". It is required after any token VALUE
change; skipping it ships canonical source and committed assets out of
sync. CLAUDE.md's Verify block was already right, so the two documents
from the same commit contradicted each other on the one question that
matters most. Build steps now include the drift guard explicitly, and both
failure modes are named.

ARCHITECTURE.md said "consistency across layers is enforced by the drift
guard, not by the generator". True as an intent, false as a claim of
coverage until the preceding commit -- 31 tracked files stale, guard
clean. The passage now states the gap that existed, why a gap in the guard
is indistinguishable from no drift, and that guard coverage is a claim
needing its own test.

CLAUDE.md's naming rule said to match the surrounding directory's name.
That is unsafe in a repo whose directories carry legacy indigo-glass names
while shipping the active variant: a new asset inherits a dead name by
proximity. Rule now points at the declaration site, with an explicit
prohibition on renaming existing paths, since codegen.py resolves them by
string.

hosts/README.md advertised _default for "any 1440p / 4K-100% setup" while
its own DPI table puts 27" 4K at 163 DPI, ratio 1.50 -- self-refuting
within one file, and wrong by 50% for anyone who followed it. _default is
now keyed to ~109 effective DPI rather than to a machine, and the DPI table
is named as the arbiter.

Also corrected during verification: the pre-commit hook is active here via
core.hooksPath=scripts/git-hooks, not absent as a check of .git/hooks/
suggested. Since core.hooksPath is per-clone untracked config, a fresh
clone on another machine is unguarded until it is set -- now documented in
both files with the command.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
---
 CLAUDE.md            | 18 +++++++++++++++---
 docs/ARCHITECTURE.md | 45 ++++++++++++++++++++++++++++++++++++--------
 hosts/README.md      | 10 ++++++++--
 3 files changed, 60 insertions(+), 13 deletions(-)

diff --git a/CLAUDE.md b/CLAUDE.md
index f7bc636..2092999 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -11,7 +11,10 @@ system is **Sage Ink**.
   `install.sh` ships no `LimeGlass.colors` or Konsole profile. There is no
   installable Lime option; do not treat it as one.
 
-When generating a new path, match the surrounding directory's name, not the repo name.
+Name a new path after its declaration site in `codegen.py` or `install.sh`, not
+after the files beside it — neighbouring `indigo-glass` names are legacy, so
+proximity is not naming authority. Never rename an existing path to match this
+rule: `codegen.py` resolves the "Never hand-edit" names by string.
 
 ## Source of truth
 
@@ -50,12 +53,21 @@ find-and-replace a hex value across layers.
 ## Verify
 
 ```
-python3 tokens/codegen.py          # regenerate
+python3 tokens/codegen.py          # regenerate — required after ANY token change
 scripts/check-palette-drift.sh     # drift guard — must pass
+scripts/test-drift-guard.sh        # only when you have edited the guard itself
 scripts/check-deployment.sh        # is the theme actually in use on this host
 ```
 
-There is no `.github/` and no CI of any kind. Tests exist; nothing runs them but you.
+Regenerating is required after any token *value* change, not just a variant
+switch — `codegen.py` moves 13 files and the hand-typed layer copies do not
+follow. See `docs/ARCHITECTURE.md` for what that cost when the guard missed it.
+
+No CI. `scripts/git-hooks/pre-commit` runs the guard on every commit, wired by
+`core.hooksPath=scripts/git-hooks`. That is per-clone local config and is not
+tracked, so a fresh clone is **unguarded until it is set**:
+
+    git config core.hooksPath scripts/git-hooks
 
 ## Other traps
 
diff --git a/docs/ARCHITECTURE.md b/docs/ARCHITECTURE.md
index 8158fed..d7149dd 100644
--- a/docs/ARCHITECTURE.md
+++ b/docs/ARCHITECTURE.md
@@ -49,7 +49,18 @@ Named shipped targets, with their declaration sites:
 **This is the load-bearing nuance:** only the files above are regenerated.
 Most layer configs carry literals typed by hand and nothing regenerates them.
 `scripts/check-palette-drift.sh:4-7` says so in its own header. Consistency
-across layers is enforced by the drift guard, *not* by the generator.
+across layers is therefore enforced by the drift guard, *not* by the generator
+— which makes any gap in the guard indistinguishable, from the outside, from
+having no drift at all.
+
+That is not hypothetical. Until 2026-09-16 the guard had exactly such a gap:
+changing an accent value and regenerating moved 13 files, left 31 tracked files
+on the superseded hex — `config/gtk-3.0/gtk.css`, `config/gtk-4.0/gtk.css`,
+`config/starship.toml` and `share/konsole/SageInk.profile` among them — and
+still printed `clean`. The CURRENCY scan closes it, and
+`scripts/test-drift-guard.sh` is the regression test that keeps it closed.
+Treat the guard's coverage as a claim that needs its own test, not as a
+property of having a guard.
 
 All generated outputs are committed, so the installer works without ever running
 `codegen.py`.
@@ -57,20 +68,32 @@ All generated outputs are committed, so the installer works without ever running
 ## Build and install
 
 ```bash
-# 1. optional — only needed after changing [meta].default_variant
+# 1. required after ANY change to tokens/indigo-glass.tokens.toml —
+#    a changed value, not just a changed [meta].default_variant.
 python3 tokens/codegen.py
 
-# 2. install
+# 2. required: regeneration moves 13 files; the hand-typed copies in the
+#    other layers do not move with them. The guard is what finds those.
+bash scripts/check-palette-drift.sh
+
+# 3. install
 bash scripts/install.sh          # 535 lines
 ```
 
+Skipping step 1 leaves canonical source and committed generated assets out of
+sync. Skipping step 2 leaves the generated assets correct and the hand-typed
+layers stale — which is the more expensive of the two, because everything
+that reports on the build still looks healthy.
+
 ## Verification
 
 | Check | File | What it proves |
 |---|---|---|
-| Palette + material drift | `scripts/check-palette-drift.sh` (734 lines) | every layer config still matches the tokens; fails the build on mismatch |
+| Palette + material drift | `scripts/check-palette-drift.sh` (821 lines) | every layer config still matches the tokens; fails the build on mismatch. Six scans: colour, currency, material, alpha, parity, shadow |
+| Drift-guard self-test | `scripts/test-drift-guard.sh` | the guard actually fails when a token changes and the layers do not follow. Run it after editing the guard |
 | Deployment | `scripts/check-deployment.sh` (368 lines) | the theme is actually live on this system |
 | Simulator | `simulator/` (SvelteKit + Playwright) | rendered palettes match the generated token files |
+| Pre-commit | `scripts/git-hooks/pre-commit` | the guard ran before a commit landed — **only if** `core.hooksPath=scripts/git-hooks` is set in that clone. It is local config, untracked, so every new clone starts unguarded |
 
 The simulator reads generated tokens directly rather than copying them —
 `simulator/src/lib/palettes.ts:3` records that it is generated from
@@ -79,20 +102,26 @@ The simulator reads generated tokens directly rather than copying them —
 maps `tokens/out/density.css` to the TOML spacing section. Passing the simulator
 is necessary but not sufficient: it cannot verify Qt/KWin or GTK rendering.
 
-The drift guard is at v2 (2026-08-28), rewritten after an audit found v1
-reporting "clean" while three shipped themes were still on Lime Glass. That
-failure is the reason the guard exists in its current form.
+The drift guard is at v5 (2026-09-16). v2 (2026-08-28) was itself a rewrite,
+after an audit found v1 reporting "clean" while three shipped themes were still
+on Lime Glass. v5 exists because v2's successors reproduced that same failure
+against a different input: a variant that keeps its name and changes its value.
+The pattern is worth naming — each version of this guard has been correct about
+the drift it was told to look for and silent about the drift it was not, so the
+guard's own coverage is now under test rather than under review.
 
 ## Invariants
 
 - `tokens/indigo-glass.tokens.toml` is the single source of truth.
 - `scripts/check-palette-drift.sh` must pass for a build to be valid.
+- Any change to the guard must keep `scripts/test-drift-guard.sh` passing.
 - Generated assets are tracked in git; those tracked files are what `install.sh`
   installs.
 - Variants differ in accent colour only.
 - No blur, gradient or translucent surface anywhere. Because nothing is
   translucent there is nothing to blur, so the KWin blur engine was removed from
-  the install path (v5, 2026-08-28).
+  the install path (install.sh v5, 2026-08-28 — unrelated to the drift guard's
+  own v5 above).
 
 ## Tracked file counts per layer directory
 
diff --git a/hosts/README.md b/hosts/README.md
index 02e00d0..2c5b58a 100644
--- a/hosts/README.md
+++ b/hosts/README.md
@@ -8,7 +8,7 @@ Canonical palette (colors, fonts, layout discipline) stays universal across all
 
 | Concept | Detail |
 |---|---|
-| `_default.toml` | Nobara desktop reference (27" 1440p @ 100% scale). Canonical sizes. |
+| `_default.toml` | Reference profile: 109 effective DPI, ratio 1.0. Canonical sizes. Defined on the Nobara desktop (27" 1440p @ 100%), but the profile is keyed to the DPI, not to that machine. |
 | `<host>.toml` | Per-host override. Sets only fields that differ from default. |
 | `apply.sh` | Reads a profile + writes values into live config files (`~/.config/kdeglobals`, GTK, Konsole, VSCode) |
 | Auto-detect | `hostname -s` matched against `<name>.toml`. Falls back to `_default`. |
@@ -54,7 +54,7 @@ font_pt = 11
 
 | Profile | Display | Scale ratio | When to use |
 |---|---|:---:|---|
-| `_default` | 27" 1440p @ 100% | 1.0 (reference) | Nobara desktop. Any 1440p / 4K-100% setup. |
+| `_default` | 27" 1440p @ 100% | 1.0 (reference) | Nobara desktop, and any display at ~109 effective DPI. |
 | `aspire5-14-1080p` | 14" 1080p @ Win 100% | 1.44x | Acer Aspire 5. Or any 13-14" 1080p where you refuse to raise display scaling. |
 
 ## Apply
@@ -106,4 +106,10 @@ bash hosts/apply.sh --dry-run
 | 27" 4K | 163 | 1.50 |
 | 32" 4K | 138 | 1.27 |
 
+`_default` suits a display only if its effective DPI is near 109. A 4K panel at
+100% scale is **not** one: by the table above, 27" 4K is 163 DPI (ratio 1.50) and
+24" 4K is 184 DPI (ratio 1.69). Both need their own profile, or display scaling.
+The DPI table is the arbiter — if a claim about a display disagrees with it, the
+table wins.
+
 If you prefer Win/KDE display scaling instead of font scaling: set display to 1.25/1.5/2.0 and keep profile at `_default`. This repo's stance is font-level scaling: same physical text size across machines without touching display scale.
-- 
2.55.0

```

### Uncommitted working-tree diff

```diff
diff --git a/browser/stylus/sites/README.md b/browser/stylus/sites/README.md
index 928ef01..5f39961 100644
--- a/browser/stylus/sites/README.md
+++ b/browser/stylus/sites/README.md
@@ -16,7 +16,7 @@ Surgical retints for sites where the universal Sage Ink Stylus style isn't enoug
 | `github.user.css` | github.com | Primer's ~1260 `--bgColor-*`/`--fgColor-*` tokens |
 | `atlassian.user.css` | atlassian.net + atlassian.com | Atlassian Design System `--ds-*` (any tenant) |
 | `microsoft365.user.css` | cloud.microsoft, outlook.office.com, teams, sharepoint | Fluent v9 `--color*` + legacy Fabric slots |
-| `wikipedia.user.css` | wikipedia/wikimedia/wiktionary/wikidata | Codex tokens + direct rules for Vector's night mode |
+| `wikipedia.user.css` | wikipedia/wikimedia/wiktionary/wikidata | Codex tokens + direct rules for Vector's night mode, the icon-mask fills, and the inline-coloured comparison tables |
 | `gemini.user.css` | gemini.google.com | Material 3 `--gm3-sys-color-*` + Gemini's `--bard-color-*` |
 | `aistudio.user.css` | aistudio.google.com | Material 3 tokens + the `ms-*` shell components |
 | `copilot.user.css` | copilot.microsoft.com | Tailwind-style 100-900 ramps, squircle clip-paths off |
@@ -111,6 +111,29 @@ now maps Primer's semantic tokens (`--fgColor-success`, `--fgColor-attention`,
 Worth checking on any site with status indicators — `contrast.mjs` reports
 saturated SVG paint now.
 
+### Icons are backgrounds, and small enough to audit clean
+
+Codex draws every toolbar icon as a `background-color` behind a `mask-image`.
+The spans are 20px, and `check.mjs` skips anything under 24×12 — so Wikipedia's
+entire header (menu, search, alerts, watchlist, appearance) painted Vector's
+`#C8CCD1` through two passes that both reported `radii: []` and a clean fill
+list. `.cdx-button__icon` reads `--color-neutral`, not the `--color-base` the
+file already set.
+
+`contrast.mjs` is what caught it, and not as a failure — as the `coveredBy`
+field on a *passing* row. Read those: `coveredBy` names the element actually
+painting over a label, and an off-palette icon shows up there long before it
+shows up anywhere else.
+
+### Radii below the audit floor
+
+`check.mjs` only counts a radius of 4px or more, on the grounds that smaller
+ones are invisible. Vector hardcodes **2px on every link** —
+`a:where(:not([role="button"]))`, zero specificity, no token behind it — plus
+the search field and the collapsible toggles. `contrast.mjs`'s rounding pass
+counted 397 of them on one article while `check.mjs` reported none. Run both;
+they do not see the same page.
+
 ### The label-on-accent rule
 
 **Never repaint a "text on accent" token unless this file also owns every
@@ -165,6 +188,13 @@ known remainders — one 8px radius outside the app shell, a 5% white wash, and
 one panel at `#0A0A0A` against the base's `#07080A`, a difference no eye
 resolves.
 
+Wikipedia at 0.2.0 is audited on two URLs — an article, for the infobox /
+ambox / navbox shapes, and `Comparison_of_web_browsers`, which is wall-to-wall
+`.wikitable` with hand-written cell colours. It carries one deliberate
+off-palette fill: the two footer attribution plates at `#F8F9FA`, Vector's own
+value. See the label-on-accent rule above; the file's header comment records
+the two filters that were rendered and rejected before settling there.
+
 Things the harness found that no screenshot would have:
 
 - Facebook's white loading skeletons come from `--glimmer-base-opaque`, which
@@ -177,6 +207,26 @@ Things the harness found that no screenshot would have:
 - Vector's night mode ignores its own tokens: `--color-progressive` computes to
   `#88a3e8` while links actually render `#80B0E7`, so Wikipedia needs direct
   rules behind the variable remap.
+- A rule can be inert and still look plausible in the file. Wikipedia's
+  `.infobox-above` header band never landed in either mode: infobox captions
+  carry an inline `background-color:#C0C0C0` from the wikitext, and Vector
+  neutralises it with `html.skin-theme-clientpref-os .infobox th:not(.notheme)
+  {background: inherit !important}` — `!important` at (0,3,2) against a bare
+  class at (0,1,0). Matching the neutraliser's shape and adding one class is
+  what makes it apply. A `!important` in your own file proves nothing.
+- Wikipedia's `{{yes}}`/`{{no}}`/`{{partial}}` templates write
+  `style="background:#9EFF9E;color:black"` **inline**, so no dark mode can
+  reach them — the `--no-style` baseline reports 1978 mint cells on one
+  comparison article, in stock dark Wikipedia. Repaint fill and label
+  together or the black text strands. Named template classes only: in a legend
+  swatch the colour *is* the datum and there is no text to carry it, so a
+  blanket `td[style*="background"]` rule deletes the meaning it set out to
+  restore.
+- Playwright's full-page screenshot does not trigger `loading="lazy"` images.
+  Wikipedia's two footer marks are lazy, so the page-level shot shows empty
+  chips no matter what the style does. `locator.screenshot()` on the element
+  renders them; that is the only way the mangled-hue filters below were seen
+  at all.
 - Google's 652px measure is not a `max-width`. `#rcnt` is a 22-track grid and
   `#center_col` is placed at `2 / span 12`. Re-placing the grid item is the
   only safe way to widen it — capping its width starves the layout instead.
diff --git a/browser/stylus/sites/wikipedia.user.css b/browser/stylus/sites/wikipedia.user.css
index 8e1438c..aabfa71 100644
--- a/browser/stylus/sites/wikipedia.user.css
+++ b/browser/stylus/sites/wikipedia.user.css
@@ -1,7 +1,7 @@
 /* ==UserStyle==
 @name           Sage Ink — Wikipedia
 @namespace      github.com/JohnRebellion/indigo-glass
-@version        0.1.0
+@version        0.2.0
 @description    Wikipedia (Vector 2022) on Sage Ink structure with its own link hue. Codex surface tokens collapsed to two ink steps, radii zeroed, link blue re-cut on the ink lightness ladder. Token names read off a live render (scripts/style-check).
 @author         John Rebellion
 @homepageURL    https://github.com/JohnRebellion/indigo-glass
@@ -48,6 +48,14 @@
     --color-base--subtle: #6B7280 !important;
     --color-emphasized: #F8F8F8 !important;
     --color-subtle: #6B7280 !important;
+    /* Codex paints every toolbar icon as a background-color behind a
+     * mask-image, and `.cdx-button__icon` reads --color-neutral, not
+     * --color-base. Leaving it unset left the whole header — menu, search,
+     * alerts, watchlist, appearance — painting Vector's #C8CCD1, a light
+     * bluish grey that a fills audit never sees because the spans are 20px.
+     * contrast.mjs's hover pass is what surfaced it, as a `coveredBy`. */
+    --color-neutral: #F8F8F8 !important;
+    --color-neutral--hover: #FFFFFF !important;
 
     /* Links — the one hue Wikipedia is identified by, plus its visited purple
      * pulled onto the same ladder so the pair still reads as a pair. */
@@ -139,13 +147,134 @@
     border-color: #1C1C1E !important;
     border-radius: 0 !important;
   }
+  /* Table headers carry a hand-written background in the wikitext — this
+   * article's infobox caption is an inline `background-color:#C0C0C0`. Vector's
+   * night mode neutralises those with
+   * `html.skin-theme-clientpref-os .infobox th:not(.notheme) {background: inherit !important}`,
+   * which is (0,3,2) and beat the plain `.infobox-above` rule that used to sit
+   * here — so the header band never landed in either mode. Matching its shape
+   * and adding one class takes this to (0,4,2). */
+  html:is(.skin-theme-clientpref-os, .skin-theme-clientpref-night)
+    :is(.infobox, .navbox, .wikitable)
+    :is(th, .infobox-above, .infobox-header, .navbox-title, .navbox-group):not(.notheme) {
+    background-color: #121216 !important;
+    color: #F8F8F8 !important;
+  }
   .wikitable > * > tr > th,
   .infobox-above,
+  .infobox-header,
   .navbox-title {
     background-color: #121216 !important;
     color: #F8F8F8 !important;
   }
 
+  /* Vector hardcodes a 2px radius on every link and on the search field —
+   * `a:where(:not([role="button"]))` and `.cdx-search-input--has-end-button`,
+   * neither of which reads --border-radius-base. check.mjs ignores radii under
+   * 4px, so this audited clean; contrast.mjs's rounding pass counted 397 of
+   * them. Circular controls (radio icons) are left alone. */
+  a:where(:not([role="button"])),
+  .cdx-search-input,
+  .cdx-search-input--has-end-button,
+  .cdx-search-input__input-wrapper,
+  .cdx-text-input,
+  .cdx-text-input__input,
+  .cdx-button,
+  .vector-pinnable-header-toggle-button,
+  .mw-collapsible-text,
+  .mw-logo {
+    border-radius: 0 !important;
+  }
+
+  /* ─── The two footer attribution marks keep their vendor plate ────────
+   * They are `cdx-button--fake-button`, so the button rule above repainted
+   * them to #121216 — and the marks inside are dark artwork drawn for the
+   * near-white plate Vector ships even in its own night mode. The result was
+   * two empty rectangles in the footer.
+   *
+   * A CSS filter does not rescue them. `invert(1)` is legible but wrong:
+   * the Wikimedia globe goes green/blue to orange/cyan, the MediaWiki
+   * sunflower yellow to teal. Adding `hue-rotate(180deg)` does not undo that
+   * — hue-rotate is a linear matrix approximation, exact only for
+   * near-neutral colour, and these marks are `#FFFC00` / `#0A00B2` and
+   * `#396` / `#069`. Both filters were rendered and read; each produced a
+   * different wrong palette.
+   *
+   * So this is the README's leave-the-vendor's-brand-fills-alone case, the
+   * same call as Atlassian's and Microsoft's brand buttons. Two 84px plates
+   * in the footer corner, exactly as stock dark Wikipedia renders them, is a
+   * smaller cost than restating someone else's trademark in a colour they
+   * did not choose. #F8F9FA is Vector's own value, measured from the
+   * `--no-style` baseline.
+   *
+   * Caught only by an element screenshot: these carry `loading="lazy"` and
+   * Playwright's full-page capture never triggers them, so the page-level
+   * shot shows two empty chips whatever this rule says. */
+  #footer-icons .cdx-button,
+  #footer-icons .cdx-button--fake-button {
+    background-color: #F8F9FA !important;
+  }
+
+  /* ─── Comparison-table pastels ───────────────────────────────────────
+   * The {{yes}}/{{no}}/{{partial}} family writes its colour inline —
+   * `style="background:#9EFF9E;color:black"` — so Vector's night mode cannot
+   * neutralise it and a comparison article renders mint, pink, cream and
+   * lavender blocks in dark mode. Confirmed stock, not a regression: the
+   * `--no-style` baseline on Comparison_of_web_browsers reports 1978 cells at
+   * rgb(158,255,158). Absorbed rather than left alone, because it is the
+   * loudest off-system surface on the whole site.
+   *
+   * Background and label are repainted TOGETHER. The inline rule sets
+   * `color:black`, so repainting only the fill would strand black text on ink
+   * — the failure mode the README's label-on-accent rule is about.
+   *
+   * Only the named template classes, never hand-coloured cells at large: in a
+   * legend swatch or an election map key the colour IS the datum and there is
+   * no text to carry it, so a blanket `td[style*=background]` rule would
+   * delete the meaning it was trying to restore. Here every cell is labelled
+   * ("Yes", "No", "Partial"), so the semantic survives the move to the hue. */
+  .table-yes, .table-yes2, .table-included, .table-active, .table-free,
+  .table-supported, .table-beta {
+    background: #0D0D10 !important;
+    color: #3FFABB !important;
+  }
+  .table-no, .table-no2, .table-dropped, .table-terminated,
+  .table-discontinued, .table-nonfree {
+    background: #0D0D10 !important;
+    color: #ED254E !important;
+  }
+  .table-partial, .table-maybe, .table-depends, .table-optional,
+  .table-sometimes, .table-experimental, .table-planned {
+    background: #0D0D10 !important;
+    color: #FBBF24 !important;
+  }
+  .table-unknown, .table-Unknown, .table-na, .table-any, .table-some {
+    background: #0D0D10 !important;
+    color: #6B7280 !important;
+  }
+  .table-rh, .rh.heading {
+    background: #121216 !important;
+    color: #F8F8F8 !important;
+  }
+
+  /* CS1 citation templates carry their own maintenance green (#18911F) and
+   * error red, outside both the Codex token set and this palette. Stock
+   * Wikipedia has them too — they are only visible with the maintenance
+   * categories switched on, but they are saturated paint the retint missed.
+   *
+   * `.cs1-code` is deliberately NOT listed: it measured green too, but it
+   * inherits that from the `.cs1-maint` span it sits inside. It is the plain
+   * `<code>` of every citation, and colouring it here would paint amber
+   * across every reference list on the site. */
+  .cs1-maint {
+    color: #FBBF24 !important;
+  }
+  .cs1-visible-error,
+  .cs1-hidden-error,
+  .error {
+    color: #ED254E !important;
+  }
+
   @supports (color: oklch(0% 0 0)) {
     :root,
     html.skin-theme-clientpref-night,
@@ -156,6 +285,7 @@
       --background-color-interactive: oklch(0.1840 0.0081 285.58) !important;
       --color-base: oklch(0.9791 0.0000 89.88) !important;
       --color-base--subtle: oklch(0.5510 0.0234 264.36) !important;
+      --color-neutral: oklch(0.9791 0.0000 89.88) !important;
       --color-progressive: oklch(0.7400 0.1100 262.29) !important;
       --color-progressive--hover: oklch(0.8200 0.1100 262.29) !important;
       --color-progressive--focus: oklch(0.6600 0.1100 262.29) !important;
diff --git a/config/fastfetch/config.jsonc b/config/fastfetch/config.jsonc
index 1c1c51f..c178c9b 100644
--- a/config/fastfetch/config.jsonc
+++ b/config/fastfetch/config.jsonc
@@ -1,9 +1,19 @@
 {
   "$schema": "https://github.com/fastfetch-cli/fastfetch/raw/dev/doc/json_schema.json",
   "logo": {
-    "type": "small",
+    // Sage Ink mark — ink drop silhouette, traced from a generated concept
+    // render (not hand-authored SVG — see provenance note below). Flat
+    // colour ($1 accent_hi) with the system's hard offset shadow
+    // ($2 accent_alt). The render's internal leaf vein doesn't survive this
+    // raster size — too thin to hold a cell at 30px — so this asset carries
+    // the "ink" half of the name only; "sage" is the fill colour, not a
+    // drawn feature. Source render, generator, and inspection notes live in
+    // research-reports/sage-ink-mark-2026-09-17/ (ship-gpt.py, 03-INSPECTION.md).
+    // Swap to sage-ink-mark-small.txt on narrow terminals.
+    "type": "file",
+    "source": "~/.config/fastfetch/sage-ink-mark.txt",
     "padding": { "right": 2 },
-    "color": { "1": "#C0E3C0" }
+    "color": { "1": "#C0E3C0", "2": "#89A889" }
   },
   "display": {
     "separator": "  ",
diff --git a/docs/REFERENCE.md b/docs/REFERENCE.md
index 0d9bc02..3613b60 100644
--- a/docs/REFERENCE.md
+++ b/docs/REFERENCE.md
@@ -145,6 +145,7 @@ The decision has been taken to close this gap by **taking full ownership of both
 | Konsole profile | Sage Ink (Iosevka Custom Condensed, accent cursor) | `~/.local/share/konsole/SageInk.profile` |
 | Shell prompt | Starship (replaces P10K) | `~/.config/starship.toml` |
 | Greeter | Fastfetch (replaces neofetch) | `~/.config/fastfetch/config.jsonc` |
+| Greeter logo | Sage Ink mark (ink drop, traced from a generated concept render) — 30-col default, 24-col alternate | `~/.config/fastfetch/sage-ink-mark.txt`, `-small.txt` |
 | Edge launch flags | Wayland + system decorations | `~/.local/share/applications/microsoft-edge.desktop` |
 | Panel widgets | windowbuttons (id=43), appmenu (id=44), windowtitle (id=26) | `~/.config/plasma-org.kde.plasma.desktop-appletsrc` |
 
diff --git a/scripts/install.sh b/scripts/install.sh
index a6145bf..29b6ca6 100755
--- a/scripts/install.sh
+++ b/scripts/install.sh
@@ -423,6 +423,9 @@ run "cp '$REPO_DIR/config/klassy/klassyrc' '$HOME/.config/klassyrc'"
 run "cp '$REPO_DIR/config/klassy/klassyrc' '$HOME/.config/klassy/klassyrc'"
 run "cp '$REPO_DIR/config/starship.toml' '$HOME/.config/starship.toml'"
 run "cp '$REPO_DIR/config/fastfetch/config.jsonc' '$HOME/.config/fastfetch/config.jsonc'"
+# config.jsonc references the logo by absolute path, so both files must ship.
+run "cp '$REPO_DIR/config/fastfetch/sage-ink-mark.txt' '$HOME/.config/fastfetch/sage-ink-mark.txt'"
+run "cp '$REPO_DIR/config/fastfetch/sage-ink-mark-small.txt' '$HOME/.config/fastfetch/sage-ink-mark-small.txt'"
 run "cp '$REPO_DIR/config/gtk-3.0/settings.ini' '$HOME/.config/gtk-3.0/settings.ini'"
 run "cp '$REPO_DIR/config/gtk-3.0/gtk.css' '$HOME/.config/gtk-3.0/gtk.css'"
 run "cp '$REPO_DIR/config/gtk-4.0/settings.ini' '$HOME/.config/gtk-4.0/settings.ini'"
diff --git a/scripts/style-check/check.mjs b/scripts/style-check/check.mjs
index a9f472b..9ae99c6 100644
--- a/scripts/style-check/check.mjs
+++ b/scripts/style-check/check.mjs
@@ -70,7 +70,14 @@ const SITES = {
   },
   wikipedia: {
     css: 'browser/stylus/sites/wikipedia.user.css',
-    urls: { article: 'https://en.wikipedia.org/wiki/Nissan_QG_engine' },
+    /* Two shapes, because an article with only an infobox never exercises the
+     * table-header rules: the engine page is the infobox/ambox/navbox case,
+     * the comparison page is wall-to-wall `.wikitable` with hand-written cell
+     * backgrounds in the wikitext. */
+    urls: {
+      article: 'https://en.wikipedia.org/wiki/Nissan_QG_engine',
+      tables: 'https://en.wikipedia.org/wiki/Comparison_of_web_browsers',
+    },
     content: 'body',
   },
   /* Work tenants are named by env var, never committed: IG_ATLASSIAN_HOST,
```

### config/fastfetch/sage-ink-mark.txt (untracked)
```
                       $1▄$1█$1█$1█
           $1▄$1▄$1▄$1▄$1▄$1▄$1▄$1▄$1▄$1▄$1█$1█$1█$1▀$1█$1█$1▀$2█
      $1▄$1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1▀$2█$2█
    $1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$2█$2█
   $1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$2█$2█
  $1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀ $1█$1█$1█$1█$1█$1█$1█$2█$2█
 $1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀ $1▄$1█$1█$1█$1█$1█$1█$1█$1█$2█$2█
 $1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀ $1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█$2█
 $1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█$2█
 $1▀$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█$2█
  $1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█$2█
   $1▀$1█$1█$1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█$2█$2▀
    $1▀$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$2█$2█$2▀
      $2▀$1▀$1▀$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$2█$2█$2█$2▀
         $2▀$2▀$2█$2█$2█$2█$2█$2█$2█$2▀$2▀$2▀
```
### config/fastfetch/sage-ink-mark-small.txt (untracked)
```
                  $1▄$1█$1█$1▄
       $1▄$1▄$1▄$1▄$1▄$1▄$1▄$1▄$1▄$1█$1█$1▀$1▄$1█$1█$2█
    $1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█ $1█$1█$1█$2█$2▀
  $1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$2█$2█
 $1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$2█$2▀
 $1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$1█$1█$2█
 $1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█
 $1█$1█$1█$1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█
  $1█$1█$1█$1▀$1▄$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█$2█
   $1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$1█$2█$2█
    $1▀$1▀$1█$1█$1█$1█$1█$1█$1█$1█$1█$1▀$1▀$2█$2▀
      $2▀$2▀$2█$1▀$1▀$1▀$2█$2█$2█$2▀$2▀
```

## 8. Response format — use exactly this skeleton

```markdown
## Q1 Commit hygiene
## Q2 Guard correctness
## Q3 Host-specific docs
## Q4 Reset script
## Q5 Wikipedia 0.2.0
## Q6 Fastfetch mark
## Q7 What is missing
## Q8 What measurement would change your answer
## Ranked findings
One line each: `severity | file:line or SHA | claim | evidence you relied on`. Most severe first.
## Rejected as non-issues
Things in the brief you considered and decided are fine, and why.
## Confidence and caveats
Where you are guessing. What you would need to see to be sure. Say plainly if a question was underspecified — do not invent detail to fill the format.
```

Do not soften findings to be agreeable — a second model is being asked the same
questions independently for exactly that reason.
