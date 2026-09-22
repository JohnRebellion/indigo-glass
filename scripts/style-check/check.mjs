#!/usr/bin/env node
/* style-check — render a site with one of the repo's Stylus site styles applied
 * and report what the style did NOT reach.
 *
 * Why this exists: the first three passes at google/youtube/facebook.user.css
 * were written from screenshots and guessed selectors. Two of those guesses
 * broke layout (Google's masonry grid, then its result rows) and several
 * missed entirely (query highlights, rounded corners). This harness reads the
 * computed styles off a real render instead, so a selector is either proven to
 * land or reported as a miss with the element that survived.
 *
 * Runs the system Edge against a COPY of the personal profile (cookies only —
 * see mkprofile.sh) so logged-in surfaces like Marketplace render. The copy is
 * disposable; the live profile is never opened.
 *
 * Usage:
 *   node check.mjs google|youtube|facebook|all [--headed] [--no-style]
 *
 * Output: /tmp/ig-shots/<site>.png plus a JSON audit on stdout.
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

const SITES = {
  google: {
    css: 'browser/stylus/sites/google.user.css',
    urls: {
      all: 'https://www.google.com/',
      images: 'https://www.google.com/',
    },
    content: '#center_col',
    /* Hitting /search directly gets served /sorry/index (CAPTCHA) on a cold
     * cookie jar. Typing the query on the homepage and submitting does not. */
    flow: async (page, label) => {
      await page.fill('textarea[name="q"], input[name="q"]', 'qg18de')
      await page.keyboard.press('Enter')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2500)
      if (label === 'images') {
        const tab = page.getByRole('link', { name: /^Images$/ }).first()
        if (await tab.count()) {
          await tab.click().catch(() => {})
          await page.waitForTimeout(2500)
        }
      }
    },
  },
  youtube: {
    css: 'browser/stylus/sites/youtube.user.css',
    urls: { home: 'https://www.youtube.com/' },
    content: 'ytd-app',
  },
  github: {
    css: 'browser/stylus/sites/github.user.css',
    urls: {
      repo: 'https://github.com/anthropics/claude-code',
      issues: 'https://github.com/anthropics/claude-code/issues',
    },
    content: 'body',
  },
  wikipedia: {
    css: 'browser/stylus/sites/wikipedia.user.css',
    /* Two shapes, because an article with only an infobox never exercises the
     * table-header rules: the engine page is the infobox/ambox/navbox case,
     * the comparison page is wall-to-wall `.wikitable` with hand-written cell
     * backgrounds in the wikitext. */
    urls: {
      article: 'https://en.wikipedia.org/wiki/Nissan_QG_engine',
      tables: 'https://en.wikipedia.org/wiki/Comparison_of_web_browsers',
      /* Both again in night mode. Wikipedia's anonymous default is
       * `skin-theme-clientpref-day`, and `emulateMedia({colorScheme:'dark'})`
       * does not change it — the class is a client preference, not a media
       * query. So every rule this file gates on night/os was being audited in
       * a mode where it cannot fire: the first pass reported 34 navbox cells
       * "unfixed" that were fixed, and 12 infobox cells unreadable that are
       * only unreadable in day mode. `?vectornightmode=1` is what flips it;
       * `?useskintheme=night` does NOT (verified — still renders day). */
      articleNight: 'https://en.wikipedia.org/wiki/Nissan_QG_engine?vectornightmode=1',
      tablesNight: 'https://en.wikipedia.org/wiki/Comparison_of_web_browsers?vectornightmode=1',
    },
    content: 'body',
  },
  /* Work tenants are named by env var, never committed: IG_ATLASSIAN_HOST,
   * IG_M365_URL. Client hostnames do not belong in a public dotfiles repo. */
  atlassian: {
    css: 'browser/stylus/sites/atlassian.user.css',
    urls: { jira: `https://${process.env.IG_ATLASSIAN_HOST || 'example.atlassian.net'}/jira/your-work` },
    content: 'body',
    settle: 8000,
  },
  m365: {
    css: 'browser/stylus/sites/microsoft365.user.css',
    urls: { mail: process.env.IG_M365_URL || 'https://outlook.cloud.microsoft/mail/' },
    content: 'body',
    settle: 10000,
  },
  gemini: {
    css: 'browser/stylus/sites/gemini.user.css',
    urls: { app: 'https://gemini.google.com/app' },
    content: 'body',
    settle: 6000,
  },
  aistudio: {
    css: 'browser/stylus/sites/aistudio.user.css',
    urls: { chat: 'https://aistudio.google.com/prompts/new_chat' },
    content: 'body',
    settle: 6000,
  },
  copilot: {
    css: 'browser/stylus/sites/copilot.user.css',
    urls: { chat: 'https://copilot.microsoft.com/' },
    content: 'body',
    settle: 6000,
  },
  facebook: {
    css: 'browser/stylus/sites/facebook.user.css',
    urls: { marketplace: 'https://www.facebook.com/marketplace/' },
    content: 'div[role="main"]',
    /* Marketplace paints glimmer skeletons for several seconds; auditing too
     * early reports the loading state instead of the page. */
    settle: 9000,
  },
  shopee: {
    css: 'browser/stylus/sites/shopee.user.css',
    urls: { home: 'https://shopee.ph/' },
    content: '#main',
    settle: 6000,
    /* shopee.ph runs a slide-puzzle verification (GeeTest-style) on any
     * unfamiliar browser fingerprint — headless fails it outright, and a
     * fresh headed profile gets a real puzzle to solve. It does not
     * re-challenge once solved: the pass persists in that profile's cookies.
     * Point IG_STYLE_PROFILE at a profile that has already solved it once
     * (`node check.mjs shopee --headed`, solve by hand, keep that profile
     * dir); do not script around the puzzle itself. */
  },
}

/* Stylus wraps everything in @-moz-document, which Chromium drops as an
 * unknown at-rule. Unwrap to the inner CSS so addStyleTag applies it. Nested
 * at-rules (@supports, @media, @font-face) inside the block are preserved. */
function unwrap(css) {
  const out = []
  let i = 0
  while (true) {
    const start = css.indexOf('@-moz-document', i)
    if (start === -1) break
    /* The block brace is the first '{' OUTSIDE the prelude's parentheses.
     * Taking the first '{' outright silently truncated google.user.css to
     * three characters, because its regexp() prelude contains [a-z]{2,3}. */
    let open = -1
    let paren = 0
    for (let k = start; k < css.length; k++) {
      if (css[k] === '(') paren++
      else if (css[k] === ')') paren--
      else if (css[k] === '{' && paren === 0) { open = k; break }
    }
    if (open === -1) break
    let depth = 0
    let j = open
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') {
        depth--
        if (depth === 0) break
      }
    }
    out.push(css.slice(open + 1, j))
    i = j + 1
  }
  return out.join('\n')
}

/* Tokens the styles are allowed to paint with. Anything else showing up as a
 * surface inside the content area is an element the style did not reach. */
const TOKEN_RGB = new Set([
  'rgb(7, 8, 10)', 'rgb(13, 13, 16)', 'rgb(18, 18, 22)', 'rgb(28, 28, 30)',
  'rgba(0, 0, 0, 0)', 'transparent',
])

async function audit(page, contentSel) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel) || document.body
    const all = [...root.querySelectorAll('*')].slice(0, 6000)
    const sig = (el) => {
      const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 2).join('.') : ''
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`
    }
    const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1)

    const radii = new Map()
    const fills = new Map()
    const linkColours = new Map()
    for (const el of all) {
      const r = el.getBoundingClientRect()
      if (r.width < 24 || r.height < 12) continue
      const c = getComputedStyle(el)
      const rad = c.borderTopLeftRadius
      if (rad !== '0px' && !rad.startsWith('0') && parseFloat(rad) >= 4) {
        // round avatars are intentional; skip anything fully circular
        const circular = parseFloat(rad) >= Math.min(r.width, r.height) / 2 - 1
        if (!circular) bump(radii, `${sig(el)} r=${rad}`)
      }
      const bg = c.backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && !bg.startsWith('rgba(0, 0, 0, 0)')) {
        bump(fills, `${sig(el)} bg=${bg}`)
      }
      if (el.tagName === 'A') bump(linkColours, c.color)
    }
    const top = (m, n = 14) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([k, v]) => `${v}x ${k}`)

    const layout = ['#cnt', '#rcnt', '#center_col', '#rso', '#search'].map((s) => {
      const e = document.querySelector(s)
      if (!e) return null
      const c = getComputedStyle(e)
      return { sel: s, box: Math.round(e.getBoundingClientRect().width), width: c.width, maxWidth: c.maxWidth, marginLeft: c.marginLeft, display: c.display, gridCols: c.gridTemplateColumns }
    }).filter(Boolean)

    return { radii: top(radii), fills: top(fills), linkColours: top(linkColours, 8), layout }
  }, contentSel)
}

async function run(siteKey, { headed, noStyle, extraCss }) {
  const site = SITES[siteKey]
  const css = noStyle ? '' : unwrap(readFileSync(resolve(REPO, site.css), 'utf8'))
  mkdirSync(SHOTS, { recursive: true })

  /* Launched as a plain Edge process and attached over CDP, NOT via
   * launchPersistentContext. Playwright's own launch path advertises the
   * automation switches, and Google answers those with /sorry/index (a
   * CAPTCHA) for every /search URL — verified three ways: direct URL,
   * homepage-then-type, and with --disable-blink-features set. Attaching to a
   * normally-started browser gets a normal SERP. */
  const port = 9333 + Math.floor(Math.random() * 400)
  const proc = spawn(EDGE, [
    `--user-data-dir=${PROFILE}`,
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    '--no-first-run', '--no-default-browser-check',
    /* The copied profile is signed into the user's Microsoft account, so Edge
     * SYNCS the real extension set into it — Dark Reader included. That made
     * early audits read Dark Reader's output (#181a1b) instead of the site's,
     * and put an ad-blocker upsell popup in every screenshot. The target
     * state for these styles is Stylus alone, so: no extensions. */
    '--disable-extensions',
    '--force-dark-mode=0',
    ...(headed ? [] : ['--headless=new']),
  ], { stdio: 'ignore', detached: false })

  let browser
  for (let i = 0; i < 60; i++) {
    await sleep(500)
    try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); break } catch {}
  }
  if (!browser) { proc.kill(); throw new Error('Edge did not expose a CDP endpoint') }
  const ctx = browser.contexts()[0]
  const results = {}
  try {
    for (const [label, url] of Object.entries(site.urls)) {
      const page = await ctx.newPage()
      await page.setViewportSize({ width: 1400, height: 1000 })
      /* Facebook (and Google's AI surfaces) follow prefers-color-scheme when
       * the account theme is Automatic. Without this the harness renders the
       * light theme and every audit line is noise. */
      await page.emulateMedia({ colorScheme: 'dark' })
      /* Google's CSP blocks injected <style> elements, so addStyleTag lands
       * silently and the audit reports the unstyled page (verified: link
       * colour came back as Google's own #99C3FF). Turn CSP off for the
       * harness page only. */
      const cdp = await ctx.newCDPSession(page)
      await cdp.send('Page.setBypassCSP', { enabled: true })
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForTimeout(3500)
      // Google/YouTube consent interstitials
      for (const t of ['Accept all', 'Reject all', 'I agree']) {
        const b = page.getByRole('button', { name: t }).first()
        if (await b.count().catch(() => 0)) {
          await b.click({ timeout: 2000 }).catch(() => {})
          await page.waitForTimeout(2000)
          break
        }
      }
      if (site.flow) await site.flow(page, label)

      /* Layout stability. Both audits measure paint, not geometry — which is
       * how a width rule shipped twice that collapsed a masonry grid and then
       * wrapped result titles one word per line. Capture the document's own
       * geometry BEFORE the style goes on, so the after-reading has something
       * to be wrong against. */
      const geomBefore = css ? await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        /* documentElement, not body: an app shell (YouTube) leaves
         * body.scrollHeight at 0 and every ratio against it is fiction. */
        docH: document.documentElement.scrollHeight,
      })) : null

      if (css) await page.addStyleTag({ content: css })
      if (site.settle) {
        await page.waitForTimeout(site.settle)
        await page.mouse.wheel(0, 600)
        await page.waitForTimeout(2500)
        await page.mouse.wheel(0, -600)
      }
      /* --extra "<css>" appends a probe stylesheet after the site style, so a
       * candidate rule can be measured against the real DOM before it is
       * written into the repo file. */
      if (extraCss) await page.addStyleTag({ content: extraCss })
      await page.waitForTimeout(1500)
      const name = `${siteKey}-${label}${noStyle ? '-bare' : ''}`
      await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false })
      await page.screenshot({ path: `${SHOTS}/${name}-full.png`, fullPage: true })
      const geomAfter = css ? await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        docH: document.documentElement.scrollHeight,
      })) : null
      const layoutWarnings = []
      if (geomBefore && geomAfter) {
        if (geomAfter.scrollW > geomAfter.clientW + 2 && geomBefore.scrollW <= geomBefore.clientW + 2) {
          layoutWarnings.push(`style introduced horizontal overflow: ${geomBefore.scrollW} -> ${geomAfter.scrollW} (viewport ${geomAfter.clientW})`)
        }
        /* Only compare heights when both readings are real; a virtualised
         * shell can report a nonsense height in either direction. */
        if (geomBefore.docH > 400 && geomAfter.docH > 400) {
          const grew = geomAfter.docH / geomBefore.docH
          if (grew > 1.5) layoutWarnings.push(`page height grew ${grew.toFixed(1)}x — content may be wrapping into a starved column`)
          if (grew < 0.6) layoutWarnings.push(`page height shrank to ${grew.toFixed(2)}x — content may be clipped`)
        }
      }

      /* A narrow pass: a responsive breakpoint can swap in a component tree
       * whose tokens were never remapped. Cheap to check, easy to miss. */
      let narrow = null
      if (css) {
        await page.setViewportSize({ width: 900, height: 1000 })
        await page.waitForTimeout(1200)
        narrow = await audit(page, site.content)
        await page.setViewportSize({ width: 1400, height: 1000 })
        await page.waitForTimeout(600)
      }

      results[label] = {
        url: page.url(), title: await page.title(),
        ...(await audit(page, site.content)),
        layoutWarnings,
        narrow900: narrow ? { radii: narrow.radii.slice(0, 5), fills: narrow.fills.slice(0, 5) } : null,
      }
      await page.close()
    }
  } finally {
    await browser.close().catch(() => {})
    proc.kill('SIGTERM')
    await sleep(1200)
  }
  return results
}

const argv = process.argv.slice(2)
const keys = argv[0] === 'all' || !argv[0] ? Object.keys(SITES) : [argv[0]]
const extraIdx = argv.indexOf('--extra')
const opts = {
  headed: argv.includes('--headed'),
  noStyle: argv.includes('--no-style'),
  extraCss: extraIdx !== -1 ? argv[extraIdx + 1] : '',
}
const out = {}
for (const k of keys) out[k] = await run(k, opts)
console.log(JSON.stringify(out, null, 1))
