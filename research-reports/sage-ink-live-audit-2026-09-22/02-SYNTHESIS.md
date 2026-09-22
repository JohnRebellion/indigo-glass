# Synthesis — round 1 (GPT, Gemini), 2026-09-22

Replies verbatim in `returns/`. GPT followed the skeleton, cited sources and
hedged where it should. Gemini ignored the skeleton (no Q7–Q9, no confidence
section) and answered only the fix-shaped questions. Weighting follows.

## Where they agree (applied)

- **GTK M2–M5**: opaque shadows, `@borders` = border_strong #5E5E60, 2px on
  entry/check/radio/switch. Verified in source; both right.
- **Edge NTP**: set `ntp_background`. Verified honoured by probe.
- **Klassy titlebar**: drop `AccentTrafficLights`. Enum values checked against
  the installed Klassy source before use (both models' values were unverified).
- **Edge pre-compensation is empirical, not an invariant** (GPT explicit,
  Gemini implicit). Applied with the Edge version recorded and a re-probe
  script, not as a universal inverse curve.

## Where they disagree

**Q1 (QML selected text).** GPT: do not flip `[Colors:Selection]` globally;
fix at the Quick/Kirigami boundary, possibly a small qqc2 patch; measure
first. Gemini: flip `ForegroundNormal` to text globally and restore dark ink
inside Klassy `polish()` for QLineEdit/QTextEdit/QPlainTextEdit.

**Gemini wins, with GPT's caveat recorded.** Evidence:
`DefaultListItemBackground.qml` (qqc2-desktop-style 6.29) draws the row via
`StylePrivate.StyleItem` into the patched QStyle (outline), while text comes
from `Kirigami.Theme.highlightedTextColor`, which reads the colour scheme.
No QWidget exists for `polish()` to reach, so GPT's option 2 is closed, and
option 1 means patching qqc2/Kirigami, which §5 rules out. The live
screenshot already shows the invisible label renders #07080A, the scheme's
Selection foreground — GPT's probe would confirm the source but cannot change
the fix. (Probe attempted twice via `qml`; failed to load, circuit breaker.)
Known breakage accepted: QML `TextField` text selection and QProgressBar
labels become text-on-sage (1.72:1), transient/rare. Every Kirigami list,
Plasma applet list and the colour-scheme preview become legible permanently.

**Q2 (web).** GPT: borders broadly on semantic roots, hard shadows only on
elevated things, add a state contract. Gemini: inset-shadow borders, plus
`margin-right/bottom: 4px` and `overflow: visible` on containers.
**GPT wins.** Gemini's margins reflow every button row and forcing
`overflow: visible` on list containers is the class of rule that "eats an
editor". Applied to GitHub and Wikipedia only — the two sites this host can
verify without logging in. Remaining 13 site styles need logged-in
verification; not changed.

## Rejected

- **GPT: Edge `tints.buttons` → [-1,-1,-1].** The tint is deliberate
  (documented in the Edge README: it paints toolbar icons accent_hi); GPT
  called it "arbitrary" without evidence. Kept.
- **GPT: GTK `opacity: 0.4` on disabled is translucency.** It is the declared
  `opacity.disabled` token and matches the reference (`nb-core.css` uses
  `--ig-opacity-disabled`). Kept.
- **GPT + my own L6: hover washes (`alpha(fg,0.06/0.08)`).** STATE_GRAMMAR.md
  explicitly exempts transient hover washes. Retracted. Scrollbar thumb is
  Tier D and is NOT exempt — fixed.
- **GPT: `button:active` margin travel reflows.** GTK3 CSS has no
  `transform`; margin is the only travel mechanism. Kept.
- **Gemini: headerbar hover `#191c1e`.** An off-token literal — the exact
  defect class being removed.
- **Gemini: web `margin` + `overflow: visible` rules.** See Q2.
- **Gemini's Klassy enum `TitleBarTextAuto`.** Not verified to exist; values
  taken from the installed source instead.
- **GPT: delete `*:selected`.** SageInk is a standalone GTK theme; deleting
  it leaves unstyled widgets with no selection indication. Converted it to
  the Tier C outline instead, and kept `selection` (text) as the fill.

## Applied, ranked by evidence

1. GTK3 contract: opaque shadows, border_strong borders, 2px controls,
   token-only fills (`#191c1e` gone), `#FFFFFF` → text, tabs outline,
   scrollbar thumb opaque, destructive shadow = page colour, image-button
   square, entry focus = 2px text ring. (source + pixel)
2. `[Colors:Selection]` foreground → text, Klassy restores base on text
   inputs. (pixel + source)
3. Edge manifest pre-compensated + NTP themed. (5 probes)
4. `check-deployment.sh` Edge path + Dark Reader ID. (profile files)
5. Klassy titlebar buttons neutral. (source enums)
6. Ink-contract lint for GTK CSS — GPT Q8: a hex-only guard stays green
   while every M2–M5 defect ships. Accepted as the strongest structural
   point in either reply.
7. GitHub + Wikipedia: 2px border_strong on controls, hard shadow on
   buttons/overlays only.
8. Firefox static theme (install needs signing — user action).
9. Stale repo facts: GTK settings.ini cursor, REFERENCE.md boundary, klassyrc
   per-state keys, GTK header comment.

## Not done, and why

- **Plasma shell popups, OSDs, notifications** (GPT Q7): not captured
  safely this round; needs a session without client windows in the taskbar.
- **GTK4/libadwaita**: GPT's ceiling analysis accepted; GTK4 `gtk.css` gets
  the same colour-contract fixes only.
- **Surface/elevation contract doc** (GPT Q7): good idea; a docs task, not
  a fix. Recorded.
