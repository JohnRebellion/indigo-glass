import { describe, it, expect } from 'vitest';
import { parsePwshColors } from './psreadline';
import profileText from '../../../../../windows/powershell/Microsoft.PowerShell_profile.ps1?raw';

describe('parsePwshColors', () => {
  it('parses a plain hex entry with its token-name comment', () => {
    const { entries } = parsePwshColors(`
      Set-PSReadLineOption -Colors @{
        Command = '#C0E3C0'  # accent_hi
      }
    `);
    expect(entries).toEqual([{ name: 'Command', kind: 'hex', raw: '#C0E3C0', hex: '#C0E3C0', tokenHint: 'accent_hi' }]);
  });

  it('parses the Selection VT truecolor pair (fg then bg, no alpha)', () => {
    const { entries } = parsePwshColors(`
      Set-PSReadLineOption -Colors @{
        Selection = "\`e[38;2;7;8;10m\`e[48;2;166;201;166m"
      }
    `);
    expect(entries).toEqual([{ name: 'Selection', kind: 'ansi-pair', raw: '`e[38;2;7;8;10m`e[48;2;166;201;166m', fg: '#07080A', bg: '#A6C9A6' }]);
  });

  it('skips full-line comments inside the block', () => {
    const { entries } = parsePwshColors(`
      Set-PSReadLineOption -Colors @{
        # this is a rationale comment, not a key
        Error = '#F42E53'
      }
    `);
    expect(entries).toEqual([{ name: 'Error', kind: 'hex', raw: '#F42E53', hex: '#F42E53', tokenHint: undefined }]);
  });

  it('parses the real shipped profile end to end', () => {
    const { entries, doc } = parsePwshColors(profileText);
    const byName = Object.fromEntries(entries.map((e) => [e.name, e]));
    expect(byName.Command).toMatchObject({ kind: 'hex', hex: '#C0E3C0' });
    expect(byName.Selection).toMatchObject({ kind: 'ansi-pair', fg: '#07080A', bg: '#A6C9A6' });
    expect(entries.length).toBeGreaterThanOrEqual(12);
    expect(doc.get('', 'Command')).toBe('#C0E3C0');
    expect(doc.used().has('/Command')).toBe(true);
  });
});
