# 1. Viability of A, B, C in a single sideloaded APK  

| Purpose | Survives the constraints? | Why it fails / succeeds |
|---------|---------------------------|--------------------------|
| **A – Operator console** | **Yes** | The operator is a single trusted user; a native app can hold the push‑notification token and invoke a local API. The only technical friction is reaching the loopback service when the workstation sleeps (see Q2). |
| **B – Public consolidated app** | **No** | • The three sites already render correctly on phones (audit 2026‑09‑15). <br>• Traffic is **40 sessions in 13 days** (≈ 3 sessions/day) – far below a threshold that justifies native development cost. <br>• A sideloaded APK gives no distribution advantage; a PWA would reach the same audience without extra code. |
| **C – Offline research reader** | **Yes, but with NDA caveat** | Bundling the 94 documents is technically possible, but the NDA‑protected files would be present on the device and trivially extractable (APK = zip). Keeping the allowlist in‑app preserves the legal guarantee but forces runtime filtering. |

# 2. Reaching the loopback‑only service (Purpose A)  

### Options (free‑tier, no static IP)

| # | Option | How it works | Failure mode(s) |
|---|--------|--------------|-----------------|
| 1 | **Local‑LAN only** – app contacts `http://127.0.0.1:5317` on the same Wi‑Fi network. | Requires the workstation to be awake, on the same subnet, and to have a stable LAN IP (or mDNS name). | Workstation sleeps → no alerts. IP change or Wi‑Fi drop → connection error. |
| 2 | **Reverse‑proxy tunnel** – free Cloudflare Tunnel / Ngrok free tier exposing `localhost:5317` to a public URL. | Tunnel runs on the workstation; the app talks to the public URL (HTTPS). | Tunnel disconnects when workstation sleeps; free tier limits (hourly uptime, bandwidth). |
| 3 | **Move scheduling off‑workstation** – run the hunt/price‑index as a serverless job (Vercel Edge Functions, GitHub Actions, Cloudflare Workers). | Alerts are generated in the cloud and sent via Firebase Cloud Messaging (FCM). | Free‑tier execution quotas may be hit; loss of “local‑only” privacy guarantee. |
| 4 | **Hybrid** – keep the pipeline locally but push results to a cheap cloud queue (e.g., free Firebase Realtime DB) that the app reads. | Workstation writes to the queue when awake; app reads regardless of workstation state. | Queue empty when workstation offline → stale data; free‑tier read/write limits. |

**Pick:** Option 3 (move scheduling to a free serverless platform). It eliminates the “workstation asleep” dead‑zone and uses the same push‑notification channel already needed for alerts. When the workstation is offline, the only thing that breaks is the *local* ability to edit the pipeline config from the phone – you would have to edit the config via the cloud UI instead.

# 3. NDA allowlist vs. bundling all 94 documents (Purpose C)

*Acceptability:* Legally risky. The operator’s devices are trusted, but an APK can be copied, unzipped, and its `assets/` folder inspected. Any NDA‑protected PDF/markdown placed there becomes readable by anyone with device access or a backup.

*Leak mechanism:*  
1. APK is a ZIP archive.  
2. An attacker (or the operator’s own backup tool) extracts `app.apk → assets/research/*.pdf`.  
3. Files are stored unencrypted on the device’s internal storage unless you add extra encryption layers.

*If you keep the allowlist unchanged:* you must implement runtime filtering (e.g., load a manifest at startup and hide disallowed docs). This adds ~200 lines of Dart code and a small JSON asset, but preserves the legal guarantee. Dropping the allowlist removes that guarantee and exposes the NDA docs to the leak path above.

# 4. Honest case for native vs. a PWA (given 40 sessions/13 days)

The only capability that **native** can provide that a 2026 Android PWA cannot, in this context, is **reliable background execution that can contact a private loopback service without the browser’s CORS / service‑worker restrictions**.  

* PWA background sync / periodic sync is optional and often throttled on free‑tier browsers; it cannot open arbitrary TCP sockets to `127.0.0.1:5317`.  
* Native Android can run a foreground/background service that polls the local API (or receives FCM) even when the UI is not visible.

If you move the pipeline to the cloud (Option 3 above), **no** native‑only capability remains; a PWA with a service worker and Web Push would be sufficient.

# 5. First thing likely to break in a single Flutter wrapper

**WebView navigation of the prerendered SvelteKit sites** – relative asset URLs, CSP headers, and the lack of a service worker in the embedded view will cause missing CSS/JS, broken redirects (`/l/<code>`), and failed navigation on the first page load. This will surface before any native console logic runs.

# 6. Design‑system reimplementation cost

**Argument against native:** Re‑creating the design language a fourth time in Flutter adds a non‑trivial maintenance burden (different token sources, divergent theming). The smarter path is to **unify the three web sites first** (extract a shared JSON token set) and, if a native app is still desired, generate Flutter theme data from that single source. This reduces duplication and keeps the visual spec consistent.

# 7. Measurements that would change the answer

| Metric | Threshold that would make native worthwhile |
|--------|---------------------------------------------|
| **Mobile‑only sessions** (Umami) | > 500 distinct mobile sessions per month (≈ 17 /day) |
| **Push‑notification engagement** (click‑through) | > 10 % of delivered alerts opened |
| **Offline‑read count** (research app) | > 100 distinct offline document opens per month |
| **Operator‑alert latency** (time from deal‑hunt to notification) | < 5 seconds required (cannot be met by periodic PWA sync) |
| **Size of research corpus** | > 500 MB of assets that would make a PWA cache impractical on low‑end devices |

Collecting any of these would justify the extra native effort.

# 8. What you’re not asking but should be

**“What is the long‑term maintenance and security model for a sideloaded native APK that contains privileged data (NDA documents, push‑notification keys, and a private API client)?”**  
Without a formal update pipeline (no CI, no Play Store), each bug fix or security patch requires manual rebuild and redistribution, which quickly becomes unsustainable.

---

## Confidence and caveats

*High confidence* on traffic numbers, design‑system divergence, and the legal leakage path (APK = zip).  
*Medium confidence* on the exact feasibility of free‑tier serverless functions for the pipeline – Vercel Hobby limits may still be hit; a quick test would be needed.  
*Low confidence* on the exact push‑notification latency requirements of the operator; a measurement of current alert delay would clarify whether native background services are truly needed.  

If you can provide:

1. Real‑time latency requirements for alerts,  
2. Expected growth rate of mobile sessions, and  
3. A policy for OTA updates of the APK,

the recommendations could be refined further.
