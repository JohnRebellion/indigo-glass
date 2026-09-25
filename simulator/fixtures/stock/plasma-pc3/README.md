# plasma-pc3 — default image-set SVGs for the PlasmaComponents 3 controls

Stock (and fallback) images for the `plasma` layer of `/components/`
(`simulator/src/lib/components/layers/plasma/paint.ts`).

| File | Consumer (PC3 QML, libplasma 6.7.4) |
| :--- | :--- |
| `default/widgets/button.svg` | Button (`private/RaisedButtonBackground.qml`, `private/ButtonFocus.qml`), CheckIndicator box |
| `default/widgets/lineedit.svg` | TextField (`TextField.qml:190-225`) |
| `default/widgets/checkmarks.svg` | CheckIndicator check mark (`CheckIndicator.qml:40-45`) |
| `default/widgets/tabbar.svg` | TabBar highlight / TabButton background |

Origin: `gunzip` of `/usr/share/plasma/desktoptheme/default/widgets/{button,lineedit,checkmarks,tabbar}.svgz`
on the Fedora 44 host, `rpm -qf`: `libplasma-6.7.4-1.fc44.x86_64`
(upstream source: https://invent.kde.org/plasma/libplasma,
`src/desktoptheme/breeze/widgets/*.svg`, installed as the `default` image
set; tag v6.7.4). Copied 2026-09-25. Same package and
host as `../plasma-theme/` (see its SOURCE.txt); kept separate so the
`/desktop/plasma-theme/` model's glob, and its coverage, do not change.

Neither `breeze-dark` nor `SageInk` ships these four files, and
`default/translucent/` and `default/opaque/` carry no copies of them, so KSvg
(`ImageSet::imagePath`, fallback image set `default`) renders exactly these
in both lanes; only the theme's `colors` file behind them differs.

Licence: LGPL-2.0-or-later (KDE VDG). Do not edit: this is a frozen upstream copy.
