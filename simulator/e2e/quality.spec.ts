import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/* Styling-quality REPORT for the simulator — contrast, sizing, shadow usage.
 *
 * This spec measures; it does not judge. It exists so the elevation rule
 * ("which elements carry the 4px offset, which do not") and the contrast
 * fixes are decided from numbers rather than from a screenshot impression.
 * Per page it writes test-results/quality/<name>.json and prints a compact
 * summary; the only assertion is that the page rendered and something was
 * measured. Once a rule is agreed it is encoded in sites.spec.ts (mocks) and
 * scripts/style-check/live-contract.mjs (real sites) — not here.
 *
 * Three measures, on the OURS lane of every /sites/<id>/ page and on the
 * simulator's own routes:
 *   (a) contrast — every element that paints its own text, WCAG ratio
 *       against its effective background (translucent layers composited up
 *       to the first opaque ancestor; colours resolved through a canvas
 *       because Chromium keeps oklch() as oklch() in computed styles);
 *   (b) sizing — interactive controls under 24px tall, text under 11px;
 *   (c) shadow — every element carrying a hard offset shadow, grouped by
 *       Pair, with the buttons split hard/flat, and "collisions": two inked
 *       elements closer than the offset, so one's shadow lands on the other. */

const SITE_IDS = [
  'github', 'wikipedia', 'youtube', 'facebook', 'google', 'claude', 'chatgpt', 'notion',
  'linear', 'atlassian', 'microsoft365', 'copilot', 'gemini', 'aistudio', 'shopee'
];
const CORE_ROUTES: Array<[string, string]> = [
  ['home', '/'],
  ['neobrutalism', '/neobrutalism/'],
  ['density-test', '/density-test/'],
  ['browser', '/browser/']
];

const OUT = join(process.cwd(), 'test-results', 'quality');

type Report = ReturnType<typeof summarise>;

const measurePage = (page: import('@playwright/test').Page, arg: { scope: string; alt: string }) =>
  page.evaluate(({ scope, alt }) => {
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = 1;
    const cctx = cvs.getContext('2d', { willReadFrequently: true })!;
    type C = { r: number; g: number; b: number; a: number };
    const cache = new Map<string, C | null>();
    const parse = (c: string): C | null => {
      const key = String(c);
      if (cache.has(key)) return cache.get(key)!;
      let out: C | null = null;
      if (key && key !== 'transparent' && key !== 'none') {
        cctx.clearRect(0, 0, 1, 1);
        cctx.fillStyle = '#000';
        cctx.fillStyle = key;
        if (cctx.fillStyle !== '#000' || /^#0{3,8}$|black|rgb\(0, 0, 0\)/i.test(key)) {
          cctx.clearRect(0, 0, 1, 1);
          cctx.fillRect(0, 0, 1, 1);
          const d = cctx.getImageData(0, 0, 1, 1).data;
          out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
        }
      }
      cache.set(key, out);
      return out;
    };
    const over = (fg: C, bg: C): C => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1
    });
    const lum = (c: C) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const ratio = (a: C, b: C) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const hex = (c: C) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
    const near = (a: C, b: C, tol = 3) => Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol;

    const roots = [...document.querySelectorAll(scope)] as HTMLElement[];
    const all = roots.flatMap((r) => [r, ...r.querySelectorAll('*')]) as HTMLElement[];
    const visible = (el: Element) => {
      const b = el.getBoundingClientRect();
      if (b.width <= 0 || b.height <= 0) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
    };
    const tag = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}`;
    const pair = (el: Element) => {
      const p = el.closest('[data-testid^="pair-"]');
      if (p) return p.getAttribute('data-testid')!.replace(/^pair-/, '');
      const s = el.closest('section[id], [data-testid], section, main');
      return s ? (s.id || s.getAttribute('data-testid') || s.tagName.toLowerCase()) : '?';
    };
    const label = (el: HTMLElement) => (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    const where = (el: HTMLElement) => `${pair(el)} ${tag(el)}${label(el) ? ` "${label(el)}"` : ''}`;
    /* Effective background: composite translucent layers up to the first
       opaque ancestor. Stops at the scope root's parent so the simulator's
       own chrome is never mistaken for a site surface. */
    const effBg = (el: Element): C => {
      const stack: C[] = [];
      let node: Element | null = el;
      let opaque: C | null = null;
      while (node) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0) { if (c.a === 1) { opaque = c; break; } stack.push(c); }
        node = node.parentElement;
      }
      let acc = opaque ?? parse(getComputedStyle(document.documentElement).backgroundColor) ?? { r: 0, g: 0, b: 0, a: 1 };
      for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc);
      return acc;
    };

    // (a) contrast — elements with their own text node
    type Pair = { fg: string; bg: string; ratio: number; min: number; size: number; count: number; sample: string; worstSample: string };
    const pairs = new Map<string, Pair>();
    const textFails: string[] = [];
    let textLeaves = 0;
    for (const el of all) {
      if (!visible(el)) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0);
      if (!own) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 4 || b.height < 4) continue;
      const cs = getComputedStyle(el);
      const fg0 = parse(cs.color);
      if (!fg0) continue;
      textLeaves++;
      const bg = effBg(el);
      const fg = fg0.a < 1 ? over(fg0, bg) : fg0;
      const size = parseFloat(cs.fontSize);
      const bold = (parseInt(cs.fontWeight, 10) || 400) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const min = large ? 3 : 4.5;
      const r = +ratio(fg, bg).toFixed(2);
      const key = `${hex(fg)}|${hex(bg)}|${min}`;
      const p = pairs.get(key);
      if (p) { p.count++; if (size < p.size) p.size = size; }
      else pairs.set(key, { fg: hex(fg), bg: hex(bg), ratio: r, min, size, count: 1, sample: where(el), worstSample: where(el) });
      if (r < min) textFails.push(`${r.toFixed(2)} (min ${min}) ${hex(fg)} on ${hex(bg)} ${size}px — ${where(el)}`);
    }

    // (b) sizing — controls under 24px, text under 11px
    const controlSel = 'button, [role="button"], input:not([type="hidden"]), select, textarea, a[href], summary, [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="switch"], [role="radio"], [role="link"]';
    const controls = all.filter((el) => visible(el) && el.matches(controlSel));
    const smallControls: string[] = [];
    const heights = new Map<number, number>();
    for (const el of controls) {
      const b = el.getBoundingClientRect();
      const h = Math.round(b.height);
      heights.set(h, (heights.get(h) ?? 0) + 1);
      if (h < 24) smallControls.push(`${h}x${Math.round(b.width)} — ${where(el)}`);
    }
    const tinyText: string[] = [];
    for (const el of all) {
      if (!visible(el)) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0);
      if (!own) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 11) tinyText.push(`${size}px — ${where(el)}`);
    }

    // (c) shadow usage — hard offset layers, by pair; buttons hard/flat; collisions
    const altC = parse(alt) ?? { r: 0, g: 0, b: 0, a: 1 };
    type Inked = { el: HTMLElement; off: number; alt: boolean; kind: string; rect: DOMRect };
    const inked: Inked[] = [];
    const kindOf = (el: HTMLElement) => {
      if (el.matches('[role="dialog"], [role="alertdialog"]')) return 'dialog';
      if (el.matches('[role="menu"], [role="listbox"], [role="tooltip"], [class*="menu" i], [class*="popover" i], [class*="dropdown" i], [class*="tooltip" i], [class*="toast" i]')) return 'popover';
      if (el.matches('button, [role="button"], input[type="submit"], a[href]')) return 'button';
      if (el.matches('input, textarea, select, [role="textbox"], [role="combobox"], [contenteditable]')) return 'input';
      if (el.matches('[class*="card" i], article, li, tr, [role="listitem"], [role="row"]')) return 'card/row';
      return 'other';
    };
    for (const el of all) {
      if (!visible(el)) continue;
      const sh = getComputedStyle(el).boxShadow;
      if (!sh || sh === 'none') continue;
      for (const layer of sh.split(/,(?![^(]*\))/).map((s) => s.trim())) {
        const m = layer.match(/^(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?(\s+inset)?$/i);
        if (!m || m[6]) continue;
        const x = parseFloat(m[2]), y = parseFloat(m[3]), blur = parseFloat(m[4]);
        const c = parse(m[1]);
        if (!c || c.a === 0 || blur > 0 || x <= 0 || y <= 0) continue;
        inked.push({ el, off: Math.max(x, y), alt: near(c, altC), kind: kindOf(el), rect: el.getBoundingClientRect() });
        break;
      }
    }
    const byPair = new Map<string, { inked: number; byKind: Record<string, number>; buttonsHard: number; buttonsFlat: number; list: string[] }>();
    const bucket = (p: string) => { if (!byPair.has(p)) byPair.set(p, { inked: 0, byKind: {}, buttonsHard: 0, buttonsFlat: 0, list: [] }); return byPair.get(p)!; };
    for (const i of inked) {
      const b = bucket(pair(i.el));
      b.inked++;
      b.byKind[i.kind] = (b.byKind[i.kind] ?? 0) + 1;
      b.list.push(`${i.off}px${i.alt ? '' : ' OFF-ALT'} ${i.kind} ${tag(i.el)}${label(i.el) ? ` "${label(i.el)}"` : ''}`);
    }
    const buttons = all.filter((el) => visible(el) && el.matches('button, [role="button"], input[type="submit"]') && (el.innerText || '').trim().length > 2);
    const inkedEls = new Set(inked.map((i) => i.el));
    for (const b of buttons) { const bk = bucket(pair(b)); if (inkedEls.has(b)) bk.buttonsHard++; else bk.buttonsFlat++; }
    // collisions: inked element whose shadow zone reaches another inked element
    const collisions: string[] = [];
    for (let i = 0; i < inked.length; i++) {
      for (let j = 0; j < inked.length; j++) {
        if (i === j) continue;
        const a = inked[i], b = inked[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const gapX = b.rect.left - a.rect.right;
        const gapY = b.rect.top - a.rect.bottom;
        const vOverlap = b.rect.top < a.rect.bottom && b.rect.bottom > a.rect.top;
        const hOverlap = b.rect.left < a.rect.right && b.rect.right > a.rect.left;
        if ((gapX >= 0 && gapX < a.off && vOverlap) || (gapY >= 0 && gapY < a.off && hOverlap)) {
          collisions.push(`${pair(a.el)} ${tag(a.el)} ${a.off}px shadow ${gapX >= 0 && gapX < a.off && vOverlap ? `${gapX.toFixed(0)}px right of` : `${gapY.toFixed(0)}px above`} ${tag(b.el)}`);
        }
      }
    }
    // button chrome geometry: heights and paddings of hard buttons
    const buttonGeo = buttons.map((b) => { const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); return { h: Math.round(r.height), border: parseFloat(cs.borderTopWidth), padX: parseFloat(cs.paddingLeft), font: parseFloat(cs.fontSize), hard: inkedEls.has(b) }; });

    return {
      elements: all.length,
      textLeaves,
      pairs: [...pairs.values()].sort((a, b) => a.ratio - b.ratio),
      textFails,
      controls: controls.length,
      heights: [...heights.entries()].sort((a, b) => a[0] - b[0]),
      smallControls,
      tinyText,
      inked: inked.length,
      inkedByKind: inked.reduce((m, i) => { m[i.kind] = (m[i.kind] ?? 0) + 1; return m; }, {} as Record<string, number>),
      inkedByOffset: inked.reduce((m, i) => { m[String(i.off)] = (m[String(i.off)] ?? 0) + 1; return m; }, {} as Record<string, number>),
      offAlt: inked.filter((i) => !i.alt).length,
      byPair: Object.fromEntries([...byPair.entries()]),
      buttons: { total: buttons.length, hard: buttons.filter((b) => inkedEls.has(b)).length, geo: buttonGeo },
      collisions
    };
  }, arg);

function summarise(name: string, r: Awaited<ReturnType<typeof measurePage>>) {
  const fails = r.pairs.filter((p) => p.ratio < p.min);
  const line = [
    `${name.padEnd(14)}`,
    `text ${String(r.textLeaves).padStart(3)} leaves, ${String(fails.length).padStart(2)} failing pairs (${fails.reduce((n, p) => n + p.count, 0)} leaves)`,
    `controls ${String(r.controls).padStart(3)}, <24px: ${r.smallControls.length}`,
    `inked ${String(r.inked).padStart(3)} [${Object.entries(r.inkedByKind).map(([k, v]) => `${k} ${v}`).join(', ')}]`,
    `buttons ${r.buttons.hard}/${r.buttons.total} hard`,
    `collisions ${r.collisions.length}`
  ].join(' | ');
  return { name, line, ...r };
}

test.describe.configure({ mode: 'serial' });

const reports: Report[] = [];

test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

for (const id of SITE_IDS) {
  test(`quality: /sites/${id}/ ours lane`, async ({ page }) => {
    await page.goto(`/sites/${id}/`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId(`site-page-${id}`)).toBeVisible();
    await expect(page.getByTestId('coverage')).not.toContainText('measuring');
    const alt = (await page.getByTestId(`site-page-${id}`).getAttribute('data-alt')) ?? '#000000';
    const r = await measurePage(page, { scope: '[data-lane="ours"]', alt });
    expect(r.textLeaves, 'nothing measured on the ours lane').toBeGreaterThan(0);
    const s = summarise(id, r);
    reports.push(s);
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify(s, null, 2));
    console.log(s.line);
  });
}

for (const [name, path] of CORE_ROUTES) {
  test(`quality: ${path} (simulator route)`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    // the simulator's own ink shadow colour is accent_alt, exposed as a CSS var
    const alt = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ig-accent-alt').trim() || getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#000000');
    const r = await measurePage(page, { scope: 'body', alt });
    expect(r.textLeaves, 'nothing measured').toBeGreaterThan(0);
    const s = summarise(`route:${name}`, r);
    reports.push(s);
    writeFileSync(join(OUT, `route-${name}.json`), JSON.stringify(s, null, 2));
    console.log(s.line);
  });
}

test.afterAll(() => {
  if (!reports.length) return;
  const md: string[] = ['# Simulator styling quality report', '', `Generated ${new Date().toISOString()} by simulator/e2e/quality.spec.ts`, ''];
  md.push('## Summary', '', '```', ...reports.map((r) => r.line), '```', '');
  for (const r of reports) {
    md.push(`## ${r.name}`, '');
    md.push(`### (a) contrast — failing (fg, bg) pairs`, '');
    const fails = r.pairs.filter((p) => p.ratio < p.min);
    md.push(fails.length ? fails.map((p) => `- **${p.ratio.toFixed(2)}** (min ${p.min}) ${p.fg} on ${p.bg}, ${p.count}x, smallest ${p.size}px — e.g. ${p.sample}`).join('\n') : '- none', '');
    md.push(`### (a) contrast — all pairs (worst 15)`, '');
    md.push(r.pairs.slice(0, 15).map((p) => `- ${p.ratio.toFixed(2)} ${p.fg} on ${p.bg}, ${p.count}x — e.g. ${p.sample}`).join('\n'), '');
    md.push(`### (b) sizing`, '');
    md.push(`- control heights: ${r.heights.map(([h, n]) => `${h}px×${n}`).join(', ')}`);
    md.push(r.smallControls.length ? `- under 24px:\n${r.smallControls.slice(0, 40).map((s) => `  - ${s}`).join('\n')}` : '- under 24px: none');
    md.push(r.tinyText.length ? `- text under 11px:\n${r.tinyText.slice(0, 20).map((s) => `  - ${s}`).join('\n')}` : '- text under 11px: none', '');
    md.push(`### (c) shadow usage`, '');
    md.push(`- inked elements: ${r.inked} — by kind ${JSON.stringify(r.inkedByKind)} — by offset ${JSON.stringify(r.inkedByOffset)} — off-alt colour: ${r.offAlt}`);
    md.push(`- text buttons: ${r.buttons.hard} hard / ${r.buttons.total}`);
    const hs = r.buttons.geo.filter((g) => g.hard).map((g) => g.h);
    if (hs.length) md.push(`- hard button heights: min ${Math.min(...hs)} max ${Math.max(...hs)}; borders ${[...new Set(r.buttons.geo.filter((g) => g.hard).map((g) => g.border))].join('/')}px`);
    md.push(`- collisions (shadow lands on an inked neighbour): ${r.collisions.length}`);
    if (r.collisions.length) md.push(r.collisions.slice(0, 30).map((c) => `  - ${c}`).join('\n'));
    md.push('', '| pair | inked | by kind | buttons hard/flat |', '| :-- | --: | :-- | :-- |');
    for (const [p, b] of Object.entries(r.byPair)) md.push(`| ${p} | ${b.inked} | ${Object.entries(b.byKind).map(([k, v]) => `${k} ${v}`).join(', ')} | ${b.buttonsHard}/${b.buttonsFlat} |`);
    md.push('');
    md.push('<details><summary>inked element list</summary>', '');
    for (const [p, b] of Object.entries(r.byPair)) if (b.list.length) md.push(`- ${p}:`, ...b.list.slice(0, 25).map((l) => `  - ${l}`));
    md.push('', '</details>', '');
  }
  writeFileSync(join(OUT, 'REPORT.md'), md.join('\n'));
  console.log(`\nreport: ${join(OUT, 'REPORT.md')}`);
});
