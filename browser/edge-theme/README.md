# Sage Ink — Edge Theme Extension

Forces Edge chrome (frame, toolbar, tabs, NTP) to render at Sage Ink token values. Eliminates the visual seam between KWin/Klassy titlebar (`#121216`) and Edge nav bar (default Chromium dark `#1C1D1F`).

Unlike Stylus/Dark Reader (see `../README.md`), this one loads unpacked directly from this repo folder — a repo edit reaches Edge on the next reload, no push or manual re-import required. See "Updating" below for the exact step.

## Install (auto-load, per profile — 2026-08-30)

Each profile launcher (`~/.local/bin/edge-*`) passes
`--load-extension=~/projects/indigo-glass/browser/edge-theme/indigo-glass`
to `microsoft-edge-stable`, so the theme loads and applies automatically on
every launch — nothing to do in `edge://extensions/` at all. Covers all 4
profile wrappers actually in use (the 3 below plus Tyremax, missing from
this doc until now):

- `edge-mtusa` (Asia/Manila → Chicago auto-switch)
- `edge-sida4` (Brisbane)
- `edge-personal` (Manila)
- `edge-tyremax` (Brisbane, `--profile-directory="Profile 1"` inside the sida4 user-data-dir)

`--load-extension` auto-enables Developer Mode extensions for that launch
only, which is why Edge shows a small "Disable developer mode extensions"
bar on startup — cosmetic, dismissible, expected for an unpacked theme.

Pre-2026-08-30 backups of the unmodified wrappers: `~/.local/bin/edge-*.bak-20260830`.

### If you ever need the manual path instead (e.g. testing without the flag)

1. Open `edge://extensions/`
2. Toggle **Developer mode** (top right) ON
3. Click **Load unpacked**
4. Select folder: `~/projects/indigo-glass/browser/edge-theme/indigo-glass/`
5. Theme applies immediately. Restart Edge if frame still mismatched.

## Color mapping

| Token             | Hex       | RGB            | Edge slot         |
| ----------------- | --------- | -------------- | ----------------- |
| `surface_alt`     | `#121216` | `18,18,22`     | frame, toolbar    |
| `surface`         | `#0D0D10` | `13,13,16`     | frame_inactive    |
| `sidebar`         | `#0A0A0D` | `10,10,13`     | frame_incognito   |
| `base`            | `#07080A` | `7,8,10`       | omnibox, NTP bg   |
| `text`            | `#F8F8F8` | `248,248,248`  | all foreground    |
| `text_muted`      | `#6B7280` | `107,114,128`  | inactive tab text |
| `accent_hi`       | `#C0E3C0` | `192,227,192`  | NTP links         |

`theme.tints.buttons` recolors Edge's own monochrome toolbar-button icons via
an HSL tint (Edge's theme API only accepts a tint, not a literal color, for
this slot). It must be kept as `accent_hi`'s own HSL, not copy-pasted from
another surface — this drifted silently for a full palette migration (was
still indigo's `#818CF8` HSL after the sage rebrand, since nothing greps a
`[H, S, L]` triple for palette drift the way a hex string can be). Recompute
with `colorsys.rgb_to_hls()` whenever `accent_hi` changes.

## Verification

After install, the Klassy titlebar (`#121216`) and Edge nav bar should render as a single seamless surface. Diff with `gpick` or KColorPicker on the boundary row to confirm zero hue shift.

## Updating

Edit `manifest.json` → bump `version` → in `edge://extensions/` click the refresh icon on the unpacked theme card. No reload needed.

## Why not a packed .crx

Packed themes require Edge Add-ons signing for distribution. Unpacked + Developer mode is friction-free for personal use and version-controllable in git.
