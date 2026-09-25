/* Every folder under src/lib/components/layers/ with an index.ts is a layer.
 * index.ts exports `layer` (LayerDef); Specimen.svelte draws any component
 * the layer lists. Discovery is by glob, as on /desktop/, so adding a layer
 * never edits a shared list. */
import type { Component } from 'svelte';
import type { LayerDef, LayerFamily } from './layer';
import type { ComponentId } from './catalogue';

const mods = import.meta.glob<{ layer: LayerDef }>('./layers/*/index.ts', { eager: true });
const specs = import.meta.glob<{ default: Component<{ component: ComponentId; lane: 'stock' | 'ours' }> }>(
  './layers/*/Specimen.svelte',
  { eager: true }
);

const FAMILY_ORDER: LayerFamily[] = ['qt', 'plasma', 'gtk', 'editor', 'site'];

export type LayerEntry = { layer: LayerDef; Specimen?: Component<{ component: ComponentId; lane: 'stock' | 'ours' }> };

export const LAYERS: LayerEntry[] = Object.entries(mods)
  .map(([p, m]) => ({ layer: m.layer, Specimen: specs[p.replace('index.ts', 'Specimen.svelte')]?.default }))
  .sort((a, b) =>
    FAMILY_ORDER.indexOf(a.layer.family) - FAMILY_ORDER.indexOf(b.layer.family) ||
    a.layer.order - b.layer.order ||
    a.layer.id.localeCompare(b.layer.id));

export const layersFor = (component: ComponentId) => LAYERS.filter((l) => l.layer.components[component]);
export const layersWithout = (component: ComponentId) =>
  LAYERS.filter((l) => !l.layer.components[component]).map((l) => ({ layer: l.layer, why: l.layer.absent[component] ?? '' }));
