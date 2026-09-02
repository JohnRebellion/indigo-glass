/* Capture /neobrutalism/ as review artefacts.
 *
 * Produces one full-page PNG (the whole implementation in a single image)
 * plus one PNG per section, because a single 1560px-wide full-page capture
 * of this route runs to several thousand pixels tall and most chat UIs
 * downsample it past the point where a 2px border is legible.
 *
 * Usage:  node scripts/shoot-neobrutalism.mjs [--width 1560] [--scale 2]
 * Requires a built site; run `npm run build` first.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(args[i + 1]);
};

const WIDTH = flag('width', 1560);
const SCALE = flag('scale', 2);
const BUILD = new URL('../build/', import.meta.url).pathname;
const OUT = new URL('../screenshots/neobrutalism/', import.meta.url).pathname;
const PORT = 4319;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf', '.pf2': 'application/octet-stream', '.svg': 'image/svg+xml'
};

if (!existsSync(BUILD)) {
  console.error('build/ not found — run `npm run build` first.');
  process.exit(1);
}

/* A static server rather than http-server, so this script has no extra dep
   and cleans itself up when the capture finishes. */
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
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: 1200 },
  deviceScaleFactor: SCALE
});

await page.goto(`http://127.0.0.1:${PORT}/neobrutalism/`, { waitUntil: 'networkidle' });
// Marquee and skeleton pulse would otherwise differ between two captures of
// the same build, which makes the images useless for a before/after diff.
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
await page.waitForTimeout(300);

const [pageW, pageH] = await page.evaluate(() => [
  document.documentElement.scrollWidth,
  document.documentElement.scrollHeight
]);

await page.screenshot({ path: join(OUT, 'full.png'), fullPage: true });
console.log(`full.png  ${pageW}x${pageH} css px @${SCALE}x`);

/* Anthropic and most chat UIs reject an image over 8000px on a side or ~3.75
   megapixels, and full.png clears both by a wide margin. Tiles are what you
   actually upload: contiguous horizontal bands of the same capture, each
   inside the limit, overlapping slightly so nothing lands in a seam.
   Tiles are captured at 1x on purpose — a 2x tile spends its whole pixel
   budget on device scale and ends up covering a few hundred CSS px. */
const TILE_SCALE = 1;
const MAX_EDGE = 7600;
const MAX_AREA = 3.5e6;
const tileH = Math.max(
  400,
  Math.min(
    Math.floor(MAX_EDGE / TILE_SCALE),
    Math.floor(MAX_AREA / (TILE_SCALE * TILE_SCALE) / pageW)
  )
);
const OVERLAP = 40;
const step = tileH - OVERLAP;
const tileCount = Math.ceil(pageH / step);

/* Write one PNG per band of [y, y+height), splitting anything taller than a
   single tile. Returns the filenames written. */
async function captureBand(target, stem, y, height) {
  const parts = Math.max(1, Math.ceil(height / step));
  const written = [];
  for (let i = 0; i < parts; i++) {
    const top = y + i * step;
    const h = Math.min(tileH, y + height - top);
    if (h <= 0) break;
    const name = parts === 1 ? `${stem}.png` : `${stem}-${i + 1}.png`;
    await target.screenshot({ path: join(OUT, name), fullPage: true, clip: { x: 0, y: top, width: pageW, height: h } });
    written.push(name);
  }
  return written;
}

const tilePage = await browser.newPage({
  viewport: { width: WIDTH, height: tileH },
  deviceScaleFactor: TILE_SCALE
});
await tilePage.goto(`http://127.0.0.1:${PORT}/neobrutalism/`, { waitUntil: 'networkidle' });
await tilePage.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
await tilePage.waitForTimeout(300);

for (let i = 0; i < tileCount; i++) {
  const y = i * step;
  const h = Math.min(tileH, pageH - y);
  if (h <= 0) break;
  const name = `tile-${String(i + 1).padStart(2, '0')}.png`;
  await tilePage.screenshot({
    path: join(OUT, name),
    fullPage: true,
    clip: { x: 0, y, width: pageW, height: h }
  });
  console.log(`${name}  ${pageW}x${h} css px @${TILE_SCALE}x`);
}

/* Per-section crops, also at 1x and split the same way, so every artefact in
   this directory can be uploaded as-is without a downscale step. */
const bands = await tilePage.$$eval('.hero, section[id]', (els) =>
  els.map((e) => {
    const r = e.getBoundingClientRect();
    return {
      id: e.id || '00-header',
      y: Math.max(0, Math.round(r.top + window.scrollY) - 8),
      height: Math.round(r.height) + 16
    };
  })
);

let sectionFiles = 0;
for (const band of bands) {
  const written = await captureBand(tilePage, band.id, band.y, band.height);
  sectionFiles += written.length;
  console.log(written.join(', '));
}

await tilePage.close();
await browser.close();
server.close();
console.log(`\nWrote full.png, ${tileCount} tile(s) and ${sectionFiles} section image(s) to screenshots/neobrutalism/`);
