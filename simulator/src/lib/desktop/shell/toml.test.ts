import { describe, it, expect } from 'vitest';
import { parseStarshipToml } from './toml';

describe('parseStarshipToml', () => {
  it('reads a quoted root key and a single-quoted string', () => {
    const doc = parseStarshipToml(`"$schema" = 'https://example.com/schema.json'\n`);
    expect(doc.get('', '$schema')).toBe('https://example.com/schema.json');
  });

  it('keeps dotted table headers as one group name', () => {
    const doc = parseStarshipToml('[palettes.sage_ink]\naccent = \'#A6C9A6\'\n');
    expect(doc.get('palettes.sage_ink', 'accent')).toBe('#A6C9A6');
  });

  it('reads booleans and integers', () => {
    const doc = parseStarshipToml('[directory]\ndisabled = false\ntruncation_length = 3\n');
    expect(doc.get('directory', 'disabled')).toBe('false');
    expect(doc.get('directory', 'truncation_length')).toBe('3');
  });

  it('unescapes a double-quoted string', () => {
    const doc = parseStarshipToml('[git_branch]\nformat = "[ $symbol $branch ]($style)"\n');
    expect(doc.get('git_branch', 'format')).toBe('[ $symbol $branch ]($style)');
  });

  it('skips full-line comments', () => {
    const doc = parseStarshipToml('# a comment\n[os]\ndisabled = false\n');
    expect(doc.get('os', 'disabled')).toBe('false');
  });

  it('joins a multi-line triple-quoted string, trimming the opening newline and line-ending backslashes', () => {
    const toml = 'format = """\n[](#A6C9A6)\\\n$os\\\n$line_break$character"""\n';
    const doc = parseStarshipToml(toml);
    expect(doc.get('', 'format')).toBe('[](#A6C9A6)$os$line_break$character');
  });

  it('parses the real config/starship.toml format string and palette table without throwing', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const text = fs.readFileSync(path.resolve(__dirname, '../../../../../config/starship.toml'), 'utf8');
    const doc = parseStarshipToml(text);
    expect(doc.get('', 'format')).toContain('$os');
    expect(doc.get('', 'format')).not.toContain('\\');
    expect(doc.get('palettes.sage_ink', 'accent')).toBe('#A6C9A6');
    expect(doc.get('directory.substitutions', 'Documents')).toContain('');
    expect(doc.get('character', 'success_symbol')).toBe('[❯](bold #C0E3C0)');
  });

  it('tracks used keys the same shape ini.ts does', () => {
    const doc = parseStarshipToml('[os]\ndisabled = false\n');
    doc.get('os', 'disabled');
    expect(doc.used().has('os/disabled')).toBe(true);
    expect(doc.keys()).toContain('os/disabled');
  });
});
