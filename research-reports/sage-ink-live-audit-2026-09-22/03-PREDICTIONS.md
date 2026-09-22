# Predictions — recorded before changes, 2026-09-22

Each is wrong if the threshold is missed.

| # | Change | Prediction | Threshold |
|---|---|---|---|
| P1 | GTK shadows opaque | gtk3-widget-factory button shadow samples #89A889 | exact match (was #7C987D) |
| P2 | GTK borders | button/entry border pixel samples #5E5E60 | exact match (was #121216/#000000-ish) |
| P3 | Selection fg | System Settings selected sidebar label has ≥1 pixel with luminance > 0.8 inside the outline | any; was 0 |
| P4 | Edge manifest | fresh-profile tab strip samples #121216; omnibox within 2/255 per channel of #07080A; NTP background within 2/255 of #07080A | exact / ≤2 / ≤2 |
| P5 | Klassy buttons | close button pixel no longer #910323; no red hue (H 330–30°, S>0.4) in titlebar | none |
| P6 | Ink lint | lint fails on the pre-fix gtk-dark.css and passes on the fixed one | both |
| P7 | check-deployment | Edge theme, Stylus, Dark Reader rows report deployed | 3 of 3 |
| P8 | GitHub/Wikipedia CSS | Playwright render: Code button has 2px #5E5E60 border and 4px hard shadow; no horizontal scrollbar introduced | both |

## Results (2026-09-22)

| # | Result | Evidence |
|---|---|---|
| P1 | PASS | GTK shadow samples #89A889 (`measure/pixels-after.txt`) |
| P2 | PASS | GTK control border samples #5E5E60 |
| P3 | PASS | System Settings selected row: label visible, 2px outline. 135 px above 80% luminance, where there were 0 |
| P4 | PASS (chrome) / LIMIT (omnibox) | frame, tabs and toolbar are exactly #121216. Edge 153 ignores `omnibox_background` (`measure/edge-lift-probe.txt`) |
| P5 | PASS | Buttons are opaque #A6C9A6 with no red. Needed per-button overrides; see LEDGER L18 |
| P6 | PASS | 24 violations in the old file, 0 in all three fixed files |
| P7 | PASS | 5/5 wrapped Edge profiles: exact theme id + Stylus + Dark Reader |
| P8 | PASS | Playwright: GitHub Code/Fork/Star/New issue and Wikipedia search have 2px borders and a 4px hard shadow, no horizontal scroll. The primary border is #07080A by design |
