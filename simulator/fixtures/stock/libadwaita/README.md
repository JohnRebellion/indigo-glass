# Stock fixture — libadwaita's compiled widget stylesheet

`gtk.css` is libadwaita **1.9.3**'s own compiled stylesheet, byte for byte,
as GTK4/libadwaita apps load it at runtime. Extracted 2026-09-25 on the
Fedora 44 host:

    rpm -q libadwaita    -> libadwaita-1.9.3-1.fc44.x86_64
    gresource extract /usr/lib64/libadwaita-1.so.0 /org/gnome/Adwaita/styles/gtk.css > gtk.css

sha256 `be8ce3333fbf074d45b90d520d5a621ee59ba3938394a0b9e934c73bd8963856`,
431 418 bytes. Upstream source: https://gitlab.gnome.org/GNOME/libadwaita,
tag `1.9.3`, `src/stylesheet/` (SCSS compiled at build time into this file).
Licence: LGPL-2.1-or-later (libadwaita).

Why it exists beside `../gtk-user-css/adwaita-dark.css`: that fixture is the
named-colour palette only (`@define-color` lines). A component page has to
know how libadwaita *paints* a button, popover, entry or scrollbar — which
colour each widget node takes — and that lives only in the widget rules of
this file. Used by `src/lib/components/layers/gtk4/`, which resolves the dark
branch (`@media (prefers-color-scheme: dark)`) the way libadwaita does for a
dark session, and takes the runtime-injected accent default
(`accent_bg_color` / `accent_fg_color`, not compiled into this file) from
`../gtk-user-css/adwaita-dark.css`.

Do not edit. Refresh by re-running the extract command against a newer
libadwaita and updating the version, hash and date above.
