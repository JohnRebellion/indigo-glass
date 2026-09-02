# Sage Ink — Design System Review — Round 1 Brief

You are reviewing a design system as an outside expert. You have no repository
access, so everything you need is below. Read it, then answer the numbered
questions in the exact format specified at the end.

I am asking a second frontier model the same questions independently. Where you
disagree with it, that disagreement is the point — do not hedge toward a
consensus answer, and do not soften findings to be agreeable.

---

## 1. What this is

**Sage Ink** — a cross-platform *neobrutalist* design system for a personal
Linux workstation (Fedora 44, KDE Plasma 6.6+, Wayland). One palette, applied
coherently across every surface the operator looks at: desktop, terminal,
editor, browser, bootloader, login screen, chat client, music player, and a
web/Tailwind theme.

Material grammar: **opaque flat surfaces, hard offset shadow (zero blur),
corner radius 0, colour-as-elevation.** Audited against the actual
[neobrutalism.dev](https://neobrutalism.dev) reference implementation
(`ekmas/neobrutalism-components`), not folk-knowledge "neobrutalist" styling.

**History matters for reading the code:** the system was *Lime Glass*
(visionOS-style glass, blur, soft elevation, lime accent), became *Indigo
Glass*, then in late August 2026 moved glass → ink: opaque, hard shadows, zero
blur, sage accent. The repository directory and the canonical token file are
still named `indigo-glass`. Some of what looks like inconsistency is residue
from that migration.

## 2. Who maintains it

Solo developer, ~9 years professional experience, full-stack. This is a
personal side project maintained in evenings and weekends — not a team product,
no users other than the author, no backwards-compatibility obligation to
anyone. Advice premised on a design-system team, a Figma workflow, a component
library release process, or consumer migration guides will not apply.

**Constraints:**
- KDE Plasma and GTK cannot parse `oklch()`. Any colour authored in a modern
  space must be emitted as plain sRGB hex or decimal RGB for those layers.
- The desktop must keep working. This theme is on the machine the operator
  works from daily; a broken login screen or window decoration is a real outage.
- Prefer reversible changes. A prior systemd automation on this machine bricked
  the login session once.
- **Assume competence.** Skip generic advice — "use design tokens", "check your
  contrast", "document your components". All three exist. Recommend changes to
  *this* system.

## 3. How it is built

**Single source of truth:** `tokens/indigo-glass.tokens.toml`, 463 lines.
Palette authored in **OKLCH** (perceptually uniform). Three variants —
`sage` (default), `indigo` (heritage), `lime` (heritage). Colour lives only in
`[variants.<name>]`; everything else (spacing, radius, shadow, type, motion,
opacity, a11y) is variant-agnostic.

Token file sections:
```
[meta] [variants.indigo] [variants.lime] [variants.sage]
[palette.alpha] [palette.composite] [palette.derive]
[spacing] [border] [radius] [radius.squircle] [opacity]
[shadow] [shadow.klassy]
[type.families] [type.scale] [type.roles] [type.weight] [type.line_height]
[motion.duration_ms] [motion.easing] [motion.roles]
[a11y] [alpha.exempt]
```

**Codegen:** `tokens/codegen.py`, 769 lines, dependency-free OKLCH↔sRGB↔P3
conversion. Emits **20 artefacts** into `tokens/out/`: CSS custom properties
(with an `@supports oklch()` upgrade layer and a Display-P3 overlay), SCSS
variables, a JSON dump, KDE `.colors` colour-scheme partials, Windows Terminal
schemes, a compact-density CSS file, Klassy radius config, and KWin blur config
— each emitted both as an unsuffixed default and one file per variant.

**Consuming surfaces** (file counts, so you can see where the mass is):
```
simulator 6636   cursor 2898   share 97   iso 73   config 36
browser 13       vscode 13     windows 7  sddm 5   hosts 4
shell 3          obsidian 3    spicetify 3  jetbrains 2  vencord 2  web 1
```
Roughly 750 tracked files.

**The central architectural fact — read this carefully, it is the thing I most
want reviewed:** codegen *emits* 20 artefacts, but the individual layer configs
do **not** consume them. Layer configs carry colour and material literals typed
by hand. Nothing regenerates them. Consistency is instead enforced *after the
fact* by a drift guard, `scripts/check-palette-drift.sh`, which fails when a
layer has drifted from the tokens.

That guard is on its second version. Its own header documents why:

```
# v2 (2026-08-28) — rewritten after an audit found the v1 guard was reporting
# "clean" while three shipped themes were still Lime Glass. Three holes:
#
#   1. SCAN PATH.   v1's SEARCH_DIRS listed 10 dirs and silently omitted six
#                   deployable ones — cursor/ hosts/ iso/ sddm/ shell/ and
#                   vencord/. vencord/indigo-glass.theme.css contained the
#                   lime accent #A8E635 for weeks while the guard passed.
#                   The list is now derived by EXCLUSION, so a new top-level
#                   directory is scanned by default instead of being invisible
#                   by default.
#
#   2. DECIMAL RGB. v1 matched '#RRGGBB' only. Colours written as decimal
#                   tuples — rgba(168,230,53,.3) in CSS, "168,230,53" in KDE
#                   colour schemes — were invisible to it. Five such lime tints
#                   survived every prior sweep in the Spicetify theme.
```

The guard now runs three scans: `--colour`, `--material` (opaque, zero blur,
hard shadow), and `--alpha` (opaque fills, outline-not-highlight on select).

## 4. Measurements

- Drift guard, run today: **clean** — colour scan 16 dirs, material scan 17
  dirs, alpha scan 17 dirs, no drift reported.
- Accent contrast: sage `#A6C9A6` on base `#07080A` = **11.00:1 (AAA)** as a
  fill. Against `--text` `#F8F8F8` it is **1.72:1**, so sage is *fill-only* by
  rule — it may never carry body text. Text stays neutral system-wide; only
  fills, borders, and icons take the accent.
- The guard is **manual**. There is no CI, no git hook, no scheduled run. It
  fires when the operator remembers to type it.
- There are **no tests** beyond that guard, and no visual regression testing of
  any kind.

## 5. What I already know — do not re-report

1. The repo directory and canonical token file are still named `indigo-glass`
   while the system is called Sage Ink. Known naming debt from the migration.
2. `tokens/README.md` still opens "# Lime Glass - Tokens" and describes `lime`
   as the default variant. Stale; the actual default is `sage`.
3. The `simulator/` and `cursor/` directories dominate the file count and are
   mostly generated or vendored assets, not hand-maintained theme code.
4. Lime-era literals leaking into shipped themes has happened twice and is the
   reason the drift guard was rewritten. It is a known failure class.
5. GRUB theming is optional and separately synced.

## 6. Questions

Answer all eight. Cite the specific mechanism or file you mean.

**Q1 — Generate-and-verify vs generate-and-consume.** The system generates 20
token artefacts that nothing consumes, then polices hand-typed literals with a
regex drift guard that has already shipped one false "clean". Is after-the-fact
verification a defensible architecture here, or is it a workaround for layers
that could actually consume generated files? Answer per surface class — some of
these (KDE `.colors`, Windows Terminal JSON, CSS) plausibly *could* be consumed
directly; others (GRUB, SDDM, Klassy) may genuinely not be able to.

**Q2 — Neobrutalist grammar.** Given the stated grammar — opaque flat surfaces,
hard offset shadow with zero blur, radius 0, colour-as-elevation, outline-not-
highlight on select — where would you expect a system like this to violate its
own rules in practice, and which surfaces are most likely to be the offenders?
What would you grep for?

**Q3 — Accessibility beyond contrast ratio.** The fill-only accent rule handles
one failure mode. What *else* breaks in a zero-radius, hard-shadow,
outline-based system: for colour-blind users, for low-vision users at high zoom,
under a forced high-contrast mode, under `prefers-reduced-motion`, or for
anyone relying on the OS focus indicator? Neobrutalism removes several
conventional affordance cues — which removals actually cost usability, and
which are cosmetic?

**Q4 — What is missing.** What does a design system operating at this scope
(3 variants × ~16 deployable surfaces, one solo maintainer) have that this one
does not? Rank by what would matter most *for a solo maintainer* — not what a
design-system team would want.

**Q5 — Failure modes.** The drift guard is manual and the only test. When this
breaks, how does it break, how would the operator find out, and how long until
they notice? What is the worst realistic failure — and is "the desktop theme is
subtly wrong for three weeks" actually worse than a loud breakage?

**Q6 — Adding a fourth variant, or a seventeenth surface.** What breaks? What
is the actual marginal cost per new variant and per new surface under the
current architecture, and what would reduce it?

**Q7 — What measurement would change your answer?** Name the specific
observation that would falsify your main recommendation — precise enough that
it could be measured today.

**Q8 — The one thing.** If exactly one change is made from your answer, which
is it, and what improves?

## 7. Required response format

Reply with markdown only, in exactly this structure. Structure matters more
than prose polish — this is pasted into an agent verbatim and compared
line-by-line against another model's reply.

```markdown
# Sage Ink Review — [Your model name]

## Verdict
[3-5 sentences. Over-built, under-built, or sound but misconfigured?]

## Q1 — Generate-and-verify vs generate-and-consume
| Surface class | Could it consume directly? | Recommendation |
| :-- | :-- | :-- |
[then your architectural judgement in prose]

## Q2 — Neobrutalist grammar violations
| Likely violation | Where to look | What to grep |
| :-- | :-- | :-- |

## Q3 — Accessibility
### Costs usability
- [removal] — [who it hurts, how]
### Cosmetic only
- [removal] — [why it is fine]

## Q4 — What is missing
| Gap | Why it matters for a solo maintainer | Concrete implementation |
| :-- | :-- | :-- |

## Q5 — Failure modes
| Failure | How it surfaces | Time to detect | Real severity |
| :-- | :-- | :-- | :-- |

## Q6 — Fourth variant / seventeenth surface
**Marginal cost now:** [...]
**What would reduce it:** [...]

## Q7 — What would change your answer
[Specific, measurable observation.]

## Q8 — The one thing
**Do:** [what]
**Effect:** [what improves, and how it would be verified]

## Confidence and caveats
[Where you are guessing. What you would need to see to be sure. Say plainly if
a question was underspecified or the excerpts were insufficient — do not invent
detail to fill the format.]
```

Do not add sections outside this structure. The caveats section is not
boilerplate — it is the most useful part of your reply, because it says what to
measure next.
