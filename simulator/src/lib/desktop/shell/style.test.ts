import { describe, it, expect } from 'vitest';
import { parseStarshipStyle, parseBracketed } from './style';

const ansi = (slot: string) => `var(--ks-ansi-${slot})`;

describe('parseStarshipStyle', () => {
  it('parses bg/fg hex and preserves case-insensitivity of the hex', () => {
    const s = parseStarshipStyle('bg:#C0E3C0 fg:#A6C9A6', ansi as never);
    expect(s.bg).toBe('#C0E3C0');
    expect(s.fg).toBe('#A6C9A6');
  });

  it('treats a bare hex with no prefix as foreground', () => {
    const s = parseStarshipStyle('bold #C0E3C0', ansi as never);
    expect(s.bold).toBe(true);
    expect(s.fg).toBe('#C0E3C0');
  });

  it('resolves a named ANSI colour through the terminal palette', () => {
    const s = parseStarshipStyle('bold fg:red', ansi as never);
    expect(s.fg).toBe('var(--ks-ansi-red)');
  });

  it('resolves starship "purple" to the magenta ANSI slot', () => {
    const s = parseStarshipStyle('bg:purple', ansi as never);
    expect(s.bg).toBe('var(--ks-ansi-magenta)');
  });

  it('resolves a bright- prefixed named colour', () => {
    const s = parseStarshipStyle('fg:bright-cyan', ansi as never);
    expect(s.fg).toBe('var(--ks-ansi-bright_cyan)');
  });

  it('parses modifiers with no colour', () => {
    const s = parseStarshipStyle('bold underline', ansi as never);
    expect(s.bold).toBe(true);
    expect(s.underline).toBe(true);
    expect(s.fg).toBeUndefined();
    expect(s.bg).toBeUndefined();
  });
});

describe('parseBracketed', () => {
  it('splits a starship [text](style) segment', () => {
    expect(parseBracketed('[❯](bold #C0E3C0)')).toEqual({ text: '❯', style: 'bold #C0E3C0' });
  });
  it('handles an empty text (a pure connector glyph)', () => {
    expect(parseBracketed('[](bg:#C0E3C0 fg:#A6C9A6)')).toEqual({ text: '', style: 'bg:#C0E3C0 fg:#A6C9A6' });
  });
  it('returns null for something that is not a bracket group', () => {
    expect(parseBracketed('$os')).toBeNull();
  });
});
