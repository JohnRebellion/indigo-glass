# Review request: adding a touch/responsive axis to a token-generated CSS theme

Reviewing a working system, not a proposal. Assume competence. Skip generic advice
("use media queries", "test on devices", "mobile-first"). I want the failure modes
and wrong assumptions a careful outside reviewer sees.

## The system

A personal design system ("Sage Ink") authored once as TOML tokens. `tokens/codegen.py`
emits per-layer artefacts; `scripts/check-palette-drift.sh` fails the build when a
layer's literals diverge from the tokens. Design language is FIXED and not up for
review: opaque surfaces only, radius 0, colour-as-elevation, hard offset shadow
(zero blur), no glass/gradient/squircle, exactly two font weights (500/700).

Generated CSS artefacts that projects consume:

- `tokens/out/css-vars.<variant>.css` — the real theme API. Emits colour AND the full
  spacing + type scale as `--ig-*` custom properties.
- `tokens/out/css-theme.<variant>.css` — light/dark pair via `prefers-color-scheme`.
- `tokens/out/density.css` — opt-in compact rules, gated on a `.ig-density-on` class.
- `web/app.css.example` — Tailwind v4 `@theme` drop-in, neobrutalism.dev schema.

Hand-written themes for host apps: Obsidian, Vencord (Discord), Spicetify (Spotify),
VSCode, GTK3/4.

## Measured state, 2026-09-15

`pointer: coarse`, `any-pointer`, `hover: none`, and any target-size rule:
**zero occurrences in the entire repository.** (One unrelated `touch-action: none`
on a slider.)

`@media` count per shipped theme file:

| File | `@media` |
|---|---|
| `tokens/out/css-vars.sage.css` | 2 — `color-gamut: p3`, `prefers-reduced-motion` |
| `tokens/out/css-theme.orchid.css` | 1 — `prefers-color-scheme: light` |
| `tokens/out/density.css` | 0 |
| `web/app.css.example` | 0 |
| `obsidian/Indigo Glass/theme.css` | 0 |
| `vencord/indigo-glass.theme.css` | 0 |
| `spicetify/Themes/indigo-glass/user.css` | 0 |
| `vscode/css/claude-code-indigo.css` | 0 |
| `config/gtk-theme/SageInk/gtk-3.0/gtk.css` | 0 |

The spacing scale, from `[spacing]` in the tokens file — one fixed set, no variants:

```toml
pad_xs=2  pad_sm=4  pad_md=6  pad_lg=10  pad_xl=16
gap_xs=2  gap_sm=4  gap_md=8  gap_lg=12  gap_xl=20
button_pad_y=4   button_pad_x=10   icon_button_pad=4
input_pad_y=4    input_pad_x=8
list_row_pad_y=3 list_row_pad_x=8  list_row_gap=1
sidebar_item_pad_y=3  sidebar_item_pad_x=8
```

The type scale, `[type.scale]` — comment in-file reads "Anchor at body=11pt for
Nobara desktop":

```toml
ratio=1.2  anchor_pt=11
xs_pt=8  sm_pt=9  md_pt=11  lg_pt=13  xl_pt=16  xxl_pt=19  hero_pt=23
# roles: toolbar_pt=10  smallest_pt=9  caption_pt=9
```

`[a11y]` contains `focus_outline_width_px=2`, `reduce_transparency_opacity`,
`reduce_motion_duration_ms`. **No target-size token exists.**

`density.css` emits `--ig-density-button-pad-y: 4px` etc. and applies them via
`.ig-density-on button { padding: … }`. It is the system's only "space utilisation"
lever and it only ever makes things *tighter*.

Of the hand-written host-app themes, **Obsidian is the only one whose host has a
first-class mobile app** (iOS/Android, where community themes apply and the app sets
`.is-mobile` / `.is-phone` / `.is-tablet` on body). The Obsidian theme has zero
`@media` and zero mobile-class selectors. Vencord/Spicetify/VSCode/GTK are desktop-only.

## What I propose

The responsive/touch dimension is a **missing axis in the token schema**, not a
missing stylesheet. So:

1. Add a coarse-pointer override block to the tokens file — e.g. `[spacing.coarse]`
   and a touch type anchor — plus `[a11y] target_size_px = 24` (WCAG 2.2 SC 2.5.8
   Level AA minimum) with a comfortable value of 44.
2. Have `emit_css_vars` emit an `@media (pointer: coarse)` block that redeclares the
   affected `--ig-*` properties — the exact mechanism the emitter already uses for
   `color-gamut: p3` and `prefers-reduced-motion`. Every consumer then inherits touch
   sizing without a single call-site change.
3. Add `@media (pointer: coarse)` escape to `density.css` so opt-in compaction cannot
   drive a target below the floor on touch.
4. Expose the spacing and type scale in `web/app.css.example`'s `@theme` block (it
   currently exposes only colour, radius, shadow offsets and font weights, so a
   consuming project invents its own spacing and the system has no opinion).
5. Give the Obsidian theme `.is-phone` / `.is-mobile` overrides.
6. Extend `check-palette-drift.sh` so the new axis is guarded like the colour axis.

## Response contract — answer exactly these, numbered, in order

1. **Is `@media (pointer: coarse)` the right gate for this**, given the artefact is a
   *token* file consumed by unknown downstream projects? Name what it gets wrong.
   Consider hybrid devices (touchscreen laptop, Surface, tablet+trackpad), where
   `pointer: coarse` is true but the user is driving a mouse — and the reverse.
   What would you gate on instead, and what does that cost?
2. **Attack the "redeclare `--ig-*` inside a media query" mechanism specifically.**
   What breaks for a downstream consumer that reads these tokens at build time
   (Tailwind `@theme`, SCSS `scss-vars.*.scss`, the JSON token export) rather than at
   runtime? The same tokens are emitted to SCSS and JSON from the same source.
3. **Is a px-valued spacing scale the actual problem?** The scale is 2/4/6/10/16 px
   fixed. Argue for or against moving to `rem`, or to a fluid `clamp()`, given: a
   desktop anchor of 11pt, two font weights, radius 0, and a drift guard that compares
   emitted literals against token values.
4. **The 24px floor.** WCAG 2.2 SC 2.5.8 AA is 24×24 CSS px; Material says 48dp,
   Apple 44pt. `button_pad_y=4` with an 11pt label yields roughly a 23px control.
   Is raising the floor at the *token* level right, or does it belong in each
   consumer? What breaks in the desktop layers (GTK, Konsole, KDE, VSCode) if the
   shared spacing tokens move?
5. **What have I misidentified as in-scope or out-of-scope?** Specifically challenge
   "Vencord/Spicetify/VSCode/GTK are desktop-only, therefore excluded", and challenge
   treating `density.css` as the space-utilisation lever.
6. **What am I not asking that I should be?** One item, the most consequential.

Be specific and terse. Cite exact token names, properties and values where you assert
a fix. Write "unknown" rather than inventing.
