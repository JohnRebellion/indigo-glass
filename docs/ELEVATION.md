# Elevation

Sage Ink has no blur, so depth is a hard offset shadow or nothing. This page
says which elements get the offset, how far, and how the rule is measured.
It supersedes the 2026-09 practice of putting `[shadow].ink` on every action
button, which the 2026-09-24 quality pass measured as noise: on the GitHub
mock 16 of 20 buttons were lifted, so none of them read as the action.

## The scale

| Level | What sits there | Offset | Edge |
| :--- | :--- | :--- | :--- |
| **0 - resting** | secondary buttons, cards in grids and rows, inputs, tags, chips, tabs, segmented controls, accordion items, alerts, drawers, the current page in a pagination | none | 2px `border_strong` where the fill needs a silhouette |
| **1 - primary** | the one accent-filled button of a group; danger and warning buttons on their own fill | `[shadow].ink` (4px) | 2px ink (`base`) |
| **2 - transient** | menu, popover, tooltip, toast, flag, command palette, autosuggest | `[shadow].ink` (4px) | 2px `border_strong` |
| **3 - modal** | dialog, alertdialog, sheet | `[shadow].ink_lg` (7px) | 2px `border_strong` |

Feature tiles and hero cards (`nb-card`, `nb-image-card`, the home page's
`.ig-card`) keep the offset: they are the composition, not a control. See
`docs/PHILOSOPHY.md` and `simulator/e2e/scopes.spec.ts`.

## The rule that decides a button

A button is primary when its fill is above the `[on_light]` threshold
(relative luminance 0.179). That is the same line that decides the label
colour, so the two properties travel together:

- fill above the threshold: level 1, ink label, `4px 4px 0 0 accent_alt`,
  collapses on `:active` with `translate(4px, 4px)`, hover moves the fill to
  `accent_hi` and nothing else;
- fill below it: level 0, no offset, no lift on hover or press.

Danger and warning buttons keep the site's own red or amber fill. Every such
fill is above the threshold, so they take the ink label and the offset like a
primary. GitHub's danger button rests on the neutral fill with red text, so it
is level 0 there.

Nothing else about a button is inferred from its class name. A site that
paints a "tonal" or "filled" secondary button light has, by this rule, made it
primary; repaint it to a dark fill if it should read as secondary.

## One lift per group

Adjacent inked elements need at least the offset between them, or the upper
one's shadow lands on the lower one's fill. `[shadow].ink` is 4, so `gap_sm`
(4) is the floor between inked elements and `gap_md` (8) the comfortable one;
`ink_lg` is 7, which `gap_md` clears.

A control made of several buttons is one group with one lift. A primary split
button (Outlook's "New mail" plus its chevron) puts the edge and the offset on
the wrapper; the halves are flat inside it with a single ink divider. The
contract treats a flat half inside a lifted wrapper as lifted.

## Divergences from neobrutalism.dev

The reference lifts more than this scale does. The simulator's
`nb-*` components mark each place with a `DIVERGENCE` comment:

- `nb-button--neutral`, `nb-alert`, `nb-accordion-item`, the current
  `nb-pagination-link` and `nb-carousel-slide` are level 0 here;
- `nb-alert--destructive` takes an ink label: the negative fill is above the
  `on_light` threshold.

## Tokens moved with this pass

Two shared tokens were lifted because the measurement failed on them
everywhere, not per site:

| Token | Before | After | Why |
| :--- | :--- | :--- | :--- |
| `text_muted` | L 0.551 `#6B7280` | L 0.62 `#7F8695` | 4.14 / 4.01 / 3.87:1 on base / surface / surface_alt; now 5.48 / 5.31 / 5.11 |
| `negative` (and ANSI `red`) | L 0.6124 `#ED254E` | L 0.63 `#F42E53` | 4.43:1 on surface_alt; now 4.76, and 5.10:1 for an ink label on the fill |

The reading variant's `text_muted` stays at L 0.65 on its own ladder.

## How it is enforced

- `simulator/e2e/sites.spec.ts` - per site: every light-filled button is
  lifted with an ink label, no dark-filled button is lifted, no two inked
  elements collide, overlays carry their level's offset.
- `scripts/style-check/live-contract.mjs` - the same checks on the real site.
- `simulator/e2e/quality.spec.ts` - measure-only: contrast pairs, control
  heights, inked elements by kind, buttons lifted / total, collisions. It
  writes `simulator/test-results/quality/REPORT.md`; read it after any
  change to a site file or the simulator's own CSS.
- `scripts/style-check/structure-blocks.py` - generates every site file's
  structure section from one description per site, so the rule cannot drift
  between files. Run it, then `python3 tokens/codegen.py` (the Stylus import
  bundles embed the site files), then the drift guard.
