# Commit audit — indigo-glass, 2026-09-22

Cross-model audit of the five commits `2e4dbed..8984511` (2026-09-16/17) and the
uncommitted working tree as of 2026-09-22. The commits were authored in sessions
running Claude Opus 5 and Claude Sonnet 5; the round-1 reviewer is Claude Fable 5.1
in a fresh session with no history from those sessions. The brief is also
paste-ready for GPT / Gemini via web chat.

| File | What it is |
|---|---|
| `00-BRIEF.md` | Round-1 brief. Self-contained: context, measurements, the full patches and diff, response contract. |
| `measure/` | Baseline evidence: exported patches, working-tree diff, style-check and contrast runs (0.1.0 baseline and 0.2.0). |
| `returns/r1-<model>.md` | Replies, pasted verbatim. |
| `02-SYNTHESIS.md` | Claims verified against the repo; accepted, rejected, and why. |
| `03-PREDICTIONS.md` | Falsifiable predictions recorded before any change. |

Relay: `cb copy < 00-BRIEF.md`, paste into each model independently, save the
reply under `returns/`. Never show one model another's answer.
