#!/usr/bin/env node
/* probe — dump the CSS rules that actually paint a given element on a live
 * page, so a site style can target the real declaration instead of a guess.
 *
 * Usage: node probe.mjs <url> <css-selector> [--headed]
 * Prints, for the first few matches: the element's own attributes and every
 * stylesheet rule whose selector matches it and which sets background/radius.
 */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const [url, selector, ...rest] = process.argv.slice(2)
const headed = rest.includes('--headed')
const port = 9700 + Math.floor(Math.random() * 200)
const proc = spawn('/opt/microsoft/msedge/msedge', [
  `--user-data-dir=${process.env.IG_STYLE_PROFILE || '/tmp/ig-style-profile'}`,
  `--remote-debugging-port=${port}`,
  '--no-first-run', '--no-default-browser-check',
    /* The copied profile is signed into the user's Microsoft account, so Edge
     * SYNCS the real extension set into it — Dark Reader included. That made
     * early audits read Dark Reader's output (#181a1b) instead of the site's,
     * and put an ad-blocker upsell popup in every screenshot. The target
     * state for these styles is Stylus alone, so: no extensions. */
    '--disable-extensions',
  ...(headed ? [] : ['--headless=new']),
], { stdio: 'ignore' })

let browser
for (let i = 0; i < 60; i++) {
  await sleep(500)
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break } catch {}
}
const ctx = browser.contexts()[0]
const page = await ctx.newPage()
await page.setViewportSize({ width: 1400, height: 1000 })
await page.emulateMedia({ colorScheme: 'dark' })
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(5000)

const out = await page.evaluate((sel) => {
  const els = [...document.querySelectorAll(sel)].slice(0, 3)
  const interesting = /background|border-radius/
  return els.map((el) => {
    const rules = []
    for (const sheet of document.styleSheets) {
      let list
      try { list = sheet.cssRules } catch { continue }
      for (const rule of list) {
        if (!rule.selectorText || !rule.style) continue
        let matches = false
        try { matches = el.matches(rule.selectorText) } catch { continue }
        if (!matches) continue
        if (interesting.test(rule.cssText)) rules.push(rule.cssText.slice(0, 200))
      }
    }
    const c = getComputedStyle(el)
    return {
      outerStart: el.outerHTML.slice(0, 220),
      classes: el.className,
      computed: { bg: c.backgroundColor, radius: c.borderTopLeftRadius, color: c.color },
      rules: rules.slice(0, 12),
      ancestors: (() => {
        const out = []
        let p = el.parentElement
        for (let i = 0; i < 4 && p; i++, p = p.parentElement) {
          out.push(`${p.tagName.toLowerCase()}${p.getAttribute('role') ? `[role=${p.getAttribute('role')}]` : ''}.${String(p.className).split(' ').slice(0, 3).join('.')}`)
        }
        return out
      })(),
    }
  })
}, selector)

console.log(JSON.stringify(out, null, 1))
await browser.close()
proc.kill('SIGTERM')
