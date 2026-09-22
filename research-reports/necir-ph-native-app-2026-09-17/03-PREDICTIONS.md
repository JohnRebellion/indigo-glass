# Baseline and falsifiable predictions — necir.ph native app decision

Baseline captured 2026-09-17, before any change.

## Traffic baseline (umami, local Postgres)

| Metric | Value | Query |
|---|---|---|
| Distinct sessions, all sites, 2026-09-04 → 09-16 | 40 | `select count(distinct session_id) from website_event` |
| Events, same window | 51 | `select count(*) from website_event` |
| diesel.necir.ph mobile / desktop sessions | 12 / 2 | group by `session.device` |
| www.necir.ph mobile / desktop sessions | 8 / 18 | group by `session.device` |
| research.necir.ph | not instrumented | no `website` row |

## System baseline

| Metric | Value |
|---|---|
| Live hosts | 3 (`www`, `diesel`, `research`); apex 308 → www |
| Dead hosts still in notes | `go`, `sharp`, `analytics` — do not resolve |
| PWA manifests / service workers across 3 repos | 0 / 0 |
| e2e suites across 3 repos | 0 |
| Hunt Studio routes / API endpoints / write endpoints | 10 / 20 / 12 |
| Hunt Studio authentication | none — `HOST=127.0.0.1` is the only access control |
| Hunt Studio privileged surface | `/api/control` runs `systemctl --user` via argv array, allowlist-guarded |
| systemd units in pipeline | 14 |
| Workstation suspend events, current boot (23 h) | 0 |
| Tailnet | exists; 3 devices enrolled incl. operator's Android (`redmi-note-15`, last seen 105 d ago) |
| Research corpus | 94 docs, 1.4 MB markdown (62 MB incl. images) |
| Scraper cache DB | `~/.cache/ph-scraper/cache.db` = **353 MB**; by `dbstat`: `search_cache` 96 MB, `product_cache` 87 MB, `query_products` 36 MB |
| Rows | `product_cache` 67,939 · `query_products` 480,295 · `price_history` 484,079 · `listing_status` **362** |
| Published corpus | 2 docs, 72 KB staged in `static-corpus/` |

## Predictions — each with a threshold that makes it wrong

1. **Purpose B (public consolidated app) will acquire fewer than 5 installs in 90 days
   if built.** Wrong if ≥5 distinct non-operator devices install the APK by 2026-12-17.
2. **Exposing Hunt Studio over Tailscale Serve needs no new auth code to be
   operationally safe, and no new code at all beyond one `tailscale serve` command
   plus a `HOST` change.** Wrong if the tailnet device list ever contains a device
   not owned by the operator, or if Serve requires the app to change its bind.
3. **Bundling the full 94-doc corpus into an APK is size-trivial**: the markdown is
   1.4 MB, so the bundle grows <2 MB. Wrong if the on-device bundle exceeds 10 MB
   without images.
4. **Moving the scraping pipeline to any free cloud tier will fail on platform
   blocking within one run.** Wrong if a full deal-hunt cycle completes from a
   datacenter IP without raising `PlatformBlocked`.
   (Gemini reached this independently; `gpt-oss` and `compound` recommended the move.)
5. **A PWA with a service worker plus Web Push satisfies Purposes B and C completely**,
   leaving zero native-only requirement for them. Wrong if a named capability either
   purpose needs is unavailable in Android Chrome 2026.
6. **The phone never needs to wake itself to poll.** Gemini named the one real
   native-only capability — background execution independent of a push payload —
   and it is unneeded because the workstation holds the schedule and is awake
   ~100% of the time. Wrong if measured workstation availability drops below 90%
   over any 30-day window, or if an alert must land in under ~5 s to be useful.
7. **A phone client never needs the 353 MB cache DB.** The operator-relevant slice
   (`listing_status`, 362 rows, plus recent `price_history`) is a few MB. Wrong if a
   useful triage view needs more than 20 MB of extract.

## Verification commands

```
docker exec analytics-stack-postgres-1 psql -U umami -d umami -At -c \
  "select count(distinct session_id), count(*) from website_event;"
tailscale status
du -sch ~/research/research-reports/*.md | tail -1
journalctl -b | grep -c 'PM: suspend entry'
du -sh ~/.cache/ph-scraper/cache.db
sqlite3 ~/.cache/ph-scraper/cache.db \
  "select name, sum(pgsize)/1024/1024 mb from dbstat group by name order by mb desc limit 5;"
tailscale serve status
```
