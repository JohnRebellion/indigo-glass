# Making the shipped Sage Ink theme CSS mobile-friendly: Research Report
*Date: 2026-09-15 | Sources: 6 web/docs + 2 cross-model returns + 12 in-repo measurements | Overall Confidence: High*

## Executive Summary

The theme is authored for **one pointer type at one density**, and that is a gap in the
token schema rather than a missing stylesheet. Measured today: `pointer: coarse`,
`any-pointer`, `hover: none` and any target-size rule occur **zero times in the entire
repository**. Every shipped theme file carries **zero `@media`** except
`css-vars.*.css` (two: `color-gamut: p3`, `prefers-reduced-motion`) and
`css-theme.*.css` (one: `prefers-color-scheme`). `[spacing]` is a single fixed px set,
`[type.scale]` anchors at 11pt with the in-file comment "for Nobara desktop", and
`[a11y]` defines `focus_outline_width_px` but **no target-size token at all**.

The right fix is the one the architecture already implies: add a coarse-pointer axis to
`tokens.toml`, emit it through the same `@media` mechanism `emit_css_vars` already uses
for P3 and reduced-motion, and every CSS consumer inherits touch sizing with no call-site
change. Two verified constraints reshape the naive version of that plan: the gate must be
`(pointer: coarse) and (hover: none)`, not `pointer: coarse` alone; and a runtime
`@media` override reaches **CSS consumers only** — `scss-vars.*.scss` and
`json-tokens.json` emit baked literals and are structurally blind to it.

Separately: **Obsidian is the only host-app theme in this repo whose host has a
first-class mobile app**, and it has zero `@media` and zero mobile-class selectors.

## Codebase Context

`tokens/indigo-glass.tokens.toml` is the single source of truth; `tokens/codegen.py`
emits per-layer artefacts; `scripts/check-palette-drift.sh` fails the build when a layer's
literals diverge. The guard currently runs five dimensions — `--colour`, `--material`,
`--alpha`, `--parity`, `--shadow` — and its own header records that the v1 guard "was
reporting clean while three shipped themes were still Lime Glass" because a dimension was
unenforced. That precedent governs the recommendation below.

## Findings

### 1. What the theme actually exposes, measured

FACT (in-repo, 2026-09-15). `tokens/out/css-vars.sage.css` is the real theme API and
emits the full spacing and type scale as custom properties, not just colour:

```css
--ig-pad-xs: 2px;  --ig-pad-sm: 4px;  --ig-pad-md: 6px;  --ig-pad-lg: 10px;  --ig-pad-xl: 16px;
--ig-gap-xs: 2px;  --ig-gap-sm: 4px;  --ig-gap-md: 8px;  --ig-gap-lg: 12px;  --ig-gap-xl: 20px;
--ig-button-pad-y: 4px;      --ig-button-pad-x: 10px;   --ig-icon-button-pad: 4px;
--ig-input-pad-y: 4px;       --ig-input-pad-x: 8px;
--ig-list-row-pad-y: 3px;    --ig-list-row-pad-x: 8px;  --ig-list-row-gap: 1px;
--ig-sidebar-item-pad-y: 3px;--ig-sidebar-item-pad-x: 8px;
```

`@media` count per shipped theme file:

| File | `@media` |
|---|---|
| [tokens/out/css-vars.sage.css](tokens/out/css-vars.sage.css) | 2 — `color-gamut: p3`, `prefers-reduced-motion` |
| [tokens/out/css-theme.orchid.css](tokens/out/css-theme.orchid.css) | 1 — `prefers-color-scheme: light` |
| [tokens/out/density.css](tokens/out/density.css) | **0** |
| [web/app.css.example](web/app.css.example) | **0** |
| [obsidian/Indigo Glass/theme.css](obsidian/Indigo%20Glass/theme.css) | **0** |
| [vencord/indigo-glass.theme.css](vencord/indigo-glass.theme.css) | **0** |
| [spicetify/Themes/indigo-glass/user.css](spicetify/Themes/indigo-glass/user.css) | **0** |
| [vscode/css/claude-code-indigo.css](vscode/css/claude-code-indigo.css) | **0** |
| [config/gtk-theme/SageInk/gtk-3.0/gtk.css](config/gtk-theme/SageInk/gtk-3.0/gtk.css) | **0** |

FACT: grepping `pointer: coarse|any-pointer|hover: none|target-size` across every `.css`,
`.py`, `.toml` and `.svelte` in the repo returns **one hit**, an unrelated
`touch-action: none` on `.nb-slider` in
[nb-core.css:429](simulator/src/lib/nb/nb-core.css#L429).

INFERENCE: `button_pad_y = 4` with an 11pt (~14.7px) label at `line_height.tight = 1.20`
gives a control roughly **23 CSS px** tall — just under the WCAG 2.2 SC 2.5.8 Level AA
minimum of **24×24 CSS px**
([Silktide](https://silktide.com/accessibility-guide/the-wcag-standard/2-5/input-modalities/2-5-8-target-size-minimum/)),
against Material's 48dp and Apple HIG's 44pt
([AllAccessible](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide)).
Arithmetic, not a measurement — worth confirming against a real render before it drives a
token change.

### 2. The gate: `pointer: coarse` alone is wrong

Both reviewing models converged here independently, and it is the clearest correction to
my first draft of the plan.

`pointer: coarse` describes the **primary** pointing device, and `any-pointer: coarse`
describes whether *any* coarse device exists. On a hybrid — touchscreen laptop, Surface,
tablet with a trackpad or stylus — a coarse pointer is present while the user is driving a
fine one. Gating on `pointer: coarse` alone over-applies touch spacing to people using a
mouse; gating on `any-pointer: coarse` alone over-applies it much more widely.

The recommended composite, from both returns:

```css
@media (pointer: coarse) and (hover: none) { … }
```

`hover: none` is the discriminator that hybrids fail — a device with a trackpad reports
`hover: hover` even when it also has a touchscreen. Cost: one extra condition, and the
block does not fire on a touchscreen laptop where a mouse is attached (which is the
correct behaviour, not a miss).

CONTRARIAN, worth carrying: one return argued that for a *token file consumed by unknown
downstream projects*, no media query is fully right, and the system should also expose an
explicit switch the host can set — the Obsidian pattern, where the host already knows. Both
can ship: the media query as the default, a class or custom-property escape hatch for hosts
that know better.

### 3. The mechanism: which consumers a runtime `@media` can actually reach

This is the objection that most changes the plan, and it is **half right** — verified both ways.

**Right for SCSS and JSON.** FACT (in-repo): `tokens/out/scss-vars.sage.scss` emits baked
literals — `$ig-pad-sm: 4px;`, `$ig-button-pad-y: 4px;` — and `tokens/out/json-tokens.json`
emits raw numbers — `"pad_sm": 4, "button_pad_y": 4`. A consumer that resolves these at
build time materialises the desktop value into its output and can never observe a runtime
`@media` block. For those two artefacts the coarse axis must be emitted as **its own
resolved set** (a second SCSS map / a `spacing.coarse` object in the JSON), not as a media
query.

**Wrong for Tailwind.** The review asserted that `@theme` bakes values so the override
would not reach generated utilities. Tailwind v4's own documentation contradicts this for
the `inline` form, which is what [web/app.css.example](web/app.css.example) already uses:
`@theme inline` instructs "utility classes to use the theme variable's underlying value
rather than referencing the variable itself", and the documented theme-switching pattern is
exactly a raw variable at `:root`, overridden under another selector, referenced through
`@theme inline` ([Tailwind CSS — Theme](https://tailwindcss.com/docs/theme),
[Colors](https://tailwindcss.com/docs/colors), via Context7). So a `@media` override of the
underlying `--ig-*` variable **does** reach `bg-*`/`p-*` utilities.

There is a real constraint in the same docs, though: `@theme` "enforces that theme variables
are defined top-level rather than nested under selectors or media queries." So the spacing
tokens cannot be *declared* inside the media block and then picked up by `@theme`. The
required shape is the two-layer pattern the file already uses for colour:

```css
:root { --ig-button-pad-y: 4px; }
@media (pointer: coarse) and (hover: none) { :root { --ig-button-pad-y: 12px; } }
@theme inline { --spacing-button-y: var(--ig-button-pad-y); }
```

### 4. Where the floor belongs — not in the base spacing tokens

Both returns reached the same conclusion by different routes, and the repo's structure
supports it: `[spacing]` is consumed by GTK, KDE, Konsole, VSCode and the Klassy decoration
as well as by the web artefacts. Raising `button_pad_y` from 4 to 6 to clear 24px moves
every control on the desktop by 2px in each direction — that is a redesign of the density
the system deliberately chose, not an accessibility fix.

The shape both returns recommend: leave `[spacing]` alone, add a sibling `[spacing.coarse]`
block with touch values, and add `[a11y] target_size_px` as its own token (24 as the AA
floor; 44 as the comfortable value). Consumers merge the coarse set only under the gate.

CONTRARIAN on the type scale: one return argued the px-valued scale is not the real problem
and that `rem` would be the bigger win, because it tracks the user's root font size and
survives browser zoom. The counter-argument, which I find stronger here: the drift guard
compares emitted literals against token values, host apps (Obsidian, VSCode, GTK) do not
share a root font size, and every hand-written theme is px throughout — so `rem` buys
scalability at the cost of the literal-fidelity guarantee that is the point of the guard.
Verdict: keep px, add the coarse set. `clamp()` was raised and is a poor fit — a fluid value
cannot be compared against a token literal by the drift guard at all.

### 5. Scope challenges from the review

**"Vencord/Spicetify/VSCode/GTK are desktop-only" — partly wrong.** FACT: Obsidian ships a
first-class mobile app and sets `body.is-mobile`, which theme and snippet CSS can target
([Obsidian Forum](https://forum.obsidian.md/t/mobile-only-css-snippet/64355)). The
repo's [obsidian/Indigo Glass/theme.css](obsidian/Indigo%20Glass/theme.css) has zero
`@media` and zero mobile-class selectors — that is a concrete, shippable gap.
`.is-phone` / `.is-tablet` were asserted by the review but **not confirmed** by any source
found; treat `is-mobile` as the safe selector [unverified — single source for the others].

INFERENCE (from the review, not measured): the others are not hermetically desktop —
Linux hybrids and convertibles run GTK with a touchscreen, and `vscode.dev` exists. But the
VSCode artefact here is a custom-CSS injection that does not apply on the web build, and
Spicetify/Vencord patch desktop Electron clients specifically. I read the exclusion as
defensible for those three, with GTK on a convertible the one genuine edge case.

**"`density.css` is the space-utilisation lever" — wrong, and this matters.** FACT: the
`--ig-*` spacing properties are emitted in `css-vars.*.css` and consumed directly by
themes that never load `density.css` and never set `.ig-density-on`. A touch floor applied
only inside `.ig-density-on` would miss every one of them. `density.css` is also
*one-directional* — it only ever tightens. The coarse axis has to live where the base
tokens live.

### 6. The drift guard is the missing enforcement

FACT: `scripts/check-palette-drift.sh` runs `--colour`, `--material`, `--alpha`,
`--parity`, `--shadow`. None of them look at spacing or target size. Both returns
independently flagged this as the most consequential unasked question.

The script's own header is the argument: the v1 guard "was reporting clean while three
shipped themes were still Lime Glass", and the v2 rewrite notes that colour was enforced
while material was "left to diligence" — which is precisely why one migration was thorough
and the other was not. A coarse-pointer axis added without a guard dimension repeats that
exact failure, and the failure mode is invisible (a theme silently keeps 23px targets and
nothing fails).

## Risks & Caveats

- **The 23px figure is arithmetic, not a measurement.** It should be confirmed on a real
  render before it justifies a token change.
- **One review claim was verified false** (Tailwind `@theme` baking defeating the override)
  and is corrected above via Tailwind's own docs. Treat the remaining unverified review
  claims — `.is-phone`/`.is-tablet`, Plasma Mobile and `vscode.dev` reach — with the same
  scepticism until checked.
- **`(pointer: coarse) and (hover: none)` deliberately does not fire** on a touchscreen
  laptop with a mouse attached. If the intent is "bigger targets whenever a finger *might*
  be used", this gate is the wrong one and `any-pointer: coarse` is right — but that
  over-applies to most modern laptops. This is a design decision, not a technical one.
- **Adding a coarse spacing set doubles the spacing surface** the guard, the docs and every
  emitter must keep consistent. That cost is real and lands on `codegen.py`,
  `check-palette-drift.sh`, `docs/DENSITY.md` and the SCSS/JSON exports.
- **`[type.scale]` is in pt, not px.** A coarse type anchor introduces a second unit
  conversion path through every emitter; worth deciding whether the coarse axis touches
  type at all, or spacing only.
- No source found on whether Obsidian mobile honours `@media (pointer: coarse)` inside a
  community theme, as opposed to the `body.is-mobile` class. **Insufficient data found** —
  ship both.

## Recommendation

1. **Add the axis at the token level, not in a stylesheet.** `[spacing.coarse]` beside
   `[spacing]`, plus `[a11y] target_size_px = 24` (AA floor) and a comfortable value of 44.
   Leave every existing `[spacing]` value untouched so the desktop layers do not move.

2. **Emit it three ways, because the consumers are not alike.** A
   `@media (pointer: coarse) and (hover: none)` block redeclaring the `--ig-*` properties in
   `css-vars.*.css` and `css-theme.*.css` — the mechanism `emit_css_vars` already uses for
   P3 and reduced-motion. A **separately resolved** coarse map in `scss-vars.*.scss` and a
   `spacing.coarse` object in `json-tokens.json`, because those bake literals and cannot see
   a media query. In `web/app.css.example`, keep the two-layer pattern the file already uses
   for colour — raw vars at `:root`, overridden in the media block, surfaced through
   `@theme inline` — since `@theme` forbids declarations inside a media query.

3. **Give Obsidian its mobile pass**, gated on `body.is-mobile` *and* the media query, since
   it is the one host here with a real phone app and currently has neither.

4. **Add a sixth drift-guard dimension before shipping any of the above.** An unenforced
   axis is the documented way this system has regressed before; a `--spacing` / `--target`
   mode that checks emitted spacing literals against both token blocks, and fails when an
   interactive control's computed target falls below `[a11y] target_size_px` under the
   coarse gate, is what keeps the new axis honest.

Sequence matters: step 4 before step 2, or the new axis ships unguarded.

## Sources

1. **Tailwind CSS — Theme variables** — https://tailwindcss.com/docs/theme — `@theme inline` semantics; `@theme` forbids nesting under selectors or media queries — current (via Context7)
2. **Tailwind CSS — Colors** — https://tailwindcss.com/docs/colors — the documented raw-variable + `@theme inline` theme-switching pattern — current (via Context7)
3. **WCAG 2.5.8 Target Size (Minimum), Silktide** — https://silktide.com/accessibility-guide/the-wcag-standard/2-5/input-modalities/2-5-8-target-size-minimum/ — 24×24 CSS px AA minimum and its exceptions — undated
4. **WCAG 2.5.8 Implementation Guide, AllAccessible** — https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide — `@media (pointer: coarse)` 48×48 pattern; Apple 44pt / Material 48dp — undated
5. **Obsidian Forum — Mobile only CSS snippet** — https://forum.obsidian.md/t/mobile-only-css-snippet/64355 — confirms `body.is-mobile` as the mobile hook for theme CSS — undated
6. **Obsidian Help — CSS snippets** — https://help.obsidian.md/snippets — theme/snippet CSS applies on mobile — current

Cross-model returns (in `returns/`): `r1-gptoss120b.md` (openai/gpt-oss-120b, full contract);
`r2-compound.md` (groq/compound, questions 1/4/5/6).

In-repo measurements are cited inline with `file:line` and were taken 2026-09-15 against
the working tree.

## Methodology

- Sub-questions investigated: 6 (the cross-model response contract)
- In-repo measurements: 12 greps/counts across `tokens/`, `web/`, `obsidian/`, `vencord/`, `spicetify/`, `vscode/`, `config/`, `scripts/`, `simulator/`
- Library docs: Tailwind v4 via Context7 (2 queries), used specifically to adjudicate a disputed review claim
- Web searches: 2; deep sources: 6
- Cross-model review: brief in `00-BRIEF.md`, 2 returns from 2 models
- Mode: direct (no agents)
- Flags:
  - **One review claim verified false** — Tailwind `@theme` baking defeating a runtime override. Corrected from primary docs.
  - **One review claim verified true** — SCSS and JSON exports bake literals and are blind to a media query. This reshapes the emit plan from one mechanism to three.
  - Both models converged independently on the gate correction and on keeping the floor out of the base spacing tokens.
  - `.is-phone` / `.is-tablet`, Plasma Mobile reach, and `vscode.dev` reach remain unverified.
  - Whether Obsidian mobile honours `@media (pointer: coarse)` in a community theme: **insufficient data found**.
