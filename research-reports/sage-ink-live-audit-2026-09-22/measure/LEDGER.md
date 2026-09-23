# Measured ledger — live audit 2026-09-22 (internal, not relayed)

Evidence classes: PIX = sampled pixel, SRC = file read, OWN = read the image
myself, GEM = gemini-see claim (never sole evidence).

| # | Surface | Finding | Evidence | Status |
|---|---|---|---|---|
| L1 | Qt/QML | System Settings sidebar: selected item label invisible. Colour-scheme preview "Highlighted text" also invisible. `[Colors:Selection] ForegroundNormal=7,8,10` == View bg; outline selection leaves interior unfilled. Klassy `tierc-outline.patch` remaps HighlightedText for QAbstractItemView only; Kirigami/QML delegates bypass polish(). | OWN, PIX (outline & interior both #07080A), SRC | confirmed |
| L2 | GTK3 | Every hard shadow is `rgba(137,168,137,0.9)` / `rgba(7,8,10,0.9)` — translucent. Renders #7C987D not #89A889. | PIX, SRC gtk-dark.css | confirmed |
| L3 | GTK3 | `@define-color borders #000000` — black border on #07080A/#0D0D10 is invisible. Reference bridge uses border_strong #5E5E60. | SRC gtk-dark.css:32, simulator nb-core.css:57 | confirmed |
| L4 | GTK3 | Entries, check, radio, switch: 1px borders. Reference: 2px on all (nb-core.css 289-420). | SRC | confirmed |
| L5 | GTK3 | switch track `#191c1e` — off-token literal. | SRC | confirmed |
| L6 | GTK3 | headerbar button hover `alpha(@theme_fg_color,0.08)` — translucent wash; state grammar says outline. | SRC | confirmed |
| L7 | GTK3 | Header comment says shadow offset 8px; rules use 4px. | SRC | confirmed (doc) |
| L8 | Edge | Theme loaded in all profiles (theme id khaagace…), but Edge lifts dark theme values non-linearly: 18→25, 7→16, 10→18, 30→35, 0→0. Toolbar renders #19191C, omnibox #101112 vs manifest #121216/#07080A. Pre-compensated input [10,10,15] renders exactly #121216; [1,2,3] renders #06090B (≈#07080A). | PIX, 5 probe launches, measure/edge-lift-probe.txt | confirmed |
| L9 | Edge | NTP renders flat #363636 with white pill search box. No Bing photo present on this profile, so the v1.3.1 rationale (keep daily photo) does not hold here. `ntp_background` is honoured (probe: magenta rendered). | PIX, OWN | confirmed; decision for user/synthesis |
| L10 | check-deployment.sh | Reads ~/.config/microsoft-edge/Default (unused); real profiles are ~/.config/edge-*. Dark Reader ID eimadp… is the Chrome-store ID; Edge store ID is ifoakf… (installed in all 3 profiles). Three false UNDEPLOYED rows. | SRC, profile Preferences | confirmed |
| L11 | Firefox | Wholly unthemed: no layer in repo. Chrome picks GTK tabstrip #121216 but toolbar #222224; pages light. | PIX, OWN | confirmed |
| L12 | Web pages | Site styles zero radius (verified square corners by zoom) but set shadows none and keep site's 1px low-contrast borders. No neobrutalist border/shadow on buttons/inputs. | OWN zoom, SRC | confirmed — judgement Q for brief |
| L13 | Klassy | Titlebar buttons `AccentTrafficLights` + `ShapeSmallCircle`: red/amber/green macOS dots, off-palette (close #910323). | PIX, SRC klassyrc | confirmed — judgement Q |
| L14 | Klassy | Live klassyrc has per-state ShadowColor/Size/Strength{Active,Inactive} keys repo copy lacks. Values identical. | SRC diff | benign drift |
| L15 | GTK settings.ini | Repo says gtk-cursor-theme-name=breeze_cursors; install sets Bibata-IndigoGlass; live has Bibata. | SRC diff | confirmed (repo stale) |
| L16 | docs/REFERENCE.md | Claims Plasma theme is breeze-dark, GTK base is WhiteSur-Dark-purple, "neither exists yet". Both SageInk packages exist and are deployed. | SRC, check-deployment | confirmed (doc) |
| L17 | Qt | Dolphin selection outline white 1px-ish (#FFFFFF), window shadow opaque #89A889 right+bottom — correct. | PIX | compliant |

## Gemini claims rejected

- GTK "missing hard offset shadow on all controls" — false. PIX #7C987D at 4px offset on buttons (see L2 for the real defect).
- Web "rounded corners on GitHub/Wikipedia buttons/inputs" — false. Zoomed crop shows square corners. Montage downscale artefact.
- Qt montage: two capacity failures; circuit breaker, not retried. Covered by own read.

## Not captured

- Plasma shell popups (Kickoff, tray, notifications): Kickoff did not open over a maximised window; full-screen shots are unsafe on this host (client window in taskbar). Out of scope this round.
- Okular shot discarded: recent-documents list showed personal contract filenames.

## L18 — Klassy titlebar buttons (P5 verify, 2026-09-22)

- Before: AccentTrafficLights; close #910323, minimise #9A761A (off-palette red and amber).
- `ButtonBackgroundColors*=Accent` alone gave #989899. Klassy's "Accent" is
  `buttonFocus` = Colors:Button DecorationFocus, which the Tier C decision set to
  `text` #F8F8F8, rendered at partial alpha. That is off-palette and translucent.
- Fix: per-button active overrides `BackgroundNormal=["AccentHighlight",100]`
  and `BackgroundHover=["AccentButtonHover",100]`. Result: opaque #A6C9A6 and no red. P5 PASS.
- Reload gotcha: KWin reconfigure and a decoration round-trip do NOT refresh
  button colours. Klassy caches them until the
  `/KlassyDecoration org.kde.Klassy.Style.updateDecorationColorCache` signal.

## Browser verification pass, 2026-09-23 (check.mjs + own read + gemini-see on chrome-only crops)

Sites: google, youtube, facebook, github, wikipedia, gemini, aistudio. Skipped: atlassian, m365, copilot
(client tenants / work account), shopee (anti-bot). Raw harness output: `measure/check-2026-09-23/`.
Gemini's rounded-corner claims were checked by 400% zoom and refuted on all five sampled
(YouTube chips, GitHub search, GitHub labels, AI Studio card, Facebook search: all square).
Its border-weight and filled-state findings held.

| # | Site | Finding | Evidence | Verdict |
|---|---|---|---|---|
| L19 | GitHub, Wikipedia | 0.3.0 controls: 2px edges, hard shadows, radii 0, fills on-token | harness + PIX | PASS |
| L20 | Facebook | radii 0, fills on-token; "page height grew 1.9x" is infinite-scroll, layout intact | harness + own read | PASS (warning benign) |
| L21 | YouTube | `#frosted-glass` rgba(15,15,15,.8) translucent under chips; `#skip-navigation` #0F0F0F; page canvas stays YouTube #0F0F0F not base | harness | FAIL: translucency + off-token |
| L22 | YouTube | selected chip "All" = solid white fill; "Home" nav = filled block | own read + gemini | Tier C violation |
| L23 | YouTube, Facebook, Gemini, AI Studio | search/composer inputs and buttons carry 0–1px borders | gemini, consistent with source (1px in youtube/facebook files) | contract: 2px border_strong |
| L24 | AI Studio | 5 off-token greys: `.upgrade-card` #1F1F1F, `.account-switcher-button` #1F1F1F, `.chunk-editor-main` #191919, `.upgrade-button` #323232, `.playground-link` #2A2A2A; right-rail run-settings cards also grey | harness + own read | FAIL: off-token fills |
| L25 | Gemini | `a.mat-mdc-list-item` #171717 off-token; composer has no border | harness + gemini | minor |
| L26 | GitHub | issue-label chips are rgba(...,0.18) fills — Tier D badges should be opaque; Primer composes them per-label via alpha so no single var fixes it | harness | known limit, document |
| L27 | Google | AI Overview block: "Show more" pill (~24px radius), rounded images, gradient fade above it. Outside `#center_col`, so check.mjs reports radii=0 — harness blind spot | own read + PIX | FAIL + harness gap |
| L28 | Facebook, GitHub, AI Studio | selected nav rows are filled blocks (Browse all, Issues, Playground) | gemini + own read | Tier C, same class as L22 |
| L29 | Wikipedia | Appearance radio groups and Search carry hard shadow + 2px edge; Vector's blue radios kept (site hue) | own read | PASS |

Not verified: Dark Reader interaction (harness runs with extensions disabled, by design), Stylus after import
(bundle merged, not yet imported), Firefox theme render.

## Fix pass for L21–L28, 2026-09-23 (residue.mjs + check.mjs + own read)

Styles bumped: youtube 0.3.0, aistudio 0.3.0, gemini 0.3.0, facebook 0.4.0, github 0.4.0, google 0.5.0.
`check.mjs` now scans Google from `body` (was `#center_col`, the L27 blind spot) and reports a
`gradients` bucket (gradient fills + backdrop-filter). The residue probe used for this pass is
promoted to `scripts/style-check/residue.mjs`. Raw output: `measure/check-2026-09-23b/`
(`*.txt` = check.mjs, `residue-*.json` = residue.mjs, after fixes).

Every hashed selector the probe surfaced was traced to a role/attribute anchor before a rule was
written; no rule names a Google or Facebook hash. Facebook fills were traced to their declared
variables (`--text-input-bar-background`, `--disabled-button-background`,
`--messenger-card-background`, `--base-blue`) via the site's own stylesheets.

| # | Site | Was | Now | Evidence |
|---|---|---|---|---|
| L30 | YouTube | canvas #0F0F0F; `#frosted-glass` rgba+blur(48px); "All" chip white fill; Home row 10% wash; 1px search edge | base everywhere; blur gone; chip + Home = inset 2px text stroke; 2px border_strong on search, masthead, guide | residue: offToken = ripple #E89082 only (site hue), gradientsBlur 0, translucent = drawer scrim only; own read |
| L31 | AI Studio | 10 off-token greys (#1F1F1F/#191919/#252525/#323232…); 3 backdrop blurs; conic gradient; Playground row #2A2A2A fill | surface/surface_alt + 2px edges; blur and gradient gone; Playground = stroke | residue: offToken 0, gradientsBlur 0; thinBorders = borderless icon buttons (1px transparent, no visible edge) |
| L32 | Gemini | current chat #171717 fill; fade gradients; composer edgeless; drawer #1C1C1C at 900px | stroke; gradients off; composer 2px; drawer sidebar token | check narrow900 fills on-token; horizontal scrollbar at 1400px is present unstyled too (not ours) |
| L33 | Facebook | Browse-all 10% wash; #1877F2 tile; #242526 chat tile; 10% washes on search label + disabled buttons; 1px combobox | stroke; #81ACF0 (site accent recut); surface; 2px edges | residue: offToken = #81ACF0 only; translucent 0; "page height grew 1.7x" = infinite scroll, as L20 |
| L34 | GitHub | Issues row 20% wash; header/filter buttons 1px; label chips rgba .18 | stroke via `--control-transparent-bgColor-selected` + inset; invisible-variant buttons edgeless by design; inputs 2px | residue: translucent = label chips only (L26 limit stands); own read |
| L35 | Google | AI Overview outside `#center_col`: #363840 source chips, #22242A "Show more" pill r=24, fade gradient, white favicon tiles, `mark` r=4 + gradient; Images tab: #22242A chips r=8, white thumb tiles, carousel fades | all on-token, radius 0, no gradients; Show more = one full-width 2px button (first cut split it in two — inner text div repainted base; fixed); tabs stayed unfilled after `:has(img)` scoping | check.mjs all + images: radii [], gradients [], fills on-token; residue all buckets empty; own read ×3 |

Residue that is intentional and stays: YouTube ripple #E89082, Facebook #81ACF0, Gemini `.gradient-strip`
#BA99E3 (per-site hue policy); YouTube/Gemini modal scrims (drift-allow); GitHub label chips (L26);
1px-transparent borders on invisible-variant buttons (no edge is the design).

Not verified in this pass: Dark Reader interaction (harness disables extensions), the bundle after
Stylus import, Firefox render. `edge-personal` confirmed on the same binary the harness drives
(`/usr/bin/microsoft-edge-stable` → `/opt/microsoft/msedge/msedge`, 153.0.4234.48) with theme,
Stylus and Dark Reader present in Default and Profile 1 (`check-deployment.sh`).

## Fix pass for the simulator + GRUB theme, 2026-09-23 (check-ink-contract.py + Playwright + own read)

Same contract as L21–L35, applied to the two layers the browser passes did not touch: the
simulator (SvelteKit, `simulator/`) and the GRUB gfxmenu theme (`share/grub-theme/`).
`scripts/check-ink-contract.py` widened from the three GTK files to the simulator's hand-typed
CSS/Svelte/TS and to `theme.txt` plus every pixmap it references (binary alpha, token-only flat
fills). Run against the pre-pass tree it reports 25 violations on the GRUB theme and 38 across
the four simulator files below; against the fixed tree, 0 in 39 files. Pixel samples from
`scripts/shoot-grub.mjs` at 2560x1440, before/after on the same entry list.

| # | Layer | Was | Now | Evidence |
|---|---|---|---|---|
| L36 | GRUB `theme.txt` | sub-lines and footer `#BCC3CE`, captions `#B7D4B7`, section labels `#C0E3C0` (three non-token greys/greens) | `accent_hi` #C0E3C0 / `accent` #A6C9A6 / `text` #F8F8F8 only; ladder 19.8 / 15.0 / 11.5:1 on base | lint: 13 hex hits gone; own read of the sample |
| L37 | GRUB pixmaps | `select_*.png` alpha 36/255 wash (0.14 baked); `menu_*` edge `#7A7B80`; `accent_line` `#BEE6BE` | `select_fill` composite token #272C2A opaque + 4px accent stroke; menu edge `border_strong` 2px on `surface_alt`; line `accent` | `magick -unique-colors`: alpha 1..1 on all 13; sample fill (39,44,42), stroke (166,201,166), panel edge (94,94,96) fill (18,18,22) — was edge (0,0,0) fill (31,32,40) |
| L38 | GRUB generator | `generate-menu.sh` hard-coded four hexes | reads `--ig-surface-alt/border-strong/accent/select-fill` from `tokens/out/css-vars.css`, fails closed on a missing token | rerun reproduces the committed PNGs byte-for-byte |
| L39 | Simulator sage preset | manifest listed stale `menu_bkg_*`; canvas never loaded the real 9-slices, painted its own tint + black 1px border + rgba(0,0,0,.55) glyph shadow | manifest = real `menu_*`/`select_*`/`accent_line`; `GrubScreen.svelte` draws the pixmaps via `drawNineSlice`, strokeRect fallback only when a slice is missing; glyph shadow gone | `sync-grub-parity.sh` "manifest covers all theme.txt references"; grub snapshot regenerated and read |
| L40 | Simulator `/grub` route | aside gradient; bezel 40px blurred rgba shadow + two indigo gradients; focus ring rgba .4; eight off-token greys; 1px `#1A1B1D` inputs | flat `surface_alt` bezel, 2px `border_strong`, hard offset shadows; inputs 2px; active row = accent border; radius 0 | lint 22 hits gone; snapshot read |
| L41 | Simulator shared | `inkPanel.ts` shadow rgba .9; `global.css` `.ig-input` 1px + `#FFFFFF` focus; vscode palette `rgba` layered shadow; palettes ambient gradients; `nb-core.css` chart hues | opaque shadow tokens; 2px `border_strong`, focus = `text`; `background-image: none`; chart slots on drift-allow (data hues on a static specimen) | lint 0; `bun run check` 0 errors; vitest 20 passed |
| L42 | Tokens | `[shadow]` shipped `hairline`, `accent_glow`, `accent_glow_lg` (rgba, 24px blur), zero consumers; codegen leaked `[shadow.klassy]` dict into CSS | removed; codegen skips subtables; new `select_fill = ["accent", 0.14, "surface_alt"]` composite | codegen OK; `check-palette-drift.sh` clean; 19 `tokens/out` files regenerated |

Playwright: 44 passed / 5 skipped after refreshing the `grub` and `claude-code` snapshots (the
latter shifted ~1px from the 2px `.ig-input` border) and repointing the `scopes` focus-ring
expectation from white to `text` rgb(248,248,248). The 5 skips predate this pass.

Residue that is intentional and stays: `background.jpg` 140px black edge feather (overscan
safety, outside the 96px safe area); GRUB gfxmenu default literals `#ffffff`/`#cccccc` in the
canvas (drift-allow: they are GRUB's defaults, not ours); `/density-test` 1px site-native fixtures
(drift-allow: the density opt-in is measured against them); `/palettes` hex exhibits (lint exempt);
legacy unreferenced GRUB assets (`card_*`, `terminal_box_*`, `progress_*`, `spin_*`, …) untouched.

Not verified in this pass: real GRUB render (`sync-grub-parity.sh --deploy` not run, needs sudo
and a reboot); the simulator is a web approximation of gfxmenu's 9-slice scaling.

### Addendum, same day: GRUB theme switched to `orchid_light`, light card model

User direction after L36–L42 landed, in two steps: (1) GRUB should be light mode in the orchid
variant the laptop ran; (2) light mode as neobrutalism.dev draws it - white page, coloured
forward-facing cards - and the black feather around the safe area stays. Implemented as one
switch, not a retype: `theme.txt` carries a `# variant: orchid_light` header, and
`generate-menu.sh`, `generate-background.sh` and `check-ink-contract.py` all read it and take
their token set from `tokens/out/css-vars.<variant>.css`. The menu generator branches on the
variant's base luminance (the `[on_light]` threshold, 0.179): dark bakes the L37 panel; light
bakes the card below. New composite token `card_fill = ["accent", 0.45, "surface"]`.

| Role | Token | Hex | Contrast |
|---|---|---|---|
| page / `desktop-color` | `base` | #FAFAFC | — |
| headline, `item_color` | `text` | #23262C | 14.5:1 on base, 7.4:1 on the card |
| sub-line, footer, `selected_item_color` | `accent_hi` | #692E80 | 8.8:1 on base, 4.5:1 on the card |
| section label, caption, key hint, accent line | `accent` | #7F4995 | 6.1:1 on base |
| boot menu card fill | `card_fill` (accent 0.45 over surface) | #C5ADCF | 1.96:1 lift off base |
| card edge 2px, hard shadow 4px, selection stroke 4px | `[on_light] border` / `ink` | #000000 | 10.3:1 on the card |
| selected row interior | none (alpha 0) | — | card shows through: Tier C, outline not fill |
| background brackets / ticks | `accent`, `accent_alt`, `positive` | #7F4995 / #9563AB / #008154 | edge decoration only |

Shadow in a 9-slice: GRUB pads each side by the W/N/E/S slice's own size and scales the corners
to the pads they meet, so `menu_e` is 6x1 and `menu_s` 1x6 (2px edge + 4px shadow), `menu_se`
6x6 solid, `menu_ne` 6x2 and `menu_sw` 2x6 with the shadow region transparent. The shadow starts
2px early on the right column and bottom row (the e/s slices stretch uniformly); at 2560x1440
that is below what the eye resolves. `simulator/src/lib/theme/nineSlice.ts` pads the same way.
Canvas samples at 2560x1440: edge (0,0,0) at 96,470; fill (197,173,207) at 200,600; right shadow
(0,0,0) at 2459..2463,900; bottom shadow (0,0,0) at 130,1268; page (250,250,252) at 300,200.

Residue, intentional: `background.jpg`'s 140px black edge feather (a ramp, on a light page a
visible dark frame) stays at the user's explicit request; it lives outside the 96px safe area.

Lint: 0 violations / 39 files against the orchid_light set plus `[on_light]` (allowed only when the
GRUB variant's base is light; transparent PNG pixels are flattened onto a sentinel and ignored).
Pixmaps: 12 slices, alpha in {0, 255} on all, opaque colours ⊆ {#000000, #C5ADCF, #7F4995}. OS
icons are dark inks (navy, green, red, blue) and stay legible on the light page. Drift guard:
COLOUR now skips the GRUB theme's declared variant under `share/grub-theme/` only; self-test
grew case 7 (a foreign variant's accent in theme.txt is drift) and its working-tree replay now
uses `git diff --binary`, without which any re-baked PNG broke the harness. Simulator preset `sage`
(the path) displays as "Orchid Ink Light"; the install path `/boot/grub2/themes/sage-ink` keeps
its legacy name. Playwright 44 passed / 5 skipped after refreshing the grub snapshot. Still not
deployed to `/boot`.
