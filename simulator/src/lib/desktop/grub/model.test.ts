import { describe, it, expect } from 'vitest';
import { contrast } from '../tokens';
import { theme, PAINT, ORCHID_LIGHT, ON_LIGHT_BORDER, cfg, stockMenuBox } from './model';

/* DesktopPage.svelte's automatic role check only compares against the
   DEFAULT variant's PALETTE (sage) — see tokens.ts's VARIANT/PALETTE, which
   read _derived.palettes[VARIANT], not a specific named variant. theme.txt
   is locked to orchid_light by its own `# variant:` header (a switch
   generate-menu.sh / generate-background.sh / check-ink-contract.py all
   read), so every role in index.ts carries token: null and this file is the
   real cross-check against the generated orchid_light palette instead. */

describe('grub theme.txt paints real orchid_light tokens', () => {
  it('desktop-color is base', () => {
    expect(PAINT.base).toBe(ORCHID_LIGHT.base);
  });
  it('card section label + capability caption are accent', () => {
    expect(PAINT.cardLabel).toBe(ORCHID_LIGHT.accent);
    expect(PAINT.cardCaption).toBe(ORCHID_LIGHT.accent);
  });
  it('card headline + BOOT PICKER header are text', () => {
    expect(PAINT.cardHeadline).toBe(ORCHID_LIGHT.text);
    expect(PAINT.header).toBe(ORCHID_LIGHT.text);
  });
  it('card sub-line is accent_hi', () => {
    expect(PAINT.cardSubline).toBe(ORCHID_LIGHT.accent_hi);
  });
  it('boot menu item text is text', () => {
    expect(PAINT.itemText).toBe(ORCHID_LIGHT.text);
  });
  it('card fill is the generated card_fill token (#C5ADCF, accent 0.45 over base)', () => {
    expect(PAINT.cardFill).toBe(ORCHID_LIGHT.card_fill);
    expect(PAINT.cardFill).toBe('#C5ADCF');
  });
  it('edge/shadow is the global on_light.border token', () => {
    expect(PAINT.edge).toBe(ON_LIGHT_BORDER);
    expect(PAINT.edge).toBe('#000000');
  });
});

describe('2026-09-25 selected-item contrast fix', () => {
  it('selected_item_color now equals item_color (text), not accent_hi', () => {
    expect(PAINT.selectedItemText).toBe(PAINT.itemText);
    expect(PAINT.selectedItemText).not.toBe(ORCHID_LIGHT.accent_hi);
  });
  it('accent_hi on card_fill really was under the 4.5:1 floor (why the fix was needed)', () => {
    const v = contrast(ORCHID_LIGHT.accent_hi, PAINT.cardFill);
    expect(v).toBeLessThan(4.5);
    expect(v).toBeCloseTo(4.4515, 3);
  });
  it('the fixed selected-item text clears the floor on the card', () => {
    expect(contrast(PAINT.selectedItemText, PAINT.cardFill)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('contrast pairs the page declares', () => {
  const floor = 4.5;
  it('every label on the page background clears the floor', () => {
    for (const fg of [PAINT.cardLabel, PAINT.cardHeadline, PAINT.cardSubline, PAINT.cardCaption, PAINT.header]) {
      expect(contrast(fg, PAINT.base)).toBeGreaterThanOrEqual(floor);
    }
  });
  it('item text and the now-fixed selected item text both clear the floor on the card', () => {
    expect(contrast(PAINT.itemText, PAINT.cardFill)).toBeGreaterThanOrEqual(floor);
    expect(contrast(PAINT.selectedItemText, PAINT.cardFill)).toBeGreaterThanOrEqual(floor);
  });
});

describe('boot_menu props GrubScreen.svelte does not read', () => {
  it('scrollbar is present in theme.txt but painted nowhere (Coverage.ignored, not missing)', () => {
    const bootMenu = theme.components.find((c) => c.type === 'boot_menu');
    expect(bootMenu?.props.scrollbar).toBe('false');
  });
});

describe('stockMenuBox layout (menu_text.c print_entry/print_entries)', () => {
  it('draws the "*" marker only on the selected row, when there is more than one entry', () => {
    const { lines } = stockMenuBox(cfg.entries, cfg.defaultIndex);
    lines.forEach((l, i) => {
      expect(l.text.includes('*')).toBe(i === cfg.defaultIndex);
      expect(l.selected).toBe(i === cfg.defaultIndex);
    });
  });
  it('every row and the top/bottom borders are the same width', () => {
    const { top, lines, bottom } = stockMenuBox(cfg.entries, cfg.defaultIndex);
    const widths = new Set([top.length, bottom.length, ...lines.map((l) => l.text.length + 2)]);
    expect(widths.size).toBe(1);
  });
  it('draws no marker at all for a single-entry menu', () => {
    const { lines } = stockMenuBox([{ title: 'Only OS' }], 0);
    expect(lines[0].text).not.toContain('*');
  });
});

describe('shared boot menu content', () => {
  it('has more than one entry (menu_text.c only draws the "*" highlight marker when it does)', () => {
    expect(cfg.entries.length).toBeGreaterThan(1);
  });
  it('default index is a valid entry', () => {
    expect(cfg.defaultIndex).toBeGreaterThanOrEqual(0);
    expect(cfg.defaultIndex).toBeLessThan(cfg.entries.length);
  });
});
