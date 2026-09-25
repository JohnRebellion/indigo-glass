# Sage Ink - VLC 3.x

VLC 3 has no colour-theme file. Its Qt5 window already reads the SageInk KDE
palette through `plasma-integration-qt5`, so most of the theme comes for free.
This layer fixes the three places VLC paints for itself:

| What | Stock | Sage Ink | Where |
|---|---|---|---|
| Seek bar | "shiny" SeekStyle: hardcoded blue `(50,156,255)` gradient | plain slider, accent fill from the palette | `vlc-qt-interface.ini` |
| Volume | "shiny" triangle, green→yellow→red gradient | plain slider, accent fill | `vlc-qt-interface.ini` |
| Fullscreen controller | 0.8 opacity | opaque (`opacity.window_active`) | `tokens/out/vlcrc.ini` |

`tokens/out/vlcrc.ini` also pins `qt-dark-palette=0` (1 replaces the KDE palette
with VLC's own greys) and sets `qt-slider-colours` to four accent stops, so the
shiny volume bar paints flat if someone turns it back on in the toolbar editor.

## Install

`scripts/install.sh` runs this when `vlc` is on `PATH`. By hand:

```bash
python3 tokens/codegen.py            # only if tokens changed
python3 scripts/apply-vlc.py --dry-run
python3 scripts/apply-vlc.py         # quit VLC first; it refuses otherwise
```

Other variants: `--variant indigo` (any `tokens/out/vlcrc.<variant>.ini`).
Flatpak VLC: `--config-dir ~/.var/app/org.videolan.VLC/config/vlc`.

Each run snapshots `vlcrc` and `vlc-qt-interface.conf` to
`~/.cache/sage-ink/backups/`. To undo, copy the snapshot back over the file.

## Why not kwriteconfig6

`vlcrc` repeats section names (`[file]` three times, `[ps]`, `[es]`, `[mp4]`, …).
KConfig merges and reorders them and drops the BOM: a live copy went from 4811
lines to 46. `apply-vlc.py` replaces VLC's own commented default line
(`#qt-fs-opacity=0.800000`) in place and leaves every other byte alone.

## Known limits

- **Rounded button frames.** Klassy is built Qt6-only (`install.sh`,
  `-DBUILD_QT5=OFF`), so VLC 3 falls back to Breeze. That brings Breeze's
  rounded button corners and a groove fill mixed from the accent (`#789179`
  measured, not `#A6C9A6`). Both are opaque. A Qt5 Klassy build would fix both
  for every Qt5 app, not only VLC.
- **Orange cone.** VLC shows its orange cone when nothing is playing. To hide
  it (this also hides album art): `qt-bgcone=0` in `vlcrc`.
- **VLC 4** uses a QML interface with its own theme settings. None of this
  applies to it.
- **Fullscreen opacity on Wayland** is up to the compositor; the key is set
  either way.
