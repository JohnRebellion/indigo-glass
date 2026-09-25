/* The contract every /desktop/<id>/ page fills in.
 *
 * A desktop layer is not CSS (except GTK and the Electron apps), so unlike
 * /sites/ the lanes cannot share one stylesheet and differ only by scope.
 * What they share instead is ONE specimen snippet, called twice with a lane
 * model parsed from a file: the stock file in the left lane, the shipped file
 * in the right. The markup cannot drift between lanes; only the file can.
 *
 * Three honesty mechanisms, all enforced by e2e/desktop.spec.ts:
 *   coverage  — every key/selector in the shipped file is read by the page,
 *               or listed with the reason it cannot be shown;
 *   roles     — the ours lane's core roles (window, text, accent...) equal
 *               the token palette, so every layer is checkably in sync;
 *   contrast  — the text/background pairs the layer actually paints meet
 *               their floor in the ours lane.
 */

export type Fidelity = 'high' | 'medium' | 'low';
export type Group = 'linux' | 'app' | 'windows';

export type ShippedFile = { path: string; generated?: boolean };

export type SurfaceMeta = {
  id: string;
  name: string;
  group: Group;
  /* Position on /desktop/ within its group (the build order in the plan). */
  order: number;
  /* Repo-relative paths of what install.sh (or the layer README) ships. */
  shipped: ShippedFile[];
  /* Where the stock lane's values come from — a fixture path and its origin. */
  stockSource: string;
  fidelity: Fidelity;
  /* Why the fidelity is what it is: what the page proves and what it cannot. */
  fidelityWhy: string;
  /* How to confirm on a real machine, and whether this host can. */
  live: string;
};

/* One role the ours lane paints, and the token it must equal. `stock` is
   informational. `token: null` marks a role that is deliberately not a
   palette colour (a Konsole ANSI slot, say): it is shown, not checked. */
export type Role = { role: string; ours: string; stock?: string; token: string | null; note?: string };

export type ContrastPair = { name: string; fg: string; bg: string; min: number };

export type Coverage = {
  total: number;
  missing: string[];
  ignored?: { token: string; why: string }[];
};

/* What a lane gives the specimens: CSS custom properties for the lane root,
   plus whatever parsed model the snippet needs (an SVG, a glyph grid). */
export type Lane<M = unknown> = { which: 'stock' | 'ours'; label: string; style: string; model: M };

export const cssVars = (vars: Record<string, string | number | undefined>) =>
  Object.entries(vars)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k.startsWith('--') ? k : `--${k}`}:${v}`)
    .join(';');
