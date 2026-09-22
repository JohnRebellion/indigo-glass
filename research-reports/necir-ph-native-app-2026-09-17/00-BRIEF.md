# Review request: should a one-app native mobile client exist for a 3-site personal domain?

Reviewing a working, deployed system with a deliberately small audience. **Assume
competence.** Skip generic advice ("consider a PWA", "validate with users", "start
with an MVP", "React Native vs Flutter has trade-offs"). I want the failure modes,
the wrong assumptions, and the parts of this plan that are incoherent as stated.

## Operator and context

One engineer, Philippines, 9+ years full-stack. Owns `necir.ph` and runs everything
on it solo. Three sites are live. There is no team, no on-call, no CI on these
repos, and no revenue attached to any of them. A second-hand diesel-engine and
vehicle flipping side business is the only commercial activity, and it transacts on
Facebook Marketplace, not on the sites.

Mobile toolchain already installed locally: Flutter (stable), Android SDK with
emulator and system images, 3 existing Flutter side projects. No Mac. No iOS
developer account.

## The three live sites (measured 2026-09-17, in-repo)

| | www.necir.ph | diesel.necir.ph | research.necir.ph |
|---|---|---|---|
| Purpose | portfolio / CV | side-business shopfront | published research reader |
| Stack | SvelteKit 2 + Svelte 5 + Tailwind v4 | same | same |
| Adapter | `adapter-vercel` | `adapter-vercel` | `adapter-static` |
| Routes | 9 | 6 | 11 |
| svelte+css lines | 1,658 | 2,671 | 2,519 |
| Runtime deps | `@vercel/edge-config`, `@vercel/functions` | `@vercel/edge-config` | `marked`, `yaml`, `github-slugger` |
| Prerendered | yes (3 flags) | yes | yes, every route |
| Auth | none | none | none |
| Public write API | 1 analytics beacon (`POST /api/e`) | none | none |
| PWA manifest | **none** | **none** | **none** |
| Service worker | **none** | **none** | **none** |
| e2e suite | **none** | **none** | **none** |

Apex `necir.ph` 308-redirects to `www`. `go.necir.ph`, `sharp.necir.ph`,
`analytics.necir.ph` do **not** resolve — they exist only in old notes.

Server-side state across all three sites is effectively zero. Everything a visitor
sees is prerendered at build time. The only dynamic endpoint is a rate-limited,
same-origin-gated analytics beacon that relays to a self-hosted Umami.

### Short links

`www.necir.ph/l/<CODE>` is a redirect service whose map is a **compiled TypeScript
module**, not a database — adding or repointing a code is a code edit plus a deploy,
deliberately, so every change is reviewable and revertable. Codes are printed on
physical posters, so a retired code is never reissued. ~8 codes exist today.

## Real traffic — the measurement that started this

Self-hosted Umami, Postgres, 13 days of data (2026-09-04 → 2026-09-16). This is
**all** the traffic that exists, not a sample:

| Site | mobile sessions | desktop sessions |
|---|---|---|
| diesel.necir.ph | 12 | 2 |
| www.necir.ph | 8 | 18 |
| research.necir.ph | **not instrumented** | not instrumented |

Totals across both instrumented sites: **40 distinct sessions, 51 events, 13 days.**
Top paths: `diesel/` (19 hits), then `www/l/WRANGLER-FB` (9), `/l/TAMARAW-FB` (6),
`/l/WRANGLER-YT` (6). Several recorded paths (`/real-browser-sim`,
`/final-clean-check`, `/direct-test`) are the operator's own instrumentation tests,
so the real human figure is lower than 40.

## The operator-side system, which is the part that is genuinely app-shaped

Separate from the three public sites there is a private pipeline:

- A Python scraping and deal-hunting system covering 5 Philippine/US marketplaces,
  with SQLite caching and an FTS-backed local index.
- **14 systemd user units** running scheduled deal hunts and a nightly engine price
  index.
- **"Hunt Studio"** — a SvelteKit console, 10 routes, 20 API endpoints, bound to
  **loopback only on port 5317**, running as a systemd user service on the operator's
  workstation. It edits the pipeline's declarative config and reads its outputs.
  Reachable only when that workstation is awake and only from that machine.

This is the only surface with a real daily user (the operator), real time-sensitive
events (a deal appearing, a price index shifting), and a real reason to want push
notification and offline access.

## The research corpus, and a hard constraint on it

`research.necir.ph` publishes from a 94-document research monorepo through a
**deny-by-default allowlist** (`publish.manifest.json`). **2 of 94** documents are
public today. The allowlist is not a nicety: the corpus contains one employer name
and two client engagements under NDA, and `adapter-static` means production has no
server runtime that could read the filesystem even if the allowlist were wrong. The
structural guarantee is the point.

## Decisions already taken — do not re-litigate these

1. **Distribution is sideload-only.** Self-signed APK, installed on the operator's
   own devices. No Play Store listing, no App Store, no TestFlight. iOS is out.
2. **The three sites stay.** A native app does not replace them; the web remains the
   public surface. Nothing is being decommissioned.
3. **DNS stays at the registrar** (Google Workspace email lives there). No
   nameserver move is available as a solution to anything.
4. **Design language is fixed**: opaque flat surfaces, radius 0, hard offset shadow,
   colour-as-elevation, no blur, no gradient, no translucency, two font weights.
   Suggestions to adopt Material 3 defaults wholesale will be rejected; say so
   plainly if you think that is a mistake.
5. **A previous audit (2026-09-15) established the sites are not broken on mobile.**
   They are fluid-first: 22 `clamp()` calls on diesel, `svh`, `auto-fit`/`minmax`
   grids, hover gated behind `(hover: hover) and (pointer: fine)`, and single-column
   `ch`-measure document flows on research. "The web version is bad on phones" is
   **not** an available justification for the app. Do not use it.
6. Free-tier hosting only (Vercel Hobby). No budget line for this.

## What is being proposed, and it has three purposes at once

One native mobile application, sideloaded, that serves **all three** of:

- **A. Operator console.** Deal-hunt and price-index alerts, listing triage, editing
  the pipeline config — i.e. Hunt Studio, on a phone, with push notifications.
- **B. Public consolidated app.** Portfolio, shopfront and research reader in one
  app, for visitors.
- **C. Offline research reader.** The research corpus readable on a phone with no
  connection.

## Response contract — answer exactly these, numbered, in order

1. **Purposes A, B and C in one sideloaded app: which of the three survive contact
   with the constraints, and which is incoherent?** Be specific about *why*, not just
   *that*. If you think one of them is self-contradicting as specified, name the
   contradiction.
2. **Purpose A requires reaching a loopback-only service on a workstation that
   sleeps.** Enumerate the actual options and their failure modes, given free-tier
   hosting, no static IP assumed, and no budget. Include the option of moving the
   scheduling off the workstation entirely. Say which you would pick and what breaks
   when the workstation is offline.
3. **Purpose C and the NDA allowlist.** The app is sideloaded to the operator's own
   devices, so it *could* bundle all 94 documents rather than the 2 that are public.
   Argue whether that is acceptable, and name the specific mechanism by which a
   locally-installed APK leaks a bundled NDA document. If you think the allowlist
   should apply to the app unchanged, say what capability that costs.
4. **Given 40 sessions in 13 days, what is the honest case for native over a PWA
   with a service worker and Web Push?** Do not recite the general comparison. Name
   the specific capability that Purpose A or C needs and that a 2026 Android PWA
   cannot deliver. If there is no such capability, say so outright.
5. **What would you expect to break first** if this is built as one Flutter app
   wrapping three prerendered SvelteKit sites plus a native operator console? Name
   the failure, not the category.
6. **The design system exists as three divergent implementations** across the three
   sites (one uses Tailwind `@theme` with hardcoded hex, one its own short CSS vars,
   one consumes 133 upstream `--ig-*` variables). Reimplementing it a **fourth** time
   in Flutter: unavoidable cost, argument against native, or argument for unifying
   the web three first? Pick one.
7. **What measurement would change your answer?** Name measurements that can
   actually be taken on this system — traffic queries, timing, repo counts — not
   user interviews or surveys.
8. **What am I not asking that I should be?** One item, the most consequential.

## Format

Answer under a heading per question, numbered, in order. Be terse and specific.
Cite exact figures from the tables above where you assert something. Write
**"unknown"** rather than inventing a fact about this system — a previous round of
this exercise had a model invent a CSS rule and reason from it, and the whole answer
was discarded.

End with:

## Confidence and caveats

Where you are guessing. What you would need to see to be sure. Say plainly if a
question was underspecified rather than inventing detail to fill the format.

---

Do not soften findings to be agreeable. A second model is being asked these same
questions independently, for exactly that reason. If the honest answer is "do not
build this", say that in question 1 and defend it.
