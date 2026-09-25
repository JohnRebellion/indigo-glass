/* The Sage Ink structural contract, scanned live in the browser after mount —
 * the desktop.spec.ts suite (deliberately, per the brief) does not check CSS
 * structure the way e2e/sites.spec.ts does for /sites/, so each of the three
 * "app" surfaces (obsidian, vencord, spicetify) runs this itself and renders
 * the result with StructureCheck.svelte. It is a smaller version of
 * sites.spec.ts's computed-style scan: radius ladder, no blur/backdrop-filter, // drift-allow: this comment names the checks, doesn't apply them
 * no gradients, no soft or translucent shadows, 2px borders on controls.
 * Owned by obsidian/; imported read-only by ../vencord and ../spicetify. */

const isRoundShape = (b: DOMRect, radius: number) => radius >= Math.min(b.width, b.height) / 2 - 0.5;

function alpha255(color: string): number {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return ctx.getImageData(0, 0, 1, 1).data[3];
}

const tag = (el: Element): string => {
  const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
  return `${el.tagName.toLowerCase()}${cls}`;
};

export function scanStructure(root: ParentNode, laneSelector = '[data-lane="ours"]'): string[] {
  const violations: string[] = [];
  const roots = [...root.querySelectorAll(laneSelector)];
  const all = roots.flatMap((r) => [r, ...Array.from(r.querySelectorAll('*'))]) as HTMLElement[];
  for (const el of all) {
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    const cs = getComputedStyle(el);

    const radius = Math.max(
      ...['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'].map(
        (k) => parseFloat((cs as unknown as Record<string, string>)[k]) || 0
      )
    );
    if (radius > 2 && !isRoundShape(b, radius)) violations.push(`${tag(el)}: radius ${radius}px off the ladder (0 / 2 / full-pill)`);

    const bf = (cs as unknown as { backdropFilter?: string; webkitBackdropFilter?: string }).backdropFilter ||
      (cs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter;
    if (bf && bf !== 'none') violations.push(`${tag(el)}: backdrop-filter ${bf}`); // drift-allow: reports a violation string, isn't a style rule
    if (cs.filter && /blur\(/.test(cs.filter)) violations.push(`${tag(el)}: filter ${cs.filter}`);
    if (/gradient\(/.test(cs.backgroundImage)) violations.push(`${tag(el)}: gradient background-image`);

    const sh = cs.boxShadow;
    if (sh && sh !== 'none') {
      for (const layer of sh.split(/,(?![^(]*\))/).map((s) => s.trim())) {
        const m = layer.match(/^(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8})\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?(\s+inset)?$/);
        if (!m) { violations.push(`${tag(el)}: unrecognised shadow shape "${layer}"`); continue; }
        const blur = parseFloat(m[4]);
        const a = alpha255(m[1]);
        if (a === 0) continue;
        if (blur > 0 || a < 255) violations.push(`${tag(el)}: soft or translucent shadow "${layer}"`);
      }
    }

    if (el.matches('button, input, select, textarea, [role="button"], [type="checkbox"], [type="radio"]')) {
      const w = parseFloat(cs.borderTopWidth);
      if (cs.borderTopStyle !== 'none' && w > 0 && w < 2) violations.push(`${tag(el)}: control border ${w}px, under the 2px floor`);
    }
  }
  return violations;
}
