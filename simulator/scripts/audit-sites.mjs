// Audit every /sites/<id>/ "ours" lane against the Sage Ink neobrutalism contract.
// Usage: node scripts/audit-sites.mjs [id ...]   (needs `npx vite build` first)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const reg = readFileSync(path.join(ROOT, 'simulator/src/lib/sites/registry.ts'), 'utf8');
const SITES = [...reg.matchAll(/id: '([a-z0-9]+)'.*?file: '([^']+)'[\s\S]*?hi: '(#[0-9A-F]{6})', mid: '(#[0-9A-F]{6})', alt: '(#[0-9A-F]{6})' \}(, retint: true)?/g)]
  .map((m) => ({ id: m[1], file: m[2], hi: m[3], mid: m[4], alt: m[5], retint: !!m[6] }));
const want = process.argv.slice(2);
const INK = ['#07080A', '#0D0D10', '#121216', '#1C1C1E', '#5E5E60', '#F8F8F8', '#7F8695', '#4B5563', '#3FFABB', '#FBBF24', '#F42E53', '#C0E3C0', '#000000'];

const server = spawn('npx', ['http-server', 'build', '-p', '4173', '-s', '--silent', '-c-1'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const out = {};
for (const s of SITES) {
  if (want.length && !want.includes(s.id)) continue;
  await page.goto(`http://127.0.0.1:4173/sites/${s.id}/`, { waitUntil: 'networkidle' });
  const res = await page.evaluate(({ allowed }) => {
    const ctx = document.createElement('canvas').getContext('2d');
    const px = (v) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#ff00ff'; ctx.fillStyle = v; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const hex = (c) => '#' + [c[0], c[1], c[2]].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
    const near = (h, set) => set.some((a) => { const d = [0, 2, 4].map((i) => Math.abs(parseInt(h.slice(1 + i, 3 + i), 16) - parseInt(a.slice(1 + i, 3 + i), 16))); return Math.max(...d) <= 3; });
    const sig = (el) => { const c = [...el.classList].slice(0, 2).join('.'); return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '') + (el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''); };
    const tally = (m, k, s) => { const e = m[k] || (m[k] = { n: 0, eg: [] }); e.n++; if (e.eg.length < 3 && !e.eg.includes(s)) e.eg.push(s); };
    const r = { elements: 0, radius: {}, radiusCircle: 0, softShadow: {}, alphaShadow: {}, shadowColour: {}, shadowGeom: {}, glass: {}, gradient: {}, translucent: {}, thinControl: {}, controls: 0, buttons: 0, buttonsShadow: 0, buttons2px: 0, foreignBg: {}, foreignText: {}, exempt: 0 };
    const CONTROL = new Set(['button', 'input', 'textarea', 'select']);
    for (const el of document.querySelectorAll('[data-lane="ours"] *')) {
      const b = el.getBoundingClientRect(); if (b.width < 2 || b.height < 2) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      r.elements++;
      const s = sig(el);
      const exempt = /avatar|Avatar|rounded-full|spinner|dot|orb|persona|presence|badge/i.test(el.className) || cs.borderRadius.includes('9999') || cs.borderRadius.includes('50%');
      const bg = px(cs.backgroundColor);
      if (bg[3] > 0 && bg[3] < 0.98) tally(r.translucent, cs.backgroundColor, s);
      else if (bg[3] > 0 && !near(hex(bg), allowed)) tally(r.foreignBg, hex(bg), s);
      const fg = px(cs.color); if (fg[3] > 0 && !near(hex(fg), allowed)) tally(r.foreignText, hex(fg), s);
      const rad = parseFloat(cs.borderTopLeftRadius) || 0;
      if (rad > 2.5) { if (exempt || rad >= Math.min(b.width, b.height) / 2 - 0.5) { r.radiusCircle++; if (exempt) r.exempt++; } else tally(r.radius, `${Math.round(rad)}px`, s); }
      if (cs.backdropFilter && cs.backdropFilter !== 'none') tally(r.glass, cs.backdropFilter, s);
      if (/gradient/.test(cs.backgroundImage)) tally(r.gradient, cs.backgroundImage.slice(0, 40), s);
      if (cs.boxShadow && cs.boxShadow !== 'none') {
        for (const sh of cs.boxShadow.split(/,(?![^()]*\))/)) {
          const col = sh.match(/(rgba?|oklch|color)\([^)]*\)|#[0-9a-f]{3,8}/i)?.[0];
          const lens = sh.replace(col || '', '').replace('inset', '').trim().split(/\s+/).filter(Boolean);
          const blur = parseFloat(lens[2] || '0') || 0;
          if (blur > 0) tally(r.softShadow, sh.trim().slice(0, 50), s);
          const c = col ? px(col) : [0, 0, 0, 1];
          if (c[3] < 0.98 && c[3] > 0) tally(r.alphaShadow, col, s);
          else if (!sh.includes('inset')) { tally(r.shadowColour, hex(c), s); tally(r.shadowGeom, lens.slice(0, 2).join(' '), s); }
        }
      }
      const tag = el.tagName.toLowerCase();
      if (CONTROL.has(tag) || el.getAttribute('role') === 'button') {
        r.controls++;
        const bw = parseFloat(cs.borderTopWidth) || 0; const bc = px(cs.borderTopColor);
        const hasBorder = cs.borderTopStyle !== 'none' && bw > 0 && bc[3] > 0;
        if (hasBorder && bw < 2) tally(r.thinControl, `${bw}px`, s);
        if (tag === 'button' || el.getAttribute('role') === 'button') { r.buttons++; if (cs.boxShadow !== 'none') r.buttonsShadow++; if (hasBorder && bw >= 2) r.buttons2px++; }
      }
    }
    return r;
  }, { allowed: [...INK, s.hi, s.mid, s.alt] });
  // static: press travel on :hover?
  const css = readFileSync(path.join(ROOT, 'browser/stylus/sites', s.file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const hoverTravel = [...css.matchAll(/([^{}]*:hover[^{}]*)\{([^}]*)\}/g)].filter((m) => /transform\s*:\s*translate/.test(m[2])).map((m) => m[1].trim().slice(0, 60));
  const activeTravel = [...css.matchAll(/([^{}]*:active[^{}]*)\{([^}]*)\}/g)].filter((m) => /transform\s*:\s*translate/.test(m[2])).length;
  out[s.id] = { ...res, hoverTravel, activeTravel, retint: s.retint, alt: s.alt };
}
await browser.close(); server.kill();

const top = (m, k = 4) => Object.entries(m).sort((a, b) => b[1].n - a[1].n).slice(0, k).map(([v, e]) => `${v}×${e.n} (${e.eg.join(', ')})`).join('; ');
for (const [id, r] of Object.entries(out)) {
  console.log(`\n=== ${id}${r.retint ? ' [retint]' : ''} — ${r.elements} elements, ${r.controls} controls, ${r.buttons} buttons (shadow ${r.buttonsShadow}, 2px ${r.buttons2px}); circles/exempt ${r.radiusCircle}`);
  const row = (k, v) => v && console.log(`  ${k.padEnd(14)} ${v}`);
  row('radius>2', top(r.radius));
  row('soft shadow', top(r.softShadow));
  row('alpha shadow', top(r.alphaShadow));
  row('glass', top(r.glass));
  row('gradient', top(r.gradient));
  row('translucent', top(r.translucent));
  row('thin control', top(r.thinControl));
  row('shadow colour', Object.entries(r.shadowColour).map(([h, e]) => `${h}${h === r.alt ? '=alt' : '≠alt ' + r.alt}×${e.n}`).join('; '));
  row('shadow geom', Object.entries(r.shadowGeom).map(([g, e]) => `${g}×${e.n}`).join('; '));
  row('foreign bg', top(r.foreignBg, 6));
  row('foreign text', top(r.foreignText, 6));
  row('hover travel', r.hoverTravel.length ? r.hoverTravel.join(' | ') : '');
  row('active travel', String(r.activeTravel));
}
