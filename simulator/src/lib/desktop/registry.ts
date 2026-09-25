/* Every folder under src/lib/desktop/ with an index.ts is a surface. Each
 * index.ts exports `meta` (SurfaceMeta) and `roles` (Role[], computed at
 * import from the parsed shipped file), and the folder holds a Page.svelte.
 * Discovery is by glob so adding a surface never edits a shared list; the
 * spec discovers the same folders from the filesystem. */
import type { Component } from 'svelte';
import type { Group, Role, SurfaceMeta } from './surface';

type Mod = { meta: SurfaceMeta; roles: Role[] };
const mods = import.meta.glob<Mod>('./*/index.ts', { eager: true });
const pages = import.meta.glob<{ default: Component }>('./*/Page.svelte', { eager: true });

const GROUP_ORDER: Group[] = ['linux', 'app', 'windows'];

export type Entry = Mod & { page?: Component };
export const SURFACES: Entry[] = Object.entries(mods)
  .map(([p, m]) => ({ ...m, page: pages[p.replace('index.ts', 'Page.svelte')]?.default }))
  .sort((a, b) =>
    GROUP_ORDER.indexOf(a.meta.group) - GROUP_ORDER.indexOf(b.meta.group) ||
    a.meta.order - b.meta.order ||
    a.meta.id.localeCompare(b.meta.id));

export const SURFACE_IDS = SURFACES.map((s) => s.meta.id);
export const surfaceById = (id: string) => SURFACES.find((s) => s.meta.id === id);
