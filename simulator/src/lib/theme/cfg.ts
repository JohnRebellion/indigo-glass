// grub.cfg parser — extracts menuentry list (title + classes) for sim.
// Ignores actions/scripts; only metadata needed.

export interface MenuEntry {
  title: string;
  classes: string[];
  id?: string;
}

export interface GrubCfg {
  entries: MenuEntry[];
  defaultIndex: number;
  timeout: number;
  theme?: string;
  gfxmode?: string;
}

export function parseGrubCfg(src: string): GrubCfg {
  const entries: MenuEntry[] = [];
  let defaultIndex = 0;
  let timeout = 5;
  let theme: string | undefined;
  let gfxmode: string | undefined;

  // Strip BLS-included junk: only parse top-level menuentry lines
  // menuentry 'Title' --class foo --class bar --id 'x' { ... }
  const reEntry =
    /menuentry\s+(['"])((?:\\\1|(?!\1).)*)\1((?:\s+--class\s+\S+|\s+--id\s+(['"])(?:\\\4|(?!\4).)*\4|\s+--[a-z_-]+\s+\S+|\s+--[a-z_-]+)*)/g;

  let m: RegExpExecArray | null;
  while ((m = reEntry.exec(src)) !== null) {
    const title = m[2];
    const rest = m[3] || '';
    const classes: string[] = [];
    const reCls = /--class\s+(\S+)/g;
    let cm: RegExpExecArray | null;
    while ((cm = reCls.exec(rest)) !== null) classes.push(cm[1]);
    const idMatch = rest.match(/--id\s+(['"])((?:\\\1|(?!\1).)*)\1/);
    const id = idMatch?.[2];
    entries.push({ title, classes, id });
  }

  // Globals
  const tm = src.match(/^\s*set\s+timeout\s*=\s*['"]?(-?\d+)['"]?/m);
  if (tm) timeout = parseInt(tm[1], 10);
  const dm = src.match(/^\s*set\s+default\s*=\s*['"]?(\d+|\S+?)['"]?/m);
  if (dm) {
    const v = parseInt(dm[1], 10);
    if (!isNaN(v)) defaultIndex = v;
  }
  const thm = src.match(/^\s*set\s+theme\s*=\s*['"]?(\S+?)['"]?\s*$/m);
  if (thm) theme = thm[1];
  const gm = src.match(/^\s*set\s+gfxmode\s*=\s*['"]?(\S+?)['"]?\s*$/m);
  if (gm) gfxmode = gm[1];

  return { entries, defaultIndex, timeout, theme, gfxmode };
}
