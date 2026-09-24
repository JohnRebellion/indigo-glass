#!/usr/bin/env node
/* probe — dump the CSS rules that actually paint a given element on a live
 * page, so a site style can target the real declaration instead of a guess.
 *
 * Usage: node probe.mjs <url> <css-selector> [--headed] [--style <file.user.css>]
 * --style injects the unwrapped user.css first (as live-contract does), so the
 * rule list shows whether OUR declaration reaches the element at all.
 * Prints, for the first few matches: the element's own attributes and every
 * stylesheet rule whose selector matches it and which sets background/radius.
 */
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const [url, selector, ...rest] = process.argv.slice(2)
const headed = rest.includes('--headed')
const styleArg = rest.indexOf('--style') >= 0 ? rest[rest.indexOf('--style') + 1] : null

/* Same as live-contract.mjs `unwrap`: strip the @-moz-document wrapper Chromium
 * would drop as an unknown at-rule. */
function unwrap(css) {
  let out = ''
  let i = 0
  for (;;) {
    const start = css.indexOf('@-moz-document', i)
    if (start < 0) { out += css.slice(i); break }
    out += css.slice(i, start)
    const open = css.indexOf('{', start)
    let depth = 1
    let j = open + 1
    for (; j < css.length && depth > 0; j++) { if (css[j] === '{') depth++; else if (css[j] === '}') depth-- }
    out += css.slice(open + 1, j - 1)
    i = j
  }
  return out
}
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
if (styleArg) await page.addStyleTag({ content: unwrap(readFileSync(styleArg, 'utf8')) })
if (styleArg) await page.waitForTimeout(1500) /* let transitions on the host's rules finish */

const out = await page.evaluate((sel) => {
  const els = [...document.querySelectorAll(sel)].slice(0, 3)
  const interesting = /background|border-radius|box-shadow|border:/
  return els.map((el) => {
    const rules = []
    /* Walk nested rules too: a declaration inside @media, @layer, @supports or
     * @container has no selectorText at the top level and would otherwise be
     * invisible here — exactly where a host's own !important tends to hide. */
    const walk = (list, ctx) => {
      for (const rule of list) {
        if (rule.cssRules && rule.cssRules.length && !rule.selectorText) {
          const head = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim()
          walk(rule.cssRules, ctx ? `${ctx} ${head}` : head)
          continue
        }
        if (!rule.selectorText || !rule.style) continue
        let matches = false
        try { matches = el.matches(rule.selectorText) } catch { continue }
        if (!matches) continue
        if (!interesting.test(rule.cssText)) continue
        const prio = rule.style.getPropertyPriority('border-radius') || rule.style.getPropertyPriority('border-top-left-radius')
        rules.push(`${ctx ? `[${ctx}] ` : ''}${prio ? '!' : ''}${rule.cssText.slice(0, 200)}`)
      }
    }
    for (const sheet of document.styleSheets) {
      let list
      try { list = sheet.cssRules } catch { continue }
      walk(list, '')
    }
    for (const sheet of document.adoptedStyleSheets || []) walk(sheet.cssRules, '[adopted]')
    const c = getComputedStyle(el)
    return {
      outerStart: el.outerHTML.slice(0, 220),
      classes: el.className,
      computed: { bg: c.backgroundColor, radius: c.borderTopLeftRadius, color: c.color, transition: c.transition, inlineStyle: el.getAttribute('style') },
      /* Tree scope: a document stylesheet cannot reach a shadow tree, and a
       * slotted element's ::slotted() !important outranks ours. `forced` is the
       * radius after an inline !important — if that zeroes it, the sheet lost. */
      scope: { inDocument: el.getRootNode() === document, slotted: !!el.assignedSlot, forced: (() => { const prev = el.style.cssText; el.style.setProperty('border-radius', '0px', 'important'); const v = getComputedStyle(el).borderTopLeftRadius; el.style.cssText = prev; return v })() },
      rules: rules.slice(0, 20),
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
