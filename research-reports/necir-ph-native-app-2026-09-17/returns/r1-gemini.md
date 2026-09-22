## 1. Purposes A, B and C in one sideloaded app: which of the three survive contact with the constraints, and which is incoherent?

**Purpose A (Operator console)** survives. It serves the single daily user (you), benefits directly from being on your physical device, and leverages the Flutter toolchain you already have installed.

**Purpose B (Public consolidated app)** is completely incoherent. Decision 1 dictates the app is "sideload-only... installed on the operator's own devices." A public audience of 40 sessions across 13 days will not, and cannot, sideload an unlisted, self-signed APK from your portfolio to browse web content they already have access to.

**Purpose C (Offline research reader)** survives *only* if redefined as a private operator tool, explicitly abandoning Purpose B. If you build it for yourself, it works. If you try to serve both yourself and the public with the same binary, you create a fatal conflict between the NDA allowlist (2 of 94 docs) and offline utility (needing all 94 docs).

## 2. Purpose A requires reaching a loopback-only service on a workstation that sleeps.

**Options:**

1. **Tailscale / ZeroTier (VPN overlay):** App connects directly to the workstation's Tailscale IP (port 5317).
* *Failure mode:* When the workstation sleeps, the app hangs or throws connection timeouts. You cannot triage or trigger hunts.


2. **Move the Python/systemd pipeline to the cloud (Always-Free VPS or Vercel cron):**
* *Failure mode:* You lose residential IP masking for the 5 marketplace scrapers (resulting in WAF blocks), and a 5GB FTS SQLite index will quickly exhaust free-tier ephemeral storage or RAM.


3. **Async State Sync via Vercel Edge Config / Upstash Redis (Free):** Workstation pushes state (deals, price indices) to the cloud when awake. The app reads from the cloud. The app pushes commands to a cloud queue; the workstation executes them upon waking.
* *Failure mode:* State is stale while the workstation sleeps. Time-sensitive deals may expire before the workstation wakes to execute the claim/triage.



**Recommendation:** Option 3. To prevent the app from breaking when the workstation is offline, the mobile client must read from a highly available replica (cloud), not the loopback origin.

## 3. Purpose C and the NDA allowlist.

Bundling all 94 documents into the APK is operationally acceptable *only* because of Decision 1 (installed strictly on your own devices).

However, if you ever host this APK for download (accidentally pursuing Purpose B), the leak mechanism is trivial: **an APK is an unencrypted ZIP archive.** Anyone downloading the APK can rename it to `.zip`, extract it, navigate to the `assets/` directory (where Flutter bundles local files), and read the 92 NDA-protected markdown/text files in plain text. No decompilation of the Dart code is required.

If you enforce the `publish.manifest.json` allowlist on the app to protect the NDA, the capability cost is the entire premise of Purpose C: you lose the ability to use your own phone as an offline reference for your 92 private research and client documents.

## 4. Given 40 sessions in 13 days, what is the honest case for native over a PWA with a service worker and Web Push?

There is no honest case for native for the web properties (`www`, `diesel`, `research`).

For Purpose A (Operator Console), a 2026 Android PWA with a Service Worker can handle offline caching, and Web Push can deliver notifications. The specific capability a PWA *cannot* deliver natively is **background execution independent of a push payload**. If your app needs to wake up in the background on a schedule, directly poll the local network (Tailscale IP) for new deals, run heavy Dart isolate processing on the SQLite FTS index, and trigger a *local* notification without relying on a third-party push server (like FCM), a PWA cannot do this. A PWA requires an external server to push the event.

If you are just going to read from an API, the PWA is perfectly capable.

## 5. What would you expect to break first

**Navigation state and hardware back-button routing inside WebViews.**

If you wrap three fluid SvelteKit sites inside a Flutter app using `webview_flutter`, the Android hardware back button will inevitably conflict with the SvelteKit client-side router. You will encounter states where pressing "back" exits the entire Flutter app instead of popping the SvelteKit history stack, or where clicking a `target="_blank"` link (like your Facebook Marketplace links on `diesel`) fails to resolve or traps the user in an un-navigable WebView overlay.

## 6. Reimplementing the design system a fourth time in Flutter: unavoidable cost, argument against native, or argument for unifying the web three first?

**Argument against native.**

You have one engineer and zero revenue. Unifying the web three is a distraction from building the operator console you actually need. Reimplementing rigid rules (radius 0, flat shadow, 2 font weights) in Flutter's Material-heavy `ThemeData` is technically straightforward, but introduces a fourth divergent source of truth to maintain for a purely stylistic reason. It highlights that wrapping existing, perfectly functioning web views in a native UI is busywork.

## 7. What measurement would change your answer?

1. **Workstation sleep percentage:** The exact hours per week the workstation is asleep versus awake. If it sleeps 90% of the time, building a real-time console is useless and the architecture must shift entirely to async queues.
2. **SQLite FTS database size (in MB) and daily mutation rate:** If the index is 20MB, the workstation can just aggressively sync the entire SQLite file to the phone for true offline querying. If it's 5GB, the phone *must* rely on remote queries.

## 8. What am I not asking that I should be?

**"Why not just add a manifest.json and Service Worker to the existing Hunt Studio SvelteKit app, and install it to my Android homescreen?"**

You already have the 10 routes and 20 API endpoints working on port 5317. Setting it up as a PWA gives you the full-screen "app" experience on your phone via Tailscale in about 15 lines of code, skipping Flutter entirely, and requires zero duplicated UI effort.

---

## Confidence and caveats

* **High confidence** that Purpose B is fundamentally incompatible with the reality of your constraints and should be scrapped entirely.
* **High confidence** on the APK asset leak mechanism.
* **Moderate confidence** on the exact network topology you are using to access the loopback port from your phone (assuming you are currently using Tailscale/Wireguard, as it was not explicitly stated how the phone reaches port 5317 when at home vs away).
* **Caveat:** The exact nature of the "deal-hunt alerts" was underspecified. If those alerts *must* be real-time (within seconds) to beat other buyers on Facebook Marketplace, Option 3 in Question 2 fails, and keeping the workstation awake (or moving the scraper to a VPS despite the IP risk) becomes a hard requirement.
