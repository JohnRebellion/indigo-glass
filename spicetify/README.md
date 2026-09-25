# Sage Ink - Spicetify (Spotify desktop)

## Install

```bash
# Install Spicetify if not yet
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh

# Copy theme into Spicetify Themes dir
cp -r Themes/indigo-glass "$(spicetify -c | xargs dirname)/Themes/"

# Activate
spicetify config current_theme indigo-glass color_scheme dark
spicetify apply
```

To revert:
```bash
spicetify config current_theme '' color_scheme ''
spicetify apply
```

## What it does

- 16-key `color.ini` palette (both `[base]` and `[dark]` sections, since
  Spicetify's `color_scheme` config can select either) mapped to Sage Ink
  tokens - see the colour map below
- `user.css` targets Spotify's own DOM: opaque ink cards/context-menu with a
  hard 4px offset shadow (no blur, no soft/translucent shadow anywhere),
  radius 0 on cards/buttons/rows/menu items (Sage Ink's ladder is 0 / 2px /
  9999px only - buttons stay pill-shaped, matching Spotify's own play-button
  shape), compact track-row/library-row padding, sage selection/scrollbar/
  focus ring, ink (not white) play/follow/shuffle button labels
- Hides the in-app upgrade-to-Premium prompts (top bar button + context-menu
  item)
- Carlito body font (uses local install)

## Colour map

| Spicetify key | Sage Ink token | Hex |
|---|---|---|
| main | base | #07080A |
| sidebar | sidebar | #0A0A0D |
| player | surface | #0D0D10 |
| card | surface_alt | #121216 |
| text | text | #F8F8F8 |
| subtext | text_muted | #7F8695 |
| button | accent | #A6C9A6 |
| button-active | accent_hi | #C0E3C0 |
| button-disabled | text_dim | #4B5563 |
| notification | accent | #A6C9A6 |
| notification-error | negative | #F42E53 |
| misc | accent_alt | #89A889 |
| equalizer | positive | #3FFABB |
| shadow | - | #000000 (Sage Ink's [shadow].ink, not a named palette step) |

## Notes

- No blur, no gradient, no translucency anywhere except the one deliberate
  Tier A transient hover wash on track rows - Sage Ink is opaque flat ink
  with colour-as-elevation (hard offset shadows only). See
  `docs/ELEVATION.md`/`docs/STATE_GRAMMAR.md`.
- Neither Spotify nor Spicetify is installed on the machine this theme is
  developed on; verify visually on a host that has both before shipping a
  revision (see `simulator/src/lib/desktop/spicetify/index.ts`'s `live` field
  for the exact install/verify steps).
- `.main-contextMenu-menu` (the context-menu panel) is styled by inferring
  Spotify's own `.main-<Component>-<element>` naming convention from this
  file's already-confirmed `.main-contextMenu-menuItemButton` sibling - not
  independently confirmed against a live client. The search box has no
  confirmed real Spotify selector at all and is left untargeted by this file.
- Spotify publishes no design-token reference for its desktop client, so the
  Sage Ink migration below was checked against third-party Spotify
  brand-colour citations, not an official spec - see
  `simulator/fixtures/stock/spicetify/color.ini`'s header for the exact
  citations and disclosed approximations.

## Previous revision

This file previously described a translucent "Lime Glass" theme (lime accent
hex table, "translucent now-playing bar (rgba(13,13,16,0.85) + 13px backdrop
blur)", "honors `prefers-reduced-transparency: reduce`" as if translucency
were the default). That material language was removed repo-wide 2026-08-28
(see the root `CLAUDE.md` "Other traps" - blur was deliberately dropped from
the whole install path) and `user.css`/`color.ini` themselves have shipped the
opaque Sage Ink values described above since; this README had not been
updated to match until 2026-09-25, and two real defects surfaced during that
update: `subtext` in `color.ini` still carried the stale pre-2026-09-24
`text_muted` hex, and `.main-card-card:hover` in `user.css` carried the
Indigo Glass *variant*'s `surface_alt` (`#1F2028`) instead of Sage Ink's own
(`#121216`) - both fixed in this pass, see `simulator/src/lib/desktop/
spicetify/index.ts` for the full defect list.
