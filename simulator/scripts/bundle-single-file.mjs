/* Export /neobrutalism/ as ONE self-contained .html file.
 *
 * Why: the page is the review artefact, and a reviewer outside this machine
 * (another model in a web chat, a browser on a phone) can neither run the dev
 * server nor stitch a directory of assets together. Screenshots lose the
 * markup and the computed values; a directory loses portability. A single
 * file keeps both, offline, with no network fetch at open time.
 *
 * What it does:
 *   1. renders the built page and waits for hydration, so the token labels
 *      resolved by liveTokens.ts are baked into the DOM as text
 *   2. inlines every stylesheet
 *   3. subsets the three fonts actually used down to the glyphs this page
 *      renders, converts to woff2, and inlines them as data URIs
 *      (3.2 MB of TTF becomes tens of KB)
 *   4. drops all script tags — nothing is interactive after step 1
 *
 * Output: screenshots/neobrutalism/indigo-glass-simulator-neobrutalism.html
 * That name travels — it is what gets attached to an external review, where
 * "neobrutalism.html" alone would say nothing about which project it is from.
 *
 * Usage (from simulator/, after `npm run build`):
 *   node scripts/bundle-single-file.mjs [--out <path>]
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { extname, join, normalize, dirname } from 'node:path';

const run = promisify(execFile);
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = outIdx === -1
  ? new URL('../screenshots/neobrutalism/indigo-glass-simulator-neobrutalism.html', import.meta.url).pathname
  : args[outIdx + 1];

const ROOT = new URL('../', import.meta.url).pathname;
const BUILD = join(ROOT, 'build');
const PORT = 4323;

if (!existsSync(BUILD)) {
  console.error('build/ not found — run `npm run build` first.');
  process.exit(1);
}

/* Only these three faces are used on this page. global.css also declares
   Carlito italic + bold-italic and the non-condensed Iosevka; none of them
   render here, so they are not carried. */
const FACES = [
  { family: 'Carlito', weight: 400, style: 'normal', file: 'static/fonts/carlito/Carlito-Regular.ttf' },
  { family: 'Carlito', weight: 700, style: 'normal', file: 'static/fonts/carlito/Carlito-Bold.ttf' },
  { family: 'Iosevka Custom Condensed', weight: 400, style: 'normal', file: 'static/fonts/iosevka/IosevkaCustom-Condensed.ttf' }
];

/* CSS-generated content never appears in innerText, so anything drawn by a
   ::before/::after rule has to be listed by hand or it renders as tofu. */
const EXTRA_GLYPHS = '✓✔●▦⌘⇧‹›⋯↔▾▴→−·—–…× ';

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let path = join(BUILD, normalize(url).replace(/^(\.\.[/\\])+/, ''));
  if (url.endsWith('/')) path = join(path, 'index.html');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf' };
  try {
    res.writeHead(200, { 'content-type': mime[extname(path)] ?? 'application/octet-stream' });
    res.end(await readFile(path));
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1560, height: 1200 } });
await page.goto(`http://127.0.0.1:${PORT}/neobrutalism/`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelectorAll('[data-testid^="spec-"]').length > 40);
await page.waitForTimeout(200);

// 1. Stylesheet text, in document order, fetched raw rather than read back
//    through the CSSOM (which re-serialises and can lose at-rules).
const sheetHrefs = await page.$$eval('link[rel="stylesheet"]', (ls) => ls.map((l) => l.getAttribute('href')));
const cssParts = [];
for (const href of sheetHrefs) {
  const url = new URL(href, `http://127.0.0.1:${PORT}/neobrutalism/`);
  cssParts.push(await (await fetch(url)).text());
}
let css = cssParts.join('\n');

// 2. Which characters does this page actually render?
const text = await page.evaluate(() => document.documentElement.innerText);
const charset = [...new Set((text + EXTRA_GLYPHS + text.toUpperCase()).split(''))]
  .filter((c) => c.codePointAt(0) >= 0x20)
  .join('');

// 3. Hydrated DOM, scripts removed.
const html = await page.evaluate(() => {
  for (const el of document.querySelectorAll('script, link[rel="stylesheet"], link[rel="modulepreload"], link[rel="preload"]')) el.remove();

  // The simulator shell's tabs point at sibling routes that do not exist
  // beside a single exported file. Keep them visible (they are part of the
  // chrome being reviewed) but inert, so nobody clicks into a 404. Same-page
  // anchors — the contents strip — still work.
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#')) {
      a.removeAttribute('href');
      a.setAttribute('data-inert-link', href);
      a.style.cursor = 'default';
    }
  }
  return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
});

await browser.close();
server.close();

// 4. Subset + woff2 each face, then rewrite @font-face to a data URI.
const work = await mkdtemp(join(tmpdir(), 'nb-fonts-'));
const faceCss = [];
let ttfBytes = 0;
let woffBytes = 0;

for (const face of FACES) {
  const src = join(ROOT, face.file);
  const dst = join(work, `${face.family.replace(/\s+/g, '')}-${face.weight}.woff2`);
  ttfBytes += (await readFile(src)).byteLength;
  await run('python3', [
    '-m', 'fontTools.subset', src,
    `--text=${charset}`,
    '--flavor=woff2',
    '--layout-features=*',
    '--no-hinting',
    '--desubroutinize',
    `--output-file=${dst}`
  ]);
  const buf = await readFile(dst);
  woffBytes += buf.byteLength;
  faceCss.push(
    `@font-face{font-family:"${face.family}";font-style:${face.style};font-weight:${face.weight};` +
    `font-display:block;src:url(data:font/woff2;base64,${buf.toString('base64')}) format("woff2")}`
  );
}
await rm(work, { recursive: true, force: true });

// Drop the build's own @font-face blocks; they point at files that will not
// exist next to a single exported HTML.
css = css.replace(/@font-face\s*\{[^}]*\}/g, '');

const banner = `<!--
  Sage Ink x neobrutalism.dev — single-file export
  Generated by simulator/scripts/bundle-single-file.mjs on ${new Date().toISOString()}
  Source route: simulator/src/routes/neobrutalism/+page.svelte
  Self-contained: styles inlined, fonts subset + embedded, no scripts, no network.
-->`;

const out = html
  .replace('<head>', `<head>\n${banner}\n<style>${faceCss.join('\n')}\n${css}</style>`)
  .replace(/\s+data-svelte-h="[^"]*"/g, '');

await writeFile(OUT, out, 'utf8');

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`wrote ${OUT}`);
console.log(`  html+css        ${kb(Buffer.byteLength(out) - woffBytes * 1.37)}`);
console.log(`  fonts           ${kb(ttfBytes)} TTF -> ${kb(woffBytes)} woff2 subset (${charset.length} glyphs)`);
console.log(`  total           ${kb(Buffer.byteLength(out))}`);
