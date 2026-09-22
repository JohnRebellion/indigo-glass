# Sage Ink live-fidelity audit — 2026-09-22

Target: bring desktop + browser layers to neobrutalism.dev grammar in Sage Ink.

## Layout
- `measure/LEDGER.md` — every finding with its evidence class (pixel/source/own read/Gemini). Internal; not relayed.
- `measure/shoot.sh` — window-only capture of a freshly launched window. Never full-screen on this host.
- `measure/pixels-before.txt`, `measure/edge-lift-probe.txt` — deterministic baselines.
- `shots/` — raw captures. **Git-ignored**: browser shots show bookmark bars.
- `relay/` — crops safe to send to a free tier (bookmarks and contributor lists cut). Read by a human-equivalent pass before sending.
- `montage/`, `gemini-out/` — gemini-see inputs and verbatim outputs.
- `00-BRIEF.md` — round-1 brief for GPT and Gemini.
- `returns/r1-<model>.md` — replies, pasted VERBATIM.
- `02-SYNTHESIS.md`, `03-PREDICTIONS.md` — written after returns.

## Relay protocol
1. `cb copy < 00-BRIEF.md`, paste into GPT and Gemini in **separate fresh chats**.
2. Never show one model the other's reply.
3. Save each reply verbatim to `returns/r1-gpt.md` and `returns/r1-gemini.md`.
