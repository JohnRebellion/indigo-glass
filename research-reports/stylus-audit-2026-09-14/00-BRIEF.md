# Review request: per-site browser restyling system + its verification harness

You are reviewing a working system, not a proposal. Assume competence: skip
generic advice about CSS specificity, "consider using a preprocessor", or
testing in general. I want the failure modes a careful reviewer sees that the
person who built it cannot.

## Context

A single operator maintains a personal design system ("Sage Ink") applied
across a Linux desktop: KDE, GTK, terminal, editors, GRUB, and the browser.
Colour is authored once in OKLCH in a tokens file; a codegen emits per-layer
configs; a drift guard fails the build when a layer's literals diverge from the
tokens.

The browser layer is three things that must not be confused:

1. **Stylus universal style** — typography, scrollbars, selection, focus ring.
   Touches no colour. Runs everywhere.
2. **Stylus per-site styles** — full retint of one site, working *through* that
   site's own dark-mode design tokens. 14 sites.
3. **Dark Reader** — automatic dark-mode inversion. Fallback for everything
   with no per-site style.

Rule: exactly one colour engine per site. A per-site style requires the site's
native dark mode ON and Dark Reader OFF for that domain. Every defect in this
system's history came from breaking that rule.

The design language is deliberate and non-negotiable here: opaque surfaces
only (a translucent "glass" material was deleted from the token set), radius 0,
colour-as-elevation rather than shadow stacks, superellipse/squircle explicitly
ruled out.

## How the per-site styles work

Each is a `.user.css` with an `@-moz-document` block. The good case is a pure
variable remap: the site publishes design tokens as CSS custom properties, and
the style redeclares them at `:root`. Measured token counts on live renders:

| Site | Token layer | Count |
|---|---|---|
| GitHub | Primer `--bgColor-*`, `--fgColor-*` | ~1260 |
| Facebook | `--web-wash`, `--card-background`, `--accent`, 78 radius tokens | 982 |
| Atlassian | `--ds-*` | 649 |
| Microsoft 365 | Fluent v9 `--color*` + legacy Fabric slots | 526 |
| Copilot | Tailwind-style 100–900 RGB-triplet ramps | 409 |
| Wikipedia | Codex | 193 |
| YouTube | `--yt-spec-*` — **never declared**, consumed via `var(…, fallback)` | n/a |
| Google | none — obfuscated per-build class hashes only | 0 |

Hue policy, decided and not up for review: tool sites (Claude, ChatGPT,
Gemini, AI Studio, Copilot, Notion, Linear) keep the system's sage accent.
Consumer/vendor sites (Google, YouTube, Facebook, GitHub, Atlassian, MS365,
Wikipedia) keep *their own brand hue*, re-cut on the system's lightness ladder
(L 0.82/0.74/0.66 at C 0.11) instead of raw brand chroma.

## The verification harness

Built after four guessed selectors shipped broken. It launches the system
browser as a normal process, attaches over CDP, injects the style, and reports
what the style did **not** reach.

Why a normal process and not the automation launcher: the automation switches
trigger a CAPTCHA on one target's search URLs, which makes the audit useless.

Three tools:
- `check.mjs` — leftover border-radii, surfaces painted outside the token set,
  link colours, layout geometry.
- `contrast.mjs` — WCAG ratios at rest, on **keyboard** focus (real Tab
  presses, because scripted `el.focus()` does not match `:focus-visible` in
  Chromium), and on hover (with an `elementFromPoint` check for an opaque
  overlay covering a label). Measures the element that *paints* text — one with
  its own text node — not the interactive container.
- `stylusapply.mjs` — inventories, de-duplicates and updates the installed
  styles across browser profiles through the extension's own API.

Colours are resolved by painting them on a 1×1 canvas rather than regex-parsed,
because the styles declare `oklch()` and Chromium keeps `oklch()` in computed
styles.

It runs against a disposable profile holding a copy of the cookie jar, so
logged-in surfaces render. The profile is signed into the browser vendor's
account, which **syncs the real extension set into it** — including Dark
Reader, which silently polluted early audits until `--disable-extensions`.

## Measured results after fixes

All audited sites: zero non-circular border-radii, all surfaces token colours.
Three stray rounded elements remain across 14 sites. Contrast failures found
and fixed (all mine):

| Site | Cause | Ratio |
|---|---|---|
| Atlassian | `--ds-text-inverse` set to ink black to sit on a repainted brand fill; that token is also used over surfaces this style darkened | 1.03:1 |
| MS365 | same class of error, three tokens incl. legacy Fabric `--white` | 1.07:1 |
| Facebook | `--hover-overlay` made opaque; the site layers it *over* the control, so the label disappeared on hover | n/a, reported by user |

Failures verified as **pre-existing in the unstyled sites** and therefore not
fixed: Atlassian "Connect apps" 1.18:1, "Open Rovo Chat" 1.56:1, Outlook icon
glyph 1.44:1 (2.18:1 → 2.65:1 *improved* by the restyle).

Resulting rule: never repaint a "text on accent" token unless the same file
owns every background that token lands on. Two files now leave vendor brand
fills alone entirely.

## Known open issue (do not rediscover)

The system's `text_muted` token (`#6B7280`, OKLCH L 0.551) measures 4.14 / 4.01
/ 3.87:1 against the three surface steps — below the 4.5:1 AA floor for small
text. It is the secondary-text mapping in every per-site style. Fixing it means
raising the token to ~L 0.60 and regenerating every layer of the desktop, not
just the browser. Known, costed, awaiting a decision.

## Already decided — do not report

- Hue policy above.
- Opaque-only surfaces, radius 0, no squircles, no soft shadows.
- Dark Reader stays enabled globally as the fallback; per-site styles are the
  exception list, not the other way round.
- The harness uses the real browser binary and a copied cookie jar; a clean
  synthetic profile is not an option because logged-in surfaces are the point.
- Class-hash selectors are accepted where a site publishes no tokens, and are
  marked VOLATILE in comments.

## Constraints

- Styles are distributed by pushing to a public git repo; the extension
  re-fetches from a raw URL. No build step, no preprocessor beyond the
  extension's own. A style must be a single self-contained file.
- The drift guard forbids colour literals that do not derive from the token
  set, and forbids translucency outside an explicit allow-list.
- Nothing that requires the operator to re-apply settings per profile by hand;
  there are five browser profiles.

## Artefacts

Appendix A: `google.user.css` — the hardest case, no token layer, plus a grid
re-placement to widen the results column.
Appendix B: `facebook.user.css` — the largest token remap.
Appendix C: `contrast.mjs` — the accessibility harness.

## Questions

Answer each. Where a question does not apply, say so rather than padding.

1. **What is missing that a well-built version of this has?** Specifically:
   what class of visual or functional breakage can these styles cause that
   neither `check.mjs` nor `contrast.mjs` would detect?
2. **Which of the decisions above are actively harmful**, as opposed to merely
   suboptimal? Name the blast radius.
3. The per-site styles override vendor design tokens at `:root` with
   `!important`. **What would you expect to break** as those sites ship
   redesigns over the next year, and what would make the styles degrade
   gracefully rather than catastrophically?
4. The harness measures a *headless render of a page the operator is logged
   into*. **What does that systematically fail to represent** compared with the
   real browsing session?
5. Is "exactly one colour engine per site" the right architecture, or is there
   a better decomposition given Dark Reader must stay for the long tail?
6. **What measurement would change your answer to any of the above?**

## Response format

```markdown
## 1. Missing capabilities
## 2. Actively harmful decisions
## 3. Redesign fragility
## 4. What the harness fails to represent
## 5. Architecture
## 6. Measurements that would change your answer
## Confidence and caveats
Where you are guessing. What you would need to see to be sure. Say plainly if a
question was underspecified — do not invent detail to fill the format.
```

Do not soften findings to be agreeable — a second model is being asked the same
questions independently for exactly that reason.
