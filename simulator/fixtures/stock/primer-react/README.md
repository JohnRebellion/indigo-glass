# Stock fixture — Primer React 38.40.0 (`@primer/react`), ActionList

Fetched 2026-09-25 from the npm package as published, unmodified:

| File | Origin | sha256 (first 12) |
| :--- | :--- | :--- |
| `ActionList-1ff5220c.css` | https://unpkg.com/@primer/react@38.40.0/dist/ActionList/ActionList-1ff5220c.css | 0d5224456614 |

Licence: MIT (GitHub Inc.). Upstream source: https://github.com/primer/react.

Used by `simulator/src/lib/components/layers/github/` for the one ActionList
state the `/sites/github/` mock does not model: a keyboard-focused menu item
(`.prc-ActionList-ActionListItem-So4vC:…:focus-visible`, an outline in
`--focus-outline-color, var(--focus-outlineColor)`). Only `:focus*` rules are
extracted (`layers/_sites/css.ts`, `pickRules` + `isFocusRule`). The hashed class suffix
(`-So4vC`) is this build's; the specimen carries it so the upstream rule
matches, and github.user.css selects `[class*="prc-ActionList-ActionListItem"]`
either way.
