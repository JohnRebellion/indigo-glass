/* vars — dump every CSS custom property in effect on <html> for a page, with
 * its computed value. Used to write site styles against the site's real token
 * vocabulary instead of guessed variable names. */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
const [url, filter = ''] = process.argv.slice(2)
const port = 9800 + Math.floor(Math.random() * 150)
const proc = spawn('/opt/microsoft/msedge/msedge', [`--user-data-dir=${process.env.IG_STYLE_PROFILE || '/tmp/ig-style-profile'}`, `--remote-debugging-port=${port}`, '--no-first-run', '--disable-extensions', '--headless=new'], { stdio: 'ignore' })
let browser
for (let i = 0; i < 60; i++) { await sleep(500); try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break } catch {} }
const page = await browser.contexts()[0].newPage()
await page.setViewportSize({ width: 1400, height: 1000 })
await page.emulateMedia({ colorScheme: 'dark' })
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(Number(process.env.IG_WAIT || 5000))
const vars = await page.evaluate(() => {
  const names = new Set()
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules } catch { continue }
    /* r.style is a CSSStyleDeclaration — iterate by index. Spreading it works
     * on most rules but yields undefined entries on some (@font-face, nested
     * at-rules), which threw on github.com. */
    const walk = (list) => {
      for (const r of list) {
        if (r.style) {
          for (let i = 0; i < r.style.length; i++) {
            const p = r.style.item(i)
            if (p && p.startsWith('--')) names.add(p)
          }
        }
        if (r.cssRules) walk(r.cssRules)
      }
    }
    walk(rules)
  }
  const cs = getComputedStyle(document.documentElement)
  return [...names].sort().map((n) => [n, cs.getPropertyValue(n).trim()]).filter(([, v]) => v)
})
console.log(vars.filter(([n, v]) => !process.argv[3] || n.includes(process.argv[3])).map(([n, v]) => `${n}: ${v}`).join('\n'))
await browser.close(); proc.kill('SIGTERM')
