#!/usr/bin/env node
/* stylusapply — inventory, clean and update the Stylus styles in an Edge
 * profile, through Stylus's own extension API rather than by editing its
 * IndexedDB.
 *
 * Stylus keeps its styles in IndexedDB; hand-editing that is a good way to
 * lose them. Its own pages expose an `API` object, so this drives that:
 *   list    — what is installed, with versions (read-only, default)
 *   reset   — remove EVERY style this repo owns, then install the 15 current
 *             ones. The only mode that reliably de-duplicates: earlier styles
 *             were pasted as plain CSS rather than usercss, and Stylus only
 *             dedupes usercss against usercss, so installing on top stacked a
 *             second copy (one profile had four "Sage Ink — GitHub" entries).
 *             Styles from anywhere else are never touched.
 *   apply   — install/update only (leaves duplicates in place)
 *   clean   — remove superseded brand eras (Lime/Indigo Glass) only
 *
 * The profile's Edge must be closed; the extension needs a headed browser.
 *
 * Usage: node stylusapply.mjs <user-data-dir> [profile-dir] [list|apply|clean|all]
 */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUNDLE = resolve(HERE, '../../browser/stylus/out/sage-ink-stylus-import.json')
const STYLUS_ID = 'clngdbkpkpeebahjckkjfobafhncgmne'
const [userDataDir, profileDir = 'Default', mode = 'list'] = process.argv.slice(2)
if (!userDataDir) { console.error('usage: stylusapply.mjs <user-data-dir> [profile-dir] [list|apply|clean|all]'); process.exit(1) }

const port = 9400 + Math.floor(Math.random() * 90)
const args = [
  `--user-data-dir=${userDataDir}`,
  `--remote-debugging-port=${port}`,
  '--no-first-run', '--no-default-browser-check',
  '--disable-features=DialMediaRouteProvider',
]
if (profileDir !== 'Default') args.push(`--profile-directory=${profileDir}`)
args.push(`chrome-extension://${STYLUS_ID}/manage.html`)
const proc = spawn('/opt/microsoft/msedge/msedge', args, { stdio: 'ignore' })

let browser
for (let i = 0; i < 80; i++) {
  await sleep(500)
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break } catch {}
}
if (!browser) { proc.kill(); throw new Error('no CDP endpoint — is this profile already open in Edge?') }

const ctx = browser.contexts()[0]
let page
for (let i = 0; i < 40; i++) {
  page = ctx.pages().find((p) => p.url().startsWith(`chrome-extension://${STYLUS_ID}/manage`))
  if (page) break
  await sleep(500)
}
if (!page) { page = await ctx.newPage(); await page.goto(`chrome-extension://${STYLUS_ID}/manage.html`) }
await page.waitForTimeout(2500)

const list = () => page.evaluate(async () => {
  const styles = await API.styles.getAll()
  return styles.map((s) => ({
    id: s.id,
    name: (s.usercssData && s.usercssData.name) || s.name,
    version: s.usercssData ? s.usercssData.version : null,
    enabled: s.enabled,
    usercss: !!s.usercssData,
  }))
})

/* Back up whatever is installed BEFORE touching anything. Deleting a style
 * through the API is irreversible and Stylus keeps no undo, so every run
 * writes a full export (sourceCode included) under backups/ first. That also
 * satisfies the repo's archive-don't-delete rule. */
const fullBefore = await page.evaluate(() => API.styles.getAll())
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const slug = `${userDataDir.split('/').pop()}-${profileDir}`.replace(/[^a-zA-Z0-9-]/g, '_')
const backupDir = resolve(HERE, '../../backups/stylus')
mkdirSync(backupDir, { recursive: true })
const backupPath = `${backupDir}/${slug}-${stamp}.json`
writeFileSync(backupPath, JSON.stringify(fullBefore, null, 1))

const before = await list()
console.log(`\n== ${userDataDir} [${profileDir}] — ${before.length} styles installed`)
console.log(`   backup: ${backupPath}`)
for (const s of before) console.log(`   ${s.enabled ? 'on ' : 'off'} ${String(s.version || '-').padEnd(7)} ${s.name}`)

if (mode === 'reset') {
  /* Every style whose name this repo owns, regardless of brand era or whether
   * it was installed as usercss. Foreign styles are left alone. */
  const ours = before.filter((s) => /^(Sage Ink|Lime Glass|Indigo Glass)\b/.test(s.name || ''))
  console.log(`\n   removing ${ours.length} repo-owned (re-installed below):`)
  const counts = {}
  for (const s of ours) counts[s.name] = (counts[s.name] || 0) + 1
  for (const [n, c] of Object.entries(counts)) console.log(`     - ${n}${c > 1 ? `  x${c}` : ''}`)
  await page.evaluate(async (ids) => { for (const id of ids) await API.styles.remove(id) }, ours.map((s) => s.id))
  await page.waitForTimeout(1500)
}

if (mode === 'clean' || mode === 'all') {
  const stale = before.filter((s) => /^(Lime Glass|Indigo Glass)\b/.test(s.name || ''))
  if (stale.length) {
    console.log(`\n   removing ${stale.length} superseded:`)
    for (const s of stale) console.log(`     - ${s.name}`)
    /* API.styles.remove(id) — there is no .delete in 2.4.11. */
    await page.evaluate(async (ids) => { for (const id of ids) await API.styles.remove(id) }, stale.map((s) => s.id))
  } else console.log('\n   nothing superseded')
}

if (mode === 'apply' || mode === 'all' || mode === 'reset') {
  const bundle = JSON.parse(readFileSync(BUNDLE, 'utf8'))
  const report = await page.evaluate(async (styles) => {
    const out = []
    for (const s of styles) {
      try {
        /* Stylus 2.4.11's API.usercss.build takes the source STRING, not an
         * options object — passing {sourceCode} fails with
         * "(sourceCode || …).replace is not a function". It returns
         * { style, dup, logs }; dup is the already-installed match. */
        const parsed = await API.usercss.build(s.sourceCode)
        const dup = parsed.dup
        const style = parsed.style || parsed
        style.enabled = true
        if (dup) style.id = dup.id
        await API.usercss.install(style)
        out.push(`${dup ? 'updated' : 'installed'}  ${style.customName || (style.usercssData && style.usercssData.name)}`)
      } catch (e) { out.push(`FAILED    ${(s.usercssData && s.usercssData.name) || s.name}: ${e && e.message}`) }
    }
    return out
  }, bundle)
  console.log('')
  for (const line of report) console.log(`   ${line}`)
}

if (mode === 'verify') {
  /* Counts alone proved unreliable — Stylus answers getAll() while it is still
   * loading, so the same profile read 15 and 36 seconds apart. Compare the
   * installed SOURCE against the repo files instead; that cannot be raced. */
  await page.waitForTimeout(6000)
  const bundle = JSON.parse(readFileSync(BUNDLE, 'utf8'))
  const want = Object.fromEntries(bundle.map((b) => [b.name, b.sourceCode]))
  const got = await page.evaluate(() => API.styles.getAll())
  const owned = got.filter((s) => /^(Sage Ink|Lime Glass|Indigo Glass)\b/.test((s.usercssData && s.usercssData.name) || s.name || ''))
  const byName = {}
  for (const s of owned) {
    const n = (s.usercssData && s.usercssData.name) || s.name
    ;(byName[n] = byName[n] || []).push(s)
  }
  const dupes = Object.entries(byName).filter(([, v]) => v.length > 1)
  const missing = Object.keys(want).filter((n) => !byName[n])
  const stale = Object.entries(byName)
    .filter(([n, v]) => want[n] && v[0].sourceCode !== want[n])
    .map(([n]) => n)
  const foreign = got.length - owned.length
  console.log(`   repo-owned: ${owned.length}/${Object.keys(want).length}  foreign: ${foreign}`)
  console.log(`   duplicates: ${dupes.length ? dupes.map(([n, v]) => `${n} x${v.length}`).join(', ') : 'none'}`)
  console.log(`   missing:    ${missing.length ? missing.join(', ') : 'none'}`)
  console.log(`   stale src:  ${stale.length ? stale.join(', ') : 'none'}`)
  console.log(`   VERDICT: ${!dupes.length && !missing.length && !stale.length ? 'IN SYNC' : 'OUT OF SYNC'}`)
}

if (mode === 'reset') {
  /* Final dedupe. The remove-then-install sequence can still leave a pair
   * behind when getAll() answers mid-load and the first pass simply did not
   * see that style. Re-read after the dust settles and keep the newest id per
   * name — the one this run installed. */
  await page.waitForTimeout(6000)
  const leftovers = await page.evaluate(async () => {
    const all = await API.styles.getAll()
    const byName = {}
    for (const s of all) {
      const n = (s.usercssData && s.usercssData.name) || s.name || ''
      if (!/^(Sage Ink|Lime Glass|Indigo Glass)\b/.test(n)) continue
      ;(byName[n] = byName[n] || []).push(s)
    }
    const killed = []
    for (const [n, list] of Object.entries(byName)) {
      if (list.length < 2) continue
      list.sort((a, b) => b.id - a.id)
      for (const s of list.slice(1)) { await API.styles.remove(s.id); killed.push(`${n} (id ${s.id})`) }
    }
    return killed
  })
  if (leftovers.length) console.log(`\n   deduped ${leftovers.length}: ${leftovers.join(', ')}`)
}

if (mode !== 'list' && mode !== 'verify') {
  /* Stylus reconciles installs asynchronously; reading the list too early
     reports transient duplicates (a 21-style profile briefly read as 36). */
  await page.waitForTimeout(6000)
  const after = await list()
  console.log(`\n   now ${after.length} styles:`)
  for (const s of after) console.log(`     ${s.enabled ? 'on ' : 'off'} ${String(s.version || '-').padEnd(7)} ${s.name}`)
}

await browser.close().catch(() => {})
proc.kill('SIGTERM')
