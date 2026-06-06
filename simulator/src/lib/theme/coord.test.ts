import { describe, it, expect } from 'vitest';
import { resolveCoord } from './coord';

describe('resolveCoord', () => {
  it('pure pixel', () => {
    expect(resolveCoord('50', 1920)).toBe(50);
    expect(resolveCoord(100, 1920)).toBe(100);
  });

  it('pure percent', () => {
    expect(resolveCoord('50%', 1920)).toBe(960);
    expect(resolveCoord('100%', 1080)).toBe(1080);
    expect(resolveCoord('0%', 1920)).toBe(0);
  });

  it('percent + offset', () => {
    expect(resolveCoord('50%+50', 1000)).toBe(550);
    expect(resolveCoord('50%-100', 1000)).toBe(400);
  });

  it('handles 100%-N (common pattern)', () => {
    expect(resolveCoord('100%-47', 1080)).toBe(1033);
  });

  it('returns 0 for malformed', () => {
    expect(resolveCoord('garbage', 1000)).toBe(0);
  });

  it('decimals', () => {
    expect(resolveCoord('25.5%', 1000)).toBe(255);
  });
});
