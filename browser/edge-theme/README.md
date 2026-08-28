# Sage Ink — Edge Theme Extension

Forces Edge chrome (frame, toolbar, tabs, NTP) to render at Sage Ink token values. Eliminates the visual seam between KWin/Klassy titlebar (`#121216`) and Edge nav bar (default Chromium dark `#1C1D1F`).

Unlike Stylus/Dark Reader (see `../README.md`), this one loads unpacked directly from this repo folder — a repo edit reaches Edge on the next reload, no push or manual re-import required. See "Updating" below for the exact step.

## Install (unpacked, per profile)

Edge theme extensions install per profile — repeat for MTUSA / Sida4 / Personal:

1. Open `edge://extensions/`
2. Toggle **Developer mode** (top right) ON
3. Click **Load unpacked**
4. Select folder: `~/projects/indigo-glass/browser/edge-theme/indigo-glass/`
5. Theme applies immediately. Restart Edge if frame still mismatched.

Repeat in each Edge profile launcher you use:
- `edge-mtusa.desktop` (Asia/Manila → Chicago auto-switch)
- `edge-sida4.desktop` (Brisbane)
- `edge-personal.desktop` (Manila)

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

## Verification

After install, the Klassy titlebar (`#121216`) and Edge nav bar should render as a single seamless surface. Diff with `gpick` or KColorPicker on the boundary row to confirm zero hue shift.

## Updating

Edit `manifest.json` → bump `version` → in `edge://extensions/` click the refresh icon on the unpacked theme card. No reload needed.

## Why not a packed .crx

Packed themes require Edge Add-ons signing for distribution. Unpacked + Developer mode is friction-free for personal use and version-controllable in git.
