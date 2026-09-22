import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
/* unwrap(): copied verbatim in behaviour from check.mjs:128 */
function unwrap(css) {
  const out = []; let i = 0
  while (true) {
    const start = css.indexOf('@-moz-document', i); if (start === -1) break
    let open = -1, depth = 0
    for (let j = start; j < css.length; j++) {
      const c = css[j]
      if (c === '(') depth++
      else if (c === ')') depth--
      else if (c === '{' && depth === 0) { open = j; break }
    }
    if (open === -1) break
    let level = 0, end = -1
    for (let j = open; j < css.length; j++) {
      if (css[j] === '{') level++
      else if (css[j] === '}') { level--; if (level === 0) { end = j; break } }
    }
    if (end === -1) break
    out.push(css.slice(open + 1, end)); i = end + 1
  }
  return out.length ? out.join('\n') : css
}
const port = 9870 + Math.floor(Math.random() * 100)
const proc = spawn('/usr/bin/microsoft-edge', [`--user-data-dir=/tmp/ig-style-profile`,
  `--remote-debugging-port=${port}`, '--remote-allow-origins=*', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--force-dark-mode=0', '--headless=new'], { stdio: 'ignore' })
let browser
for (let i = 0; i < 60; i++) { await sleep(500); try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break } catch {} }
const ctx = browser.contexts()[0]
const raw = readFileSync(process.argv[2], 'utf8')
const css = process.argv[3] === '--no-style' ? '' : unwrap(raw)
const TOKENS = ['rgb(7, 8, 10)','rgb(13, 13, 16)','rgb(18, 18, 22)','rgba(0, 0, 0, 0)','rgb(248, 249, 250)']
for (const [label, url] of [['article','https://en.wikipedia.org/wiki/Nissan_QG_engine?vectornightmode=1'],
                            ['tables','https://en.wikipedia.org/wiki/Comparison_of_web_browsers?vectornightmode=1']]) {
  const page = await ctx.newPage()
  await page.setViewportSize({ width: 1400, height: 1000 })
  await page.emulateMedia({ colorScheme: 'dark' })
  const cdp = await ctx.newCDPSession(page); await cdp.send('Page.setBypassCSP', { enabled: true })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(3000)
  if (css) await page.addStyleTag({ content: css })
  await page.waitForTimeout(600)
  const out = await page.evaluate((TOKENS) => {
    const mode = document.documentElement.className.match(/skin-theme-clientpref-\S+/)?.[0]
    const fills = {}, black = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect(); if (r.width < 24 || r.height < 12) continue
      const s = getComputedStyle(el), bg = s.backgroundColor
      if (bg && !TOKENS.includes(bg)) { const k = `${el.tagName.toLowerCase()}.${(el.className||'').toString().split(' ')[0]} bg=${bg}`; fills[k] = (fills[k]||0)+1 }
      if (s.color === 'rgb(0, 0, 0)' && el.textContent.trim()) black.push(`${el.tagName.toLowerCase()}.${(el.className||'').toString().split(' ')[0]}`)
    }
    return { mode, styleApplied: getComputedStyle(document.querySelector('.mw-page-container')).backgroundColor,
             fills: Object.entries(fills).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>`${v}x ${k}`),
             blackCount: black.length, blackSample: [...new Set(black)].slice(0,5) }
  }, TOKENS)
  console.log(`== ${label} [${out.mode}] page-container=${out.styleApplied}`)
  out.fills.forEach(f => console.log('   ', f))
  console.log(`    black-text elements: ${out.blackCount}`, out.blackSample.join(', '))
  await page.close()
}
await browser.close(); proc.kill()
