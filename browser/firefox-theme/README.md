# Sage Ink — Firefox theme

A static theme, with no code and only `theme.colors`, holding Sage Ink token
values. The hexes are hand-typed tokens from `tokens/out/css-vars.css`, so the
drift guard checks them like any other layer. Change a colour in the TOML,
regenerate, and fix whatever the guard reports here.

## Install

Release Firefox only loads signed add-ons permanently. Pick one route:

- **Try it now (until restart):** open `about:debugging#/runtime/this-firefox`,
  choose *Load Temporary Add-on…*, and pick `sage-ink/manifest.json`.
- **Keep it:** sign it as an unlisted add-on on addons.mozilla.org. Signing is
  free and needs your AMO account, so the maintainer does it by hand:

      cd browser/firefox-theme/sage-ink
      npx web-ext sign --channel=unlisted --api-key=… --api-secret=…

  Then install the `.xpi` it writes. Keep the API key out of the repo.
- Developer Edition or Nightly with `xpinstall.signatures.required=false` will
  also accept a zipped unsigned copy.

## Mapping notes

- The tab strip is `surface_alt`. The selected tab and toolbar share `base`, so
  they read as one plate, and a sage `tab_line` marks the active tab.
- The URL field uses a `border_strong` edge at rest and a `text` edge on focus
  (Tier C: state is an outline, not a fill).
- Popup and sidebar selections are Tier D sage fills with base-ink text.
- Firefox themes cannot draw offset shadows, so the hard ink shadow is absent here.
