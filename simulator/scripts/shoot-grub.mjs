/* Capture the /grub simulator canvas at native 2560x1440.
 *
 * The canvas backing store is always SCREEN_W x SCREEN_H regardless of the
 * on-page preview width, so we pull it with toDataURL rather than screenshot
 * the scaled <canvas> element — a downscaled grab would hide exactly the
 * sub-pixel edge work (feathered border, 4px selection stroke) we want to
 * inspect.
 *
 * Usage:  node scripts/shoot-grub.mjs [outfile] [selectedIndex]
 * Requires a built site: `bun run build` (or npm) first.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';

const OUT = process.argv[2] ?? '/tmp/grub-sim.png';
const SELECTED = Number(process.argv[3] ?? 0);

const BUILD = new URL('../build/', import.meta.url).pathname;
if (!existsSync(BUILD)) {
  console.error('build/ not found — run `bun run build` first.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.pf2': 'application/octet-stream', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let file = join(BUILD, normalize(p));
    // adapter-static emits /grub/index.html; a bare /grub resolves to the
    // directory, which readFile rejects with EISDIR.
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) file = join(BUILD, normalize(p) + '.html');
    if (!existsSync(file)) { res.writeHead(404); res.end('nope'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => { if (m.type() === 'error') console.error('page:', m.text()); });
await page.goto(`http://127.0.0.1:${port}/grub`, { waitUntil: 'networkidle' });
await page.waitForSelector('canvas');

if (SELECTED > 0) {
  const rows = page.locator('.entry-row input, .entry-row button');
  await rows.nth(SELECTED).focus().catch(() => {});
}

// Give the async render (image + font decode) a beat past networkidle.
await page.waitForFunction(() => {
  const c = document.querySelector('canvas');
  if (!c) return false;
  const x = c.getContext('2d');
  // any non-transparent pixel in the content band means we've painted
  const d = x.getImageData(1200, 200, 1, 1).data;
  return d[3] > 0;
}, null, { timeout: 15000 });

const dataUrl = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, Buffer.from(dataUrl.split(',')[1], 'base64'));
console.log('wrote', OUT);

await browser.close();
server.close();
