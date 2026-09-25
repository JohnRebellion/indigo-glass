import { describe, it, expect } from 'vitest';
import { parseIni, kdeColor, unusedKeys } from './ini';

describe('parseIni', () => {
  const doc = parseIni('﻿# c\n[General]\nName=Sage Ink\n[Colors:Window][Inactive]\nBackgroundNormal=7,8,10\n[file]\na=1\n[x]\n[file]\nb=2\nIcon[$e]=x\n');

  it('reads nested KConfig groups and merges repeated ones', () => {
    expect(doc.get('General', 'Name')).toBe('Sage Ink');
    expect(doc.get('Colors:Window/Inactive', 'BackgroundNormal')).toBe('7,8,10');
    expect(doc.get('file', 'a')).toBe('1');
    expect(doc.get('file', 'b')).toBe('2');
  });

  it('strips KConfig [$e] key flags', () => {
    expect(doc.has('file', 'Icon')).toBe(true);
  });

  it('tracks what was read', () => {
    expect(unusedKeys(doc)).toEqual(['file/Icon']);
    expect(unusedKeys(doc, ['file/*'])).toEqual([]);
  });

  it('req throws on a missing key', () => {
    expect(() => doc.req('General', 'Nope')).toThrow(/missing \[General\] Nope/);
  });
});

describe('kdeColor', () => {
  it('converts r,g,b and r,g,b,a', () => {
    expect(kdeColor('166,201,166')).toBe('#A6C9A6');
    expect(kdeColor('7,8,10,204')).toBe('#07080ACC');
    expect(kdeColor('7,8,10,255')).toBe('#07080A');
    expect(kdeColor('#a6c9a6')).toBe('#A6C9A6');
  });
});
