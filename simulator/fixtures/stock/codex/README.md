# Stock fixture — Codex 2.7.0 (`@wikimedia/codex`)

Fetched 2026-09-25 from the npm package as published, unmodified:

| File | Origin | sha256 (first 12) |
| :--- | :--- | :--- |
| `codex.style.css` | https://unpkg.com/@wikimedia/codex@2.7.0/dist/codex.style.css | 298fdd0b8ba6 |

Licence: GPL-2.0-or-later (Wikimedia Foundation). Upstream source:
https://gerrit.wikimedia.org/g/design/codex.

Used by `simulator/src/lib/components/layers/wikipedia/` for what the
`/sites/wikipedia/` mock (`src/lib/sites/wikipedia/stock.css`) does not model:
Codex's focus paint on `.cdx-button` and `.cdx-text-input__input` (it reads
`--border-color-progressive--focus` / `--box-shadow-color-progressive--focus`)
and the checkbox tick (`.cdx-checkbox__icon:before`, drawn in
`--border-color-inverted-fixed`). Only those rules are extracted
(`layers/_sites/css.ts`); nothing else in the file reaches the page. The
fallbacks inside `var()` are Codex's day-mode values — Wikipedia's night
mode supplies its own through the token layer, which the mock carries only
in part, so stock-lane focus colours are the Codex fallback where the mock
declares no token.
