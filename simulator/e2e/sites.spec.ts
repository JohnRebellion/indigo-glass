import { test, expect } from '@playwright/test';

/* /sites/<id>/ — each page claims to show the site's stock elements next to
 * the same elements under the shipped Stylus file. Three things make that
 * claim worth something, and each is enforced here:
 *   1. coverage — every selector token in the .user.css has an element in the
 *      stock lane, so there is no rule the right lane cannot demonstrate;
 *   2. the scoped file actually applied — the "ours" lane root paints a
 *      different background from the stock root (every file remaps the page
 *      surface), and the stock lane is untouched;
 *   3. layout — nothing runs past the viewport, so a capture is complete;
 *   4. contract — the ours lane obeys Sage Ink structure (ink page, hard alt
 *      shadows only, no blur/gradient, radius 0 off circles and pills,
 *      the offset on accent-filled primary buttons only, hard-edged dialogs
 *      and menus, no two inked elements closer than the offset). The
 *      elevation scale is docs/ELEVATION.md; scripts/style-check/live-contract.mjs
 *      carries the same body for real sites - keep them in step.
 * The id list is the registry's; it is repeated here because the registry
 * imports the .user.css files through Vite's ?raw, which Playwright's Node
 * loader cannot resolve. */
const IDS = [
  'github', 'wikipedia', 'youtube', 'facebook', 'google', 'claude', 'chatgpt', 'notion',
  'linear', 'atlassian', 'microsoft365', 'copilot', 'gemini', 'aistudio', 'shopee'
];

test('index lists every site', async ({ page }) => {
  await page.goto('/sites/');
  for (const id of IDS) await expect(page.getByTestId(`site-row-${id}`)).toBeVisible();
});

for (const id of IDS) {
  test(`${id}: renders, covers its file, and the scoped style lands only on the ours lane`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/sites/${id}/`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId(`site-page-${id}`)).toBeVisible();

    await expect(page.getByTestId('coverage')).not.toContainText('measuring');
    const missing = await page.getByTestId('coverage-missing').locator('li').allTextContents().catch(() => []);
    expect(missing, 'selector tokens with no element on the page').toEqual([]);

    const lanes = await page.evaluate(() => {
      // Chromium keeps oklch() as oklch() in computed styles, and the files'
      // @supports blocks win, so resolve through a canvas as contrast.mjs does.
      const ctx = document.createElement('canvas').getContext('2d')!;
      const px = (el: Element | null) => {
        if (!el) return null;
        ctx.fillStyle = getComputedStyle(el).backgroundColor;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      return {
        stock: px(document.querySelector('[data-lane="stock"]')),
        ours: px(document.querySelector('[data-lane="ours"]')),
        oursCount: document.querySelectorAll('[data-lane="ours"]').length
      };
    });
    expect(lanes.oursCount).toBeGreaterThan(3);
    // Every file now remaps the page surface to Sage Ink base #07080A; ±2 for
    // the oklch->sRGB rounding.
    expect(lanes.ours, 'scoped Stylus did not repaint the ours lane').not.toEqual(lanes.stock);
    for (const [i, want] of [7, 8, 10].entries()) expect(Math.abs(lanes.ours![i] - want)).toBeLessThanOrEqual(2);

    // 4. contract — the ours lane is Sage Ink structure, not a retint. This is
    //    what keeps the shipped file and this page in step: a rule that drifts
    //    (a soft shadow back, a radius left, a flat button) fails here.
    const contract = await page.evaluate((alt: string) => {
      const ctx = document.createElement('canvas').getContext('2d')!;
      const rgb = (c: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
      const near = (a: number[], b: number[], tol = 3) => a.slice(0, 3).every((v, i) => Math.abs(v - b[i]) <= tol);
      const altRgb = rgb(alt);
      const roots = [...document.querySelectorAll('[data-lane="ours"]')];
      const all = roots.flatMap((r) => [...r.querySelectorAll('*')]) as HTMLElement[];
      const visible = (el: Element) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      const tag = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}`;
      const pair = (el: Element) => el.closest('[data-testid^="pair-"]')?.getAttribute('data-testid') ?? '?';
      const where = (el: Element) => `${pair(el)} ${tag(el)}`;
      const isArt = (el: Element) => el.matches('img, svg, canvas, video, picture, [data-art], [class*="avatar" i], [class*="thumb" i], [class*="img" i], [class*="image" i], [class*="logo" i], [class*="orb" i], [class*="dot" i], [class*="spinner" i], [class*="progress" i], [class*="slider" i], [class*="switch" i], [class*="toggle" i], [class*="radio" i], [class*="checkbox" i], [class*="badge" i], [class*="presence" i], [class*="status" i], [class*="reaction" i], [class*="story" i], [class*="knob" i], [class*="indicator" i], [class*="fab" i], [class*="glimmer" i], [class*="skeleton" i], [class*="stars" i], [class*="pos" i], [role="img"], [role="progressbar"], [role="switch"], [role="slider"], [role="checkbox"], [role="radio"], [class*="Icon" i]') || !!el.closest('[class*="avatar" i], [class*="switch" i], [class*="toggle" i], [class*="progress" i], [class*="slider" i], [class*="radio" i], [class*="checkbox" i], [class*="story" i], [class*="reaction" i], [class*="orb" i], [class*="spinner" i], [class*="skeleton" i], [class*="glimmer" i], [data-art]');
      const isRoundShape = (el: Element, cs: CSSStyleDeclaration) => {
        const b = el.getBoundingClientRect();
        const r = parseFloat(cs.borderTopLeftRadius);
        // Circles and pills are exempt: radius at or past half the shorter side.
        return r >= Math.min(b.width, b.height) / 2 - 0.5;
      };
      // Two stops with the second at 0% is a hard edge, not a blend: Google's star-rating fill. Content, not decoration.
      const hardStop = (img: string) => /\d(?:px|%)\s*,\s*(?:rgba?\([^)]*\)|[a-z]+|#[0-9a-f]+)\s+0%\)/i.test(img);
      const fails = { radius: [] as string[], shadow: [] as string[], blur: [] as string[], gradient: [] as string[], thin: [] as string[], overlay: [] as string[], collision: [] as string[], phantom: [] as string[], status: [] as string[] };
      const inked: { el: HTMLElement; off: number }[] = [];
      for (const el of all) {
        if (!visible(el)) continue;
        const cs = getComputedStyle(el);
        // radius > 2px on anything not a circle/pill/art
        const r = Math.max(...['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'].map((k) => parseFloat((cs as any)[k]) || 0));
        if (r > 2 && !isRoundShape(el, cs) && !isArt(el)) fails.radius.push(`${where(el)} r=${r}`);
        // shadow: only hard `Npx Npx 0 0 <alt>` or none; nothing soft, nothing alpha
        const sh = cs.boxShadow;
        if (sh && sh !== 'none') {
          // Chromium serialises each layer as `<colour> x y blur spread [inset]`.
          for (const layer of sh.split(/,(?![^(]*\))/).map((s) => s.trim())) {
            const m = layer.match(/^(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?(\s+inset)?$/i);
            if (!m) { fails.shadow.push(`${where(el)} ${layer}`); continue; }
            const blur = parseFloat(m[4]);
            const c = rgb(m[1]);
            if (c[3] === 0) continue;
            if (blur > 0 || c[3] < 255) fails.shadow.push(`${where(el)} ${layer}`);
            const x = parseFloat(m[2]), y = parseFloat(m[3]);
            if (!m[6] && blur === 0 && x > 0 && y > 0 && near(c, altRgb)) inked.push({ el, off: Math.max(x, y) });
          }
        }
        const bf = (cs as any).backdropFilter || (cs as any).webkitBackdropFilter;
        if (bf && bf !== 'none') fails.blur.push(where(el));
        if (cs.filter && /blur\(/.test(cs.filter) && !isArt(el)) fails.blur.push(`${where(el)} filter`);
        if (/gradient\(/.test(cs.backgroundImage) && !hardStop(cs.backgroundImage) && !isArt(el) && !el.matches('[data-scrim]')) fails.gradient.push(where(el));
      }
      // buttons (docs/ELEVATION.md): a text-bearing, non-chrome button whose own
      // fill is lighter than relative luminance 0.179 (the [on_light] threshold
      // in the tokens) is the primary: it MUST carry the 4px alt offset and an
      // ink label. The offset is never on a dark fill. No quota - per element.
      const btns = all.filter((el) => visible(el) && el.matches('button, [role="button"], input[type="submit"]'));
      const chrome = (el: HTMLElement) => {
        const cs = getComputedStyle(el);
        const text = (el.textContent ?? '').trim();
        const iconOnly = el.children.length === 1 && el.children[0].matches('svg, i, img, [class*="icon" i], [role="img"]') && text.length <= 3;
        return !text || text.length <= 2 || iconOnly || isRoundShape(el, cs) || isArt(el) || !!el.closest('[role="tablist"], nav, [role="navigation"], [role="menu"], [role="listbox"], [role="tree"], [class*="tabs" i], [class*="nav" i], [class*="breadcrumb" i], [class*="chip" i], [class*="pager" i], [class*="Pivot"], [class*="CommandBar"]') ||
          el.matches('[role="tab"], [role="menuitem"], [role="option"], [role="link"], [class*="tab" i], [class*="chip" i], [class*="pill" i], [class*="ghost" i], [class*="subtle" i], [class*="transparent" i], [class*="invisible"], [class*="quiet"], [class*="link" i], [class*="text" i], [class*="MenuItem"], [class*="Tree"], [class*="icon" i], [class*="carousel" i], [class*="arrow" i], [class*="menu-item" i], [class*="list-item" i], [class*="nav" i], [class*="story" i], [class*="reaction" i], [class*="tile" i], [class*="follow" i], [class*="mode" i], [class*="send" i], [class*="copy" i], [class*="share" i], [class*="action" i], [class*="toggle" i], [class*="switch" i], [class*="filter" i], [class*="deemph" i], [class*="floating" i], [class*="on-media" i], [class*="lozenge" i], [class*="tag" i], [class*="account" i], [class*="skip" i], [class*="playground" i], [class*="tts" i], [class*="model" i], [class*="disabled" i], [disabled], [aria-disabled="true"], [data-variant="invisible"], [data-variant="link"]');
      };
      const candidates = btns.filter((b) => !chrome(b as HTMLElement));
      const lum = (c: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const isLightFill = (el: Element) => { const c = rgb(getComputedStyle(el).backgroundColor); return c[3] > 0 && lum(c) > 0.179; };
      const isHard = (el: Element) => { const s = getComputedStyle(el).boxShadow; const m = s.match(/(rgba?\([^)]*\)|oklch\([^)]*\))\s+4px\s+4px\s+0px(\s+0px)?/); return !!m && near(rgb(m[1]), altRgb); };
      // a flat half inside an inked wrapper (a split button) is lifted by the group
      const lifted = (el: Element) => isHard(el) || (!!el.parentElement && isHard(el.parentElement));
      const primary = candidates.filter(isLightFill);
      const hard = candidates.filter(lifted);
      const hex = (c: number[]) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
      const withFill = (b: Element) => `${where(b)} fill=${hex(rgb(getComputedStyle(b).backgroundColor))} "${(b.textContent ?? '').trim().slice(0, 20)}"`;
      const primaryFlat = primary.filter((b) => !lifted(b)).map(withFill);
      const primaryLightLabel = primary.filter((b) => lum(rgb(getComputedStyle(b).color)) > 0.179).map(withFill);
      const secondaryHard = btns.filter((b) => isHard(b) && !isLightFill(b)).map(withFill);
      // collisions: an inked element whose shadow zone reaches another inked element
      const rendered = (el: Element) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0 && r.width > 0 && r.height > 0; };
      const shown = inked.filter((i) => rendered(i.el)); // Gemini's cdk-describedby tooltips are hidden a11y text; Google parks closed dialogs at opacity 0
      for (const a of shown) for (const b of shown) {
        if (a === b || a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const ra = a.el.getBoundingClientRect(), rb = b.el.getBoundingClientRect();
        const gapX = rb.left - ra.right, gapY = rb.top - ra.bottom;
        const vOverlap = rb.top < ra.bottom && rb.bottom > ra.top, hOverlap = rb.left < ra.right && rb.right > ra.left;
        if ((gapX >= 0 && gapX < a.off && vOverlap) || (gapY >= 0 && gapY < a.off && hOverlap)) fails.collision.push(`${where(a.el)} ${a.off}px shadow lands on ${tag(b.el)}`);
      }
      const thinBorder = candidates.filter((b) => { const cs = getComputedStyle(b); const w = parseFloat(cs.borderTopWidth); return cs.borderTopStyle !== 'none' && w > 0 && w < 2 && rgb(cs.borderTopColor)[3] > 0; }).map(where);
      // icon-only affordances keep their own geometry (structure-blocks.py): a
      // ghost icon button (no label, transparent fill) that has picked up our
      // 2px border_strong edge is an exemption the generator missed - live
      // YouTube grew 25 boxed kebab menus when its classes went camelCase.
      // A stock-bordered icon button (Codex's normal-weight icon-only) keeps
      // its edge, upgraded to 2px; only a stock-ghost one is a miss. The stock
      // lane is the same markup, so the twin sits at the same child path.
      const stockTwin = (el: Element) => {
        const ours = el.closest('[data-lane="ours"]');
        const stock = ours?.closest('[data-testid^="pair-"]')?.querySelector('[data-lane="stock"]');
        if (!ours || !stock) return null;
        const path: number[] = [];
        for (let n: Element | null = el; n && n !== ours; n = n.parentElement) path.unshift([...n.parentElement!.children].indexOf(n));
        let t: Element | undefined = stock;
        for (const i of path) t = t?.children[i];
        return t ?? null;
      };
      const stockEdged = (el: Element) => { const t = stockTwin(el); if (!t) return false; const cs = getComputedStyle(t); return cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0 && rgb(cs.borderTopColor)[3] > 0; };
      const inkEdge = rgb('#5E5E60');
      const iconEdge = btns.filter((b) => {
        const cs = getComputedStyle(b);
        const text = (b.textContent ?? '').trim();
        const bx = b.getBoundingClientRect();
        const iconish = (!text && bx.width <= 72 && bx.height <= 72) || (b.children.length === 1 && b.children[0].matches('svg, i, img, [class*="icon" i], [role="img"]') && text.length <= 3);
        return iconish && rgb(cs.backgroundColor)[3] === 0 && cs.borderTopStyle === 'solid' && parseFloat(cs.borderTopWidth) >= 2 && near(rgb(cs.borderTopColor), inkEdge) && !stockEdged(b);
      }).map(where);
      // phantom: an inked element too small to be a surface (YouTube's empty
      // un-upgraded tooltip hosts came out as 4x4 accent dots).
      for (const i of shown) { const r = i.el.getBoundingClientRect(); if (r.width < 12 || r.height < 12) fails.phantom.push(`${where(i.el)} ${Math.round(r.width)}x${Math.round(r.height)}`); }
      // status: a presence/status dot keeps its hue. Fluent draws it as an SVG
      // filled with currentColor, so an ink `color` rule on the badge blacked out
      // every Teams presence dot (2026-09-25). Judge the SVG fill when there is
      // one, else the background; the dot must not read as ink.
      for (const el of all.filter((e) => visible(e) && e.matches('[class*="presence" i], [class*="status-dot" i]'))) {
        const svg = el.querySelector('svg');
        const paint = rgb(svg ? getComputedStyle(svg).fill : getComputedStyle(el).backgroundColor);
        if (paint[3] > 0 && Math.max(...paint.slice(0, 3)) < 48) fails.status.push(`${where(el)} rgb(${paint.slice(0, 3).join(',')})`);
      }
      // overlays: dialog + menu carry 2px border and the alt shadow
      for (const el of all.filter((e) => visible(e) && e.matches('[role="dialog"], [role="menu"], [role="alertdialog"]'))) {
        const cs = getComputedStyle(el);
        const ok = parseFloat(cs.borderTopWidth) >= 2 && /4px 4px 0px|7px 7px 0px/.test(cs.boxShadow) && near(rgb(cs.boxShadow.match(/(rgba?\([^)]*\)|oklch\([^)]*\))/)?.[1] ?? 'transparent'), altRgb);
        if (!ok) fails.overlay.push(`${where(el)} border=${cs.borderTopWidth} shadow=${cs.boxShadow}`);
      }
      return { fails, buttons: { total: candidates.length, primary: primary.length, hard: hard.length, primaryFlat, primaryLightLabel, secondaryHard, thinBorder, iconEdge } };
    }, (await page.getByTestId(`site-page-${id}`).getAttribute('data-alt')) ?? '#000000');
    expect(contract.fails.blur, 'a blurred backdrop or blur filter in the ours lane').toEqual([]);
    expect(contract.fails.gradient, 'gradient fill in the ours lane').toEqual([]);
    expect(contract.fails.shadow, 'soft, alpha or off-palette shadow in the ours lane').toEqual([]);
    expect(contract.fails.radius, 'radius above 2px on a non-round element in the ours lane').toEqual([]);
    expect(contract.fails.overlay, 'dialog/menu without 2px edge and hard alt shadow').toEqual([]);
    expect(contract.buttons.thinBorder, 'action button with a border thinner than 2px').toEqual([]);
    expect(contract.buttons.iconEdge, 'ghost icon button boxed by the 2px edge (icon-only keeps its own geometry)').toEqual([]);
    expect(contract.buttons.total, 'no action buttons found to judge').toBeGreaterThan(0);
    expect(contract.buttons.primaryFlat, 'accent-filled button without the 4px offset (level 1)').toEqual([]);
    expect(contract.buttons.primaryLightLabel, 'accent-filled button without an ink label').toEqual([]);
    expect(contract.buttons.secondaryHard, 'offset shadow on a dark-filled button (level 0 is flat)').toEqual([]);
    expect(contract.fails.collision, 'inked elements closer than the shadow offset').toEqual([]);
    expect(contract.fails.status, 'presence/status dot painted ink (its hue is the information)').toEqual([]);
    expect(contract.fails.phantom, 'inked element under 12px (an empty host wearing the edge and shadow)').toEqual([]);

    const overflow = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth, c: document.documentElement.clientWidth,
      bad: [...document.querySelectorAll('[data-testid^="pair-"]')]
        .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .map((el) => el.getAttribute('data-testid'))
    }));
    expect(overflow.bad, 'pairs extending past the viewport').toEqual([]);
    expect(overflow.w).toBeLessThanOrEqual(overflow.c + 1);
    expect(errors).toEqual([]);
  });
}
