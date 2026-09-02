# Sage Ink Round 1 Synthesis — GPT-5 × Gemini × local verification

Both replies live in the session transcript (2026-09-01); they were pasted into
chat rather than into `returns/`, so this file is the durable record. Every
factual claim below was checked against the repository before being accepted.

---

## 0. Correction to the brief — my error, and it shaped both answers

The brief stated that codegen "emits 20 artefacts, but the individual layer
configs do **not** consume them." That is **overstated**. I derived it from the
drift-guard's own header comment rather than from `scripts/install.sh`.

`scripts/install.sh` defines `apply_ini_to_config()` and uses it to consume
generated output directly:

```
228: apply_ini_to_config "$REPO_DIR/tokens/out/kwinrc-blur.ini"   kwinrc
236: apply_ini_to_config "$REPO_DIR/tokens/out/klassy-radius.ini" klassyrc
237: apply_ini_to_config "$REPO_DIR/tokens/out/klassy-radius.ini" "$HOME/.config/klassy/klassyrc"
```

So generate-and-consume **already exists** — for KWin blur and Klassy radius.
The architecture is not absent; it is applied to two surfaces and not extended.
Both reviewers argued as though it were absent everywhere. Their conclusions
survive this correction (see §2), but their framing of it as a total absence
does not, and Gemini's "architecturally absurd" rests partly on it.

A second template mechanism also already exists —
`config/microsoft-edge.desktop.template`. The pattern Gemini recommends
inventing is established in the repo, just unapplied.

## 1. Gemini's central factual claim is wrong by roughly 17×

Gemini asserts "**750 hand-typed layer configs**", "hand-editing literals across
~750 files", and a per-variant cost of "hours". It took the 750 *tracked files*
figure from §3 of the brief and reread it as 750 palette-bearing files.

Measured: **77 tracked files contain any palette hex literal.** Excluding
documentation, READMEs, research reports, and the drift guard itself (which
contains the literals it searches for), the deployable set is **~40–45 files**.

By directory: `config` 17, `browser` 11, `share` 5, `windows` 4, `vscode` 4,
`tokens` 3, then 1–2 each across vencord, spicetify, sddm, obsidian, cursor,
web, jetbrains.

This collapses Gemini's cost model. A fourth variant is not "hours of hand
editing across 750 files"; it is a change across a few dozen files. That does
not make the manual approach *good* — but "exorbitantly high" is not the
measured position, and Q6 was answered from the wrong number.

GPT never made this error. It reasoned per surface class and explicitly
declined to assert counts it could not see.

## 2. The finding that settles Q1 — a live drift the guard does not catch

GPT predicted the failure mode "generated artefacts disagree with
hand-maintained deployables." It is **present right now**, on a tree where
`check-palette-drift.sh` reports clean.

`share/color-schemes/SageInk.colors` is the file `install.sh` actually deploys
(line 191). It is hand-maintained, 139 lines. `tokens/out/kde-palette.sage.colors`
is the generated partial, 54 lines. Comparing the 18 overlapping keys:

| Section | Key | Generated | Shipped |
| :-- | :-- | :-- | :-- |
| `[Colors:Window]` | `ForegroundPositive` | `63,250,187` = **#3FFABB** | `113,247,159` = **#71F79F** |

`#3FFABB` is the token `positive`. `#71F79F` is a different green with no token
backing — almost certainly a pre-migration survivor. The shipped file's own
header says *"Color values merged from tokens/out/kde-palette.sage.colors
(source of truth)"*. It is not merged; it has diverged.

The guard misses this **by design**: it hunts *forbidden old-variant* colours
(lime `#A8E635`, indigo) and material violations. It never asserts that a
deployed value *equals* the generated value. Absence of a known-bad colour is
not presence of the correct one.

That is the answer to Q1, and it is stronger than either reviewer could argue
from the brief alone. **Generate-and-verify has failed silently again, today,
on the highest-traffic surface in the system.**

## 3. A surface class both reviewers under-served

**11 of the palette-bearing files are SVG assets** under
`config/plasma-theme/SageInk/` — `background.svg`, `tooltip.svg`,
`viewitem.svg`, across `opaque/`, `solid/`, `translucent/` variants.

SVGs cannot `@import` CSS custom properties. Gemini's symlink-and-import
recommendation does not reach them at all. GPT swept them into "cursor,
simulator, raster, binary, or vendored assets — not directly consumable",
which is right about mechanism but wrong about category: these are
hand-maintained source, not vendored, and they *are* deterministically
templatable. They are the clearest case in the repo for GPT's
"render the complete target file from a template" recommendation.

## 4. Where they agree, and it holds up

- **Severity ranking.** Both rank an SDDM/KWin/GRUB syntax failure far above
  colour drift: colour drift is cosmetic and slow; a broken login screen is an
  outage needing TTY recovery. Both note the architecture is heavily optimised
  against the low-severity failure and has no structural guard against the
  high-severity one. Correct, and it matches this machine's history — a systemd
  automation bricked the login session once already.
- **Automatic execution.** The guard is manual and therefore will be forgotten.
  Both recommend wiring it to a git hook. Cheap, obviously right.
- **Templates for non-importable surfaces.** Both land here from different
  directions. The repo already has the mechanism.

## 5. Where I disagree with both

**Gemini: "eliminates the need for the drift guard entirely."** No. Templating
removes *transcription* drift. It cannot detect a host framework reasserting a
default after theme load, a baked soft shadow inside an SVG, or a value edited
directly in the live config by a KDE settings dialog. GPT's framing — the guard
becomes *defence in depth* rather than the primary mechanism — is right, and
Gemini's is the more dangerous recommendation of the two because it ends with
less verification than the system has today.

**Gemini's Q7 falsifier is better-aimed than it knew.** It hedged on whether
KDE rewrites its own config files at runtime. It does — this box has a recorded
case of a KDE file dialog rewriting `kdeglobals` on close, and a separate note
that Klassy reads `~/.config/klassy/klassyrc` while a stale `~/.config/klassyrc`
also exists. Symlinking anything KDE writes back to is genuinely unsafe. That
constrains the deployment design and neither model could have known it.

**GPT's 90% propagation threshold (Q7)** is a good test but the number is
arbitrary. The sentinel-variant experiment underneath it is the valuable part
and should be run as specified.

## 6. Ranked plan

| # | Change | Evidence | Risk |
| --: | :--- | :--- | :--- |
| 1 | Fix `ForegroundPositive` in `share/color-schemes/SageInk.colors` to `63,250,187` | §2 — live, confirmed | none |
| 2 | Extend the guard with an **equality** check: every generated key must match its deployed counterpart | §2 — the guard's actual blind spot, not a hypothetical | low |
| 3 | Wire the guard to a `pre-commit` hook | both reviewers; guard is manual today | low |
| 4 | Generate `share/color-schemes/*.colors` in full from a checked-in template, instead of hand-merging a partial | §2; GPT Q1 | low |
| 5 | Template the 11 plasma-theme SVGs from tokens | §3 | low |
| 6 | Run GPT's sentinel-variant experiment to measure real propagation | GPT Q7 | none — disposable branch |
| 7 | Add syntax validation + atomic install + rollback for SDDM/KWin/GRUB | both reviewers on severity; machine history | medium |
| 8 | Extend `apply_ini_to_config`-style consumption to remaining INI/JSON surfaces | GPT Q1 per-class table | medium |

Items 1–3 are same-day and address a defect that exists right now. Item 7 is
the one that protects against the failure that actually hurts.

## 7. Round 2 — worth it, narrowly

Both reviewers' caveats asked for the same things: the guard's actual patterns
and exclusions, `install.sh`, one representative source-and-deployed file pair
per surface, and the deployment/reload process. Those are now partly measured.

A round 2 carrying (a) the corrected consumption picture, (b) the 40–45 file
count, (c) the live `ForegroundPositive` drift, and (d) the KDE
config-rewriting constraint would get a materially better answer on deployment
safety — the area where both hedged hardest and where the real risk sits.
