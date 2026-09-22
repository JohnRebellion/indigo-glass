# Synthesis — one native app for all of necir.ph

*Date: 2026-09-17 · 5 independent returns · brief in `00-BRIEF.md` · returns verbatim in `returns/`*

Models: `gpt` (GPT, web chat), `gemini` (Gemini, web chat), `openai/gpt-oss-120b`,
`qwen/qwen3.8-27b`, `groq/compound` (the last three via Groq; `compound` routes to
`gpt-oss-120b` underneath, so those two are less independent than the count suggests).

## Verdict

**Do not build one native app for all three purposes.** Purpose B is
self-contradicting, C is a content-packaging problem, and A — the only purpose with
a real user — is not solved by a native shell. The transport fix A actually needs is
already installed on this machine.

**5/5 models say Purpose B is dead**, and none of them says it on cost grounds. It
cannot exist as specified: a sideload-only APK has no distribution path to the
public. GPT: *"this is really a private app containing public web content."* Gemini:
*"a public audience of 40 sessions across 13 days will not, and cannot, sideload an
unlisted, self-signed APK."* qwen: *"a door that no one walks through."*

## Where they agree, and it survives verification

| Claim | Models | Verified |
|---|---|---|
| Purpose B is incoherent, not merely low-value | 5/5 | CONFIRMED — no public channel exists under sideload-only; 40 sessions/13 d |
| APK is not a confidentiality boundary — `unzip base.apk` reads `assets/` | 5/5 | CONFIRMED mechanism. GPT adds the key-recovery corollary: encrypting assets only moves the secret into the same binary |
| A fourth design-system implementation in Flutter is a cost, not a feature | 5/5 | Accepted with a caveat (below) |
| No native-only capability is needed for B or C | gpt, gemini, gpt-oss, compound | CONFIRMED |
| Purpose A is the only purpose with a real user and time-sensitive events | 4/5 | CONFIRMED |
| Do not adopt Material 3 defaults over the existing geometry | gpt (asked directly), gemini | Accepted — no dissent |

## Where they disagree, and who wins

### 1. "The workstation sleeps" — the premise, and it was mine, and it is false

GPT and Gemini both built their Purpose A analysis on it. GPT: *"Tailscale solves
NAT/addressing, not machine availability."* Gemini: *"when the workstation sleeps,
the app hangs."* `gpt-oss-120b` went further and declared A non-viable outright.

Measured on this host: **0 suspend events in the current 23-hour boot**;
`journalctl --list-boots` shows reboot cycles, not sleep cycles. The RUNBOOK's
"whenever the workstation is asleep or offline" describes reboots and outages. I
copied that phrasing into the brief as a hard constraint, and **three of five
returns spent their Q2 budget solving a problem this machine does not have.**

Gemini asked for the exact number as its Q7 measurement; the answer is roughly 0%
sleep, and its "if it sleeps 90% of the time" branch never fires.

### 2. How to reach the loopback service

| Model | Pick |
|---|---|
| qwen | Tailscale Serve |
| gemini | Cloud state replica (Edge Config / Upstash) |
| gpt | Tailscale short-term; long-term move scheduler + state + API off-box |
| gpt-oss, compound | Move the pipeline to free cloud compute |

**qwen wins, and GPT's short-term half agrees.** Two reasons, both measured:

1. **Tailscale is already installed and the phone is already enrolled.**
   `tailscale status` → v1.102.2, 3 devices, including `redmi-note-15` (Android,
   last seen 105 d ago). `tailscale serve status` → "No serve config". The work is
   one command, not an architecture. GPT explicitly declined to assume the topology
   ("I would not assume that part from the brief") and Gemini flagged it as its own
   moderate-confidence gap — both were right to hedge; the brief should have stated it.
2. **The cloud-compute picks are ruled out by the pipeline's own README.**
   `ph-scraper-mcp/README.md:73-80` — platforms serve a `punish?x5secdata=` wall to
   "flagged/datacenter IPs", the adapter raises `PlatformBlocked`, and the documented
   fix is a residential proxy. Shopee is auth-walled behind `af-ac-enc-*` tokens
   computed by in-page JS. **Gemini alone got this right unprompted** — *"you lose
   residential IP masking for the 5 marketplace scrapers (resulting in WAF blocks)"* —
   while `gpt-oss` and `compound` made cloud migration their top recommendation.
   GPT hedged correctly in its caveats: not enough detail to prove GitHub-hosted
   execution reproduces it.

That two models recommended the one forbidden option is a brief defect: the three
websites got a table, the pipeline got a paragraph, and **reviewers optimise the
layer you explain best.**

### 3. Is bundling all 94 documents acceptable?

**Gemini says yes** (*"operationally acceptable only because of Decision 1"*).
The other four say no. **GPT gives the answer that actually resolves it**: the
mechanism is not the question, the contract is — *"bundling 94 is acceptable only if
the relevant NDAs actually permit those local copies on those devices. The brief does
not establish that, so the contractual answer is unknown."*

That is correct and it is the only honest position: this is not a technical call, and
nothing measurable on this box settles it. Until the NDA terms are checked, the
allowlist applies to any client. Cost of that, stated plainly by both GPT and Gemini:
offline access to the other 92 documents, which is most of C's value.

### 4. What breaks first

Three different answers, all plausible, none verifiable without building it:
GPT says the **offline promise** (a WebView still needs the network, so "offline
reader" fails the moment you go offline — and fixing it means building a second
content-delivery system inside Flutter, at which point "we're just wrapping the
sites" is no longer true). Gemini says **hardware back-button versus SvelteKit's
client router**, plus `target="_blank"` marketplace links trapping the WebView.
`compound` says **asset/CSP failures on first load**. GPT's is the most consequential
because it breaks a stated purpose rather than an interaction.

## Rejected outright

- **Move the pipeline to Vercel / GitHub Actions / Cloudflare Workers / free VPS**
  (`gpt-oss` pick, `compound` pick, GPT's long-term half). Datacenter-IP blocking.
- **"5 GB FTS SQLite index"** (Gemini's assumption). Measured: `~/.cache/ph-scraper/cache.db`
  is **353 MB**. Gemini's own thresholds were 20 MB (sync the file) and 5 GB (remote
  only), so the real number sits between its two branches — and the dichotomy
  dissolves on inspection, because the bulk is raw scrape payload a phone never
  needs: `search_cache` 96 MB and `product_cache` 87 MB by `dbstat`, against
  `listing_status` at **362 rows**. The triage-relevant slice is a few MB.
- **"Corpus > 500 MB / the 2 GB Cache API limit"** (`compound`, `gpt-oss`). Corpus is
  **1.4 MB of markdown** (62 MB with images). Three orders of magnitude off.
- **"Fly.io free tier: one shared VM"** (qwen). Discontinued 2024; already recorded
  in the portfolio's deploy notes.
- **"Configure Windows Power Plan"** (qwen). Linux host. Moot anyway — nothing sleeps.
- **"A PWA cannot contact the private loopback service"** (`compound`'s single claimed
  native-only capability). True only while the service is plain HTTP. Under Tailscale
  Serve it is HTTPS on a real `*.ts.net` LetsEncrypt certificate, so the
  mixed-content block disappears — and the transport fix is needed for a native app too.
  **Correction, 2026-09-17, after attempting it:** that certificate is not available
  until HTTPS Certificates are enabled for the tailnet in the admin console. This
  tailnet has them off — `tailscale cert` returns "your Tailscale account does not
  support getting TLS certs" and `CertDomains` is `None`, which is why
  `tailscale serve` hangs. The rejection above still stands, but it costs one
  admin-console setting, not zero. `CertDomains: None` was visible in the data used
  for this synthesis and was read past.
- **"Rooted device" and "shoulder-surfing"** as NDA leak vectors (qwen). Weak. The
  real vectors are `unzip base.apk` and cloud backup of app data.

## The one native-only capability anybody named, and what it is worth

Gemini, alone and correctly: **background execution independent of a push payload.**
A PWA cannot wake itself on a schedule to poll the tailnet; it needs something to
push it. That is a true limitation.

It does not apply here. The workstation runs the schedule already — 14 systemd units,
and it is awake ~100% of the time as measured. It can send the push itself; Web Push
needs VAPID keys and `pywebpush`, not a hosted server and not an FCM project. The
phone never needs to wake itself to poll something that can call it.

So the honest position: **the capability is real, the need for it is not.**

## Accepted, with a caveat the models could not know

All five recommend unifying the three divergent web theme implementations before any
mobile work. **Accept the reasoning, do not bundle the work.** The 2026-09-15 audit
found unification orthogonal to mobile work and bundling it scope creep with no e2e
suite to catch regressions. Gemini independently reaches the same place from the
other direction: *"unifying the web three is a distraction from building the operator
console you actually need."*

## The security finding, stated plainly

Hunt Studio has **no authentication**. `HOST=127.0.0.1` in the systemd unit is its
entire access control, and `studio/svelte.config.js:9-10` says so in a comment. Its
surface is 20 API endpoints, **12 of them writes**, and `/api/control` invokes
`systemctl --user` (argv array, no shell, allowlist-guarded — that part is done right).

- **`tailscale serve` (tailnet-only) is acceptable**: 3 devices, all the operator's.
- **`tailscale funnel` would publish an unauthenticated systemd-control API to the
  public internet.** Never run it against port 5317.
- Add a token on write paths. The comment saying "loopback is the boundary" stops
  being true the moment Serve is on.
- SvelteKit's CSRF origin check is on by default, and the config relies on loopback.
  Writes arriving with a `*.ts.net` Origin will fail until `ORIGIN` is set for the
  daemon. **This breaks first.**

GPT's Q8 sharpens the same point into the finding of the round: **what is the APK's
trust boundary?** One artifact would hold public content, an operator control plane,
and confidential research, with no boundary between them. Sideloading removes store
distribution; it does not create a security boundary inside the binary. That argues
against one app more strongly than any Flutter-versus-PWA comparison.

## What to do, ranked by evidence strength

1. **Kill Purpose B.** 5/5 models; no public channel exists under sideload-only.
   Cost: zero.
2. **`tailscale serve` Hunt Studio, set `ORIGIN`, add a write-path token.** Software
   already installed, phone already enrolled. Delivers A's read path with no app.
3. **Install Hunt Studio itself as a PWA from the tailnet** — Gemini's Q8, and the
   best single suggestion in the round: manifest plus service worker on the app that
   already has the 10 routes and 20 endpoints, instead of reimplementing them.
4. **Web Push from the pipeline for alerts.** The workstation sends when awake, which
   is ~always. No hosted push server, no FCM project.
5. **Keep the publish allowlist applying to any client until the NDA terms are
   actually read.** 4/5 models, and GPT's framing is the correct one: the blocker is
   contractual, not technical, and it is currently **unknown**.
6. **Only then ask whether native adds anything.** Present evidence: a fourth
   design-system implementation, a manual APK update path with no CI on any repo
   (`compound`'s Q8), a merged trust boundary (GPT's Q8), and no needed capability.

## Method flaws in this round, recorded

1. **The brief asserted "the workstation sleeps" without measuring it.** False. Three
   of five returns spent Q2 on it. Same failure class as 2026-09-15, where the brief's
   breakpoint census was an invalid metric.
2. **The brief did not state that a tailnet already exists with the phone enrolled.**
   Both web-chat models flagged the gap honestly rather than inventing a topology —
   the better behaviour, and it still cost a question.
3. **The pipeline was under-described relative to the websites**, so two models
   recommended the option its own README forbids.
4. **`groq/compound` shares a model and a rate-limit budget with `gpt-oss-120b`**, so
   five returns are closer to four independent opinions.
5. **Two returns truncated** on the free tier (`qwen` mid-Q3, `gpt-oss` mid-caveats).
