# Review of One-App Native Mobile Client Proposal

## 1. Purposes A, B and C in one sideloaded app: which survive, and which is incoherent?

**Purpose B is incoherent.**

The incoherence is not technical; it is structural. You are proposing to build a "Public consolidated app" for an audience that consists of **32 total sessions** (12 mobile on diesel, 8 mobile on www) over 13 days, minus your own instrumentation tests. Even if *every* mobile session were a unique human who desired the app, you are building a native distribution channel for <20 potential users.

The contradiction: You are trying to use a **native, sideloaded binary** to serve a **public, web-native artifact**.
*   **Reason 1:** A sideloaded APK does not go to visitors. Visitors encounter `diesel.necir.ph` or `www.necir.ph` via link. They will not download your self-signed APK from a GitHub release page because their hands are full of diesel engines or they are browsing a portfolio. You are building a door that no one walks through.
*   **Reason 2:** The three sites are already fluid-first and passed audit (Decision 5). There is no functional deficit to cure. You are not solving a usability problem; you are solving a "I want a native app" problem for an audience that is effectively non-existent.

**Purpose C is incoherent as specified for a "public" app, and barely coherent for a private one.**
*   If C is part of Purpose B (Public), it leaks NDA documents (see Q3).
*   If C is part of Purpose A (Private), it is redundant with "offline access for the operator," but the mechanism is flawed (see Q3).

**Purpose A is the only coherent purpose.**
It addresses a real user (you), a real workflow (deal hunting), a real gap (loopback-only console with no push), and a real need (alerts). However, it is being sabotaged by being bundled with B and C.

**Verdict:** Do not build this as one app. Build **only Purpose A** as a separate, private, sideloaded tool. Kill B and C. The public sites stay as they are. The research reader stays on the web.

## 2. Purpose A requires reaching a loopback-only service on a workstation that sleeps. Options and failure modes.

The core problem: Hunt Studio binds to `127.0.0.1:5317` on your workstation. Your phone is never on the same network as the workstation. The workstation sleeps.

**Option 1: Dynamic DNS + Firewall Port Forward (Free)**
*   **Mechanism:** Install a DDNS client on the workstation (e.g., No-IP free tier, or self-hosted Syncthing companion). Configure router port forward for `5317` to the workstation's LAN IP. Use Tailscale (Personal plan, free) to create a virtual network between phone and workstation.
*   **Failure Modes:**
    *   Workstation sleeps: Tailscale agent suspends. Phone cannot reach it. No push.
    *   Router reboots: Port forward lost if not persisted.
    *   ISP blocks inbound 5317 (rare, but possible).
*   **Verdict:** Viable if you keep the workstation awake 24/7. But "workstation sleeps" is stated as a constraint. If it sleeps, this fails completely during sleep.

**Option 2: Move Scheduling Off Workstation (Free Tier Cloud)**
*   **Mechanism:** Move the Python scraping/hunting logic to a free-tier serverless function or container.
    *   **Vercel Hobby:** Already using it. Functions are cheap, but Python runtime is limited (Edge vs Node). Your system uses SQLite caching and FTS. SQLite is not persistent on Vercel. You would need to persist state in Postgres (Neon free tier) or S3-compatible storage.
    *   **Fly.io Free Tier:** One shared VM. Can run long-lived Python. Has SQLite mount.
    *   **Oracle Cloud Free Tier:** Always-free ARM instance. Enough for a scraper.
*   **Failure Modes:**
    *   **State Migration:** Your SQLite cache is local. Moving to cloud means rewriting persistence. This is a **major** scope increase.
    *   **Latency:** Scraping 5 marketplaces from a free-tier VM (US/EU) to PH/US sites may hit IP throttling/blocking. Your residential IP is currently invisible to those sites. A datacenter IP may be blocked.
    *   **Complexity:** You are introducing a new deployment target, new secrets management, and new monitoring for a system that currently runs as 14 systemd units.
*   **Verdict:** **Correct long-term, but dangerous short-term.** It solves the "sleeping workstation" problem permanently. It breaks the "scraper identity is residential" assumption.

**Option 3: WebSocket Reverse Tunnel (Tailscale + Simple Tunneling App)**
*   **Mechanism:** Use Tailscale Serve/Funnel to expose Hunt Studio.
    *   **Tailscale Serve:** Exposes a port on the Tailscale IP, not public internet. Your phone joins the same Tailscale network. Phone connects to `100.x.y.z:5317`.
    *   **Constraint:** Tailscale requires the Tailscale agent to be running and the machine to be awake.
*   **Failure Modes:**
    *   **Sleep:** If workstation sleeps, Tailscale disconnects. Phone gets no data.
    *   **Latency:** Negligible.
*   **Verdict:** **This is the solution.** Pick **Option 3 (Tailscale Serve)** combined with **preventing workstation sleep** (power management config: never sleep when plugged in).
    *   *What breaks when workstation is offline?* Nothing. The phone just shows "Offline" or "Last synced: 2h ago." The push notifications stop. The deal hunt stops. You lose the "alert" capability, but you retain the "view cached state" capability if the app caches the last response.

**Specific Instruction for Implementation:**
1.  Install Tailscale on Workstation and Phone.
2.  Configure Tailscale Serve on the Workstation to expose `http://127.0.0.1:5317` as `https://<workstation-tsdns-name>.ts.net` (with automatic Tailscale TLS cert).
3.  Update Hunt Studio config to accept requests from the Tailscale subnet (or keep it loopback and use a lightweight reverse proxy on the workstation that listens on the Tailscale interface and forwards to 127.0.0.1:5317).
4.  Configure Windows Power Plan: "Never" sleep when plugged in. "1 Hour" sleep when on battery (you won't be using it for Hunt Studio on battery).
5.  **Push Notifications:** Tailscale does not do push. You need a **separate** push mechanism.
    *   **Solution:** Deploy a tiny **Webhook Server** to Vercel/VPS.
    *   The Python script runs on the workstation. When a deal is found, it sends a POST request to `https://alerts.necir.ph/hook` (your free-tier serverless function).
    *   The serverless function forwards this to **OneSignal** (free tier) or **FCM** directly (requires your own Firebase project, free).
    *   The Flutter app registers for FCM push.
    *   **Failure Mode:** If workstation is asleep, the Python script doesn't run, so no POST to the webhook, so no push. This is acceptable. You lose alerts during sleep, which is fine because you aren't hunting deals at 3 AM.

## 3. Purpose C and the NDA allowlist.

**Is bundling all 94 documents acceptable?**
**No.**

**The specific leak mechanism:**
1.  **APK Decompression:** Any Android APK is a Zip file. Any user (or forensic tool) can unpack the APK. If the 94 PDFs/Markdown files are in `assets/`, they are plain text.
2.  **Disk Encryption Limitations:** While modern Android offers file-based encryption, a **rooted** device (or a cracked Android 12+ with certain exploits) can read the app's data directory. Even on a non-rooted device, a backup via `adb backup` may extract app data.
3.  **The "Phone Left Unlocked" Risk:** If a friend borrows your phone, or you leave it on a counter, and they have physical access, they can potentially access app data directories if the phone is compromised. More importantly, **shouldersurfing**. If you bundle all docs, you assume the app is secure. It is not.
4.  **The "Social Engineering" Risk:** You are an engineer with a side business. If an NDA client sees you discussing "all my research" in a native app context, or if you accidentally share a screenshot, the fact that the *entire* corpus is stored locally on a mobile device is a liability.

**Should the allowlist apply to the app unchanged?**
**Yes.** The app should only fetch/display the 2 public documents.

**What capability does this cost
