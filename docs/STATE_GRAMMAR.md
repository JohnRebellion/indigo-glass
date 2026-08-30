# State grammar: fill vs. outline vs. alpha

Sage Ink's answer to "how does a clickable thing show it's focused, hovered,
or selected" — and why the codebase enforces it with a real checker
(`scripts/check-palette-drift.sh --alpha`), not just convention.

## The four principles

1. **No translucent glass edge.** A wash that fakes a floating layer over a
   surface is the one remaining artefact of the pre-ink material language.
   Sage Ink is opaque, flat fields, hard offset shadow — see
   `tokens/indigo-glass.tokens.toml` `[meta] material_style`.
2. **Every colour a real token.** A translucent value bakes an off-palette
   composite that exists nowhere in the token file and can't be audited.
   `check-palette-drift.sh --colour` only catches literal hex; alpha
   composites hide from it entirely, which is why `--alpha` exists.
3. **Fill means identity, outline means state.** A badge, tag, or button
   tells you *what a thing is* and keeps its opaque fill. A list row, tab,
   or menu item's on-select state tells you *what's happening to it right
   now* and gets a solid-colour outline instead of a filled wash.
4. **One rule survives every backend.** GRUB 9-patch PNG, Plasma FrameSVG,
   GTK CSS, VSCode JSON, Vencord/Spicetify CSS-in-JS, a `<canvas>` preview -
   a 2px solid stroke reads identically on all of them; a translucent fill
   needs per-backend contrast retuning against whatever surface it sits on.

## Tier table

| Tier | What | Verdict |
|---|---|---|
| **A - content** | Alpha painted *behind or within running content*: editor/terminal selection, find-match, word/line highlight, diff/merge regions, indent guides, whitespace dots, fold indicators, drag-drop target previews, a modal scrim | **Permanently exempt.** The alpha *is* the medium - you can't outline a highlighted word mid-sentence, and a scrim must show the backdrop through it by definition. Named in `[alpha.exempt].key_fragments` in the token file. |
| **B - chrome** | Hairline dividers between panels/widgets (`border`, `border_strong`) | **Composite to opaque.** `[palette.composite]` in the token file resolves these at codegen time - see `tokens/codegen.py::_composite_hex`. |
| **C - on-select state** | A clickable list row / tab / menu item / nav entry currently selected or focused | **Outline, not fill.** Solid-colour stroke, not translucent background. Colour is adaptive: black on light surfaces, white/near-white on dark ones (matches the reference's own `--ring` token, which is literally `oklch(0% 0 0)` in light mode and `oklch(100% 0 0)` in dark). |
| **D - identity fill** | Badges, tags, validation boxes, scrollbar thumbs, status chips | **Keep the fill, make it opaque.** Prefer a real accent-step token (`accent_alt`/`accent_hi`, i.e. `#89A889`/`#C0E3C0`) over a computed alpha blend where the fill is meant to look "solid and visible" (e.g. a scrollbar thumb); use an opaque composite where the fill is meant to look "pale and subtle" (e.g. a tag chip). |

A **transient, non-scrollbar hover wash** (a row previewing its own click
before you commit to it) is allowed to stay a translucent tint regardless of
tier - established throughout the codebase and encoded in the checker as an
explicit exception (`hover` in context, except when `scrollbar`/`slider` is
also present - a scrollbar thumb's hover state is Tier D, not a preview).

## Per-backend mapping

| Backend | Outline mechanism |
|---|---|
| CSS (GTK, browser Stylus, Spicetify, Vencord) | `outline: 2px solid <color>; outline-offset: 2px;` (detached, matches the reference's `ring-2 ring-offset-2`) |
| VSCode theme JSON | Dedicated `*Outline`/`*Border` keys where they exist (`list.focusOutline`, `menu.selectionBorder`, `tab.activeBorderTop`, ...); where none exists (`quickInputList`, `peekViewResult`, `statusBarItem`), fall back to reducing the fill toward a neutral, non-accent wash - documented per-key, not a silent gap |
| KDE Plasma colour scheme | `DecorationFocus` role (distinct from `Colors:Selection`, which stays a genuine text-selection fill) |
| Plasma FrameSVG (`viewitem.svg`) | Only the `*-center` tile's opacity zeroed per state; the 8 corner/edge tiles already form a complete border frame using the file's own existing geometry |
| GRUB (9-patch PNG) | `select_c/e/w.png` are transparent fill, 2px stroke outline only |
| Discord (Vencord) | Can only override the *value* of a variable Discord's compiled stylesheet already reads as `background-color` - no stable, non-obfuscated selector exists to attach a real `outline` to. Documented limitation, not solved: reduced toward barely-there instead of a bold fill. |
| Canvas (`GrubScreen.svelte` preview) | `ctx.strokeRect(...)`, no `ctx.fillRect(...)` for the selected-row treatment |

## Enforcement

`scripts/check-palette-drift.sh --alpha` (part of the default full run) flags
any `rgba(...)` with alpha < 1 or `#RRGGBBAA` hex outside the Tier A
allowlist and the hover exception. Escape hatch: a trailing `# drift-allow`
comment on the same line, with a reason - same convention as the existing
colour/material checks. A genuinely new Tier A case belongs in
`[alpha.exempt].key_fragments`, not a scattered `drift-allow`.
