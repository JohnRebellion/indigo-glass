# Outline-not-highlight sweep — 2026-08-30

Session record + next-session review plan.

Companion docs: [`STATE_GRAMMAR.md`](STATE_GRAMMAR.md) is the *rule* this
session established and enforces. This file is the *record* of applying it,
including what could not be applied and why.

---

## 1. The intent (stated by the user, in their own framing)

> "instead of highlight, it should be outline… on the on-select clickable items"

Unpacked over the session into four principles, all four of which the work
was measured against:

1. **No translucent wash faking glass.** A translucent state fill is the last
   surviving artefact of the pre-ink material language.
2. **Every colour a real token.** A translucent value bakes an off-palette
   composite that exists nowhere in `tokens.toml` and can't be audited.
3. **Fill means identity, outline means state.** A badge/tag/button keeps its
   opaque fill (*what a thing is*). A list row / tab / menu item's on-select
   state becomes an outline (*what is happening to it*).
4. **One rule survives every backend.** A 2px stroke reads identically on
   GRUB 9-patch PNG, Plasma FrameSVG, GTK CSS, VSCode JSON, canvas. A fill
   needs per-backend contrast retuning.

Principle 3 is the load-bearing one. Principles 1–2 were the enforcement
lever that made the sweep *findable* rather than a matter of diligence.

---

## 2. Three distinct bug classes, found in sequence

Each was invisible to the check that caught the previous one. This is the
single most important thing to carry forward: **each sweep was clean before
the next class was discovered.**

| # | Class | How it hid | Found by |
|---|---|---|---|
| 1 | **Translucent fill** — `rgba(…, 0.22)`, `#RRGGBBAA` | Colour checker only matched literal hex; material checker only looked for blur/grain/soft-shadow | The `/plan` sweep, then enforced by the new `--alpha` mode |
| 2 | **`color-mix(…, N%, transparent)`** | Functionally identical to `rgba()`, but matched neither the `rgba(` nor `#RRGGBBAA` regex | User screenshot of the `density-test` sidebar list, *after* `--alpha` reported clean |
| 3 | **Fully opaque fill on an on-select state** | Not translucent at all, so no alpha-based check could ever see it | Dedicated read-only audit agents, *after* both above were clean |

Class 3 has **no automated guard**. See §6.

---

## 3. What changed

### 3.1 Token source (schema v5 → v6)

- `tokens/indigo-glass.tokens.toml`
  - `[palette.alpha] border` / `border_strong` — the last literal translucent
    "glass edge" *in the token source itself*, self-contradicting
    `material_style = "flat_ink"` — moved to a new `[palette.composite]`
    table, resolved to opaque hex at emit time.
  - `[palette.alpha]` now holds only `overlay` (a modal scrim genuinely needs
    the backdrop to show through).
  - New `[alpha.exempt].key_fragments` — the Tier A allowlist consumed by the
    checker.
- `tokens/codegen.py` — added `_composite_hex()`, wired `[palette.composite]`
  into `derive_palette()`.
- Regenerated `tokens/out/*`. `--ig-border` went `#FFFFFF0F` → `#1C1C1E`.
- Synced the stale hand-copy `simulator/src/lib/styles/tokens.css`, which had
  never picked up the earlier border/weight/`DecorationFocus` work either.

### 3.2 Enforcement

- `scripts/check-palette-drift.sh` gained a third mode, `--alpha`, alongside
  `--colour` / `--material`, and is part of the default run.
- Comment-aware (a `/* was rgba(…) */` note is not a violation), nested-block
  aware (handles the `@-moz-document` wrapper every browser Stylus file uses),
  selector-context aware (`::selection {` on a line above the property),
  shadow/glow aware, and normalises kebab/camel/snake so one fragment list
  covers every naming convention in the repo.
- Escape hatch is the existing `# drift-allow` convention.

### 3.3 Per-surface (repo)

| Surface | Change |
|---|---|
| VSCode themes (dark+light) | 27 keys/file composited to opaque; `quickInputList.focusBackground`, `peekViewResult.selectionBackground` → neutral (no outline key exists — confirmed against the official theme-colour reference); `inputOption.activeBackground` → transparent (its `activeBorder` already carries the signal); `tab.activeBackground` flattened to match `inactiveBackground` so `tab.activeBorderTop` alone marks the active tab |
| VSCode `claude-code-indigo.css` | checkbox / suggestion-bullet / mention-chip fills → opaque |
| GTK3 | `menuitem:hover`, `row:selected` — solid full-strength accent fills → white inset outline |
| GTK4 | `headerbar_border_color`, `sidebar_border_color` → opaque |
| Obsidian | `--background-modifier-*` → opaque; `--background-modifier-active-hover` → `transparent`, replaced by a real outline rule on `.is-active` / `.is-selected` (Obsidian's classes are stable and documented, unlike Discord's); stale lime `--tag-background`; stale pre-v5 `positive` hex |
| Spicetify | hairline border, progress track, scrollbar thumbs → opaque/real tokens |
| Vencord | Discord state variables → opaque; scrollbar thumbs → real tokens; mention badge → opaque |
| Browser Stylus | scrollbar thumbs → real tokens; Notion's on-select wash reduced (kept deliberately backdrop-agnostic, `drift-allow`-tagged) |
| Simulator | `color-mix` sweep across nav tabs, VSCode-preview file rows, command-palette rows, chat bubbles, chips, scrollbars; `density-test` sidebar list → outline; dead `pillBorderBottomFor()` removed; stale lime accent in the GRUB canvas preview |
| GRUB | `generate-cards.sh` (+ the legacy `iso/` copy) — rounded, translucent, alpha-masked stat cards → sharp, opaque, 2px-bordered; assets regenerated |
| SDDM | QML input borders → opaque |
| Edge theme | `theme.tints.buttons` was still indigo `#818CF8`'s HSL after the sage migration — stored as an `[H,S,L]` triple, so no hex-based drift check could ever see it. Recomputed from `accent_hi`. v1.3.0 |

### 3.4 KDE / Plasma (the deepest layer, and the most live-state-dependent)

- `config/plasma-theme/SageInk/colors` — a **separate file** from
  `share/color-schemes/SageInk.colors`, never touched by the earlier
  `DecorationFocus` fix. All 7 roles were still accent-green, and it was
  live-deployed. Fixed to `248,248,248`.
- `config/plasma-theme/SageInk/widgets/viewitem.svg` — the earlier fix zeroed
  the `*-center` fill tiles but left the frame at its inherited Breeze **5px**
  thickness. Redrawn at **2px** across all 24 tiles
  (`selected` / `hover` / `selected+hover` × 8 positions).
- `widgets/tooltip.svg` — added a solid 2px black border frame to all 8 edge
  and corner tiles.
- `dialogs/background.svg` (the app-menu / Kicker popup surface) — all 8
  drop-shadow tiles disabled, 8 border tiles recoloured to solid black.
  Per explicit instruction: outline instead of drop-shadow.
- Both propagated to the `opaque` / `solid` / `translucent` variant copies.

### 3.5 Sibling projects

| Project | Outcome |
|---|---|
| **ph-scraper studio** | Page-nav active state reused `.btn-primary`'s opaque `bg-hazard-500` → white outline + accent text. Rebuilt, `ph-studio.service` restarted, confirmed serving. |
| **Portfolio** | Audited — **clean, no changes needed**. Already outline/colour-only on every nav and list state, with a global `*:focus-visible` outline nothing overrides. (The pending diff there is from earlier in the session: `--radius-md`, `.text-display` weight.) |
| **Rebel Diesel** | `rebel-diesel-landing.html:75` nav-link hover used a filled background → outline. Poster/signage confirmed pure static print artifacts, out of scope. Its deliberate zero-shadow print divergence was **not** touched. |

---

## 4. Deployment state — the part most likely to mislead next session

**Nothing in `indigo-glass` is committed. 79 changed files, all working-tree
only, `main` level with `origin/main`, last commit `f13a832`.**

| Target | State |
|---|---|
| GTK3 + GTK4 | Live-synced to `~/.themes/SageInk`. GTK4 had **never** been deployed at all before this session — the live `gtk-4.0/` dir was empty. |
| KDE colour scheme | Live at `~/.local/share/color-schemes/SageInk.colors`, matches repo. |
| Plasma desktop theme | Live at `~/.local/share/plasma/desktoptheme/SageInk`, matches repo. |
| GRUB | Deployed to `/boot/grub2/themes/sage-ink`, verified byte-identical via `sudo diff -rq`. |
| VSCode | Live via symlink (`~/.vscode-insiders/extensions/indigo-glass.indigo-glass-0.1.0` → repo `vscode/`). **Needs a window/theme reload to re-render** — cached parse. |
| ph-scraper studio | Built + service restarted + serving. Uncommitted in its own repo. |
| Portfolio | Uncommitted, **not deployed** (Vercel untouched). |
| Rebel Diesel | **Deployed** (post-doc). `research-reports/` is gitignored by design in its own `research` repo, but the actual publish target is a *separate*, direct-upload Cloudflare Pages project (`rebel-diesel`, no git integration) built from `research-reports/_deploy/`, not the gitignored source tree. Synced `_deploy/index.html` from the fixed source and ran `npx wrangler pages deploy`; verified the fix live at rebel-diesel.pages.dev. |
| Obsidian / Spicetify / Vencord | **Not installed on this machine.** Repo-only. Never visually verified — reference material for a future install. |
| SDDM | Repo theme has never been installed to `/usr/share/sddm/themes/`. Repo-only, unverified. |
| Edge theme | **Superseded the original plan.** Instead of manually refreshing the extension card per profile, added `--load-extension=.../edge-theme/indigo-glass` to all 4 launcher scripts (found a 4th, `edge-tyremax`, undocumented until now) — auto-loads and auto-applies as the active theme on every launch, no manual step at all. Verified by reading the running profile's own `Preferences` (`extensions.theme.id` matches the loaded path's extension ID). Originals backed up as `~/.local/bin/edge-*.bak-20260830`. |

### Plasma cache gotcha (cost real debugging time twice)

Two independent caches, both must be cleared, or a correct file renders stale:

```bash
rm -f ~/.cache/plasma_theme_SageInk.kcache ~/.cache/ksvg-elements
kquitapp6 plasmashell && sleep 1 && (nohup plasmashell >/dev/null 2>&1 &)
```

`ksvg-elements` is the one that was missed initially — it held the pre-fix
green render of `viewitem.svg` even after the theme kcache was dropped.
Also: `plasma-apply-colorscheme` **no-ops if the scheme name is unchanged**,
even when the file content changed — toggle to another scheme and back.

---

## 5. Walls — documented limits, not oversights

Do not re-litigate these without new information; each was investigated to
the mechanism.

| Wall | Why |
|---|---|
| **Dolphin file listing** | Painted by KDE Frameworks' `KItemListView`/`KItemListWidget` (`libKF6ItemViews`), compiled C++. Draws a filled rect from the palette Highlight role directly. No config key in `dolphinrc`, no colour-scheme role, no SVG asset. Needs a source patch + rebuild. |
| **Klassy QStyle** | `klassy6.so` is a compiled Qt style plugin; `klassyrc` exposes only window-decoration options. Separate wall from the above, same conclusion. |
| **Vencord / Discord** | Can only override the *value* of variables Discord's compiled stylesheet already reads as `background-color`. Class names are hash-obfuscated and churn per release — no stable selector to attach a real outline to. Mitigated to barely-there + opaque. |
| **VSCode `statusBarItem`** | No outline/border key exists in the theme-colour API (focus-only). Confirmed against the official reference. |
| **VSCode `quickInputList` / `peekViewResult`** | Same — no outline key for the focused/selected row. Confirmed against the official reference. Fallback is a neutral, non-accent fill. |
| **Edge / Chrome theme manifest** | Colour slots + one HSL tint only. No border, radius, or shadow concept exists in the API. Correct on-palette colour is the entire available surface. |

---

## 6. The gap that remains open

**Bug class 3 (opaque fill on an on-select state) has no automated guard.**

`--alpha` cannot see it by construction — the value is a legitimate solid
colour; only its *role* (a state, not an identity) makes it wrong. It was
found by targeted read-only audit agents, i.e. by judgement, which means it
can silently reappear.

A guard would need to reason about selector semantics: flag a solid
`background`/`bg-*` whose selector matches `:hover` / `.active` / `.selected`
/ `[aria-selected]` **and** whose element is list-like — while not flagging
buttons, badges, chips, validation boxes, or zebra striping. That is a real
design problem, not a regex. Deliberately deferred; recorded here so the next
session knows it is *absent*, not *passing*.

---

## 7. Review plan for next session

Verification-first. The intent was visual; file diffs are not evidence that
the intent was met. Work top-down and stop at the first surprise.

### Phase A — confirm the automated floor still holds (2 min)

```bash
cd ~/projects/indigo-glass
./scripts/check-palette-drift.sh          # expect: clean (colour + material + alpha)
python3 tokens/codegen.py --check         # expect: outputs up to date
cd simulator && bun run check              # expect: 0 errors, 0 warnings
```

If `codegen.py --check` fails, `tokens/out/*` drifted from the token source —
regenerate and re-sync `simulator/src/lib/styles/tokens.css` (a hand-copy, not
generated in place).

**Already caught once** (2026-08-30, same day, after this doc was first
written): `codegen.py --check` failed — `tokens/out/json-tokens.json` had
been stale since the schema v5→v6 bump, never regenerated after the later
`[alpha.exempt]` table was added to `tokens.toml`. Fixed by re-running
`python3 tokens/codegen.py`. Lesson: run `--check` immediately after *every*
`tokens.toml` edit in the same sitting, not just after the "last" one — it's
easy to add one more small edit and forget the regen.

### Phase B — visually verify the live surfaces (the actual deliverable)

Each row is "does the *rendered* result match the intent", not "was the file
edited". Screenshot each; compare against §1 principle 3.

| # | Surface | What to look for | If wrong, suspect |
|---|---|---|---|
| B1 | Desktop icon selection (Folder View) | 2px white outline, no fill, no green | Both Plasma caches (§4) |
| B2 | App menu / Kicker popup | Hard black border, **no drop shadow** | `dialogs/background.svg`, variant dirs |
| B3 | Tooltip | Hard black 2px border, no shadow | `widgets/tooltip.svg`, variant dirs |
| B4 | Plasma list/menu item selection | Outline, not fill | `viewitem.svg` 2px geometry |
| B5 | GTK3 app menus + list rows (`gtk3-demo`) | White inset outline, not accent fill | Live `~/.themes/SageInk` sync |
| B6 | VSCode Explorer file list | **Reload window first.** Transparent fill, white focus outline | Cached theme parse, not source |
| B7 | VSCode tabs | Active tab marked by top border only, no fill difference | `tab.activeBackground` |
| B8 | GRUB boot menu (next reboot) | Outline-only selected row, sharp opaque stat cards | Already verified byte-identical |
| B9 | ph-studio `localhost:5317` | Active nav = outline, not amber block | Rebuild + restart |
| B10 | Simulator `density-test` route | Sidebar rows outline on hover/focus | The original screenshot case |

### Phase C — decide the open questions

1. **Commit.** ~80 files uncommitted in `indigo-glass` across a schema bump, a
   new checker mode, two new docs, and regenerated outputs. Likely wants
   splitting: token/codegen + checker + docs as one commit, per-surface fixes
   as another, Plasma assets as a third. **ph-scraper studio is also still
   uncommitted** in its own repo (portfolio is resolved — see below).
2. ~~**Edge theme**~~ — **Resolved**, but not the way this doc originally
   proposed. Auto-loads via the 4 launcher scripts now; nothing left to do
   unless the nag bar it introduces becomes annoying enough to want the
   packed/signed `.crx` route instead.
3. **Class-3 guard** (§6) — build it, or accept judgement-only and note that
   in `STATE_GRAMMAR.md`.
4. **Dolphin** — accept the wall, or open a Klassy/kitemviews source patch as
   a separate piece of work.
5. **Unverifiable surfaces** — Obsidian, Spicetify, Vencord, SDDM are edited
   but were never rendered. Either install one to spot-check the convention
   transfers, or explicitly mark them "written to spec, unverified".
6. ~~**Portfolio commit + deploy**~~ — **Resolved.** Committed (`3b2f73c`) and
   pushed to `origin/master`; Vercel auto-deploys from that push. Confirmed
   its `CLAUDE.md` names Vercel (not the also-existing, stale
   `johnrebellion-portfolio` Cloudflare Pages project) as canonical — left
   that alone per its own "never change deploy targets without asking" rule.
7. ~~**Rebel Diesel deploy**~~ — **Resolved.** Turned out to be a Cloudflare
   Pages direct-upload project (`rebel-diesel`, no git integration), built
   from `research-reports/_deploy/` — a manually-maintained copy of
   `rebel-diesel-landing.html`, not the gitignored source tree itself. Synced
   and deployed via `wrangler pages deploy`; confirmed live.

### Phase D — leftovers from before this sweep

Still outstanding, never re-raised, low priority:

- Stale naming: `share/grub-theme/theme.txt` header (`Lime Glass v12`),
  `vscode/settings.snippet.json` (references a theme name that no longer
  exists), `tokens/codegen.py` docstring, `config/starship.toml`,
  `hosts/*.toml`, and the `obsidian/Indigo Glass/` folder + manifest name.
- `share/grub-theme/background-prompt.md` — a "tightened" revision was drafted
  in conversation but never written to the file.
