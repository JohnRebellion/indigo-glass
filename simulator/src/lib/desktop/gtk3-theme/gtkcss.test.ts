import { describe, expect, it } from 'vitest';
import {
  extractDefineColors,
  substituteNames,
  translateFunctions,
  rewritePseudoClasses,
  gtkSelectorInventory,
  gtkToWeb
} from './gtkcss';

describe('extractDefineColors', () => {
  it('pulls name/value pairs out and strips them from the rest', () => {
    const { defs, rest } = extractDefineColors('@define-color theme_bg_color #0D0D10;\nwindow { color: red; }');
    expect(defs).toEqual([['theme_bg_color', '#0D0D10']]);
    expect(rest.trim()).toBe('window { color: red; }');
  });

  it('keeps declaration order so a later redefinition can win (user gtk.css layering)', () => {
    const { defs } = extractDefineColors('@define-color accent_color #A6C9A6;\n@define-color accent_color #C0E3C0;');
    expect(defs).toEqual([
      ['accent_color', '#A6C9A6'],
      ['accent_color', '#C0E3C0']
    ]);
  });
});

describe('substituteNames', () => {
  it('turns @name into var(--gtk-name)', () => {
    expect(substituteNames('@theme_fg_color')).toBe('var(--gtk-theme_fg_color)');
  });
  it('substitutes multiple refs in one value', () => {
    expect(substituteNames('4px 4px 0 0 @borders')).toBe('4px 4px 0 0 var(--gtk-borders)');
  });
  it('leaves plain colours untouched', () => {
    expect(substituteNames('#0D0D10')).toBe('#0D0D10');
  });
});

describe('translateFunctions — alpha (exact)', () => {
  it('translates a fractional factor to a percentage mix toward transparent', () => {
    expect(translateFunctions(substituteNames('alpha(@theme_fg_color, 0.08)'))).toBe(
      'color-mix(in srgb, var(--gtk-theme_fg_color) 8%, transparent)' // drift-allow: expected parser output, not paint
    );
  });
  it('accepts a percentage factor directly', () => {
    expect(translateFunctions('alpha(#FFFFFF, 50%)')).toBe('color-mix(in srgb, #FFFFFF 50%, transparent)'); // drift-allow: parser test input, not paint
  });
  it('clamps an out-of-range factor', () => {
    expect(translateFunctions('alpha(#FFFFFF, 1.5)')).toBe('color-mix(in srgb, #FFFFFF 100%, transparent)');
  });
});

describe('translateFunctions — mix (exact)', () => {
  it('interpolates with factor 0 = first colour, 1 = second', () => {
    expect(translateFunctions('mix(#000000, #FFFFFF, 0.25)')).toBe('color-mix(in srgb, #000000 75%, #FFFFFF 25%)');
  });
  it('does not fire on color-mix( itself', () => {
    const input = 'color-mix(in srgb, red 50%, blue)';
    expect(translateFunctions(input)).toBe(input);
  });
});

describe('translateFunctions — shade/lighter/darker (documented approximation)', () => {
  it('factor 1 is the identity (no-op)', () => {
    expect(translateFunctions(substituteNames('shade(@x, 1)'))).toBe('var(--gtk-x)');
  });
  it('factor 0 is pure black, factor 2 is pure white (the documented domain endpoints)', () => {
    expect(translateFunctions('shade(#89A889, 0)')).toBe('color-mix(in srgb, black 100%, #89A889)');
    expect(translateFunctions('shade(#89A889, 2)')).toBe('color-mix(in srgb, #89A889 0%, white)');
  });
  it('factor between 1 and 2 mixes toward white proportionally', () => {
    expect(translateFunctions('shade(#89A889, 1.5)')).toBe('color-mix(in srgb, #89A889 50%, white)');
  });
  it('factor between 0 and 1 mixes toward black proportionally', () => {
    expect(translateFunctions('shade(#89A889, 0.5)')).toBe('color-mix(in srgb, black 50%, #89A889)');
  });
  it('lighter() is shade(c, 1.3)', () => {
    expect(translateFunctions('lighter(#89A889)')).toBe(translateFunctions('shade(#89A889, 1.3)'));
  });
  it('darker() is shade(c, 0.7)', () => {
    expect(translateFunctions('darker(#89A889)')).toBe(translateFunctions('shade(#89A889, 0.7)'));
  });
});

describe('translateFunctions — nesting and pass-through', () => {
  /* translateFunctions itself only translates function calls; @-substitution
   * is a separate pass (substituteNames) that the real pipeline always runs
   * first (see gtkToWeb). These tests compose the two the same way. */
  it('resolves a @ref nested inside a function', () => {
    expect(translateFunctions(substituteNames('alpha(@theme_fg_color, 0.5)'))).toContain('var(--gtk-theme_fg_color)');
  });
  it('resolves a function nested inside another function', () => {
    expect(translateFunctions(substituteNames('alpha(shade(@c, 0.5), 0.5)'))).toBe(
      'color-mix(in srgb, color-mix(in srgb, black 50%, var(--gtk-c)) 50%, transparent)'
    );
  });
  it('leaves modern relative-colour syntax untouched (libadwaita ships this)', () => {
    const input = 'oklab(from @accent_bg_color min(l, 0.5) a b)';
    // only the @ref is a GTK-specific token here; oklab()/min() are native CSS
    expect(translateFunctions(substituteNames(input))).toBe('oklab(from var(--gtk-accent_bg_color) min(l, 0.5) a b)');
  });
  it('leaves RGB()-with-slash-alpha syntax untouched', () => {
    expect(translateFunctions('RGB(0 0 6 / 80%)')).toBe('RGB(0 0 6 / 80%)');
  });
});

describe('rewritePseudoClasses', () => {
  it('maps :backdrop to a class, per the brief', () => {
    expect(rewritePseudoClasses('window:backdrop')).toBe('window.backdrop');
  });
  it('maps state pseudo-classes to data-attributes', () => {
    expect(rewritePseudoClasses('button:hover')).toBe('button[data-hover]');
    expect(rewritePseudoClasses('button:active, button:checked')).toBe('button[data-active], button[data-checked]');
  });
  it('rewrites inside :not()', () => {
    expect(rewritePseudoClasses('row:hover:not(:selected)')).toBe('row[data-hover]:not([data-selected])');
  });
  it('rewrites every state in a compound negative-lookahead chain', () => {
    expect(rewritePseudoClasses('radio:not(:indeterminate):not(:checked):active:not(:backdrop)')).toBe(
      'radio:not(:indeterminate):not([data-checked])[data-active]:not(.backdrop)'
    );
  });
  it('leaves unmapped pseudo-classes (structural, :not, :dir) untouched', () => {
    expect(rewritePseudoClasses('tab:first-child:dir(ltr)')).toBe('tab:first-child:dir(ltr)');
  });
  it('does not touch pseudo-elements', () => {
    expect(rewritePseudoClasses('label::first-line')).toBe('label::first-line');
  });
});

describe('gtkToWeb — -gtk-* handling', () => {
  it('drops -gtk-icon-shadow and records why', () => {
    const { css, dropped } = gtkToWeb('* { -gtk-icon-shadow: none; color: red; }', '.ours');
    expect(css).not.toContain('-gtk-icon-shadow');
    expect(css).toContain('color: red');
    expect(dropped).toEqual([{ property: '-gtk-icon-shadow', reason: expect.stringContaining('shadows a rendered icon surface') }]);
  });
  it('drops a value that calls -gtk-recolor(), keeping the reason keyed to the declared property', () => {
    const { css, dropped } = gtkToWeb('check:checked { -gtk-icon-source: -gtk-recolor(url("x.svg")); }', '.ours');
    expect(css).not.toContain('-gtk-recolor');
    expect(dropped[0].property).toBe('-gtk-icon-source');
  });
  it('drops -gtk-scaled() used inside an otherwise-ordinary property', () => {
    const { dropped } = gtkToWeb('button { background-image: -gtk-scaled(url("a.png"), url("a@2.png")); }', '.ours');
    expect(dropped).toEqual([{ property: 'background-image', reason: expect.stringContaining('1x/2x') }]);
  });
  it('keeps -gtk-outline-radius, renamed, with translation still applied to its value', () => {
    const { css, dropped } = gtkToWeb('button { -gtk-outline-radius: shade(@x, 0); }', '.ours');
    expect(css).toContain('outline-radius: color-mix(in srgb, black 100%, var(--gtk-x))');
    expect(dropped).toEqual([]);
  });
  it('deduplicates repeated drops of the same property', () => {
    const { dropped } = gtkToWeb('a { -gtk-icon-shadow: none; } b { -gtk-icon-shadow: none; }', '.ours');
    expect(dropped).toHaveLength(1);
  });
});

describe('gtkToWeb — scoping and variables', () => {
  it('wraps the file in @scope on the given selector', () => {
    const { css } = gtkToWeb('window { color: red; }', '[data-lane="ours"]');
    expect(css.startsWith('@scope ([data-lane="ours"]) {')).toBe(true);
    expect(css.trim().endsWith('}')).toBe(true);
  });
  it('emits every @define-color as a --gtk- custom property on :scope', () => {
    const { css, defineNames } = gtkToWeb('@define-color theme_bg_color #0D0D10;\nwindow { background-color: @theme_bg_color; }', '.ours');
    expect(css).toContain('--gtk-theme_bg_color: #0D0D10;');
    expect(css).toContain('background-color: var(--gtk-theme_bg_color)');
    expect(defineNames).toEqual(['theme_bg_color']);
  });
  it('a later @define-color of the same name overrides the earlier one (theme + user-css layering)', () => {
    const { css } = gtkToWeb('@define-color accent_color #A6C9A6;\n@define-color accent_color #C0E3C0;', '.ours');
    // both lines are emitted in file order; CSS itself resolves "last wins" on :scope,
    // same as GTK resolves @define-color redefinition at parse time
    const lines = [...css.matchAll(/--gtk-accent_color: (#[0-9A-F]+);/g)].map((m) => m[1]);
    expect(lines).toEqual(['#A6C9A6', '#C0E3C0']);
  });
  it('passes selectors through unchanged apart from pseudo-class rewriting', () => {
    const { css } = gtkToWeb('headerbar button:hover { background-color: alpha(@theme_fg_color, 0.08); }', '.ours');
    expect(css).toContain('headerbar button[data-hover] {');
  });
  it('leaves @keyframes structurally intact (nested braces are not mistaken for selectors needing pseudo-rewrite)', () => {
    const { css } = gtkToWeb('@keyframes spin { to { transform: rotate(360deg); } }', '.ours');
    expect(css.replace(/\s+/g, ' ')).toContain('@keyframes spin { to {transform: rotate(360deg); } }');
  });
});

describe('gtkSelectorInventory', () => {
  it('collects element, class and attribute tokens, ignoring at-rules', () => {
    const css = `
      @keyframes spin { to { transform: rotate(360deg); } }
      headerbar button.suggested-action:hover, .titlebar button { color: red; }
      row:selected { color: blue; }
    `;
    expect(gtkSelectorInventory(css)).toEqual(['.suggested-action', '.titlebar', 'button', 'headerbar', 'row']);
  });
  it('does not blank out on input with no @-moz-document wrapper (unlike selectorInventory for sites)', () => {
    expect(gtkSelectorInventory('button { color: red; }')).toEqual(['button']);
  });
});
