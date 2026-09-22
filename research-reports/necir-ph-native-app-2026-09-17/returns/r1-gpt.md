# 1. Purposes A, B and C

**A — Operator console: survives, but not as specified.**
The UI is coherent; the availability model isn't. Hunt Studio is explicitly **loopback-only on the workstation** and the workstation may sleep, while A simultaneously wants time-sensitive deal alerts and phone access.  A native APK does not create a network path to a sleeping machine.

**B — Public consolidated app: self-contradictory as stated.**
The content can be public, but the *application* cannot be a public distribution surface when distribution is explicitly **sideload-only to the operator's own devices**, with no Play Store/App Store/TestFlight.  So this is really a **private app containing public web content**, not a public app.

The underlying sites already work as the public surface, and the measured traffic is only **40 sessions / 13 days**, actually fewer than 40 real-human sessions because some are operator instrumentation tests.

**C — Offline research reader: survives, with a hard content-boundary decision.**
Technically straightforward because the research site is completely prerendered/static. But bundling all 94 documents changes the security/publication model; the source says only **2/94 are intentionally public** and the allowlist exists precisely because of NDA material.

So my classification is:

| Purpose | Status                               | Core issue                                         |
| ------- | ------------------------------------ | -------------------------------------------------- |
| A       | **Viable after architecture change** | Workstation availability/reachability              |
| B       | **Incoherent as worded**             | "Public app" + operator-only sideload distribution |
| C       | **Viable**                           | NDA boundary must remain explicit                  |

The larger problem is that A is the only purpose with a genuine new capability requirement. B and C can already be served by the web architecture.

# 2. Reaching the loopback service

There are several materially different choices.

**LAN access.** Bind Hunt Studio beyond `127.0.0.1`, firewall it, and have the phone hit the workstation's LAN address. Simplest. Failure: phone must be on the same network, the workstation must be awake, its address must remain discoverable, and exposing a control surface to the LAN creates a new attack surface.

**Tailscale.** Put the phone and workstation in the same tailnet and expose the service through the workstation's Tailscale interface, or use a subnet-router arrangement. Tailscale's current Personal plan is free and permits unlimited user devices; subnet routing is supported across plans. ([Tailscale][1])
Failure: **the sleeping workstation is still dead**. Tailscale solves NAT/addressing, not machine availability. It also adds a private-network dependency to the app.

**Outbound tunnel.** A Cloudflare Tunnel-style arrangement avoids inbound NAT/static-IP problems because the workstation makes the outbound connection. Failure: again, **sleep kills it**, and you add an external tunnel provider plus another ingress boundary. With the registrar constraint, a custom-hostname setup also needs to be checked against how your DNS is currently managed; I would not assume that part from the brief.

**Port forwarding/DDNS.** Technically possible without static IP if the ISP permits inbound access. Failure modes are CGNAT, changing WAN IP, router configuration, and exposing an operator-control API directly to the Internet. This is the wrong place to save $0.

**Keep workstation as-is and accept availability loss.** Zero architectural change. When the workstation sleeps, A cannot read fresh Hunt Studio state, edit config, or execute anything.

**Move scheduling off the workstation.** This is the only option that actually attacks the availability problem rather than dressing it up.

For a zero-budget experiment, **GitHub Actions is the interesting candidate**: scheduled workflows can run as frequently as every five minutes, and GitHub Free currently includes **2,000 Actions minutes/month** for private repositories; public repositories get free standard-runner execution. ([GitHub Docs][2])

Vercel Hobby is substantially less suitable for the deal-hunt scheduler: its Cron jobs are capped at **once per day** with **±59 minutes** scheduling precision. ([Vercel][3])

But there is an important catch: **moving only the scheduler isn't enough**. Hunt Studio currently reads the pipeline's outputs and edits its declarative config on the workstation.  If the machine is offline, you still don't have the API/state that the phone needs.

So my pick is:

**Short term:** Tailscale + keep the workstation awake when needed.
**Actual A architecture:** move the **scheduler + persistent state + operator API** off the workstation together. GitHub Actions can handle scheduling, but you'd still need a durable remote state/control mechanism.

What breaks while the workstation is offline under the current architecture: **everything unique to Hunt Studio**. Remote notifications cannot originate from its local scheduler, current SQLite-derived state cannot be read, and config edits cannot reach the local pipeline.

# 3. NDA allowlist and bundling 94 documents

I would **not treat the 94-document bundle as equivalent to the site's publication model**.

The current system has a structural guarantee: only the manifest allowlist reaches the static production artifact, and the production server cannot inspect the source corpus.

Putting all 94 into the APK creates a second distribution artifact containing documents that production deliberately excludes.

The specific leakage mechanism is wonderfully boring: **an APK is not a confidentiality boundary**. If the document bytes are packaged as Flutter assets/resources, the APK can be unpacked and those assets extracted. If you encrypt them, the app must contain or obtain a decryption key; a key available to the application can ultimately be recovered or the plaintext captured at runtime. Obfuscation/compression changes inconvenience, not the trust boundary.

So:

**Bundling 94 is acceptable only if the relevant NDAs actually permit those local copies on those devices.** The brief does not establish that, so the contractual answer is **unknown**.

Applying the existing allowlist unchanged would cost one capability: **offline access to the 92 private documents**. You would still get an offline reader for the 2 documents intentionally published today.

That's the clean boundary.

# 4. Honest native-over-PWA case

Given the actual system: **there is no demonstrated capability here that Android PWA cannot provide.**

Your current public sites have **zero PWA manifests and zero service workers**, but that's an implementation state, not an inherent PWA limitation.

Android Chromium supports service-worker-based background push, with the service worker able to wake for a push event and display a notification even when the web app isn't open. ([web.dev][4]) Offline storage/caching is likewise a core service-worker/PWA mechanism. ([Chrome for Developers][5])

For **A**, native has one practical advantage: it can make ordinary native network calls without the browser's origin/mixed-content/private-network constraints. But that doesn't solve the actual failure: **the workstation can be asleep**.

For **C**, a service worker plus Cache Storage/IndexedDB can cache the static research corpus. Nothing in the brief identifies a research-reader operation requiring native-only Android capability.

So with **40 measured sessions in 13 days**, of which the actual human count is lower, the evidence for a native distribution layer is extremely thin.

# 5. What breaks first in the Flutter wrapper

**Purpose C: the "offline" promise.**

Wrapping the three remote SvelteKit sites in WebViews does **not** make them offline.

The WebView still needs the remote site unless you explicitly implement asset interception/caching/materialization. `research.necir.ph` being `adapter-static` helps enormously with *what* can be cached, but the proposed wrapper doesn't inherently perform that caching.

So the first concrete failure is:

> phone goes offline → WebView requests `research.necir.ph` → network request fails → "offline research reader" fails.

You then end up implementing a second content-delivery system inside Flutter anyway, at which point "we're just wrapping the sites" has stopped being true.

# 6. Fourth design-system implementation

**Argument against native.**

The existing design system is already **three divergent implementations**: Tailwind theme/hex values, short bespoke CSS variables, and 133 upstream `--ig-*` variables.

Adding Flutter creates a fourth renderer with a fourth token/component implementation.

That isn't merely some unavoidable one-time porting cost. It creates another place where changes to typography, spacing, elevation, interaction states, and component geometry can diverge.

Unifying the web implementations first would reduce that particular pain, but it doesn't answer whether an app is justified. Given the current traffic and zero demonstrated native-only capability, **the divergence itself is evidence against adding the fourth implementation now**.

And no, I wouldn't replace the visual language with wholesale Material 3 defaults; your stated geometry is a deliberate system, not an unfinished Material implementation.

# 7. Measurements that could change the answer

The useful measurements are mostly operational:

**Traffic.** Instrument `research.necir.ph`, then measure 30–90 days of mobile sessions, repeat visitors, document-route hits, and actual public-reader usage. Today that site has **no instrumentation**, so the 40-session figure excludes an entire site.

**Hunt workload.** Count hunts/day, median/max scrape duration, how often a result is time-sensitive enough that a 15/30/60-minute delay matters, and how many operator interventions/day actually happen from outside the workstation.

**Availability.** Log workstation sleep/offline intervals against attempted Hunt Studio access and alert events. This tells you whether A's real problem is inconvenience or actual missed work.

**Repository duplication.** Measure shared-component/token overlap across the three sites and then count the incremental Flutter implementation size. The current sites already total **6,848 Svelte/CSS lines** (1,658 + 2,671 + 2,519), which gives you a concrete baseline for how much UI surface you're reproducing.

**PWA prototype.** Build only the capabilities that matter: offline research caching and Web Push. Measure cache size, cold/offline launch success, push delivery latency, and whether the operator API can be exposed over HTTPS without making the networking architecture ugly.

A result showing **substantial Hunt Studio use while the workstation is asleep** would materially change the architecture decision. A result showing the sites remain at roughly today's traffic and the PWA handles offline/push requirements would push the other way.

# 8. What you're not asking

**What is the APK's trust boundary?**

You're combining three materially different classes of thing in one artifact:

**public content + operator control + potentially confidential research**.

That means one stolen/copied/reverse-engineered APK potentially becomes the container for all three. The sideload decision removes store distribution, but it does **not** create a security boundary between things packaged into the same APK.

That matters more than Flutter versus PWA. It determines whether this should actually be **one application at all**, even if all three surfaces happen to be visually related.

## Confidence and caveats

High confidence on the architectural contradictions and failure modes because they follow directly from the measured system described in the brief.

The two biggest unknowns are **the NDA terms governing local copies** and **what the Hunt pipeline actually requires at runtime** (credentials, browser automation, persistent SQLite semantics, etc.). The brief tells me it uses Python + SQLite + scheduled systemd units, but not enough to prove that GitHub-hosted execution can reproduce it unchanged.

The current Android/PWA capability claims are based on current platform documentation, including current 2026 GitHub/Vercel limits. ([web.dev][4])

The sharpest overall finding is: **don't build the proposed three-purpose app as one thing. A has a real architectural problem, B is distributionally self-contradictory, and C is mostly a content-packaging problem.** The native shell doesn't solve the hardest problem in A, while it creates a fourth implementation of everything else.

[1]: https://tailscale.com/pricing?utm_source=chatgpt.com "Tailscale pricing"
[2]: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows?utm_source=chatgpt.com "Events that trigger workflows - GitHub Docs"
[3]: https://vercel.com/docs/cron-jobs/usage-and-pricing?utm_source=chatgpt.com "Usage & Pricing for Cron Jobs"
[4]: https://web.dev/articles/push-notifications-overview?utm_source=chatgpt.com "Push notifications overview  |  Articles  |  web.dev"
[5]: https://developer.chrome.com/blog/default-offline?utm_source=chatgpt.com "Basic offline page for web apps on Chrome Android  |  Blog  |  Chrome for Developers"
