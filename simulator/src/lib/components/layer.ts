/* The contract every layer on /components/ fills in.
 *
 * A layer is one theming backend (Qt widgets, GTK3, Plasma SVG, VS Code, a
 * Stylus site...). Its folder under layers/<id>/ holds:
 *   index.ts       — `layer: LayerDef`, built from the shipped file(s) and a
 *                    frozen stock file, imported raw (never transcribed);
 *   Specimen.svelte — props { component, lane }: draws that component in the
 *                    layer's own idiom from the lane's parsed model, marking
 *                    each painted element with data-probe (see probe.ts).
 * Both lanes render the same Specimen markup; only the file behind the lane
 * differs, as on /desktop/ and /sites/.
 *
 * Most layers reuse the parsed models their /desktop/ or /sites/ page
 * already builds (read-only imports), so a component page and a surface page
 * can never disagree about what a file says.
 */
import type { ComponentId } from './catalogue';

export type LaneName = 'stock' | 'ours';

export type LaneDef = {
  /* Shown in the lane legend: which file, which version. */
  label: string;
  /* CSS custom properties on the lane root (cssVars() output). */
  style?: string;
  /* Classes / attributes the lane root carries (a site's <html> classes...). */
  rootClass?: string;
  rootAttrs?: Record<string, string>;
  /* Stylesheet injected once for this lane. It MUST be scoped to
     `[data-layer="<id>"][data-lane="<lane>"]` (or narrower) so it cannot
     reach another layer's specimens on the same page. */
  css?: string;
};

export type LayerFamily = 'qt' | 'gtk' | 'plasma' | 'editor' | 'site';

export type ComponentUse = {
  note?: string;
  /* Slots this layer cannot paint, with the reason (e.g. Plasma has no
     focus-ring SVG element). Listed on the page, not silently dropped. */
  skip?: { slot: string; why: string }[];
  /* A documented contract the layer deliberately departs from, with the
     reason. Shown in amber; e2e accepts it only with a non-empty reason. */
  exceptions?: { slot: string; why: string }[];
  /* A real defect in the shipped file that this page found and that is not
     fixed yet, with the reason and what a fix needs. Shown in red as a known
     gap; e2e accepts it only while the slot still fails (a stale entry for
     a slot that now passes is itself an error). */
  known?: { slot: string; why: string }[];
};

export type LayerDef = {
  id: string;
  name: string;
  family: LayerFamily;
  order: number;
  /* Repo-relative paths of what install.sh / the layer README ships. */
  shipped: string[];
  /* Where the stock lane comes from: fixture path and upstream origin. */
  stockSource: string;
  /* What the specimens can and cannot prove for this layer. */
  fidelity: string;
  lanes: Record<LaneName, LaneDef>;
  /* Layer-specific token values the ours lane may use in place of the
     palette's, keyed by token name. Stylus sites remap the accent ladder
     to each site's own brand hue (browser/stylus/sites/README.md); a site
     slot painting that hue is on-token for that site. */
  tokenHex?: Record<string, string>;
  /* Every component id appears in exactly one of these two maps. */
  components: Partial<Record<ComponentId, ComponentUse>>;
  absent: Partial<Record<ComponentId, string>>;
  /* Optional wrapper element every specimen sits inside (a site's app root). */
  wrap?: { tag: string; attrs?: Record<string, string> };
};

export const layerScope = (id: string, lane: LaneName) => `[data-layer="${id}"][data-lane="${lane}"]`;
