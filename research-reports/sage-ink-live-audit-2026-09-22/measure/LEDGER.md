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
