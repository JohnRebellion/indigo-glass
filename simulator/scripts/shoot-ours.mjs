/* Capture per-component crops of /neobrutalism/, aligned 1:1 with
 * scripts/shoot-reference.mjs so `gemini-see -d` can diff the two by id.
 *
 * Crops on `[data-testid^="spec-<id>"]` — the same attribute
 * Specimen.svelte stamps for e2e/neobrutalism.spec.ts's roster-coverage
 * check, so this can't silently drift from what that test enforces.
 * Some roster ids (button, label, form) are folded into compound specimen
 * names ("button / default", "label + form"); those are matched by prefix
 * and every matching cell is captured, numbered like shoot-reference.mjs's
 * `--all` mode.
 *
 * Requires a built site; run `npm run build` first.
 *
 * Usage:  node scripts/shoot-ours.mjs [id...]   # default: all 46
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { ROSTER } from '../src/lib/nb/roster.ts';

const args = process.argv.slice(2);
const ids = args.length > 0 ? args.filter((id) => ROSTER.includes(id)) : ROSTER;

/* Roster ids with no specimen of their own — folded into a compound cell
   under a different id. Documented here rather than guessed at capture
   time, because a silent prefix-widen risks matching the wrong cell. */
const FOLDED_INTO = { form: 'label' };

const BUILD = new URL('../build/', import.meta.url).pathname;
if (!existsSync(BUILD)) {
  console.error('build/ not found — run `npm run build` first.');
  process.exit(1);
}

const DATE = new Date().toISOString().slice(0, 10);
const OUT = new URL(`../../research-reports/neobrutalism-live-audit-${DATE}/ours/`, import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const PORT = 4321;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml'
};
const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let path = join(BUILD, normalize(url).replace(/^(\.\.[/\\])+/, ''));
  if (url.endsWith('/')) path = join(path, 'index.html');
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1560, height: 1200 },
  deviceScaleFactor: 2
});
await page.goto(`http://127.0.0.1:${PORT}/neobrutalism/`, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
await page.waitForTimeout(300);

const manifest = [];

for (const id of ids) {
  const lookupId = FOLDED_INTO[id] ?? id;
  /* A bare CSS prefix selector matches 'alert-dialog' when looking for
     'alert'. Fetch every spec cell and require the id to end there or be
     followed by a boundary (' ', '/', '+') a compound name like
     "button / default" or "label + form" would use.
     Two roster sections both render a specimen literally named "chart"
     (Styling's token-swatch grid and DataDisplay's actual chart), so
     testid is NOT unique — re-querying by testid string would collapse
     both onto whichever comes first in the DOM. Keep the live
     ElementHandles from the one $$() call instead of re-selecting. */
  const allHandles = await page.$$('[data-testid^="spec-"]');
  const boundary = new RegExp(`^spec-${lookupId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[ /+])`);
  const handles = [];
  for (const h of allHandles) {
    const t = await h.getAttribute('data-testid');
    if (boundary.test(t)) handles.push(h);
  }
  if (handles.length === 0) {
    console.error(`${id}: no specimen found (data-testid matching /${boundary.source}/)`);
    manifest.push({ id, ok: false, reason: 'no-specimen' });
    continue;
  }
  if (FOLDED_INTO[id]) {
    console.log(`${id}: folded into '${lookupId}' specimen, capturing that cell`);
  }
  const take = handles.length;
  for (let i = 0; i < take; i++) {
    const testid = await handles[i].getAttribute('data-testid');
    const filename = take === 1 ? `${id}.png` : `${id}-${i + 1}.png`;
    await handles[i].scrollIntoViewIfNeeded();
    await handles[i].screenshot({ path: `${OUT}${filename}` }).catch((e) => {
      console.error(`${id} [${i}]: screenshot failed — ${e.message}`);
    });
    manifest.push({ id, ok: true, testid, file: filename });
    console.log(`${id}${take > 1 ? ` [${i + 1}/${take}]` : ''} (${testid}): OK`);
  }
}

await writeFile(`${OUT}manifest.json`, JSON.stringify(manifest, null, 2));
await browser.close();
server.close();
console.log(`\nWrote ${manifest.filter((m) => m.ok).length} specimen(s) to ${OUT}`);
