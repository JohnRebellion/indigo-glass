# Stock cursor fixtures — Breeze (`breeze_cursors`)

Copied 2026-09-25 from the Fedora 44 / Plasma 6 host, where
`/usr/share/icons/breeze_cursors/` is Plasma's default cursor theme.
Every file below is owned by **breeze-cursor-theme-6.7.4-2.fc44.noarch**
(`rpm -qf` on each resolved target). Licence: GPL-2.0-or-later (Breeze).

`cursors/` holds the compiled Xcursor binaries, copied byte for byte from the
REAL file each name resolves to (`readlink -f`), under Breeze's own file name
plus a `.xcur` suffix. The suffix is the only change: `vite dev` treats a
request for an extensionless path as a JS module and cannot serve it (see
src/lib/desktop/cursor/model.ts); the page strips it back off.
Where the freedesktop / CSS cursor name the page asks for is a symlink in
Breeze, the fixture keeps a relative symlink, so the page resolves names the
same way for both lanes:

| Name asked for | Breeze real file (`readlink -f`) | sha256 (first 12) |
| :--- | :--- | :--- |
| default | default | e00f516cb0ad |
| pointer | pointer | 715bd2ff8ae9 |
| text | text | 115ec2ac80a0 |
| wait | wait (animated, 23 frames) | 43db4d8f14fc |
| progress | progress (animated, 23 frames) | 934b2b5a8e0a |
| crosshair | crosshair | 60fdb6dff8c7 |
| move | dnd-move | 3ceed461bdfa |
| not-allowed | not-allowed | 9e977bd0c674 |
| n-resize | size_ver | e1eb07c90b3e |
| e-resize | size_hor | 4da8230752ca |
| ne-resize | size_bdiag | 82f04f5de862 |
| nw-resize | size_fdiag | c14d9c9cfca1 |
| help | help | 9c31c129160f |
| grabbing | dnd-move | 3ceed461bdfa |

Simplifications: the `.xcur` suffix above; and on the host `grabbing -> closedhand -> dnd-move` is a
two-hop chain; the fixture links `grabbing -> dnd-move` directly (same bytes).

`index.theme` is the theme's own `/usr/share/icons/breeze_cursors/index.theme`,
unchanged.

Not copied: `cursors_scalable/` (the SVG cursors KWin 6 prefers on Wayland).
The page compares Xcursor bitmaps only; see the page's fidelity note.
