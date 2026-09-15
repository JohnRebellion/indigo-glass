# Verifying reviewer claims against the browser, not against intuition

Round 1, Groq (`openai/gpt-oss-120b`). Fixtures in this directory; each was run
in the same Edge build the styles target.

## Refuted

### "Variables defined on `:root` are not inherited into a closed shadow tree"
Used to argue per-site styles silently miss shadow-DOM components.

**False.** Custom properties are inherited properties and cross shadow
boundaries. `measure/claims.html` attaches a shadow root whose inner element
reads `var(--site-token, blue)`; an author-origin `:root { --site-token: …
!important }` painted it:

    A_shadow_open: rgb(0, 255, 0)   ← the injected value, not the fallback

This is not incidental — it is the mechanism the YouTube style depends on.
`--yt-spec-*` is never declared by YouTube at all; its Polymer components read
it with `var(…, fallback)` inside shadow trees, and declaring it at `:root` is
what supplies the value. What shadow DOM *does* defeat is **selector matching**,
which is a different and real limitation.

### "Runtime CSSOM updates wipe the overrides"
Used to argue a site's JS theme switch re-exposes brand colours.

**False for the stated mechanism.** `element.style.setProperty()` is an inline
declaration without `!important`; an author-origin `!important` declaration
outranks it. `measure/claims.html` sets `--site-token` from script *after* the
style is injected:

    I_jsvar_bg: rgb(0, 255, 0)      ← author !important still wins

A site could still win by shipping its own `!important` at higher specificity.
That is the real version of this risk and it is worth stating; the JS one is not.

### The suggested "graceful degradation" pattern is broken CSS
Recommended verbatim:

    --bgColor-default: var(--my-bg-default, var(--bgColor-default));

**Invalid.** A custom property referencing itself is a cycle, which makes it
invalid at computed-value time — the property does not fall back to the site's
value, it ceases to have one. `measure/claims2.html`:

    selfref: rgb(255, 255, 0)   ← the *fallback* colour: the variable died
    plain:   rgb(18, 52, 86)    ← a plain override, for contrast

Applying this recipe would break every site it touched. The underlying goal
(degrade when a site renames a token) is legitimate; this is not the way.

## Accepted as real gaps

- **Interaction states beyond three.** `contrast.mjs` covers rest, keyboard
  focus and hover. `:visited`, `:disabled`, `:active` and site-specific
  "pressed"/"selected" states are unmeasured.
- **Non-CSS colour.** SVG `fill`/`stroke` attributes, `<canvas>`, and WebGL are
  invisible to a computed-style audit. Brand-coloured inline icons can survive
  a retint that the audit calls clean.
- **Native form controls.** Date pickers, `<select>` popups and file dialogs are
  UA-rendered; they have no text node to measure and are driven by
  `color-scheme`, which no style here sets.
- **Single viewport.** Every audit runs at 1400x1000. A responsive breakpoint can
  swap in a component tree whose tokens were never remapped.
- **Layout stability.** Both tools measure paint, not geometry. A rule that
  shifts layout (the Google grid re-placement is exactly this) is only caught
  because it is inspected by hand.

## Corrected, not simply accepted

- **"A dead class-hash selector leaves the style inert while Dark Reader keeps
  running."** The second half is wrong for this configuration: those domains sit
  in Dark Reader's `disabledFor`, so nothing takes over. The real failure is
  quieter — the site renders its own dark theme, unstyled, and nothing reports
  it. That argues for a periodic harness run, not for a fallback engine.
- **"CSP may block the per-site stylesheet for real users."** Inverted. Stylus
  injects as an extension user stylesheet and is not subject to page CSP; the
  *harness* is, which is why it needs `Page.setBypassCSP` — a harness artefact
  that does not exist in production.
