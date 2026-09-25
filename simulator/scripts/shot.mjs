/* Screenshot a built simulator page: node scripts/shot.mjs <path> <out.png> [width] [fullPage 1|0].
 * Needs the static server up (npx http-server build -p 4173 -s -c-1). */
import { chromium } from '@playwright/test';
const [,, path, out, w='1400', full='1'] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto('http://127.0.0.1:4173' + path); await p.waitForTimeout(500);
await p.screenshot({ path: out, fullPage: full === '1' }); await b.close();
