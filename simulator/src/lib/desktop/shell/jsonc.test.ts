import { describe, it, expect } from 'vitest';
import { parseJsoncDoc } from './jsonc';

describe('parseJsoncDoc', () => {
  it('strips full-line // comments and flattens nested objects', () => {
    const doc = parseJsoncDoc('{\n  // a comment\n  "a": { "b": "#FFFFFF" }\n}\n');
    expect(doc.get('', 'a.b')).toBe('#FFFFFF');
  });

  it('flattens arrays with numeric indices', () => {
    const doc = parseJsoncDoc('{ "modules": [ { "type": "os" }, { "type": "kernel" } ] }');
    expect(doc.get('', 'modules.0.type')).toBe('os');
    expect(doc.get('', 'modules.1.type')).toBe('kernel');
  });

  it('tracks used keys', () => {
    const doc = parseJsoncDoc('{ "x": 1 }');
    doc.get('', 'x');
    expect(doc.used().has('/x')).toBe(true);
    expect(doc.keys()).toContain('/x');
  });

  it('parses the real config/fastfetch/config.jsonc without throwing', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const text = fs.readFileSync(path.resolve(__dirname, '../../../../../config/fastfetch/config.jsonc'), 'utf8');
    const doc = parseJsoncDoc(text);
    expect(doc.get('', 'logo.color.1')).toBe('#C0E3C0');
    expect(doc.get('', 'display.color.output')).toBe('#F8F8F8');
    expect(doc.get('', 'modules.0.color.user')).toBe('#89A889');
  });
});
