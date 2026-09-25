/* VS Code colour themes as the workbench resolves them.
 *
 * A theme file sets some keys of the colour registry; every key it leaves
 * unset falls back to that key's registered default for the theme type
 * (here `dark`), and a default is often another key or a transparent() of
 * one. VS Code then exposes every resolved key as a CSS custom property,
 * `--vscode-<key with . as ->` (colorRegistry asCssVariableName), which is
 * what its widgets' CSS and inline styles read. This module does the same
 * for the keys the /components/ specimens paint, so a slot shows what VS Code
 * would actually paint, defaults included.
 *
 * Sources for the defaults, all at microsoft/vscode
 * 2ec783d855253a817b5787fb48bc6c3d8d31c0c5 (the stock fixture's commit):
 *   B = src/vs/platform/theme/common/colors/baseColors.ts
 *   I = src/vs/platform/theme/common/colors/inputColors.ts
 *   L = src/vs/platform/theme/common/colors/listColors.ts
 *   M = src/vs/platform/theme/common/colors/menuColors.ts
 *   E = src/vs/platform/theme/common/colors/editorColors.ts
 *   X = src/vs/platform/theme/common/colors/miscColors.ts
 *   W = src/vs/workbench/common/theme.ts
 */

/* JSONC as VS Code's theme loader reads it: `//` and block comments outside
   strings, trailing commas. (The shipped file is plain JSON; the stock files
   carry comments, one after an array element.) */
export function parseJsonc(src: string): any {
  let out = '';
  for (let i = 0; i < src.length; ) {
    const c = src[i];
    if (c === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
    } else if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
    } else {
      out += c;
      i++;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

export type Colors = Record<string, string>;

/* Follow `include` (relative file names) and merge `colors`; the including
   file wins, as in VS Code's ColorThemeData.loadColorTheme. */
export function loadTheme(files: Record<string, string>, entry: string): Colors {
  const theme = parseJsonc(files[entry]);
  const inc = typeof theme.include === 'string' ? theme.include.replace(/^\.\//, '') : null;
  const base = inc ? loadTheme(files, inc) : {};
  const own = Object.fromEntries(Object.entries((theme.colors ?? {}) as Colors).map(([k, v]) => [k, v.toUpperCase()]));
  return { ...base, ...own };
}

/* Color.transparent(factor): alpha multiplied, formatted as #RRGGBBAA
   (Color.Format.CSS.formatHexA rounds alpha * 255). */
export function transparent(hex: string | null, factor: number): string | null {
  if (!hex) return null;
  const h = hex.replace('#', '');
  const a = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1;
  const aa = Math.round(a * factor * 255).toString(16).padStart(2, '0');
  return `#${h.slice(0, 6)}${aa}`.toUpperCase();
}

type Get = (key: string) => string | null;
type Default = string | null | ((get: Get) => string | null);

/* Dark-theme registry defaults for the keys the specimens read. `null` is a
   registered null: VS Code emits no variable, and the widget's CSS fallback
   (`var(--vscode-button-border, transparent)`...) applies. */
export const DARK_DEFAULTS: Record<string, Default> = {
  foreground: '#CCCCCC', // B:13
  focusBorder: '#007FD4', // B:37
  contrastBorder: null, // B:41
  contrastActiveBorder: null, // B:45 (null on dark; hc only)
  'icon.foreground': '#C5C5C5', // B:33

  'editor.background': '#1E1E1E', // E:19
  'editor.foreground': '#BBBBBB', // E:23
  'editorWidget.background': '#252526', // E:49
  'editorWidget.foreground': (g) => g('foreground'), // E:53
  'editorWidget.border': (g) => transparent(g('editorWidget.foreground'), 0.2), // E:57 — derived, translucent
  'editorHoverWidget.background': (g) => g('editorWidget.background'), // E:187
  'editorHoverWidget.foreground': (g) => g('editorWidget.foreground'), // E:191
  'editorHoverWidget.border': (g) => g('editorWidget.border'), // E:195

  'dropdown.background': '#3C3C3C', // I:94 (selectBackground)
  'dropdown.foreground': '#F0F0F0', // I:102
  'dropdown.border': (g) => g('dropdown.background'), // I:106
  'button.foreground': '#FFFFFF', // I:113
  'button.background': '#0E639C', // I:121
  'button.border': (g) => g('contrastBorder'), // I:129 — null on dark
  'button.secondaryForeground': (g) => g('foreground'), // I:133
  'button.secondaryBackground': (g) => g('list.hoverBackground'), // I:137
  'button.secondaryBorder': (g) => transparent(g('foreground'), 0.15), // I:141 — derived, translucent
  'checkbox.background': (g) => g('dropdown.background'), // I:181
  'checkbox.foreground': (g) => g('dropdown.foreground'), // I:189
  'checkbox.border': (g) => g('dropdown.border'), // I:193
  'input.background': '#3C3C3C', // I:20
  'input.foreground': (g) => g('foreground'), // I:24
  'input.border': null, // I:28
  'inputOption.activeBorder': '#007ACC', // I:32
  'input.placeholderForeground': (g) => transparent(g('foreground'), 0.5), // I:48 — derived, translucent

  'list.focusOutline': (g) => g('focusBorder'), // L:25
  'list.focusAndSelectionOutline': null, // L:29
  'list.activeSelectionBackground': '#04395E', // L:33
  'list.activeSelectionForeground': '#FFFFFF', // L:37
  'list.hoverBackground': '#2A2D2E', // L:65

  'menu.border': null, // M:17
  'menu.foreground': (g) => g('dropdown.foreground'), // M:21
  'menu.background': (g) => g('dropdown.background'), // M:25
  'menu.selectionForeground': (g) => g('list.activeSelectionForeground'), // M:29
  'menu.selectionBackground': (g) => g('list.activeSelectionBackground'), // M:33
  'menu.selectionBorder': null, // M:37

  'scrollbarSlider.background': '#79797966', // X:56 — #797979.transparent(0.4); drift-allow: upstream VS Code default, stock lane only

  'tab.activeBackground': (g) => g('editor.background'), // W:32
  'tab.inactiveBackground': '#2D2D2D', // W:36
  'tab.activeForeground': '#FFFFFF', // W:49
  'tab.inactiveForeground': (g) => transparent(g('tab.activeForeground'), 0.5), // W:56 — derived, translucent
  'tab.border': '#252526', // W:103
  'tab.activeBorder': null, // W:117
  'tab.activeBorderTop': null, // W:126
  'editorGroupHeader.tabsBackground': '#252526', // W:219
  'sideBar.background': '#252526', // W:623
  'sideBar.foreground': null // W:630 — inherits `foreground` through CSS
};

/* Theme value, else registry default, recursively. */
export function resolve(theme: Colors): Colors {
  const memo = new Map<string, string | null>();
  const get: Get = (key) => {
    if (memo.has(key)) return memo.get(key)!;
    let v: string | null = theme[key] ?? null;
    if (v === null && key in DARK_DEFAULTS) {
      const d = DARK_DEFAULTS[key];
      v = typeof d === 'function' ? d(get) : d;
    }
    memo.set(key, v);
    return v;
  };
  const out: Colors = {};
  for (const k of new Set([...Object.keys(theme), ...Object.keys(DARK_DEFAULTS)])) {
    const v = get(k);
    if (v) out[k] = v;
  }
  return out;
}

/* Every resolved key as VS Code's own custom property, for the lane root. */
export const cssVarName = (key: string) => `--vscode-${key.replace(/\./g, '-')}`;
export function laneStyle(c: Colors): string {
  const vars = Object.entries(c).map(([k, v]) => `${cssVarName(k)}:${v}`);
  /* The workbench's stroke width (menu.ts reads var(--vscode-strokeThickness));
     the lane root stands in for the editor area behind every specimen. */
  vars.push('--vscode-strokeThickness:1px');
  vars.push(`--desk-bg:${c['editor.background']}`);
  vars.push('--desk-font:-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", "Ubuntu", "Droid Sans", sans-serif');
  return vars.join(';');
}
