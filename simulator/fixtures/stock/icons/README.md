# Icon theme fixtures (/desktop/icons/)

Copied from this host (Fedora 44, /usr/share/icons) on 2026-09-25. Symlinks
are dereferenced; `manifest.json` records, per icon and size, the path the
freedesktop lookup resolved, the symlink target (`real`), and the owning
package from `rpm -qf`:

| Tree | Package | Licence (rpm `%{LICENSE}`) |
| :--- | :--- | :--- |
| `breeze-dark/` | `breeze-icon-theme-6.29.0-1.fc44.noarch` | LGPL-2.1-or-later AND LGPL-3.0-or-later AND CC-BY-SA-4.0 |
| `papirus-dark/*/actions`, `16x16/places` (symbolic, recolourable) | `papirus-icon-theme-dark-20250501-2.fc44.noarch` | GPL-3.0-only AND CC-BY-SA-4.0 AND LGPL-3.0-or-later |
| everything else under `papirus-dark/` (coloured folders, mimetypes, emblems, 32/48 status) | `papirus-icon-theme-20250501-2.fc44.noarch` (Papirus-Dark symlinks into Papirus) | GPL-3.0-only AND CC-BY-SA-4.0 AND LGPL-3.0-or-later |

The per-file owner is in `manifest.json` (`package`); the table is a summary of it.

Selection: 16 icon names that exist in both themes (places, mimetypes,
actions, status, emblems), at 16/22/32/48 px. Each size uses the file the
theme's `index.theme` resolves for that size (exact `Size` match first, else
the closest directory — so e.g. Breeze `edit-copy` at 32 is `actions/24`, and
that is recorded as `dirSize` 24). Plus `papirus-dark/48x48/places/folder-{blue,green,grey,teal,darkcyan,bluegrey}.svg`:
the files `papirus-folders -C <colour>` would repoint `folder.svg` at (on this
host `folder.svg -> folder-blue.svg`, the Papirus default).

The theme choice itself is not in this folder: stock reads `[Icons] Theme`
from `../kde-colors/kdeglobals` (breeze-dark, the Breeze Dark global theme
default), ours from `config/kdeglobals.snippet` (Papirus-Dark).

Regenerate deliberately (the lookup script lived in /tmp and is not tracked);
say so in the commit.
