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
 *      neobrutal action buttons, hard-edged dialogs and menus).
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
      const fails = { radius: [] as string[], shadow: [] as string[], blur: [] as string[], gradient: [] as string[], thin: [] as string[], overlay: [] as string[] };
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
          }
        }
        const bf = (cs as any).backdropFilter || (cs as any).webkitBackdropFilter;
        if (bf && bf !== 'none') fails.blur.push(where(el));
        if (cs.filter && /blur\(/.test(cs.filter) && !isArt(el)) fails.blur.push(`${where(el)} filter`);
        if (/gradient\(/.test(cs.backgroundImage) && !isArt(el) && !el.matches('[data-scrim]')) fails.gradient.push(where(el));
      }
      // buttons: ≥60% of text-bearing, non-chrome buttons carry the 4px alt shadow
      const btns = all.filter((el) => visible(el) && el.matches('button, [role="button"], input[type="submit"]'));
      const chrome = (el: HTMLElement) => {
        const cs = getComputedStyle(el);
        const text = (el.textContent ?? '').trim();
        const iconOnly = el.children.length === 1 && el.children[0].matches('svg, i, img, [class*="icon" i], [role="img"]') && text.length <= 3;
        return !text || text.length <= 2 || iconOnly || isRoundShape(el, cs) || isArt(el) || !!el.closest('[role="tablist"], nav, [role="navigation"], [role="menu"], [role="listbox"], [role="tree"], [class*="tabs" i], [class*="nav" i], [class*="breadcrumb" i], [class*="chip" i], [class*="pager" i], [class*="Pivot"], [class*="CommandBar"]') ||
          el.matches('[role="tab"], [role="menuitem"], [role="option"], [role="link"], [class*="tab" i], [class*="chip" i], [class*="pill" i], [class*="ghost" i], [class*="subtle" i], [class*="transparent" i], [class*="invisible"], [class*="quiet"], [class*="link" i], [class*="text" i], [class*="MenuItem"], [class*="Tree"], [class*="icon" i], [class*="carousel" i], [class*="arrow" i], [class*="menu-item" i], [class*="list-item" i], [class*="nav" i], [class*="story" i], [class*="reaction" i], [class*="tile" i], [class*="follow" i], [class*="mode" i], [class*="send" i], [class*="copy" i], [class*="share" i], [class*="action" i], [class*="toggle" i], [class*="switch" i], [class*="filter" i], [class*="deemph" i], [class*="floating" i], [class*="on-media" i], [class*="lozenge" i], [class*="tag" i], [class*="account" i], [class*="skip" i], [class*="playground" i], [class*="tts" i], [class*="model" i], [class*="disabled" i], [disabled], [aria-disabled="true"], [data-variant="invisible"], [data-variant="link"]');
      };
      const candidates = btns.filter((b) => !chrome(b as HTMLElement));
      const hard = candidates.filter((b) => { const s = getComputedStyle(b).boxShadow; const m = s.match(/(rgba?\([^)]*\)|oklch\([^)]*\))\s+4px\s+4px\s+0px(\s+0px)?/); return !!m && near(rgb(m[1]), altRgb); });
      const flat = candidates.filter((b) => !hard.includes(b)).map(where);
      const thinBorder = candidates.filter((b) => { const cs = getComputedStyle(b); const w = parseFloat(cs.borderTopWidth); return cs.borderTopStyle !== 'none' && w > 0 && w < 2 && rgb(cs.borderTopColor)[3] > 0; }).map(where);
      // overlays: dialog + menu carry 2px border and the alt shadow
      for (const el of all.filter((e) => visible(e) && e.matches('[role="dialog"], [role="menu"], [role="alertdialog"]'))) {
        const cs = getComputedStyle(el);
        const ok = parseFloat(cs.borderTopWidth) >= 2 && /4px 4px 0px|7px 7px 0px/.test(cs.boxShadow) && near(rgb(cs.boxShadow.match(/(rgba?\([^)]*\)|oklch\([^)]*\))/)?.[1] ?? 'transparent'), altRgb);
        if (!ok) fails.overlay.push(`${where(el)} border=${cs.borderTopWidth} shadow=${cs.boxShadow}`);
      }
      return { fails, buttons: { total: candidates.length, hard: hard.length, flat, thinBorder } };
    }, (await page.getByTestId(`site-page-${id}`).getAttribute('data-alt')) ?? '#000000');
    expect(contract.fails.blur, 'a blurred backdrop or blur filter in the ours lane').toEqual([]);
    expect(contract.fails.gradient, 'gradient fill in the ours lane').toEqual([]);
    expect(contract.fails.shadow, 'soft, alpha or off-palette shadow in the ours lane').toEqual([]);
    expect(contract.fails.radius, 'radius above 2px on a non-round element in the ours lane').toEqual([]);
    expect(contract.fails.overlay, 'dialog/menu without 2px edge and hard alt shadow').toEqual([]);
    expect(contract.buttons.thinBorder, 'action button with a border thinner than 2px').toEqual([]);
    expect(contract.buttons.total, 'no action buttons found to judge').toBeGreaterThan(0);
    expect(contract.buttons.hard / contract.buttons.total, `flat action buttons: ${contract.buttons.flat.join(' | ')}`).toBeGreaterThanOrEqual(0.6);

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
