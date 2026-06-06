import { describe, it, expect } from 'vitest';
import { parseTheme, serialiseTheme } from './parser';

describe('parseTheme', () => {
  it('parses root properties with colon syntax', () => {
    const src = `
      title-text: "Indigo-Glass"
      desktop-image: "background.jpg"
      desktop-color: "#0a0402"
    `;
    const t = parseTheme(src);
    expect(t.root['title-text']).toBe('Indigo-Glass');
    expect(t.root['desktop-image']).toBe('background.jpg');
    expect(t.root['desktop-color']).toBe('#0a0402');
  });

  it('parses component blocks with equals syntax', () => {
    const src = `
      + boot_menu {
        left = 50%-260
        top = 30%
        width = 520
        item_color = "#e0e7ff"
        item_font = "SF Pro Display Regular 30"
      }
    `;
    const t = parseTheme(src);
    expect(t.components).toHaveLength(1);
    const bm = t.components[0];
    expect(bm.type).toBe('boot_menu');
    expect(bm.props['left']).toBe('50%-260');
    expect(bm.props['width']).toBe('520');
    expect(bm.props['item_color']).toBe('#e0e7ff');
    expect(bm.props['item_font']).toBe('SF Pro Display Regular 30');
  });

  it('parses multiple components', () => {
    const src = `
      title-text: ""
      + progress_bar {
        id = "__timeout__"
        width = 100%
      }
      + label {
        text = "Hello"
        align = "center"
      }
      + boot_menu {
        width = 1620
      }
    `;
    const t = parseTheme(src);
    expect(t.components).toHaveLength(3);
    expect(t.components.map((c) => c.type)).toEqual(['progress_bar', 'label', 'boot_menu']);
  });

  it('strips comments', () => {
    const src = `
      # this is a comment
      title-text: "X" # inline comment
      + label {
        # inside comment
        text = "Y"
      }
    `;
    const t = parseTheme(src);
    expect(t.root['title-text']).toBe('X');
    expect(t.components[0].props['text']).toBe('Y');
  });

  it('parses inline single-line component', () => {
    const src = `+ image { left = 60 top = 96 width = 360 height = 140 file = "assets/card_c.png" }`;
    const t = parseTheme(src);
    expect(t.components).toHaveLength(1);
    expect(t.components[0].type).toBe('image');
    expect(t.components[0].props.left).toBe('60');
    expect(t.components[0].props.width).toBe('360');
    expect(t.components[0].props.file).toBe('assets/card_c.png');
  });

  it('parses multiple inline components', () => {
    const src = `
      + image { left = 60 top = 96 width = 100 file = "a.png" }
      + image { left = 200 top = 96 width = 100 file = "b.png" }
    `;
    const t = parseTheme(src);
    expect(t.components).toHaveLength(2);
    expect(t.components[0].props.file).toBe('a.png');
    expect(t.components[1].props.file).toBe('b.png');
  });

  it('round-trips via serialise', () => {
    const original = `title-text: "Test"
desktop-color: "#000000"

+ label {
  text = "Hello"
  align = "center"
  left = 50%
}
`;
    const t = parseTheme(original);
    const out = serialiseTheme(t);
    const t2 = parseTheme(out);
    expect(t2.root).toEqual(t.root);
    expect(t2.components).toEqual(t.components);
  });
});
