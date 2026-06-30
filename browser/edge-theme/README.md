# Lime Glass — Edge Theme Extension

Forces Edge chrome (frame, toolbar, tabs, NTP) to render at Lime Glass token values. Eliminates the visual seam between KWin/Klassy titlebar (`#1F2028`) and Edge nav bar (default Chromium dark `#1C1D1F`).

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
| `surface_alt`     | `#1F2028` | `31,32,40`     | frame, toolbar    |
| `surface`         | `#1C1C21` | `28,28,33`     | frame_inactive    |
| `sidebar`         | `#18181C` | `24,24,28`     | frame_incognito   |
| `base`            | `#0F0F12` | `15,15,18`     | omnibox, NTP bg   |
| `text`            | `#F8F8F8` | `248,248,248`  | all foreground    |
| `text_muted`      | `#A5A9B2` | `165,169,178`  | inactive tab text |
| `indigo_hi`       | `#818CF8` | `129,140,248`  | NTP links         |

## Verification

After install, the Klassy titlebar (`#1F2028`) and Edge nav bar should render as a single seamless surface. Diff with `gpick` or KColorPicker on the boundary row to confirm zero hue shift.

## Updating

Edit `manifest.json` → bump `version` → in `edge://extensions/` click the refresh icon on the unpacked theme card. No reload needed.

## Why not a packed .crx

Packed themes require Edge Add-ons signing for distribution. Unpacked + Developer mode is friction-free for personal use and version-controllable in git.
