# Stock fixture — Primer CSS 22.3.1 (`@primer/css`)

Fetched 2026-09-25 from the npm package as published, unmodified:

| File | Origin | sha256 (first 12) |
| :--- | :--- | :--- |
| `base.css` | https://unpkg.com/@primer/css@22.3.1/dist/base.css | bbfd23f55491 |
| `forms.css` | https://unpkg.com/@primer/css@22.3.1/dist/forms.css | 4f226b43fce6 |

Licence: MIT (GitHub Inc.). Upstream source: https://github.com/primer/css.

Used by `simulator/src/lib/components/layers/github/` for one thing the
`/sites/github/` mock (`src/lib/sites/github/stock.css`) does not model:
Primer's own focus paint — `button:focus-visible` in `base.css` and
`.form-control:focus-visible` in `forms.css`, both of which read
`--focus-outlineColor`, the variable `github.user.css` remaps. Only the
focus rules are extracted (`layers/_sites/css.ts`, `pickRules` + `isFocusRule`); nothing
else in these files reaches the page.
