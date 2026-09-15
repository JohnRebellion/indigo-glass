# Appendix C — contrast.mjs

```js
#!/usr/bin/env node
/* contrast — audit a site style for unreadable text and stray rounding.
 *
 * Two checks the style-check audit does not make:
 *
 * 1. CONTRAST, including focus. Every interactive element is measured at rest,
 *    then focused and measured again. The rest-state check catches an accent
 *    fill with the wrong label colour; the focus pass catches the bug this was
 *    written for — text-on-accent set to ink black while only the *rest* state
 *    of that accent background was remapped, so :focus falls back to the
 *    site's own dark fill and the label disappears.
 *
 * 2. ROUNDING, honestly reported. The main audit skips anything fully
 *    circular, on the grounds that avatars are meant to be round. This lists
 *    both buckets so a squared avatar or a surviving pill is visible.
 *
 * Effective background walks up the ancestor chain, compositing translucent
 * layers, because a button with rgba(0,0,0,0) is painted by its parent.
 *
 * Usage: node contrast.mjs <site> [--headed]   (site keys from check.mjs)
 */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const PROFILE = process.env.IG_STYLE_PROFILE || '/tmp/ig-style-profile'

const TARGETS = {
  google: ['browser/stylus/sites/google.user.css', 'https://www.google.com/search?q=qg18de'],
  youtube: ['browser/stylus/sites/youtube.user.css', 'https://www.youtube.com/'],
  facebook: ['browser/stylus/sites/facebook.user.css', 'https://www.facebook.com/marketplace/'],
  'facebook-feed': ['browser/stylus/sites/facebook.user.css', 'https://www.facebook.com/'],
  /* The search-results rail is where "Notify Me" lives — it does not exist on
   * /marketplace/, which is why the first hover audit missed a reported bug. */
  'facebook-search': ['browser/stylus/sites/facebook.user.css', 'https://www.facebook.com/marketplace/search?query=15x7%20mags'],
  github: ['browser/stylus/sites/github.user.css', 'https://github.com/anthropics/claude-code'],
  wikipedia: ['browser/stylus/sites/wikipedia.user.css', 'https://en.wikipedia.org/wiki/Nissan_QG_engine'],
  atlassian: ['browser/stylus/sites/atlassian.user.css', `https://${process.env.IG_ATLASSIAN_HOST || 'example.atlassian.net'}/jira/your-work`],
  m365: ['browser/stylus/sites/microsoft365.user.css', process.env.IG_M365_URL || 'https://outlook.cloud.microsoft/mail/'],
  gemini: ['browser/stylus/sites/gemini.user.css', 'https://gemini.google.com/app'],
  aistudio: ['browser/stylus/sites/aistudio.user.css', 'https://aistudio.google.com/prompts/new_chat'],
  copilot: ['browser/stylus/sites/copilot.user.css', 'https://copilot.microsoft.com/'],
  claude: ['browser/stylus/sites/claude-ai.user.css', 'https://claude.ai/new'],
  chatgpt: ['browser/stylus/sites/chatgpt.user.css', 'https://chatgpt.com/'],
  notion: ['browser/stylus/sites/notion.user.css', 'https://www.notion.so/'],
  linear: ['browser/stylus/sites/linear.user.css', 'https://linear.app/'],
}

function unwrap(css) {
  const out = []
  let i = 0
  for (;;) {
    const start = css.indexOf('@-moz-document', i)
    if (start === -1) break
    let paren = 0
    let open = -1
    for (let k = start; k < css.length; k++) {
      const c = css[k]
      if (c === '(') paren++
      else if (c === ')') paren--
      else if (c === '{' && paren === 0) { open = k; break }
    }
    if (open === -1) break
    let depth = 0
    let j = open
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') { depth--; if (depth === 0) break }
    }
    out.push(css.slice(open + 1, j))
    i = j + 1
  }
  return out.join('\n')
}

const PAGE_FN = () => {
  /* Resolve ANY CSS colour to rgba by painting it on a canvas. A regex over
   * the computed string is not enough: these styles declare oklch(), which
   * Chromium keeps as oklch() in getComputedStyle, and a regex that only
   * knows rgb() silently reports those layers as absent — which made the
   * first run of this script flag GitHub's perfectly readable green button
   * as black-on-black. */
  const cvs = document.createElement('canvas')
  cvs.width = cvs.height = 1
  const cctx = cvs.getContext('2d', { willReadFrequently: true })
  const cache = new Map()
  const parse = (c) => {
    const key = String(c)
    if (cache.has(key)) return cache.get(key)
    let out = null
    if (key && key !== 'transparent' && key !== 'none') {
      cctx.clearRect(0, 0, 1, 1)
      cctx.fillStyle = '#000'
      cctx.fillStyle = key
      if (cctx.fillStyle !== '#000' || /^#0{3,8}$|black|rgb\(0, 0, 0\)/i.test(key)) {
        cctx.clearRect(0, 0, 1, 1)
        cctx.fillRect(0, 0, 1, 1)
        const d = cctx.getImageData(0, 0, 1, 1).data
        out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }
      }
    }
    cache.set(key, out)
    return out
  }
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  })
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  /* Effective background: walk up compositing translucent layers until an
     opaque one is found, else assume the page canvas. */
  const effBg = (el) => {
    const stack = []
    let node = el
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor)
      if (c && c.a > 0) { stack.push(c); if (c.a === 1) break }
      node = node.parentElement
    }
    const root = parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 0, g: 0, b: 0, a: 1 }
    let acc = root.a === 1 ? root : { r: 0, g: 0, b: 0, a: 1 }
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc)
    return acc
  }
  const sig = (el) => {
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 2).join('.') : ''
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`
  }
  /* Only innerText — an icon-only button still has a `color`, and judging it
   * by that produces noise: an aria-label is not painted. innerText also
   * respects visibility, so hidden labels do not count either. */
  const label = (el) => (el.innerText || '').trim()
  const shortLabel = (el) => label(el).slice(0, 28)

  /* Measure the element that actually PAINTS the text — one with its own
   * text node — not the interactive container. A container's `color` is
   * frequently inherited and then overridden on the child span that holds the
   * label, so judging containers reports failures that are not on screen
   * (every Marketplace card came back at 1.2:1 that way, while the price and
   * title are painted light by their own spans). */
  const focusableOf = (el) => el.closest('button, [role="button"], a, input, summary, [tabindex="0"]')
  const textLeaves = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  for (let el = walker.nextNode(); el && textLeaves.length < 400; el = walker.nextNode()) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0)
    if (!own) continue
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 6) continue
    const c = getComputedStyle(el)
    if (c.visibility === 'hidden' || c.display === 'none' || c.opacity === '0') continue
    textLeaves.push(el)
  }
  const interactive = textLeaves

  const measure = (el) => {
    const c = getComputedStyle(el)
    const fg = parse(c.color)
    if (!fg) return null
    const bg = effBg(el)
    const size = parseFloat(c.fontSize)
    const bold = (parseInt(c.fontWeight, 10) || 400) >= 700
    const large = size >= 24 || (size >= 18.66 && bold)
    const composed = fg.a < 1 ? over(fg, bg) : fg
    return {
      ratio: +ratio(composed, bg).toFixed(2),
      min: large ? 3 : 4.5,
      fg: c.color,
      bg: `rgb(${bg.r | 0}, ${bg.g | 0}, ${bg.b | 0})`,
    }
  }

  const rest = []
  for (const el of interactive) {
    const m = measure(el)
    if (m && m.ratio < m.min) rest.push({ el: sig(el), text: shortLabel(el), ...m })
  }

  /* Focus pass — the failure mode this file exists for. The text leaf is not
   * usually focusable, so focus its nearest focusable ancestor and re-measure
   * the leaf. */
  const focus = []
  for (const el of interactive.slice(0, 150)) {
    const target = focusableOf(el)
    if (!target) continue
    const before = measure(el)
    try { target.focus({ preventScroll: true }) } catch { continue }
    const after = measure(el)
    try { target.blur() } catch {}
    if (!after) continue
    if (after.ratio < after.min && (!before || before.ratio >= before.min || after.ratio < before.ratio - 0.2)) {
      focus.push({ el: sig(el), text: shortLabel(el), restRatio: before ? before.ratio : null, ...after })
    }
  }

  /* Rounding, both buckets. */
  const radii = { rounded: new Map(), circular: new Map() }
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (r.width < 12 || r.height < 8) continue
    const c = getComputedStyle(el)
    const raw = c.borderTopLeftRadius
    const val = parseFloat(raw)
    if (!val) continue
    const circular = raw.includes('%') ? parseFloat(raw) >= 50 : val >= Math.min(r.width, r.height) / 2 - 1
    const bucket = circular ? radii.circular : radii.rounded
    const key = `${sig(el)} r=${raw}`
    bucket.set(key, (bucket.get(key) || 0) + 1)
  }
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${v}x ${k}`)

  const worst = (list) => list.sort((a, b) => a.ratio - b.ratio).slice(0, 12)
  return {
    checked: interactive.length,
    note: 'checked = elements painting their own text',
    restFailures: worst(rest),
    focusFailures: worst(focus),
    stillRounded: top(radii.rounded, 10),
    circular: top(radii.circular, 6),
  }
}

const [siteKey, ...rest] = process.argv.slice(2)
const headed = rest.includes('--headed')
const [cssPath, url] = TARGETS[siteKey] || []
if (!cssPath) { console.error(`unknown site: ${siteKey}. known: ${Object.keys(TARGETS).join(', ')}`); process.exit(1) }

const port = 9050 + Math.floor(Math.random() * 60)
const proc = spawn('/opt/microsoft/msedge/msedge', [
  `--user-data-dir=${PROFILE}`,
  `--remote-debugging-port=${port}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  ...(headed ? [] : ['--headless=new']),
], { stdio: 'ignore' })

let browser
for (let i = 0; i < 60; i++) {
  await sleep(500)
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break } catch {}
}
if (!browser) { proc.kill(); throw new Error('no CDP endpoint') }
const ctx = browser.contexts()[0]
const page = await ctx.newPage()
await page.setViewportSize({ width: 1400, height: 1000 })
await page.emulateMedia({ colorScheme: 'dark' })
const cdp = await ctx.newCDPSession(page)
await cdp.send('Page.setBypassCSP', { enabled: true })
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(Number(process.env.IG_WAIT || 7000))
if (!rest.includes('--no-style')) {
  await page.addStyleTag({ content: unwrap(readFileSync(resolve(REPO, cssPath), 'utf8')) })
  await page.waitForTimeout(1500)
}
const result = await page.evaluate(PAGE_FN)

/* Keyboard pass. el.focus() from script does NOT match :focus-visible in
 * Chromium — only keyboard interaction does — so a scripted focus loop cannot
 * see a rule that repaints a button on :focus-visible. This walks the page
 * with real Tab presses and measures whatever lands in document.activeElement,
 * which is the exact path a user takes to hit the bug. */
const keyboard = []
await page.evaluate(() => { const f = document.querySelector('a, button'); if (f) f.blur(); window.scrollTo(0, 0) })
for (let i = 0; i < 60; i++) {
  await page.keyboard.press('Tab')
  const hit = await page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return null
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1
    const c2 = cvs.getContext('2d', { willReadFrequently: true })
    const toRgb = (v) => { c2.clearRect(0, 0, 1, 1); c2.fillStyle = '#000'; c2.fillStyle = v
      c2.clearRect(0, 0, 1, 1); c2.fillRect(0, 0, 1, 1); const d = c2.getImageData(0, 0, 1, 1).data
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 } }
    const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 })
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
    const effBg = (node) => { const stack = []
      while (node && node !== document.documentElement) { const c = toRgb(getComputedStyle(node).backgroundColor)
        if (c.a > 0) { stack.push(c); if (c.a === 1) break } node = node.parentElement }
      let acc = { r: 0, g: 0, b: 0, a: 1 }
      const root = toRgb(getComputedStyle(document.documentElement).backgroundColor)
      if (root.a === 1) acc = root
      for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc)
      return acc }
    /* the leaf that paints the label, inside the focused control */
    const leaves = [el, ...el.querySelectorAll('*')].filter((n) =>
      [...n.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim()))
    if (!leaves.length) return null
    const out = []
    for (const leaf of leaves.slice(0, 3)) {
      const cs = getComputedStyle(leaf)
      const fg = toRgb(cs.color)
      const bg = effBg(leaf)
      const size = parseFloat(cs.fontSize)
      const bold = (parseInt(cs.fontWeight, 10) || 400) >= 700
      const min = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5
      out.push({ text: (leaf.innerText || '').trim().slice(0, 24), ratio: +ratio(fg.a < 1 ? over(fg, bg) : fg, bg).toFixed(2), min,
        fg: cs.color, bg: `rgb(${bg.r | 0}, ${bg.g | 0}, ${bg.b | 0})`,
        el: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}` })
    }
    return out
  })
  if (hit) for (const h of hit) if (h.ratio < h.min) keyboard.push(h)
}
/* Hover pass. Sites commonly paint hover as a separate overlay LAYER stacked
 * over the control's content — if that overlay is opaque it does not tint the
 * button, it covers the label. A style that swaps a translucent hover wash for
 * an opaque ink step therefore makes text vanish on hover, which neither the
 * rest nor the focus pass can see. */
const hoverFails = []
const hoverTargets = await page.$$('button, [role="button"], a[role="button"], a, summary, [tabindex="0"]')
for (const handle of hoverTargets.slice(0, 90)) {
  try {
    const box = await handle.boundingBox()
    if (!box || box.width < 16 || box.height < 10) continue
    const before = await handle.evaluate((el) => (el.innerText || '').trim().slice(0, 24))
    if (!before) continue
    await handle.hover({ timeout: 1500 })
    await page.waitForTimeout(120)
    const hit = await handle.evaluate((el) => {
      const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1
      const c2 = cvs.getContext('2d', { willReadFrequently: true })
      const toRgb = (v) => { c2.clearRect(0, 0, 1, 1); c2.fillStyle = '#000'; c2.fillStyle = v
        c2.clearRect(0, 0, 1, 1); c2.fillRect(0, 0, 1, 1); const d = c2.getImageData(0, 0, 1, 1).data
        return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 } }
      const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 })
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
      const leaf = [el, ...el.querySelectorAll('*')].find((n) =>
        [...n.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim()))
      if (!leaf) return null
      const r = leaf.getBoundingClientRect()
      const cs = getComputedStyle(leaf)
      /* What is actually painted at the label's centre — this catches an
         opaque overlay sitting ON TOP of the text, which a background walk
         up the ancestor chain would miss entirely. */
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const topEl = document.elementFromPoint(cx, cy)
      const covered = topEl && topEl !== leaf && !leaf.contains(topEl) && !topEl.contains(leaf)
      const stack = []
      let node = leaf
      while (node && node !== document.documentElement) {
        const c = toRgb(getComputedStyle(node).backgroundColor)
        if (c.a > 0) { stack.push(c); if (c.a === 1) break }
        node = node.parentElement
      }
      let bg = { r: 0, g: 0, b: 0, a: 1 }
      const root = toRgb(getComputedStyle(document.documentElement).backgroundColor)
      if (root.a === 1) bg = root
      for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg)
      const fg = toRgb(cs.color)
      const size = parseFloat(cs.fontSize)
      const bold = (parseInt(cs.fontWeight, 10) || 400) >= 700
      return {
        text: (leaf.innerText || '').trim().slice(0, 24),
        ratio: +ratio(fg.a < 1 ? over(fg, bg) : fg, bg).toFixed(2),
        min: size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5,
        fg: cs.color, bg: `rgb(${bg.r | 0}, ${bg.g | 0}, ${bg.b | 0})`,
        coveredBy: covered ? `${topEl.tagName.toLowerCase()}.${String(topEl.className).split(' ')[0]} bg=${getComputedStyle(topEl).backgroundColor}` : null,
      }
    })
    if (hit && (hit.ratio < hit.min || hit.coveredBy)) hoverFails.push(hit)
  } catch {}
}
result.hoverFailures = hoverFails.slice(0, 12)

const seen = new Set()
result.keyboardFocusFailures = keyboard.filter((k) => {
  const key = k.el + k.text + k.ratio
  if (seen.has(key)) return false
  seen.add(key); return true
}).sort((a, b) => a.ratio - b.ratio).slice(0, 12)

console.log(JSON.stringify({ [siteKey]: { url: page.url(), ...result } }, null, 1))
await browser.close().catch(() => {})
proc.kill('SIGTERM')
```
