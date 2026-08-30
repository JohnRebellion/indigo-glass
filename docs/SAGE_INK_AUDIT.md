# Sage Ink — Exhaustive Implementation Audit

Generated 2026-08-29. Purpose: a complete inventory of every themed surface in this
repo, as a base for auditing what's actually Sage Ink vs what's still "Lime Glass"
(the prior lime-accented, translucent/blur-heavy iteration) or "Indigo Glass"
(the iteration before that, violet-accented). Sage Ink is the current default:
opaque, hard-edged, colour-as-elevation, zero blur.

Canonical source of truth for all colour/spacing/shadow/motion values:
`tokens/indigo-glass.tokens.toml` → `tokens/codegen.py` → `tokens/out/*`.

---

## 1. Tokens (canonical source)

`tokens/indigo-glass.tokens.toml` (schema v5, 394 lines):

- **`[meta]`**: `name="Sage Ink"`, `description="neobrutalist ink - opaque, hard-shadow, colour-as-elevation. No glass."`, `default_variant="sage"`, `material_style="flat_ink"`.
- **Three variants defined**: `sage` (default), `lime`, `indigo` — all three are intentional, labelled alternates in the schema, not accidental leftovers:
  - `sage`: accent `#A6C9A6`, accent_hi `#C0E3C0`, accent_alt `#89A889`.
  - `lime`: accent `#A8E635`, accent_hi `#C1FF58`, accent_alt `#8BC406`.
  - `indigo`: accent ~hue 275° (violet/indigo family).
- **`[opacity]`**: `window_active=1.00`, `window_inactive=1.00` (both were `0.92`/`0.85` pre-v5 — that was the actual glass leftover, now fixed at the token level).
- **`[radius]`**: `default=0` ("was glass rounded 8"). `[radius.squircle].enabled=false` (visionOS device from the glass era, explicitly disabled, dead code kept only because codegen still reads it).
- **`[shadow]`**: `ink`/`ink_lg`/`ink_press` are hard offset, zero blur (`4px 4px 0 0` / `7px 7px 0 0`), doc-placeholder colour overwritten with `accent_alt` at emit time. Glass/neumorphic entries (`glass_sm`, `glass`, `neu_raised`, `neu_pressed`) **deleted** in v5.
- **`[shadow.klassy]`**: separate table driving the native Klassy shadow (`klassy-radius.ini`), independently kept at the doubled 8px offset used by the C++ patch.
- **Fully deleted in v5** (confirmed gone, not just deprecated): `[glass]`, `[glass.render]`, `[glass.grain]`, `[ambient]`, `[blur]`. The changelog comment in the file itself notes these "survived in the Obsidian/Spicetify/Vencord themes for weeks after the migration" — i.e. the token was fixed well before the app-level CSS caught up (see §6).

`tokens/codegen.py` (741 lines) generates, per variant plus a canonical default copy:

- `css-vars.css`, `scss-vars.scss` — CSS/Sass custom properties (palette, spacing, radius, opacity, shadow, type, motion).
- `kde-palette.colors` — KDE colour-scheme INI partial.
- `wt-scheme.json` — Windows Terminal scheme JSON.

Shared (variant-agnostic) outputs: `json-tokens.json`, `density.css`, `kwinrc-blur.ini` (blur explicitly `false`, no longer reads any opacity/blur token), `klassy-radius.ini` (`WindowCornerRadius`, `ShadowSize/Strength/Color` — colour derived live from `accent_alt`).

**Known gap**: the `[opacity]` table is wired into CSS output only. It is **not** wired into the KWin/Klassy layer — Klassy's titlebar opacity fix (`ActiveTitleBarOpacity=100` in `klassyrc`) is hand-maintained, not codegen-derived. If tokens.toml opacity values ever change again, KWin/Klassy will not pick it up automatically.

**Stale docstring**: `codegen.py`'s module docstring still lists `tokens/out/glass[.variant].css` as an output — the `emit_*glass*` function was removed; confirmed absent from `tokens/out/`.

**`simulator/package.json`** `tokens:sync` script still runs `cp ../tokens/out/glass.css src/lib/styles/glass.css` — **broken**, that file no longer exists.

---

## 2. Plasma / KWin / Klassy

### `config/klassy/klassyrc`
- `[TitleBarOpacity]`: `ActiveTitleBarOpacity=100`, `InactiveTitleBarOpacity=100`, `OpaqueMaximizedTitleBars=true`. Comment documents these were found live at **30/60/false** (genuine frosted-glass leftover) on 2026-08-28 and fixed.
- `[Windeco]`: `WindowCornerRadius=0`, `useTitleBarColorForAllBorders=true` (works around an undefined `ColorRole::Frame` producing a stray dark border).
- `[ShadowStyle]`: `ShadowSize=ShadowSmall`, `ShadowStrength=255`, `ShadowColor=137,168,137` (sage, hard shadow — not black/soft).
- `[Exceptions]`: `OpaqueTitleBar=true` (required for the opacity keys above to actually apply).
- `[Style]`: `MenuOpacity=100`.
- **Note**: this file was reset to near-empty once this session (user hit Klassy's GUI "Defaults" or similar) — restored from this repo-tracked copy. The repo copy is the actual known-good source of truth; treat the live `~/.config/klassy/klassyrc` as disposable/regeneratable from it.

### `config/kwin/`
- `kwinrc.snippet`: Klassy decoration, `blurEnabled=false`, `better_blur_dxEnabled=false`, `backgroundcontrastEnabled=false` — all translucency effects off.
- **`kwinrulesrc.snippet` is a stale leftover file**: header literally says *"Lime Glass — global window opacity rule"* with `opacityactive=88`/`opacityinactive=85`. Confirmed **not applied** in the live `~/.config/kwinrulesrc` (live shows `100`/`100`), but the stale snippet still exists on disk in the repo and should be deleted or updated so it can't be accidentally reapplied.

### `config/plasma-theme/SageInk/`
- `metadata.json`: "opaque, hard-edged, brutalist".
- `plasmarc`: `ContrastEffect.enabled=false`, `AdaptiveTransparency.enabled=false` — correct.
- Top-level `colors` file matches sage palette, sourced from `tokens/out/kde-palette.sage.colors`.
- **`opaque/`, `solid/`, `translucent/` variant subdirectories are byte-identical** for every shared file. "translucent/" is vestigial/unimplemented scaffolding — no actual translucent variant exists. Worth pruning or actually implementing; currently just a misleading name.
- No `feGaussianBlur`/`stdDeviation` anywhere in any theme SVG — confirmed no blur filters.
- `dialogs/background.svg`: corner shadow tiles were `fill="#000000"` (mismatched vs sage edge tiles) — **fixed this session**, all 8 instances now `#89A889` (commit `f3d788b`). The separate soft-shadow *gradient* stops (`stop-color="#000000"`, distinct from the flat corner fill) were also patched to `#89A889` this session, across the `dialogs/background.svg` in the base theme and its `opaque/solid/translucent` copies.
- `widgets/viewitem.svg`: label text was illegible white-on-pale-sage on hover/selected tiles; fixed by hardcoding `fill:#456246` (dark sage) across all 35 `fill:currentColor` instances, after two rejected alternate approaches (shadow-rect, then stroke-outline) each introduced new geometry defects.
- `widgets/background.svg` (generic hover/pressed highlight, non-variant copy) correctly uses `class="ColorScheme-*"` / `fill="currentColor"`, resolving live from kdeglobals' `SageInk` colour scheme (`Colors:Selection`) — this is the *correct* idiomatic pattern, not a bug, despite containing decorative `fill="#ff00ff"`/`"#ff6600"` — those are Plasma-SDK `hint-*-margin`/`hint-*-inset` slicing-tool guide markers, standard boilerplate, never rendered.

### Klassy decoration source (`~/src/klassy`, separate git clone, not part of this repo)
3 commits ahead of the `paulmcauley/klassy` vendor base:
1. `0f023c0` — vendor base.
2. `e8c74d8` — "hard offset shadow for windows and buttons (Sage Ink)": `s_shadowParams[1]` ("Small" preset) repurposed from a soft shadow to a hard one — offset (8,8) → tuned this session to (6,6), radius forced to a minimum safe value of 6 (radius <6 causes negative/zero padding, which collapses the whole 9-patch shadow tile down to a single detached corner square — this was the actual root cause chased at length this session).
3. `81f175f` — "revert boxSize inflation hack for hard offset shadow": an earlier attempt to fix offset-clipping by inflating `boxSize` was reverted; it broke mask-centering and caused asymmetric transparent bleed on the top/left edges.
- `breezedecoration.cpp` `createShadowObject()`: forces `shadowColor.setAlpha(255)` (brutalist offset shadows are opaque by definition; the incoming colour can carry alpha from `ShadowStrength`).
- `libbreezecommon/breezeboxshadowrenderer.cpp` `renderShadow()`: the actual blur pass (`boxBlurAlpha`/`mirrorTopLeftQuadrant`) is skipped entirely — `radius` is kept only for canvas/padding sizing, giving a crisp flat-edged shadow instead of a soft halo.
- **Status as of this session's end**: shadow pipeline confirmed working in principle (stock `ShadowVeryLarge` preset renders fine on the test window), but the custom `ShadowSmall` preset's exact final tuning (offset/radius/visible size) was not re-verified visually before the session moved on — flag this as the one open item if VSCode's own window shadow still looks off.

---

## 3. GTK / Icons / Cursor / Fonts

### `config/gtk-theme/SageInk/`
- `index.theme`: `IconTheme=Papirus-Dark` (migrated from Tela-circle-purple-dark, 2026-08-28), `CursorTheme=Bibata-IndigoGlass` (heritage name, intentional — see cursor section).
- `gtk-3.0/gtk-dark.css`: fully migrated — opaque fills, `border-radius:0`, hard offset shadows `8px 8px 0 0 rgba(137,168,137,0.9)`, sage accents. No blur/translucency/purple.

### `config/gtk-3.0/` / `config/gtk-4.0/`
- `settings.ini` (both): `gtk-theme-name=SageInk`, `gtk-icon-theme-name=Papirus-Dark`, `gtk-cursor-theme-name=Bibata-IndigoGlass`. Live `~/.config/gtk-*.0/settings.ini` confirmed byte-identical to repo source — no drift.
- `gtk-4.0/gtk.css`: fully migrated libadwaita overrides, opaque `#121216` card fills, hard `8px 8px 0 0` shadows.
- **`config/gtk-3.0/gtk.css` — real, self-documented leftover**: its own comment states GTK3 apps still render on **WhiteSur-Dark-purple** as the base theme; this file only overrides accent colours on top. Widget shadows/corners/vibrancy for GTK3 apps are not ink-material at all — the base theme itself was never replaced, only accent-patched.

### `scripts/install.sh`
- Icon block installs `papirus-icon-theme` via `dnf`, idempotency-guarded. No Tela git clone remains.
- GTK theme block copies `config/gtk-theme/SageInk` → `~/.themes/SageInk` (comment confirms replacing WhiteSur-Dark-purple — but per above, that replacement is only partial for GTK3).

### `cursor/`
- Builds `Bibata-IndigoGlass` (recoloured Bibata-Modern-Classic). Colours: `ACCENT=#A6C9A6`, `OUTLINE=#07080A`, `BASE=#F8F8F8` — current sage tokens, no purple. The "IndigoGlass" name is a deliberate, documented heritage choice (referenced by `gtk-cursor-theme-name`/`kcminputrc`; renaming would break the live binding).

### `share/fonts/indigo-glass-fonts/`
- Bundle: Carlito (prose), Inter (UI fallback), Iosevka Custom (6 weights — README undersells this as "Regular only"), MesloLGS NF (mono fallback), SF Pro Display (Apple-proprietary).
- **Leftover**: `README.md` title is still *"Lime Glass - Font Bundle"*, body repeatedly says "Lime Glass layers"/"Lime Glass repo" — doc-only, no functional impact.

### `share/color-schemes/`
- `SageInk.colors`: fully sage (`166,201,166` / `192,227,192` / `137,168,137`), matches live installed copy byte-for-byte.
- `IndigoGlass.colors`: indigo/violet family (`94,106,210` / `129,140,248` / `167,139,250`) — kept intentionally installable as a second variant per `install.sh` comment, not a straggler.

---

## 4. Apps / Editors / Browsers

| Surface | File | Status |
|---|---|---|
| VSCode theme | `vscode/themes/indigo-glass-{dark,light}.json` | Sage-correct (`#A6C9A6`/`#C0E3C0`/`#89A889`), named "Sage Ink Dark/Light" |
| VSCode webview CSS | `vscode/css/claude-code-indigo.css` | Header still says "Lime Glass"; `--app-modal-background` alpha ~0.8 (leftover transparency); shadows correctly hard/zero-blur |
| VSCode settings snippet | `vscode/settings.snippet.json` | **Broken**: points to theme name `"Lime Glass Dark/Light"`, which no longer exists (registered names are "Sage Ink Dark/Light") |
| Web template | `web/app.css.example` | `--shadow-ink-*` migrated to `#89A889`, zero blur. `--color-border*` still white-alpha (`rgba(255,255,255,0.06/0.10)`) |
| Dark Reader preset | `browser/darkreader/indigo-glass.json` | Clean, named "Sage Ink" |
| Edge theme manifest | `browser/edge-theme/indigo-glass/manifest.json` | **Leftover naming**: `"name": "Lime Glass — Edge Theme"` while its own README already says Sage Ink; colours correct |
| Monkeytype | `browser/monkeytype/indigo-glass.json` + README | **Hard leftover**: `mainColor: #A8E635`, caret `#C1FF58` — literal old lime colours, essentially un-migrated |
| Stylus (universal) | `browser/stylus/indigo-glass.user.css` | Correctly renamed "Sage Ink — Universal"; sage-hued alpha overlays only |
| Stylus (per-site) | `browser/stylus/sites/{chatgpt,claude-ai,linear,notion}.user.css` | **Leftover naming**: all 4 still headed `@name Lime Glass - <site>`; white-alpha borders throughout |
| Spicetify | `spicetify/Themes/indigo-glass/{color.ini,user.css}` | `color.ini` sage-correct; `user.css` has one `rgba(0,0,0,0.9)` black shadow (should be `#89A889`); README fabricates a "translucent + 13px backdrop blur" now-playing bar that doesn't exist in the actual CSS |
| Vencord | `vencord/indigo-glass.theme.css` | Correctly kills Discord's native blur (`backdrop-filter: none !important`); same black-shadow leftover as Spicetify; README also describes a stale lime mapping |
| JetBrains | `jetbrains/Indigo Glass.icls` | **Leftover, load-bearing**: internal `name="Lime Glass"`/`originalScheme="Lime Glass"` attributes; functional colours are sage-correct |
| Obsidian | `obsidian/Indigo Glass/theme.css` | Header correct; `--tag-background`/`--callout-color` still `#8BC406` (old lime accent-alt), twice; same black-shadow leftover |
| Konsole | `share/konsole/` | Old `IndigoGlass.colorscheme`/`.profile` still present with blue/purple ANSI slots (`#818CF8`/`#A78BFA`) — hard leftover. New `SageInk.colorscheme`/`.profile` fully sage. Opacity confirmed `=1` (opaque) in **both** old and new — no transparency leftover on this axis |
| Windows Terminal | `windows/terminal/indigo-glass.scheme.json` | **Leftover, load-bearing**: `"name": "Lime Glass"`, and `install.ps1:243` matches against this literal string — functionally coupled, not just cosmetic |
| PowerShell profile | `windows/powershell/Microsoft.PowerShell_profile.ps1:39` | **Hard leftover, functional**: raw ANSI escape hardcodes `168,230,53` = `#A8E635` (old lime) for `Selection`, while every other entry in the same table was migrated |
| Windows registry | `windows/registry/indigo-glass-accent.reg` | `AccentColor` correct opaque sage; **`ColorizationColor`/`ColorizationAfterglow` alpha byte `C4` (~0.77, not opaque)**; `ColorizationBlurBalance=1` and `ColorizationGlassAttribute=1` still enabled (only `GlassReflectionIntensity=0` was zeroed) |

Recurring cross-cutting pattern: **Spicetify, Vencord, and Obsidian all use `rgba(0,0,0,0.9)`** for their offset hard-shadow instead of the canonical sage `#89A889` used in `web/app.css.example` and the native Klassy shadow. Same fix, three places.

Out-of-family decorative purple `#C8B5FF` recurs consistently across VSCode dark theme, Vencord, the Notion Stylus override, Obsidian, and Windows Terminal — consistent enough to read as a deliberate secondary/decorative accent rather than residue, but it sits outside the sage family and is worth a deliberate yes/no.

---

## 5. Boot chrome (GRUB / SDDM)

- **`share/grub-theme/theme.txt`** (canonical source): migrated to sage (`#07080A`, `#C0E3C0`, `#A6C9A6`), header comment still says "Lime Glass" (comment only). **Real leftover**: the `"BOOT PICKER"` header text and `boot_menu.item_color` both use `#E8FFB0` — a lime-yellow, off-palette, not documented as an intentional accent anywhere.
- **`iso/boot/grub/themes/indigo-glass/theme.txt`**: an entirely separate, **fully unmigrated Indigo Glass artifact** — `desktop-color "#0a0a14"`, label colours `#c4b5fd`/`#a78bfa`/`#e0e7ff` (violet family). Not touched by the lime→sage remap at all; this is the biggest single gap found in the whole audit.
- **`sddm/indigo-glass/Main.qml`**: colours correctly migrated to sage (`accent=#A6C9A6`, opaque panel, hard 8px offset shadow, `radius:0`), header comment explicitly claims the opaque-panel migration from a translucent Lime-Glass-era panel — but **line 84 still literally renders the brand text `"Lime Glass"` on screen**.

---

## 6. Repo tooling (what's automatically checked vs manually maintained)

- **`scripts/check-palette-drift.sh`** (v2): scans every top-level dir (except `docs/research-reports/scripts/tokens`) for (a) stale non-active-variant colour literals, computed live from the toml, and (b) material drift — `backdrop-filter`/`feTurbulence`/`blur()`, soft box-shadows, and Klassy's `TitleBarOpacity`/`OpaqueTitleBar=false`. Supports `--colour`/`--material` and a `# drift-allow` escape hatch.
  - **This audit found real drift the script's colour check likely wouldn't catch as currently scoped**: SDDM's on-screen `"Lime Glass"` string, GRUB's header comments, and — notably — `iso/` is *not* in the script's exclusion list, so a live run should actually already be flagging its indigo hex literals. Worth running `check-palette-drift.sh` fresh and reconciling its output against this doc.
- **`scripts/install.sh`**: full Fedora/Nobara/Arch/Ubuntu installer. No longer builds `better-blur-dx`, no longer installs the blur watchdog, no longer writes global window-opacity rules. Builds Klassy from source with the hard-shadow patch.
- **`scripts/sync-grub-parity.sh`**: propagates `share/grub-theme/` → `simulator/static/presets/sage/` and (with `--deploy`) `/boot/grub2/themes/sage-ink/`. Banner text still says *"Lime Glass GRUB parity sync"* (comment/log only).
- **`scripts/sync-browser-theme.sh`**: clones Stylus/Dark Reader LevelDB settings across Edge profiles so all browser profiles share one Stylus-authored theme. Banner still says *"Lime Glass browser theme sync"* (comment/log only).
- **`scripts/kwin-blur-watchdog.sh`**: dead code — blur is disabled outright in v5 — but the file is still repo-tracked, header still says "Lime Glass — Better Blur resume watchdog".
- **`scripts/_recolor-grub-lime-to-sage.py`** / **`_remap-lime-to-sage.py`**: explicitly ad-hoc, one-off migration scripts whose own docstrings say "delete after Sage Ink rollout is verified" — still present, i.e. the rollout has not yet been declared fully verified/cleaned up by their own criteria.
- **`hosts/`**: per-machine font point-size overrides (DPI compensation), palette-agnostic. `hosts/README.md` title is still *"Lime Glass - Host Profiles"* (doc only).
- **`simulator/`**: SvelteKit live-preview app (`/grub`, `/browser`, `/vscode`, `/density-test`, `/palettes` routes) for QA against all three variants side by side — not itself a themed production target. Its `tokens:sync` npm script is broken (references deleted `glass.css`, see §1).

---

## 7. Summary — everything still needing a decision or fix

**Hard colour leftovers (visibly wrong today):**
1. `browser/monkeytype/indigo-glass.json` + README — `#A8E635`/`#C1FF58`, essentially un-migrated.
2. `share/konsole/IndigoGlass.colorscheme`/`.profile` — blue/purple ANSI slots (intentional-variant question: keep as second option, like `IndigoGlass.colors`, or retire?).
3. `windows/powershell/Microsoft.PowerShell_profile.ps1:39` — hardcoded `#A8E635` ANSI escape.
4. `obsidian/Indigo Glass/theme.css` — `#8BC406` tag/callout colours, twice.
5. `share/grub-theme/theme.txt` — `#E8FFB0` boot-picker header/item colour.
6. `iso/boot/grub/themes/indigo-glass/` — entire artifact never migrated (violet family).
7. Spicetify / Vencord / Obsidian — `rgba(0,0,0,0.9)` shadows, should be `#89A889` to match everywhere else.

**Functionally broken (not just cosmetic):**
8. `vscode/settings.snippet.json` — points at a theme name that doesn't exist.
9. `simulator/package.json` `tokens:sync` — references a deleted file.
10. `config/kwin/kwinrulesrc.snippet` — stale opacity rule (not live, but on disk).

**Naming-only, but load-bearing (renaming breaks a live reference, needs care):**
11. `windows/terminal/indigo-glass.scheme.json` + `install.ps1:243` string match.
12. `jetbrains/Indigo Glass.icls` internal `name=`/`originalScheme=`.
13. `sddm/indigo-glass/Main.qml:84` — visible on-screen "Lime Glass" text (this one's just a string change, low risk).

**Naming-only, cosmetic (safe to batch-fix anytime):**
14. Comment/README headers across `vscode/`, `browser/edge-theme/`, all 4 `browser/stylus/sites/*.user.css`, `spicetify/README.md`, `vencord/README.md`, `jetbrains/README.md`, `windows/README.md`, `hosts/README.md`, `scripts/sync-grub-parity.sh`, `scripts/sync-browser-theme.sh`, `scripts/kwin-blur-watchdog.sh`, `share/fonts/indigo-glass-fonts/README.md`.

**Deliberate, intentional — not leftovers, just flagging for awareness:**
- `tokens.toml` `[variants.lime]` and `[variants.indigo]` — labelled alternates, sage is default.
- `share/color-schemes/IndigoGlass.colors` — deliberately kept installable per install.sh.
- `cursor/` "Bibata-IndigoGlass" name — load-bearing, intentionally not renamed.
- `config/plasma-theme/SageInk/{opaque,solid,translucent}/` — all byte-identical; not a bug, but dead/unimplemented scaffolding worth pruning or building out.
- `#C8B5FF` decorative purple recurring across several app themes — looks deliberate, but is outside the sage family; worth an explicit call either way.

**Open/unverified from this session:**
- Klassy's custom `ShadowSmall` preset (VSCode window shadow) — pipeline confirmed working, but final offset/radius tuning wasn't re-confirmed visually before the session moved to this audit.
- The Kickoff/app-menu "bottom-right corner square" artifact reported this session was not conclusively diagnosed — last state was checking whether it belongs to the popup itself or a different window/taskbar element underneath.
