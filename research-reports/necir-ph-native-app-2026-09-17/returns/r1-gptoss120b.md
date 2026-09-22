## 1.  Purposes A, B and C in one sideloaded app  

| Purpose | Survives the stated constraints? | Why it fails / is incoherent |
|---------|----------------------------------|------------------------------|
| **A – Operator console** | **Does not survive** | It must talk to a *loopback‑only* service (`127.0.0.1:5317`) that runs on the operator’s workstation **and** the workstation sleeps most of the day. With no static IP, no paid tunnel, and no budget for a cloud relay, the console cannot reliably reach that API when the machine is offline. The requirement “push notifications” also needs a server‑side push source, which does not exist. |
| **B – Public consolidated app** | **Partially survives** | The three sites already render correctly on mobile browsers (audit 2026‑09‑15). The app would only duplicate that capability and add no technical advantage. It is feasible (the APK can load the three URLs in WebViews) but offers no justification against the extra maintenance burden. |
| **C – Offline research reader** | **Survives** | The only real need for native code is to provide guaranteed offline access to the research corpus. This can be satisfied by bundling the allowed documents (or a cache) inside the APK. No external service or authentication is required, so it fits the sideload‑only, zero‑budget model. |

**Bottom line:** Only purpose C is internally consistent; A is self‑contradictory, B is redundant.

---

## 2.  Reaching the loop‑back‑only service (Purpose A)  

### Options (free‑tier, no static IP, no budget)

| Option | How it works | Failure modes |
|--------|--------------|--------------|
| **a. Public tunneling (ngrok, Cloudflare Tunnel, localtunnel)** | The workstation runs a tunnel client that exposes `localhost:5317` on a random public URL. | Free tier limits concurrent tunnels, URL changes on restart, tunnel drops when the workstation sleeps → console sees “service unavailable”. |
| **b. Expose via Vercel Serverless Function** | Move the Hunt‑Studio API into a Vercel edge function; the app calls `https://api.necir.ph/...`. | Requires rewriting the API, adding auth (none currently). Free Hobby tier limits invocations; any bug in the moved API breaks the console. |
| **c. Push‑based notification via Firebase Cloud Messaging (FCM)** | The pipeline, when it discovers a deal, sends an FCM message directly to the device. The app shows a local notification; no polling of the workstation. | Requires the pipeline to run **somewhere** that can reach the internet (i.e., not the sleeping workstation). If the pipeline stays on the workstation, no messages are sent while it sleeps. |
| **d. Off‑load scheduling to a free cloud cron (GitHub Actions, Vercel Cron)** | The deal‑hunt scripts run as scheduled CI jobs; results are stored in a public static JSON bucket (e.g., GitHub Pages). The app polls that bucket. | CI free tiers have limited minutes; the pipeline may not run as frequently as needed. When the workstation is offline, the data is stale but the app still works (it just shows old results). |
| **e. Hybrid “sync‑when‑online”** – workstation writes its latest index to a public repo or bucket whenever it is awake; the app fetches that file on start‑up. | Same as (d) but the workstation is the source. | If the workstation never wakes, the file never updates → no new alerts. |

### Which I would pick  

**Option d (cloud cron / static JSON sync)** – it removes the dependency on the workstation being reachable. The app can still function offline (reading the last synced file) and will simply show stale data when the workstation is asleep.  

**What breaks when the workstation is offline:** any solution that relies on a live tunnel or direct HTTP to `127.0.0.1` (options a, c) stops delivering new alerts; the console becomes non‑functional until the machine wakes.

---

## 3.  NDA allowlist vs bundling all 94 documents (Purpose C)

*Is bundling acceptable?* **No.**  
Even though the APK is sideloaded only to the operator’s devices, an APK is a ZIP archive that any user (or the operator themselves) can unzip with `apktool` or any archive utility. The extracted files are trivially readable and can be copied to any other device or uploaded to the internet, breaking the NDA.

**Leak mechanism:**  

1. `apk install` → `/data/app/.../base.apk` (ZIP).  
2. `unzip base.apk` → `assets/research/*.md` (or whatever format).  
3. Files are plain‑text; no DRM or encryption is present.  

Thus the mere act of bundling the 92 non‑public documents creates a *distribution vector* that bypasses the “deny‑by‑default allowlist”.

**If the allowlist must stay unchanged:** the app must *fetch* documents at runtime from a server that enforces the allowlist (e.g., a Vercel edge function that reads `publish.manifest.json`). This adds a network dependency and means offline reading is limited to the two public documents unless the device caches them after an authenticated fetch – which costs storage and adds complexity.

---

## 4.  Honest case for native vs a PWA with Service Worker & Web Push  

With **40 sessions in 13 days** (≈3 sessions per day) the traffic is negligible.  

*Specific capability that **A** or **C** needs and a 2026 Android PWA cannot deliver:* **None**.  

- **Push notifications:** Android PWAs can receive Web Push via Firebase (same server needed for native).  
- **Offline large‑document access:** A PWA can cache the research PDFs/markdowns with the Cache API; size limits (≈2 GB on modern Chrome) are far above the ~94 documents.  
- **Background processing for alerts:** A PWA can use Periodic Background Sync (still experimental) but the same limitation exists – a server must push the data anyway.  

Therefore there is *no exclusive native capability* required by the stated purposes.

---

## 5.  What would break first in the combined Flutter app?  

**The first functional failure will be the loopback API call to `127.0.0.1:5317`** (Operator console) as soon as the operator’s workstation is asleep or the tunnel is not active. The rest of the UI (WebViews for the three sites) would still load, but the console portion would immediately error out.

---

## 6.  Design‑system reimplementation cost  

**Pick:** *Unify the three web implementations first.*  

- The three sites already share the same visual language (opaque flats, radius 0, fixed elevation colours). Consolidating them into a single Tailwind‑based design‑token package would eliminate duplicated CSS, simplify future changes, and provide a **single source of truth** that could be exported as JSON for Flutter.  
- Re‑creating the design system a **fourth time** in Flutter adds a non‑recoverable cost (design‑token translation, maintenance of two parallel systems) without any clear benefit, because the native UI would still need its own widget definitions. Unifying the web first yields a reusable token file that can be consumed by both web and Flutter, reducing overall effort.

---

## 7.  Measurement that would change the answer  

| Measurement | Why it matters |
|-------------|----------------|
| **Average daily alerts generated by the pipeline** (e.g., > 10 alerts/day) | If alerts become frequent enough that missing one due to workstation sleep is costly, a dedicated native push path might be justified. |
| **Growth rate of mobile sessions** (e.g., > 200 sessions/month) | Higher traffic would increase the ROI of a native app vs a thin PWA wrapper. |
| **Size of the research corpus** (total megabytes) | If the corpus grows beyond the practical cache size of a PWA (or exceeds the 2 GB Cache API limit), native bundling might become advantageous. |
| **Uptime of the workstation** (percentage of time awake) | If the workstation is awake > 95 % of the time, a tunnel‑based solution could be viable; if < 30 %, it is not. |
| **Number of distinct devices that need offline access** | More devices increase the attack surface for NDA leakage; measuring this would influence whether bundling is acceptable. |

Any one of these crossing a reasonable threshold would tilt the cost‑benefit toward a native solution.

---

## 8.  What I’m not asking that I should be  

**“What are the legal and liability risks of embedding NDA‑covered documents in a distributable APK, and how can they be mitigated?”** – this directly impacts the feasibility of Purpose C and any future distribution beyond the operator’s own phones.

---

## Confidence and caveats  

- **High confidence** on the incompatibility of Purpose A with a sleeping workstation and the leak mechanism of an APK (well‑known ZIP structure).  
- **Moderate confidence** that a PWA can cache the entire
