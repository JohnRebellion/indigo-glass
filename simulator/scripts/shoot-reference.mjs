/* Capture neobrutalism.dev's own rendered component previews as fidelity
 * ground truth for the /neobrutalism/ audit.
 *
 * Each /docs/<id> page embeds one or more live preview boxes
 * (`.not-prose[class*="min-h-[200px]"]`, the site's own demo container,
 * not a selector we invented). By default this captures only the first
 * (hero) preview per page — the representative demo — for the cheap
 * sectioned pass. `--all` captures every preview box per page, for
 * drilling into one component in full.
 *
 * Forces dark mode via `localStorage.theme = 'dark'` before navigation —
 * Sage Ink has no light variant, so a light-mode reference is not a fair
 * comparison. Fails loudly if `<html>` doesn't end up with class `dark`.
 *
 * Usage:
 *   node scripts/shoot-reference.mjs                 # hero preview, all 46
 *   node scripts/shoot-reference.mjs --all button card select   # every preview, named ids only
 *   node scripts/shoot-reference.mjs --id button --all          # every preview, one id
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { ROSTER } from '../src/lib/nb/roster.ts';

const args = process.argv.slice(2);
const ALL = args.includes('--all');
const rest = args.filter((a) => a !== '--all' && a !== '--id');
const ids = rest.length > 0 ? rest.filter((id) => ROSTER.includes(id)) : ROSTER;
const unknown = rest.filter((id) => !ROSTER.includes(id));
if (unknown.length) {
  console.error(`Not in roster, skipped: ${unknown.join(', ')}`);
}

const OUT = new URL('../../research-reports/', import.meta.url).pathname;
const DATE = new Date().toISOString().slice(0, 10);
const RUN_DIR = `${OUT}neobrutalism-live-audit-${DATE}/reference/`;
await mkdir(RUN_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  deviceScaleFactor: 2
});
await context.addInitScript(() => {
  try { localStorage.setItem('theme', 'dark'); } catch {}
});
const page = await context.newPage();

const manifest = [];

for (const id of ids) {
  const url = `https://www.neobrutalism.dev/docs/${id}`;
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => {
    console.error(`${id}: navigation failed — ${e.message}`);
    return null;
  });
  if (!resp || !resp.ok()) {
    manifest.push({ id, url, ok: false, status: resp?.status() ?? 0 });
    console.log(`${id}: SKIP (${resp?.status() ?? 'no response'})`);
    continue;
  }

  await page.waitForTimeout(200);
  const htmlClass = await page.evaluate(() => document.documentElement.className);
  if (!htmlClass.includes('dark')) {
    console.error(`${id}: dark mode did not engage (class="${htmlClass}") — skipping to avoid a light-mode false comparison`);
    manifest.push({ id, url, ok: false, reason: 'dark-mode-failed' });
    continue;
  }

  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}'
  });

  const boxCount = await page.evaluate(
    () => document.querySelectorAll('article div[class*="min-h-[200px]"]').length
  );
  if (boxCount === 0) {
    console.error(`${id}: no preview box found — selector may need updating`);
    manifest.push({ id, url, ok: false, reason: 'no-preview-box' });
    continue;
  }

  const take = ALL ? boxCount : 1;
  for (let i = 0; i < take; i++) {
    const box = page.locator('article div[class*="min-h-[200px]"]').nth(i);
    const filename = take === 1 ? `${id}.png` : `${id}-${i + 1}.png`;
    await box.screenshot({ path: `${RUN_DIR}${filename}` }).catch((e) => {
      console.error(`${id} box ${i}: screenshot failed — ${e.message}`);
    });
    manifest.push({ id, url, ok: true, box: i, of: boxCount, file: filename, htmlClass });
    console.log(`${id}${take > 1 ? ` [${i + 1}/${boxCount}]` : ''}: OK`);
  }
}

await writeFile(`${RUN_DIR}manifest.json`, JSON.stringify(manifest, null, 2));
await browser.close();
console.log(`\nWrote ${manifest.filter((m) => m.ok).length} preview(s) to ${RUN_DIR}`);
