import { describe, expect, it } from 'vitest';
import { CHECKS, DOC_ROLES, DOC_WEIGHTS, README_ROWS, BUNDLE_FILES, BUILD_PLAN, NAMING, GTK_HOST_MISMATCH } from './model';

/* Guards the readers against the real files: an empty parse would hide
   every discrepancy the page exists to show. */
describe('fonts model reads the real sources', () => {
  it('parses the TYPOGRAPHY.md role and weight tables', () => {
    expect(DOC_ROLES.length).toBeGreaterThanOrEqual(8);
    expect(DOC_WEIGHTS.length).toBeGreaterThanOrEqual(4);
    expect(DOC_ROLES.find((r) => r.role === 'Body / app content')?.pt).toBe(11);
  });
  it('checks one row per desktop font key, each with a finite pt', () => {
    expect(CHECKS.map((c) => c.id)).toEqual(['body', 'mono', 'menu', 'toolbar', 'smallest', 'title', 'terminal', 'gtk3', 'gtk4']);
    for (const c of CHECKS) expect(Number.isFinite(c.pt), c.id).toBe(true);
  });
  it('lists the bundle, its README table and the build plan', () => {
    expect(BUNDLE_FILES.length).toBeGreaterThan(0);
    expect(README_ROWS.length).toBe(5);
    expect(BUILD_PLAN.some((p) => p.key === 'g' && p.value === 'double-storey')).toBe(true);
  });
  it('maps every token heading pt to a doc row', () => {
    for (const n of NAMING) expect(n.doc, n.token).not.toBe('—');
  });
  it('GTK sizing assumption holds on every host', () => {
    expect(GTK_HOST_MISMATCH).toEqual([]);
  });
});
