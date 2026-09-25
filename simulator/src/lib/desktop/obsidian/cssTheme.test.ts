import { describe, it, expect } from 'vitest';
import { extractCssVars, resolveValue, resolveVar, declaredVars } from './cssTheme';

describe('extractCssVars', () => {
  it('reads declarations from a block whose selector matches, last write wins', () => {
    const css = `.theme-dark { --a: 1; --b: 2px; }\n.theme-dark { --a: 3 !important; }`;
    const vars = extractCssVars(css, ['.theme-dark']);
    expect(vars.get('--a')).toBe('3');
    expect(vars.get('--b')).toBe('2px');
  });

  it('matches one selector in a comma list', () => {
    const css = `.theme-dark, .theme-darker { --x: red; }`;
    expect(extractCssVars(css, ['.theme-darker']).get('--x')).toBe('red');
    expect(extractCssVars(css, ['.nope']).has('--x')).toBe(false);
  });

  it('ignores non-custom-property declarations', () => {
    const css = `.theme-dark { color: red; --a: 1; }`;
    const vars = extractCssVars(css, ['.theme-dark']);
    expect(vars.has('color')).toBe(false);
    expect(vars.get('--a')).toBe('1');
  });

  it('strips comments before matching', () => {
    const css = `/* .theme-dark { --fake: 1; } */\n.theme-dark { --real: 2; }`;
    expect(extractCssVars(css, ['.theme-dark']).get('--real')).toBe('2');
  });
});

describe('resolveValue / resolveVar', () => {
  const vars = new Map([
    ['--base', '#07080A'],
    ['--alias', 'var(--base)'],
    ['--fallback-only', 'var(--missing, #FFFFFF)'],
    ['--cycle-a', 'var(--cycle-b)'],
    ['--cycle-b', 'var(--cycle-a)']
  ]);

  it('returns a plain value unchanged', () => {
    expect(resolveValue(vars, '#07080A')).toBe('#07080A');
  });

  it('resolves one level of var() indirection', () => {
    expect(resolveVar(vars, '--alias')).toBe('#07080A');
  });

  it('falls back when the referenced var is missing', () => {
    expect(resolveVar(vars, '--fallback-only')).toBe('#FFFFFF');
  });

  it('breaks a cycle instead of recursing forever', () => {
    expect(resolveVar(vars, '--cycle-a')).toBe('transparent');
  });

  it('returns transparent for an unknown name with no fallback', () => {
    expect(resolveVar(vars, '--never-declared')).toBe('transparent');
  });
});

describe('declaredVars', () => {
  it('finds every declared custom property, not usages', () => {
    const css = `.theme-dark { --a: 1; } .x { color: var(--a); --b: var(--a); }`;
    expect(declaredVars(css).sort()).toEqual(['--a', '--b']);
  });
});
