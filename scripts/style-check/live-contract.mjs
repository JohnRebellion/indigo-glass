#!/usr/bin/env node
/* live-contract — run the simulator's Sage Ink structure contract against the
 * REAL site with the shipped .user.css injected.
 *
 * simulator/e2e/sites.spec.ts proves each file against its /sites/<id>/ mock;
 * this is the same contract block (radius, shadow, blur, gradient, overlay,
 * action buttons, thin borders) evaluated on the live DOM, so a selector that
 * only exists in the mock, or a live class the file never saw, shows up here
 * and nowhere else. Keep the contract body in step with the spec's — the
 * checks are copied, not shared, because the spec is TypeScript under
 * Playwright's runner and this is a plain Node script over CDP.
 *
 * Runs the system Edge against the disposable profile copy (mkprofile.sh), so
 * logged-in surfaces render. Nothing leaves the machine; screenshots land in
 * /tmp/ig-shots/live-<id>.png. A shot of a work profile is client material —
 * read it here, never relay it.
 *
 * Usage:
 *   node live-contract.mjs <id>[,<id>…]|public|all [--headed] [--no-style] [--url <override>] [--shot]
 *
 * Exit status is the number of sites with at least one contract failure.
 */
import { chromium } from 'playwright-core'
import { readFileSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const PROFILE = process.env.IG_STYLE_PROFILE || '/tmp/ig-style-profile'
const SHOTS = '/tmp/ig-shots'
const EDGE = '/opt/microsoft/msedge/msedge'

/* `alt` is the per-site accent_alt from simulator/src/lib/sites/registry.ts —
 * the colour every hard shadow in that file must resolve to. Update both. */
const SITES = {
  github: { css: 'github.user.css', alt: '#6494D5', url: 'https://github.com/anthropics/claude-code/issues', public: true },
  wikipedia: { css: 'wikipedia.user.css', alt: '#6D92D6', url: 'https://en.wikipedia.org/wiki/Nissan_QG_engine?vectornightmode=1', public: true },
  youtube: { css: 'youtube.user.css', alt: '#CD776A', url: 'https://www.youtube.com/', public: true, settle: 6000 },
  google: {
    css: 'google.user.css', alt: '#8293B2', url: 'https://www.google.com/', public: true,
    /* /search on a cold jar is served the CAPTCHA page; typing the query is not. */
    flow: async (page) => {
      await page.fill('textarea[name="q"], input[name="q"]', 'sage ink')
      await page.keyboard.press('Enter')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2500)
    },
  },
  shopee: { css: 'shopee.user.css', alt: '#CC7866', url: 'https://shopee.ph/', public: true, settle: 6000, root: '#main' },
  facebook: { css: 'facebook.user.css', alt: '#6A93D5', url: 'https://www.facebook.com/marketplace/', settle: 9000 },
  claude: { css: 'claude-ai.user.css', alt: '#CB795F', url: 'https://claude.ai/new', settle: 6000 },
  chatgpt: { css: 'chatgpt.user.css', alt: '#3CA887', url: 'https://chatgpt.com/', settle: 6000 },
  notion: { css: 'notion.user.css', alt: '#5F96D4', url: 'https://www.notion.so/', settle: 8000 },
  linear: { css: 'linear.user.css', alt: '#7F8CD5', url: 'https://linear.app/', settle: 8000 },
  atlassian: { css: 'atlassian.user.css', alt: '#6893D5', url: `https://${process.env.IG_ATLASSIAN_HOST || 'example.atlassian.net'}/jira/your-work`, settle: 8000 },
  microsoft365: { css: 'microsoft365.user.css', alt: '#5D96D3', url: process.env.IG_M365_URL || 'https://outlook.cloud.microsoft/mail/', settle: 10000 },
  copilot: { css: 'copilot.user.css', alt: '#5D96D3', url: 'https://copilot.microsoft.com/', settle: 6000 },
  gemini: { css: 'gemini.user.css', alt: '#A181C9', url: 'https://gemini.google.com/app', settle: 6000 },
  aistudio: { css: 'aistudio.user.css', alt: '#6A93D5', url: 'https://aistudio.google.com/prompts/new_chat', settle: 6000 },
}

const argv = process.argv.slice(2)
const flag = (f) => argv.includes(f)
const opt = (f) => { const i = argv.indexOf(f); return i === -1 ? undefined : argv[i + 1] }
const which = argv.find((a) => !a.startsWith('--') && a !== opt('--url')) || 'public'
const ids = which === 'all' ? Object.keys(SITES) : which === 'public' ? Object.keys(SITES).filter((k) => SITES[k].public) : which.split(',')
for (const id of ids) if (!SITES[id]) { console.error(`unknown site ${id}; known: ${Object.keys(SITES).join(' ')}`); process.exit(2) }

/* Same as check.mjs `unwrap`: Chromium drops @-moz-document as an unknown
 * at-rule, so inject the block bodies. The block brace is the first `{`
 * outside the prelude's parentheses (google's regexp() contains `{2,3}`). */
function unwrap(css) {
  const out = []
  let i = 0
  for (;;) {
    const start = css.indexOf('@-moz-document', i)
    if (start === -1) break
    let open = -1, paren = 0
    for (let k = start; k < css.length; k++) {
      if (css[k] === '(') paren++
      else if (css[k] === ')') paren--
      else if (css[k] === '{' && paren === 0) { open = k; break }
    }
    if (open === -1) break
    let depth = 0, j = open
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') { depth--; if (depth === 0) break }
    }
    out.push(css.slice(open + 1, j))
    i = j + 1
  }
  return out.join('\n')
}

/* The contract. Mirrors sites.spec.ts step 4 with two substitutions: the
 * "ours lane" is the whole document (or `root`), and `where()` names the
 * nearest landmark instead of the mock's pair id. */
function contract({ alt, rootSel, limit }) {
  const ctx = document.createElement('canvas').getContext('2d')
  const rgb = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data] }
  const near = (a, b, tol = 3) => a.slice(0, 3).every((v, i) => Math.abs(v - b[i]) <= tol)
  const altRgb = rgb(alt)
  const root = (rootSel && document.querySelector(rootSel)) || document.body
  const all = [...root.querySelectorAll('*')].slice(0, limit)
  const visible = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight * 3 }
  const cls = (el) => (typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : [])
  const tag = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls(el).length ? '.' + cls(el).slice(0, 3).join('.') : ''}`
  const landmark = (el) => {
    const l = el.closest('[role="dialog"], [role="menu"], [role="navigation"], nav, header, aside, main, footer, form, [role="main"], [role="banner"], [role="complementary"]')
    return l ? (l.getAttribute('role') || l.tagName.toLowerCase()) : 'page'
  }
  const where = (el) => `${landmark(el)} ${tag(el)}`
  const isArt = (el) => el.matches('img, svg, canvas, video, picture, [data-art], [class*="avatar" i], [class*="thumb" i], [class*="img" i], [class*="image" i], [class*="logo" i], [class*="orb" i], [class*="dot" i], [class*="spinner" i], [class*="progress" i], [class*="slider" i], [class*="switch" i], [class*="toggle" i], [class*="radio" i], [class*="checkbox" i], [class*="badge" i], [class*="presence" i], [class*="status" i], [class*="reaction" i], [class*="story" i], [class*="knob" i], [class*="indicator" i], [class*="fab" i], [class*="glimmer" i], [class*="skeleton" i], [class*="stars" i], [class*="pos" i], [role="img"], [role="progressbar"], [role="switch"], [role="slider"], [role="checkbox"], [role="radio"], [class*="Icon" i]') || !!el.closest('[class*="avatar" i], [class*="switch" i], [class*="toggle" i], [class*="progress" i], [class*="slider" i], [class*="radio" i], [class*="checkbox" i], [class*="story" i], [class*="reaction" i], [class*="orb" i], [class*="spinner" i], [class*="skeleton" i], [class*="glimmer" i], [data-art]')
  const isRoundShape = (el, cs) => {
    const b = el.getBoundingClientRect()
    const r = parseFloat(cs.borderTopLeftRadius)
    return r >= Math.min(b.width, b.height) / 2 - 0.5
  }
  // Two stops with the second at 0% is a hard edge, not a blend: Google's star-rating fill. Content, not decoration.
  const hardStop = (img) => /\d(?:px|%)\s*,\s*(?:rgba?\([^)]*\)|[a-z]+|#[0-9a-f]+)\s+0%\)/i.test(img)
  const fails = { radius: [], shadow: [], blur: [], gradient: [], overlay: [], collision: [], phantom: [] }
  const inked = []
  for (const el of all) {
    if (!visible(el)) continue
    const cs = getComputedStyle(el)
    const r = Math.max(...['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'].map((k) => parseFloat(cs[k]) || 0))
    if (r > 2 && !isRoundShape(el, cs) && !isArt(el)) fails.radius.push(`${where(el)} r=${r}`)
    const sh = cs.boxShadow
    if (sh && sh !== 'none') {
      for (const layer of sh.split(/,(?![^(]*\))/).map((s) => s.trim())) {
        const m = layer.match(/^(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?(\s+inset)?$/i)
        if (!m) { fails.shadow.push(`${where(el)} ${layer}`); continue }
        const blur = parseFloat(m[4])
        const c = rgb(m[1])
        if (c[3] === 0) continue
        if (blur > 0 || c[3] < 255) fails.shadow.push(`${where(el)} ${layer}`)
        const x = parseFloat(m[2]), y = parseFloat(m[3])
        if (!m[6] && blur === 0 && x > 0 && y > 0 && near(c, altRgb)) inked.push({ el, off: Math.max(x, y) })
      }
    }
    const bf = cs.backdropFilter || cs.webkitBackdropFilter
    if (bf && bf !== 'none') fails.blur.push(where(el))
    if (cs.filter && /blur\(/.test(cs.filter) && !isArt(el)) fails.blur.push(`${where(el)} filter`)
    if (/gradient\(/.test(cs.backgroundImage) && !hardStop(cs.backgroundImage) && !isArt(el) && !el.matches('[data-scrim]')) fails.gradient.push(where(el))
  }
  const btns = all.filter((el) => visible(el) && el.matches('button, [role="button"], input[type="submit"]'))
  const chrome = (el) => {
    const cs = getComputedStyle(el)
    const text = (el.textContent ?? '').trim()
    const iconOnly = el.children.length === 1 && el.children[0].matches('svg, i, img, [class*="icon" i], [role="img"]') && text.length <= 3
    return !text || text.length <= 2 || iconOnly || isRoundShape(el, cs) || isArt(el) || !!el.closest('[role="tablist"], nav, [role="navigation"], [role="menu"], [role="listbox"], [role="tree"], [class*="tabs" i], [class*="nav" i], [class*="breadcrumb" i], [class*="chip" i], [class*="pager" i], [class*="Pivot"], [class*="CommandBar"]') ||
      el.matches('[role="tab"], [role="menuitem"], [role="option"], [role="link"], [class*="tab" i], [class*="chip" i], [class*="pill" i], [class*="ghost" i], [class*="subtle" i], [class*="transparent" i], [class*="invisible"], [class*="quiet"], [class*="link" i], [class*="text" i], [class*="MenuItem"], [class*="Tree"], [class*="icon" i], [class*="carousel" i], [class*="arrow" i], [class*="menu-item" i], [class*="list-item" i], [class*="nav" i], [class*="story" i], [class*="reaction" i], [class*="tile" i], [class*="follow" i], [class*="mode" i], [class*="send" i], [class*="copy" i], [class*="share" i], [class*="action" i], [class*="toggle" i], [class*="switch" i], [class*="filter" i], [class*="deemph" i], [class*="floating" i], [class*="on-media" i], [class*="lozenge" i], [class*="tag" i], [class*="account" i], [class*="skip" i], [class*="playground" i], [class*="tts" i], [class*="model" i], [class*="disabled" i], [disabled], [aria-disabled="true"], [data-variant="invisible"], [data-variant="link"]')
  }
  const candidates = btns.filter((b) => !chrome(b))
  // docs/ELEVATION.md: a light-filled (relative luminance > 0.179) non-chrome
  // button is the primary and must be hard with an ink label; the offset is
  // never on a dark fill. Same body as simulator/e2e/sites.spec.ts.
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const isLightFill = (el) => { const c = rgb(getComputedStyle(el).backgroundColor); return c[3] > 0 && lum(c) > 0.179 }
  const isHard = (el) => { const s = getComputedStyle(el).boxShadow; const m = s.match(/(rgba?\([^)]*\)|oklch\([^)]*\))\s+4px\s+4px\s+0px(\s+0px)?/); return !!m && near(rgb(m[1]), altRgb) }
  const hex = (c) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
  const label = (b) => `${where(b)} fill=${hex(rgb(getComputedStyle(b).backgroundColor))} "${(b.textContent || '').trim().slice(0, 24)}"`
  const primary = candidates.filter(isLightFill)
  // a flat half inside an inked wrapper (a split button) is lifted by the group
  const lifted = (el) => isHard(el) || (!!el.parentElement && isHard(el.parentElement))
  const hard = candidates.filter(lifted)
  const primaryFlat = primary.filter((b) => !lifted(b)).map(label)
  const primaryLightLabel = primary.filter((b) => lum(rgb(getComputedStyle(b).color)) > 0.179).map(label)
  const secondaryHard = btns.filter((b) => isHard(b) && !isLightFill(b)).map(label)
  const rendered = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0 && r.width > 0 && r.height > 0 }
  const shown = inked.filter((i) => rendered(i.el)) // Gemini's cdk-describedby tooltips are hidden a11y text; Google parks closed dialogs at opacity 0
  for (const a of shown) for (const b of shown) {
    if (a === b || a.el.contains(b.el) || b.el.contains(a.el)) continue
    const ra = a.el.getBoundingClientRect(), rb = b.el.getBoundingClientRect()
    const gapX = rb.left - ra.right, gapY = rb.top - ra.bottom
    const vOverlap = rb.top < ra.bottom && rb.bottom > ra.top, hOverlap = rb.left < ra.right && rb.right > ra.left
    if ((gapX >= 0 && gapX < a.off && vOverlap) || (gapY >= 0 && gapY < a.off && hOverlap)) fails.collision.push(`${where(a.el)} ${a.off}px shadow lands on ${tag(b.el)}`)
  }
  const thinBorder = candidates.filter((b) => { const cs = getComputedStyle(b); const w = parseFloat(cs.borderTopWidth); return cs.borderTopStyle !== 'none' && w > 0 && w < 2 && rgb(cs.borderTopColor)[3] > 0 }).map(where)
  // Same as sites.spec.ts: a ghost icon button (no label, transparent fill)
  // wearing our 2px border_strong edge is a missed exemption, not a style.
  const inkEdge = rgb('#5E5E60')
  const iconEdge = btns.filter((b) => {
    const cs = getComputedStyle(b)
    const text = (b.textContent ?? '').trim()
    const bx = b.getBoundingClientRect()
    const iconish = (!text && bx.width <= 72 && bx.height <= 72) || (b.children.length === 1 && b.children[0].matches('svg, i, img, [class*="icon" i], [role="img"]') && text.length <= 3)
    return iconish && rgb(cs.backgroundColor)[3] === 0 && cs.borderTopStyle === 'solid' && parseFloat(cs.borderTopWidth) >= 2 && near(rgb(cs.borderTopColor), inkEdge) && !b.hasAttribute('data-ig-stock-edge')
  }).map(where)
  // phantom: an inked element too small to be a surface (YouTube's empty
  // un-upgraded tooltip hosts came out as 4x4 accent dots).
  for (const i of shown) { const r = i.el.getBoundingClientRect(); if (r.width < 12 || r.height < 12) fails.phantom.push(`${where(i.el)} ${Math.round(r.width)}x${Math.round(r.height)}`) }
  for (const el of all.filter((e) => visible(e) && e.matches('[role="dialog"], [role="menu"], [role="alertdialog"]'))) {
    const cs = getComputedStyle(el)
    const ok = parseFloat(cs.borderTopWidth) >= 2 && /4px 4px 0px|7px 7px 0px/.test(cs.boxShadow) && near(rgb(cs.boxShadow.match(/(rgba?\([^)]*\)|oklch\([^)]*\))/)?.[1] ?? 'transparent'), altRgb)
    if (!ok) fails.overlay.push(`${where(el)} border=${cs.borderTopWidth} shadow=${cs.boxShadow}`)
  }
  const pageBg = rgb(getComputedStyle(document.documentElement).backgroundColor).slice(0, 3)
  const bodyBg = rgb(getComputedStyle(document.body).backgroundColor).slice(0, 3)
  return { scanned: all.length, pageBg, bodyBg, fails, buttons: { total: candidates.length, primary: primary.length, hard: hard.length, primaryFlat, primaryLightLabel, secondaryHard, thinBorder, iconEdge } }
}

/* Collapse a long list to distinct signatures with counts, most frequent first. */
const summarise = (list, n = 12) => {
  const m = new Map()
  for (const s of list) m.set(s, (m.get(s) || 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => (v > 1 ? `${v}× ${k}` : k))
}

mkdirSync(SHOTS, { recursive: true })
const port = 9600 + Math.floor(Math.random() * 200)
const proc = spawn(EDGE, [
  `--user-data-dir=${PROFILE}`,
  `--remote-debugging-port=${port}`,
  '--no-first-run', '--no-default-browser-check',
  /* The copied profile syncs the real extension set; Dark Reader would paint
   * over the site and the audit would read its output. Stylus alone is the
   * target state, and here the file is injected directly, so: none. */
  '--disable-extensions',
  ...(flag('--headed') ? [] : ['--headless=new']),
], { stdio: 'ignore' })

let browser
for (let i = 0; i < 60; i++) {
  await sleep(500)
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break } catch {}
}
if (!browser) { proc.kill(); console.error('no CDP endpoint — is the profile already open in Edge?'); process.exit(2) }

let failing = 0
const results = {}
try {
  const ctx = browser.contexts()[0]
  for (const id of ids) {
    const site = SITES[id]
    const page = await ctx.newPage()
    await page.setViewportSize({ width: 1400, height: 1000 })
    await page.emulateMedia({ colorScheme: 'dark' })
    const url = opt('--url') && ids.length === 1 ? opt('--url') : site.url
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      if (site.flow) await site.flow(page)
      await page.waitForTimeout(site.settle || 4000)
      if (!flag('--no-style')) {
        /* Stock state the contract needs after our sheet lands: which buttons
         * the site itself bordered (their 2px edge is an upgrade, not a miss). */
        await page.evaluate(() => {
          for (const b of document.querySelectorAll('button, [role="button"], input[type="submit"]')) {
            const cs = getComputedStyle(b)
            if (cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0 && !/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cs.borderTopColor)) b.setAttribute('data-ig-stock-edge', '')
          }
        })
        await page.addStyleTag({ content: unwrap(readFileSync(resolve(REPO, 'browser/stylus/sites', site.css), 'utf8')) })
        await page.waitForTimeout(800)
      }
      const title = await page.title()
      if (/\/sorry\/|\/challenge|consent\./.test(page.url()) || /just a moment|unusual traffic|attention required|verify you are human/i.test(title)) {
        // Bot wall or consent gate: nothing of the real page was scanned, so a clean result here proves nothing.
        failing++
        results[id] = { url: page.url(), title: title.slice(0, 60), blocked: true }
        await page.close()
        continue
      }
      const r = await page.evaluate(contract, { alt: site.alt, rootSel: site.root || null, limit: 12000 })
      const counts = Object.fromEntries(Object.entries(r.fails).map(([k, v]) => [k, v.length]))
      const bad = Object.values(counts).some((n) => n > 0) || r.buttons.thinBorder.length > 0 || r.buttons.iconEdge.length > 0 || r.buttons.primaryFlat.length > 0 || r.buttons.primaryLightLabel.length > 0 || r.buttons.secondaryHard.length > 0
      if (bad) failing++
      results[id] = {
        url: page.url(), title: title.slice(0, 60), scanned: r.scanned, pageBg: r.pageBg, bodyBg: r.bodyBg,
        counts,
        buttons: { total: r.buttons.total, hard: r.buttons.total ? Math.round((100 * r.buttons.hard) / r.buttons.total) + '%' : 'n/a', primary: `${r.buttons.hard}/${r.buttons.primary} hard`, primaryFlat: summarise(r.buttons.primaryFlat), primaryLightLabel: summarise(r.buttons.primaryLightLabel), secondaryHard: summarise(r.buttons.secondaryHard), thinBorder: summarise(r.buttons.thinBorder), iconEdge: summarise(r.buttons.iconEdge) },
        fails: Object.fromEntries(Object.entries(r.fails).map(([k, v]) => [k, summarise(v)])),
      }
      if (flag('--shot')) await page.screenshot({ path: `${SHOTS}/live-${id}.png`, fullPage: false })
    } catch (e) {
      failing++
      results[id] = { url, error: String(e.message || e).split('\n')[0] }
    }
    await page.close()
  }
} finally {
  await browser.close().catch(() => {})
  proc.kill()
}

console.log(JSON.stringify(results, null, 2))
process.exit(failing)
