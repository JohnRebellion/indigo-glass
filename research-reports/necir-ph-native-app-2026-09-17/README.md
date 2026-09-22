# necir.ph native app audit — 2026-09-17

Cross-model audit of the proposal: one native mobile app covering all necir.ph
sites and subdomains.

| File | What it is |
|---|---|
| `00-BRIEF.md` | Round-1 brief, sent verbatim to 3 models. Client/employer names redacted before sending. |
| `returns/r1-gpt.md` | GPT (web chat), full contract, cites external sources |
| `returns/r1-gemini.md` | Gemini (web chat), full contract |
| `returns/r1-gptoss120b.md` | `openai/gpt-oss-120b`, full contract, truncated at Q8 caveats |
| `returns/r1-qwen.md` | `qwen/qwen3.8-27b`, truncated mid-Q3 (richest on Q1–Q3) |
| `returns/r1-compound.md` | `groq/compound`, full contract |
| `02-SYNTHESIS.md` | Reconciliation, rejections, ranked plan |
| `03-PREDICTIONS.md` | Baseline measurements + falsifiable predictions |

5 returns: 3 relayed directly via `groq`, plus GPT and Gemini pasted back from web
chat. `groq/compound` routes to `gpt-oss-120b` underneath, so the five are closer to
four independent opinions.

Round 2, if run, must open with "here is what we predicted, here is what happened"
against `03-PREDICTIONS.md`, and must fix three brief defects:

1. **State that the workstation does not sleep** (0 suspend events in a 23 h boot).
   The brief asserted sleep; 3 of 5 returns spent Q2 solving a non-problem.
2. **State that a tailnet already exists with the phone enrolled.** Both web-chat
   models flagged the missing topology rather than inventing one — correct behaviour,
   still a wasted question.
3. **Describe the scraping pipeline's residential-IP dependency in full.** Under-
   describing it made 2 of 5 models recommend the cloud move its own README forbids;
   only Gemini caught it unprompted.
