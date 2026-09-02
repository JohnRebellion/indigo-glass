/* Dump the COMPUTED style of one live instance of every .nb-* primitive.
 *
 * The reviewers get the reference's Tailwind class strings and this table.
 * That pairing is the only way an outside model can check fidelity without
 * repo access: Tailwind classes state intent, computed styles state what the
 * browser actually painted, and the gap between them is where a bug lives.
 *
 * Lives here rather than in the audit workspace so it resolves the
 * simulator's own playwright install.
 *
 * Usage (from simulator/, after `npm run build`):
 *   node scripts/dump-computed.mjs > ../research-reports/<audit>/measure/computed.tsv
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const BUILD = new URL('../build/', import.meta.url).pathname;
const PORT = 4322;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf' };

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let path = join(BUILD, normalize(url).replace(/^(\.\.[/\\])+/, ''));
  if (url.endsWith('/')) path = join(path, 'index.html');
  try {
    res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
    res.end(await readFile(path));
  } catch { res.writeHead(404).end('nf'); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1560, height: 1200 } });
await page.goto(`http://127.0.0.1:${PORT}/neobrutalism/`, { waitUntil: 'networkidle' });

const PROPS = [
  'background-color', 'color', 'border-top-width', 'border-top-style',
  'border-top-color', 'border-top-left-radius', 'box-shadow', 'outline',
  'font-size', 'font-weight', 'font-family', 'padding', 'height', 'width',
  'opacity', 'transition-duration', 'transition-timing-function'
];

const rows = await page.evaluate((props) => {
  const seen = new Set();
  const out = [];
  for (const el of document.querySelectorAll('[class*="nb-"]')) {
    for (const cls of el.classList) {
      if (!cls.startsWith('nb-') || seen.has(cls)) continue;
      seen.add(cls);
      const cs = getComputedStyle(el);
      const rec = { selector: '.' + cls };
      for (const p of props) rec[p] = cs.getPropertyValue(p);
      // font-family is long and identical everywhere; keep only the head.
      rec['font-family'] = rec['font-family'].split(',')[0].replace(/"/g, '');
      out.push(rec);
    }
  }
  return out.sort((a, b) => a.selector.localeCompare(b.selector));
}, PROPS);

// Contrast ratios the page computed for itself, read back from the DOM.
const contrasts = await page.$$eval('.tk tbody tr', (trs) =>
  trs.map((tr) => [...tr.cells].map((c) => c.innerText.replace(/\s+/g, ' ').trim()))
);

console.log('## computed styles');
console.log(['selector', ...PROPS].join('\t'));
for (const r of rows) console.log([r.selector, ...PROPS.map((p) => r[p])].join('\t'));
console.log('');
console.log('## contrast (as rendered)');
for (const c of contrasts) console.log(c.join('\t'));

await browser.close();
server.close();
