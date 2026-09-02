# Cross-model audit — the `/neobrutalism/` implementation page — 2026-09-02

Getting GPT and Gemini to review the Sage Ink × neobrutalism.dev
implementation page for **proper implementation and execution**.

## What is being reviewed

`simulator/src/routes/neobrutalism/` and `simulator/src/lib/nb/` — a single
page that renders all 46 components of `ekmas/neobrutalism-components` plus
every styling page in Sage Ink tokens, built so one capture is a complete
review artefact. See [docs/NEOBRUTALISM-PAGE.md](../../docs/NEOBRUTALISM-PAGE.md).

## Relay protocol

1. **Attach** `indigo-glass-simulator-neobrutalism.html` — 214 KB,
   self-contained, offline, no scripts. This is the artefact.
   Optionally also `01-APPENDIX-A-reference-classes.md` and
   `measure/computed.tsv`.
2. **Paste** `00-BRIEF.md` as the message.
3. **Do this independently in each model.** Never show one model the other's
   answer — sequential review just produces agreement with whoever went
   first. Independent disagreement is the signal being bought here.
4. **Save replies verbatim** to `returns/r1-gpt.md` and `returns/r1-gemini.md`.
   Do not pre-summarise; the raw reasoning is needed to judge which model to
   weight where they conflict.
5. Then: verify every factual claim against the actual files before acting on
   any of it, and write `02-SYNTHESIS.md`.

## Files

```
00-BRIEF.md                          round 1, out
01-APPENDIX-A-reference-classes.md   the reference library's own class strings
01-APPENDIX-B-implementation.css     the 893 lines under review, standalone
indigo-glass-simulator-neobrutalism.html   THE ARTEFACT — attach this
tile-01..05.png                      visual fallback, 5 contiguous strips
measure/computed.tsv                 computed style of all 113 .nb-* primitives
returns/                             replies, verbatim
02-SYNTHESIS.md                      reconciliation (after returns)
```

## Baseline at time of sending

| | |
| :--- | :--- |
| Components covered | 46 / 46 (66 specimens) |
| Implementation | 893 lines CSS, 7 section components |
| `svelte-check` | 0 errors, 0 warnings, 350 files |
| `check-palette-drift.sh` | clean — colour, material, alpha, parity |
| Playwright, this page | 3 / 3 pass |
| Rendered page | 1560 × 10784 css px |
| Single-file export | 214 KB, 0 external requests |
| `--main-foreground` on `--main` | 11.00:1 AAA |
| `--border` on `--background` | 1.31:1 — the open question in Q2 |

## Defects found by measuring *before* briefing

Recorded because the skill's first rule is measure-first, and it paid:

1. **`oklch()` parsed as RGB.** `getComputedStyle().color` preserves the
   authored colour space, so every swatch label and every contrast ratio on
   the page was wrong — `#07080A` printed as `#000106`. Fixed via a canvas
   round-trip; regression test added.
2. **`.nb-badge--tag` had no fill.** It was written as a variant but only set
   a radius, so the tag badge rendered unfilled — the exact Tier D violation
   the same page documents. Reclassified as a modifier; markup fixed.
3. **`--overlay` mislabelled `#08080ACC`.** `getImageData` unpremultiplies,
   costing a unit of red on the one translucent token. Resolver now prefers
   the canvas `fillStyle` serialisation, which is exact.

All three were in the artefact when this audit was proposed. They are
disclosed in §5 of the brief rather than hidden, since the page's whole
purpose is catching this class of error.
