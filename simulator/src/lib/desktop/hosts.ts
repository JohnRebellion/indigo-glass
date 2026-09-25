/* hosts/*.toml — per-machine type sizes. A desktop page renders at the
 * selected host's point sizes, so the 14" Aspire (1.27x) can be judged
 * without booting it. Only the flat [section] key = number/string subset the
 * host files use is parsed; _default fills anything a profile leaves out. */
const files = import.meta.glob('../../../../hosts/*.toml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export type Host = { id: string; name: string; scale: number; v: Record<string, Record<string, number | string>> };

function parseToml(text: string) {
  const out: Record<string, Record<string, number | string>> = {};
  let sect = '';
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const h = line.match(/^\[([^\]]+)\]$/);
    if (h) { sect = h[1]; out[sect] ??= {}; continue; }
    const kv = line.match(/^([\w.-]+)\s*=\s*(.+)$/);
    if (!kv) continue;
    const v = kv[2].trim();
    (out[sect] ??= {})[kv[1]] = /^".*"$/.test(v) ? v.slice(1, -1) : Number.isFinite(Number(v)) ? Number(v) : v;
  }
  return out;
}

const parsed = Object.entries(files).map(([p, t]) => ({ id: p.split('/').pop()!.replace('.toml', ''), v: parseToml(t) }));
const base = parsed.find((h) => h.id === '_default')!.v;

export const HOSTS: Host[] = parsed
  .map(({ id, v }) => {
    const merged: Host['v'] = {};
    for (const s of new Set([...Object.keys(base), ...Object.keys(v)])) merged[s] = { ...base[s], ...v[s] };
    return { id, name: String(merged.meta?.name ?? id), scale: Number(merged.meta?.scale_factor ?? 1), v: merged };
  })
  .sort((a, b) => (a.id === '_default' ? -1 : b.id === '_default' ? 1 : a.id.localeCompare(b.id)));

/* Lane-root custom properties for a host: every specimen sizes its text from
   these instead of hard-coding points. */
export const hostVars = (h: Host) => {
  const f = h.v.fonts ?? {};
  return [
    `--host-body-pt:${f.body_pt}pt`,
    `--host-mono-pt:${f.mono_pt}pt`,
    `--host-menu-pt:${f.menu_pt}pt`,
    `--host-toolbar-pt:${f.toolbar_pt}pt`,
    `--host-small-pt:${f.smallest_pt}pt`,
    `--host-title-pt:${f.window_title_pt}pt`,
    `--host-konsole-pt:${h.v.konsole?.font_size ?? f.mono_pt}pt`,
    `--host-panel-pt:${h.v.kde?.panel_pt ?? f.body_pt}pt`,
    `--host-scale:${h.scale}`
  ].join(';');
};
