import { describe, it, expect } from 'vitest';
import { resolveIcon } from './icon';

describe('resolveIcon', () => {
  const assets = {
    files: new Map([
      ['icons/nobara.png', 'data:image/png;base64,NOBARA'],
      ['icons/gnu-linux.png', 'data:image/png;base64,LINUX'],
      ['icons/windows.png', 'data:image/png;base64,WIN'],
      ['icons/os.png', 'data:image/png;base64,OS']
    ])
  };

  it('walks class chain left-to-right, first match wins', () => {
    const entry = { title: 'X', classes: ['nobara', 'gnu-linux', 'gnu', 'os'] };
    expect(resolveIcon(entry, assets)).toBe('data:image/png;base64,NOBARA');
  });

  it('skips missing classes', () => {
    const entry = { title: 'X', classes: ['unknown', 'also-missing', 'windows'] };
    expect(resolveIcon(entry, assets)).toBe('data:image/png;base64,WIN');
  });

  it('falls through to os.png when others missing', () => {
    const entry = { title: 'X', classes: ['notreal', 'os'] };
    expect(resolveIcon(entry, assets)).toBe('data:image/png;base64,OS');
  });

  it('returns null when no class matches', () => {
    const entry = { title: 'X', classes: ['nope', 'still-nope'] };
    expect(resolveIcon(entry, assets)).toBeNull();
  });
});
