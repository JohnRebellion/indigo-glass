# Lime Glass Branch Audit — `feat/lime-glass-variant`

**Date:** 2026-07-14
**Scope:** All 21 commits on `feat/lime-glass-variant` vs `main` (242 files, +3233/−801), plus the uncommitted working-tree change.
**Method:** Manual review of `tokens/codegen.py` + `tokens/indigo-glass.tokens.toml`, independent recomputation of all OKLCH/contrast claims, `codegen.py --check`, and three parallel review passes (shell scripts, docs/naming, token propagation).

---

## Executive summary

**The token pipeline core is sound and its intent is correct — but the branch delivers that intent only about halfway.** The stated goal (Lime Glass as default variant, Indigo Glass preserved as a selectable variant, single OKLCH source of truth) is fully realized in `tokens/`, KDE color schemes, GRUB theme, VSCode dark theme, and the simulator. Downstream of that, the branch performed a **mass rename without recolor**: ~14 layers now claim "Lime Glass" in their names/headers while still shipping indigo hex values. Additionally there is one real accessibility bug in the *generated shipping default* (illegible selected text in KDE), and the GRUB deploy path writes boot-critical config non-atomically with no validation.

| Severity | Count |
|----------|-------|
| CRITICAL (label lies to user / illegible UI) | 2 classes (A1, B*) |
| HIGH | 5 |
| MEDIUM | 9 |
| LOW / polish | 8 |

**Recommended execution order:** Section A (codegen fixes) → Section B (recolor-or-retitle decision per layer) → Section C (GRUB hardening) → Section D (docs). Each finding below has a concrete fix and a verification step.

---

## A. Generated-output bugs (fix in codegen/TOML, then regenerate)

### A1. HIGH — Selected text illegible in shipping KDE palette (white on lime, 1.50:1)

- **File:** `tokens/codegen.py:385` (emitter), affects `tokens/out/kde-palette.colors` and `tokens/out/kde-palette.lime.colors` (`[Colors:Selection] ForegroundNormal=255,255,255`, `ForegroundActive=248,248,248`)
- **Problem:** Selection foreground is hardcoded white. On indigo selection (#5E6AD2) that is 4.70:1 (fine). On lime selection (#A8E635) it is **1.50:1 — unreadable**. This ships in the default variant.
- **Verified math:** white on #A8E635 = 1.50:1; base #07080A on #A8E635 = 13.39:1.
- **Fix:** In `emit_kde_colors`, compute the selection foreground per variant by WCAG contrast: use `p['base']` (or `#000000`-side pick) when the accent is light, white when the accent is dark. Simplest robust rule: compute relative luminance of `accent`; if contrast(white, accent) < 4.5, use `base` for both `ForegroundNormal` and `ForegroundActive` in `[Colors:Selection]`. Apply the same guard anywhere text sits on `accent` (check `emit_wt_scheme` `selectionBackground` interaction — see A6).
- **Verify:** regenerate; `grep -A4 'Colors:Selection' tokens/out/kde-palette.lime.colors` shows `7,8,10` (or similar dark) foreground; indigo file still shows `255,255,255`.

### A2. MEDIUM — Hardcoded indigo glow leaks into lime outputs

- **Files:** `tokens/indigo-glass.tokens.toml:203-204` (`indigo_glow = "0 0 0 2px rgba(94,106,210,0.30)"`, `indigo_glow_lg = "... rgba(94,106,210,0.40)"`) in the variant-agnostic `[shadow]` table → emitted into `tokens/out/css-vars.lime.css:87-88`, `tokens/out/css-vars.css:87-88`, and synced `simulator/src/lib/styles/tokens.css:87-88`.
- **Problem:** The lime default ships `--ig-shadow-indigo-glow` containing literal indigo rgba — violates the repo's own single-accent rule ("Do NOT hardcode hex", TOML header). Impact is latent today (no downstream file consumes the var; `glass.css:126-127` overrides it to `none` under `[data-reduce-bright]` only), but any consumer loading `css-vars.css` without `glass.css` gets an indigo focus ring in the lime theme.
- **Fix:** Rename tokens to `accent_glow`/`accent_glow_lg` and derive the rgba from the active variant's `accent` in codegen (same pattern as glass tint at `codegen.py:525-528`). Keep `--ig-shadow-indigo-glow` emitted as an alias for back-compat if desired (mirror `_BRAND_ALIAS`). Update the `[data-reduce-bright]` override names in `emit_glass_css` (`codegen.py:717-718`) and `README.md:150` (`.glow-indigo` utilities).
- **Verify:** `grep -n '94,106,210' tokens/out/css-vars.lime.css` returns nothing; the indigo variant file still carries indigo rgba.

### A3. LOW — Uncommitted regenerated `json-tokens.json`

- **File:** `tokens/out/json-tokens.json` (working tree) — adds `"force_contrast_params": false`.
- **Problem:** Regen output from commit `0604706` was left uncommitted. `codegen.py --check` passes with the working-tree state, so it is correct — just missed.
- **Fix:** Commit as `chore(tokens): commit regenerated json-tokens.json (force_contrast_params)`. (If A1/A2 are done first, it will be swept up in that regen commit anyway.)

### A4. LOW — `accent_alt` comment hex is wrong by one

- **File:** `tokens/indigo-glass.tokens.toml:74` — comment claims `#8BC407`; codegen actually derives **#8BC406** from oklch(0.7523 0.1947 127.71).
- **Risk:** Anyone hand-porting the palette from the comment (which is exactly what the Section B recolor work will do) introduces a 1-bit mismatch vs generated outputs.
- **Fix:** Correct the comment to `#8BC406`. **Rule for Section B executors: always copy hex from `tokens/out/css-vars.lime.css`, never from TOML comments.**

### A5. LOW — `accent_hi` is out of sRGB gamut (channel-clipped)

- **File:** `tokens/indigo-glass.tokens.toml:73` — oklch(0.9323 0.2049 127.71) has linear green = 1.019 before clipping.
- **Impact:** `oklch_to_hex` channel-clips (slight hue/lightness distortion vs the authored value), and the P3 emission preserves the extra chroma, so `--ig-accent-hi` renders **visibly more saturated on P3 monitors than on sRGB**. May be desired ("more chroma on capable monitors" is the stated P3 intent), but this is the only palette entry where sRGB and P3 diverge from *clipping* rather than gamut mapping.
- **Fix (optional):** Reduce C to ~0.19 at L=0.9323 to bring it just inside sRGB, or accept and document. Decision call for John.

### A6. LOW — Sibling on-accent contrast risks (audit when fixing A1)

- `tokens/out/wt-scheme.json` sets `selectionBackground: #A8E635`; Windows Terminal blends selection, but light-on-lime cells may be low contrast. Visual check after install.
- `emit_kde_colors` also puts `accent_hi` (#C1FF58, even lighter) as `BackgroundAlternate` in `[Colors:Selection]` — same white-foreground problem as A1; the A1 fix covers it.

### A7. LOW — P3 overlay only upgrades legacy var names

- **File:** `tokens/codegen.py:285` — the `@media (color-gamut: p3)` block emits only `indigo, indigo_hi, violet, amber, positive, negative`. The semantic names (`--ig-accent`, `--ig-accent-hi`, `--ig-accent-alt`) and `lime*` aliases never get the P3 upgrade (they stop at the oklch() tier, which browsers gamut-map themselves — acceptable, but inconsistent).
- **Fix:** Emit the P3 block over `("accent", "accent_hi", "accent_alt", "amber", "positive", "negative")` plus their aliases (iterate `_BRAND_ALIAS`).

### A8. LOW — `text_muted` below AA for body text

- #6B7280 = 4.14:1 on base (#07080A), 3.87:1 on surface_alt (#121216). Fails AA 4.5:1 for normal text; passes AA-large (3:1).
- **Fix (decision):** Either lighten `text_muted` (e.g. L≈0.60 gives ~5:1) or document that muted text is caption/large-only. Same value fails similarly in the indigo variant (pre-existing), so this is a system-wide call, not a branch regression.

---

## B. Rename-without-recolor — layers claiming Lime, rendering indigo

**This is the branch's largest defect class.** The rename pass updated names/headers/`@name` fields but not colors. Every file below is *default-applying* (no lime counterpart exists). For each: **decide recolor vs retitle-back-to-Indigo** — the current state (label says Lime, pixels say indigo) is the worst of both.

**Recolor source of truth:** `tokens/out/css-vars.lime.css`. Key values: accent `#A8E635`, accent_hi `#C1FF58`, accent_alt `#8BC406`, base `#07080A`, surface `#0D0D10`, surface_alt `#121216`, sidebar `#0A0A0D`, text `#F8F8F8`, text_muted `#6B7280`. Old indigo values to hunt: `#5E6AD2`, `#818CF8`, `#A78BFA`, `#0F0F12`, `#1C1C21`, `#1F2028`, `#18181C` (case-insensitive; also `rgba(94,106,210,…)`, `dword:ff5e6ad2`, `168,230,53`-style RGB triplets for the KDE-ish formats).

### B1. Installed by default by the install scripts — fix first

| # | File | Evidence | Installed by |
|---|------|----------|--------------|
| B1a | `config/starship.toml` | 18 old hexes (lines 5-85: `indigo = '#5E6AD2'`, `bg_0 = '#0F0F12'`…); header says "Lime Glass" | `scripts/install.sh:190` |
| B1b | `config/fastfetch/config.jsonc` | lines 6, 11-12, 21: `#818CF8`/`#A78BFA` | `scripts/install.sh:191` |
| B1c | `windows/terminal/indigo-glass.scheme.json` | `"name": "Lime Glass"` with full indigo palette (bg `#0F0F12`, blue `#5E6AD2`). **Name-collides with the correct `tokens/out/wt-scheme.json`** — whichever installs last wins. | `windows/install.ps1:243-251` (sets it as default profile's colorScheme) |
| B1d | `windows/registry/indigo-glass-accent.reg` | line 3 comment: "Lime Glass — Windows 11 accent color #5E6AD2"; `AccentColor=dword:ff5e6ad2` (lines 11-13, 20, 31-32) | `windows/install.ps1` / README instructions |
| B1e | `windows/powershell/Microsoft.PowerShell_profile.ps1` | lines 29-37 PSReadLine colors `#818CF8/#A78BFA/#5E6AD2` | `windows/install.ps1` |

**Fix for B1c specifically:** replace file contents with `tokens/out/wt-scheme.lime.json`, or better, make `install.ps1` read `tokens/out/wt-scheme.json` directly (which `tokens/README.md:60` already *claims* it does — see D3).

### B2. User-activated layers (renamed + version-bumped, still indigo)

| # | File | Evidence |
|---|------|----------|
| B2a | `vscode/themes/indigo-glass-light.json` + `vscode/package.json:26` | Only line 2 changed (`"name": "Lime Glass Light"`); 89 indigo hexes, 0 lime (`focusBorder: #5E6AD2` at line 6). The **dark** theme was properly recolored (115 lime, 0 indigo) — light was skipped. |
| B2b | `browser/stylus/sites/claude-ai.user.css:16-31`, `notion.user.css:16-30`, `linear.user.css:16-29`, `chatgpt.user.css` | `@name` renamed + version bumped 0.2.0→0.3.0, colors untouched. These feed `sync-browser-theme.sh`. (The *universal* `browser/stylus/indigo-glass.user.css` **was** recolored — only the 4 site styles are stale.) |
| B2c | `vencord/indigo-glass.theme.css:2-3,11-17` | `@name Lime Glass`, body indigo (`--ig-indigo: #5E6AD2`, base `#0F0F12`) |
| B2d | `spicetify/Themes/indigo-glass/color.ini:8-39` + `user.css` | header "Lime Glass", both sections indigo |
| B2e | `obsidian/Indigo Glass/theme.css:9-40` | header renamed, 19 indigo hexes; `obsidian/README.md:1-3` claims "Same palette as VSCode/KDE" — false |
| B2f | `jetbrains/Indigo Glass.icls` | `<scheme name="Lime Glass">` with 36 old hexes |
| B2g | `sddm/indigo-glass/Main.qml:13-16` + `background.svg:7-9` + `metadata.desktop:2` | Login screen `Name=Lime Glass`, `accent: "#5E6AD2"`, indigo glow background |
| B2h | `cursor/build-bibata.sh:31-33,100` | `ACCENT="#5E6AD2"` with comment "(Lime Glass primary)" — factually wrong; `cursor/out/Bibata-IndigoGlass/` is the stale build output (rebuild after fix) |

### B3. Simulator internal disagreement (MEDIUM)

`simulator/src/lib/styles/tokens.css` and `glass.css` are byte-identical to lime canonical outputs (correct), but these hand-carry indigo:
- `simulator/src/lib/styles/mesh.css` (5 hits), `liquid-glass.css` (2), `simulator/src/lib/components/GrubScreen.svelte` (5), `simulator/src/routes/vscode/+page.svelte` (2 indigo / 2 lime mixed)
- `assets/liquid-glass/liquid-glass.css`, `assets/mesh/mesh-gradient.css`

The 2026-refresh preview disagrees with itself. Recolor these (or better: make them consume `var(--ig-accent)` etc. so this class of bug dies).

### B4. Konsole profile identity inversion (MEDIUM)

- `share/konsole/IndigoGlass.profile:2,16` — `Name=IndigoGlass` but `ColorScheme=LimeGlass`, plus indigo-era violet cursor `CustomCursorColor=167,139,250` on a lime scheme. **There is no `LimeGlass.profile` at all.** Installed as-is by `scripts/install.sh:180`; also sed-targeted by `hosts/apply.sh:113-115`.
- **Fix:** Create `share/konsole/LimeGlass.profile` (`Name=LimeGlass`, `ColorScheme=LimeGlass`, lime-appropriate cursor e.g. `168,230,53`), restore `IndigoGlass.profile` to `ColorScheme=IndigoGlass` + violet cursor, update `scripts/install.sh:180` and its "Next steps" echo (line ~283), and `hosts/apply.sh:113-115` to target the lime profile.

### B5. Stale hand-merged KDE scheme (MEDIUM)

- `share/color-schemes/LimeGlass.colors` — the file `install.sh:176` actually installs — diverges from the generated partial `tokens/out/kde-palette.lime.colors` on real values: `activeBlend=18,18,22` vs generated `168,230,53`; `activeBackground=18,18,22` vs `13,13,16`; `inactiveBackground=13,13,16` vs `10,10,13`; `ForegroundLink=139,196,6` vs `193,255,88`; Button `BackgroundAlternate=42,46,58` vs `13,13,16`.
- Also: display-name mismatch — shipped `Name=Lime Glass` (line 121) vs generated `Name=LimeGlass` (`codegen.py:359` strips spaces). Blind-merging the partial would silently change the display name.
- **Fix:** Re-merge the generated partial into `LimeGlass.colors` **after** the A1 fix lands (so the selection fix propagates). Decide the canonical display name (space or no space) and make `codegen.py:359` match; keep `plasma-apply-colorscheme` id stable. Where the hand-file intentionally differs (e.g. `activeBlend` for titlebar tinting), either port the intent into codegen or comment the deliberate divergence in the file.

### B6. LOW — Packaged old artifact

- `iso/boot/grub/themes/indigo-glass/theme.txt` header still "Indigo Glass" (inside `indigo-grub.iso` source tree) — packaged artifact of the old build; regenerate the ISO or leave with a note.

---

## C. Script safety (GRUB = highest blast radius; area already churned 3 fix commits)

### C1. HIGH — `install.sh --with-grub` never writes GRUB_FONT (silent text-mode fallback)

- **Files:** `scripts/install.sh:243-247` vs `scripts/sync-grub-parity.sh:126` (and its comment at 121-123)
- **Problem:** Commit `bc75096` claims "sync GRUB_FONT alongside GRUB_THEME/BACKGROUND on --deploy" — only `sync-grub-parity.sh` was fixed. `install.sh`'s own GRUB path writes `GRUB_THEME`/`GRUB_BACKGROUND` but never `GRUB_FONT`; a stale/missing font breaks the `if loadfont` guard in `/etc/grub.d/00_header`, silently disabling gfxterm — theme never loads for `install.sh --with-grub` users. Two install paths for the same artifact, one fixed.
- **Fix (preferred):** Delete the duplicated GRUB logic from `install.sh` and have `--with-grub` shell out to `sync-grub-parity.sh --deploy`. (Alternative: copy the GRUB_FONT block over — but the duplication is the root cause; see also C3.)
- **Verify:** after `install.sh --with-grub --dry-run`, the planned edits include `GRUB_FONT`.

### C2. HIGH — `grub2-mkconfig` writes the live grub.cfg non-atomically, unvalidated

- **Files:** `scripts/sync-grub-parity.sh:126-147`, `scripts/install.sh:242-260`
- **Problem:** Both scripts sed-patch `/etc/default/grub` then run `grub2-mkconfig -o <live grub.cfg>` directly. No `grub2-script-check`, no non-empty check, no backup of grub.cfg itself (only `/etc/default/grub` is backed up), no temp-file + atomic rename. An interrupted run (disk full, kill) leaves a truncated boot config; a bad theme reference passes mkconfig silently and only fails at boot.
- **Fix:** `grub2-mkconfig -o "${cfg}.new"` → verify non-empty and `grub2-script-check "${cfg}.new"` (fall back to `grub-script-check` if the un-prefixed tool exists) → `cp -a "$cfg" "${cfg}.bak-$STAMP"` → `mv "${cfg}.new" "$cfg"`. Apply in both scripts (or just in `sync-grub-parity.sh` once C1 unifies them).

### C3. MEDIUM — `install.sh` GRUB edit pattern is inconsistent with the newer script

- **File:** `scripts/install.sh:243-246` — unconditional `sed -i` followed by a separate `grep -q` check-then-append; in `--dry-run` the grep reads live system state and can mis-report. `sync-grub-parity.sh:126-133` already has the clean `if grep -q then sed else append` pattern.
- **Fix:** Made moot by C1's unification; otherwise adopt the parity-script pattern.

### C4. MEDIUM — `sync-browser-theme.sh` non-atomic backup→copy window

- **File:** `scripts/sync-browser-theme.sh:67-74` — `mv "$dst" "${dst}.bak-$STAMP"` then `cp -a "$src" "$dst"`; a kill between/during leaves the extension-settings dir missing (silent settings loss, not corruption — the Edge-running guard at 51-53 is good).
- **Fix:** copy to `"${dst}.tmp-$STAMP"` first, then swap: `mv "$dst" "$dst.bak-$STAMP" && mv "$dst.tmp-$STAMP" "$dst"`.

### C5. MEDIUM — Edge-running check has a TOCTOU gap

- **File:** `scripts/sync-browser-theme.sh:51-53` — single `pgrep` at start; nothing prevents Edge launching mid-apply, and no lock against concurrent script runs.
- **Fix:** re-check `pgrep` immediately before each profile's copy; optionally `flock` a sentinel for the apply loop.

### C6. MEDIUM — systemd unit hardcodes the author's clone path

- **Files:** `vscode/systemd/indigo-glass-vscode-patch.service` (`ExecStart=/bin/bash %h/projects/indigo-glass/...`), installed verbatim by `vscode/systemd/install.sh:30` which *knows* the real repo root and doesn't template it.
- **Fix:** have `vscode/systemd/install.sh` sed the actual repo path into the unit at install time.

### C7. LOW — `eval "$@"` run-helper pattern

- **Files:** `scripts/install.sh:35-40`, `scripts/sync-grub-parity.sh:42-51` — safe with current controlled inputs; fragile for paths with spaces/metacharacters.
- **Fix (optional):** array-based direct exec, or document the constraint.

### What the scripts do well (keep)

- `sync-browser-theme.sh`: dry-run-by-default, per-target timestamped backups, double `pgrep` guard, Personal-profile-as-read-only-source. Reference implementation for the others.
- `sudo test -f` for grub.cfg detection (correct vs Fedora/Nobara `0700 /boot/grub2`); graceful degradation on missing paths.
- `windows/install.ps1`: backs up every mutated file (`*.before-indigo-glass`), genuine `-DryRun` threaded through all stages.
- The KDE/Konsole scheme-name collision fix (`7307563`) is complete and verified.

---

## D. Documentation drift

### D1. HIGH — Root `README.md` still documents indigo as the system

- Lines 27-44: Color palette section is 100% indigo (`Indigo #5E6AD2 Linear primary`) — no `#A8E635`/`#07080A`.
- Lines 54, 60: "Near-black `#0F0F12`", "One primary accent (`#5E6AD2` indigo)".
- Lines 15-20: layer list says "IndigoGlass color scheme", "violet cursor", "amber-on-indigo GRUB theme".
- Line 89: "Patches kdeglobals with IndigoGlass scheme" — `install.sh:201` actually writes `ColorScheme=LimeGlass`.
- Lines 127-129: manual-integration table omits `LimeGlass.colors`/`LimeGlass.colorscheme`.
- **Nothing anywhere documents that variants exist or how to select Indigo** — the single most important doc gap given the branch's intent.
- **Fix:** rewrite palette + accent-rules sections with lime values; add a "Variants" section (lime default, indigo heritage, how to switch: which files/`default_variant` in TOML + regen, per-layer variant files).

### D2. HIGH — `docs/REFERENCE.md` and `docs/PHILOSOPHY.md` contradict the rebrand

- `REFERENCE.md`: title says Lime (`:1`), body is entirely indigo — `:16-21` core formula, `:25-62` "canonical palette", `:74,87-88` scheme/profile names, `:225-227` self-contradictory snippet (`ColorScheme=IndigoGlass` + `Name=Lime Glass`), `:507,705,710-712` `plasma-apply-colorscheme IndigoGlass`, `:744` Edge accent `#5E6AD2`, `:793-811` indigo Tailwind block. Either rewrite with lime values (+ "values are per-variant" note) or banner it as the Indigo-variant reference.
- `PHILOSOPHY.md`: naming section rewritten correctly (`:149-157`), but `:67-93` "Color reasoning" argues only why indigo is *the* accent, and `:129` "Constraint discipline: `#5E6AD2` is the ONLY decorative accent" directly contradicts `:150` "single ghost-lime `#A8E635` … brand signature". Reframe color reasoning per-variant; the lime rationale already exists in the TOML comments (lines 63-66) — lift it into the doc.
- `docs/DENSITY.md:93`: "the indigo tint reads through" → "accent tint" (one-word fix).

### D3. MEDIUM — Tokens pipeline docs describe schema v2 / `[palette.oklch]` (gone)

- `tokens/indigo-glass.tokens.toml:6` header "Schema version: 2" vs `:17` `schema_version = 3`; `:12-14` v2 note names `[palette.oklch]` as source.
- `tokens/indigo-glass.tokens.toml:62-63` — direct contradiction: "lime-tinted near-black; hue ~120" vs "NEUTRAL deep near-black (NOT lime-tinted)". Line 62 is stale (actual hues 262-286) — delete it.
- `tokens/README.md:5,15,79-81` — same v2/`[palette.oklch]` staleness; files table (`:13-23`) omits all per-variant outputs; `:58` "merged into IndigoGlass.colors"; `:60` claims `wt-scheme.json` is "auto-injected by windows/install.ps1" — **false**, install.ps1 reads `windows/terminal/indigo-glass.scheme.json` (root cause of B1c); `:71` "indigo tint" → accent tint.
- `tokens/codegen.py:2-18` module docstring — "schema v2", `[palette.oklch]`, output list omits per-variant files; contradicts its own machinery at `:124-161`, `:809-826`.
- `tokens/indigo-glass.tokens.toml:345-356` `[ambient]` comment "MUST use the existing indigo/violet hues only" — functionally fine (aliases resolve per-variant) but reads as "orbs are always indigo"; reword to accent/accent_alt.

### D4. MEDIUM — Sub-READMEs document the artifact they no longer ship

- `vscode/README.md:13-31` palette table is indigo while the shipped dark theme is lime; also verify `:65` bracket rotation and `:147` claims against the lime theme.
- `browser/README.md:40-42` "what it paints" table is indigo; the universal userstyle actually paints lime `rgba(168,230,53,0.45)`.
- `browser/monkeytype/README.md:1-13` "canonical Lime Glass palette" followed by an indigo table; the JSON is lime.
- `share/grub-theme/README.md:12-13,26,34-35` — indigo prose next to a fully-lime `theme.txt`.
- `jetbrains/README.md`, `obsidian/README.md`, `spicetify/README.md`, `windows/README.md:103` — Lime titles over indigo bodies (resolve together with the B2 recolor-vs-retitle decision per layer).

---

## E. Verified-correct claims (no action — recorded so Opus doesn't re-litigate)

- `codegen.py --check` exits 0 against the working tree.
- Lime accent #A8E635 on base #07080A = **13.39:1** (TOML claim exact); the "vs 12.79:1" is the same accent on the old #0F0F12 base — comparison is honest.
- All OKLCH→hex round trips match TOML comments except A4 (#8BC406 vs #8BC407).
- KWin fix (`0604706`): `ForceContrastParams=false` + neutral Brightness/Saturation/Contrast=100 emitted correctly; browser Dark Reader keeps the canonical 96/110 values independently, as the comments state.
- `_BRAND_ALIAS` legacy-key aliasing (`indigo`→active accent, `violet`→accent_alt) is intentional back-compat, not a bug; `[ambient] orb_primary = "indigo"` resolves to lime correctly.
- Scheme names are distinct everywhere in generated outputs: `LimeGlass`/`Lime Glass` vs `IndigoGlass`/`Indigo Glass` in KDE + WT files.
- `simulator/src/lib/styles/tokens.css` and `glass.css` are byte-identical to canonical generated outputs.
- Hand-maintained but currently in-sync (LOW drift risk, no action): `config/gtk-3.0/gtk.css`, `config/gtk-4.0/gtk.css`, `browser/darkreader/indigo-glass.json`, `browser/monkeytype/indigo-glass.json`, `browser/stylus/indigo-glass.user.css` (universal), `vscode/css/claude-code-indigo.css`, `share/grub-theme/theme.txt`, `share/konsole/LimeGlass.colorscheme`.

---

## Execution checklist (suggested commit sequence)

1. [ ] **A1** selection foreground contrast logic in `emit_kde_colors` + regen → `fix(tokens): contrast-safe selection foreground per variant`
2. [ ] **A2 + A4 + A7 + D3-docstrings** glow derivation, comment fixes, P3 key set, schema-v3 docstrings + regen (sweeps **A3**) → `fix(tokens): derive accent glow per variant; schema v3 doc pass`
3. [ ] **B5** re-merge generated partial into `share/color-schemes/LimeGlass.colors`; settle `Name=` spacing → `fix(kde): sync LimeGlass.colors with generated partial`
4. [ ] **B4** add `LimeGlass.profile`, restore `IndigoGlass.profile`, update `install.sh` + `hosts/apply.sh` → `fix(konsole): proper per-variant profiles`
5. [ ] **B1a-e** recolor default-installed configs from `tokens/out/css-vars.lime.css` → `fix(config,windows): lime recolor for default-installed layers`
6. [ ] **B2a-h** per-layer decision: recolor or retitle back to Indigo (do B2c/B2d/B2e/B2f as a batch; B2g SDDM needs the SVG regenerated; B2h rebuild cursor) → one commit per layer or one `fix: complete lime recolor across user-activated layers`
7. [ ] **B3** simulator mesh/liquid-glass/GrubScreen recolor (prefer `var(--ig-*)` consumption) → `fix(sim): lime across mesh/liquid-glass; consume tokens`
8. [ ] **C1 + C2 (+C3)** unify GRUB paths, atomic validated mkconfig → `fix(grub): unify deploy path; atomic validated grub.cfg writes`
9. [ ] **C4 + C5** browser-sync atomic swap + re-check → `fix(scripts): atomic profile swap in sync-browser-theme`
10. [ ] **C6** template systemd unit path → `fix(vscode): template repo path into systemd unit`
11. [ ] **D1 + D2** README + REFERENCE/PHILOSOPHY rewrite incl. Variants section → `docs: lime-default rewrite + variant selection guide`
12. [ ] **D4** sub-README tables → `docs: sync layer READMEs with shipped artifacts`
13. [ ] Decisions to make (no code until decided): **A5** (accent_hi gamut), **A8** (text_muted AA), B2 recolor-vs-retitle per layer, B6 (ISO artifact).

After each codegen-touching step: `python3 tokens/codegen.py && python3 tokens/codegen.py --check` and re-diff `simulator/src/lib/styles/{tokens,glass}.css` against `tokens/out/`.
