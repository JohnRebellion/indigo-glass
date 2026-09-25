/* Windows 11 accent + dark mode: windows/registry/indigo-glass-accent.reg
 * (hand-kept .reg, not touched by codegen.py -- confirmed absent from
 * tokens/codegen.py's shipped-file list).
 *
 * Decode rules (verified against this file's own bytes, not guessed):
 *   AccentColor / ColorizationColor / ColorizationAfterglow / the two
 *   *ColorMenu keys are all DWORDs stored 0xAABBGGRR (alpha, blue, green,
 *   red -- Windows' historical little-endian COLORREF-with-alpha order for
 *   these specific keys). "AccentColor"=dword:ffa6c9a6 decodes to
 *   A=FF B=A6 G=C9 R=A6 -> #A6C9A6, which is sage's own `accent` token
 *   (tokens.ts PALETTE.accent) -- the file's own header comment agrees.
 *
 * Stock: Windows 11 has no shippable "default theme" source file to fetch
 * (unlike Darcula or Campbell, this is not open source), so every stock
 * value here is either a documented Microsoft behaviour or a well-attested
 * community-verified default, cited per field in STOCK_NOTE. Anything
 * Microsoft does not publish a fixed default for (the Colorization*Balance
 * knobs, which DWM computes at runtime from the desktop wallpaper) is left
 * unset rather than invented -- see STOCK_NOTE for each. */
import regText from '../../../../../windows/registry/indigo-glass-accent.reg?raw';
import { contrast, PALETTE } from '../tokens';

export type RegModel = {
  sections: Record<string, Record<string, string>>;
  get(section: string, key: string): string | undefined;
};

const KNOWN_SECTIONS = [
  'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\DWM',
  'HKEY_CURRENT_USER\\Control Panel\\Desktop',
  'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
  'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Accent'
] as const;
export type Section = (typeof KNOWN_SECTIONS)[number];

/* A minimal, honest .reg reader: no external ini/registry-file library is
 * warranted for one small hand-kept file, and vendoring a registry parser
 * would be more code than this. Only handles what indigo-glass-accent.reg
 * actually uses (dword values under [Section] headers); does not attempt
 * REG_BINARY, REG_SZ, or multi-line values, since the shipped file has
 * none. */
export function parseReg(text: string): RegModel {
  const sections: Record<string, Record<string, string>> = {};
  let current: string | null = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';')) continue;
    const sec = trimmed.match(/^\[(.+)\]$/);
    if (sec) {
      current = sec[1];
      sections[current] ??= {};
      continue;
    }
    const kv = trimmed.match(/^"([^"]+)"=dword:([0-9a-fA-F]{8})$/);
    if (kv && current) sections[current][kv[1]] = kv[2];
  }
  return {
    sections,
    get(section, key) {
      return sections[section]?.[key];
    }
  };
}

export type Argb = { a: number; hex: string };

/* 0xAABBGGRR -> {a: 0-255, hex: #RRGGBB}. */
export function decodeAbgr(dwordHex: string | undefined): Argb | undefined {
  if (!dwordHex) return undefined;
  const v = parseInt(dwordHex, 16);
  const a = (v >>> 24) & 0xff;
  const b = (v >>> 16) & 0xff;
  const g = (v >>> 8) & 0xff;
  const r = v & 0xff;
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return { a, hex: `#${toHex(r)}${toHex(g)}${toHex(b)}` };
}

const toInt = (dwordHex: string | undefined): number | undefined => (dwordHex === undefined ? undefined : parseInt(dwordHex, 16));
const toBool = (dwordHex: string | undefined): boolean | undefined => (dwordHex === undefined ? undefined : toInt(dwordHex) !== 0);

export type AccentModel = {
  raw: RegModel;
  accentColor?: Argb;
  accentColorMenuDwm?: Argb;
  colorizationColor?: Argb;
  colorizationAfterglow?: Argb;
  colorizationColorBalance?: number;
  colorizationAfterglowBalance?: number;
  colorizationBlurBalance?: number;
  colorizationGlassReflectionIntensity?: number;
  colorizationGlassAttribute?: number;
  enableWindowColorization?: boolean;
  autoColorization?: boolean;
  appsUseLightTheme?: boolean;
  systemUsesLightTheme?: boolean;
  colorPrevalence?: boolean;
  accentColorMenuExplorer?: Argb;
  startColorMenu?: Argb;
};

const DWM: Section = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\DWM';
const DESKTOP: Section = 'HKEY_CURRENT_USER\\Control Panel\\Desktop';
const PERSONALIZE: Section = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize';
const ACCENT_EXPLORER: Section = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Accent';

export function buildModel(reg: RegModel): AccentModel {
  return {
    raw: reg,
    accentColor: decodeAbgr(reg.get(DWM, 'AccentColor')),
    accentColorMenuDwm: decodeAbgr(reg.get(DWM, 'AccentColorMenu')),
    colorizationColor: decodeAbgr(reg.get(DWM, 'ColorizationColor')),
    colorizationAfterglow: decodeAbgr(reg.get(DWM, 'ColorizationAfterglow')),
    colorizationColorBalance: toInt(reg.get(DWM, 'ColorizationColorBalance')),
    colorizationAfterglowBalance: toInt(reg.get(DWM, 'ColorizationAfterglowBalance')),
    colorizationBlurBalance: toInt(reg.get(DWM, 'ColorizationBlurBalance')),
    colorizationGlassReflectionIntensity: toInt(reg.get(DWM, 'ColorizationGlassReflectionIntensity')),
    colorizationGlassAttribute: toInt(reg.get(DWM, 'ColorizationGlassAttribute')),
    enableWindowColorization: toBool(reg.get(DWM, 'EnableWindowColorization')),
    autoColorization: toBool(reg.get(DESKTOP, 'AutoColorization')),
    appsUseLightTheme: toBool(reg.get(PERSONALIZE, 'AppsUseLightTheme')),
    systemUsesLightTheme: toBool(reg.get(PERSONALIZE, 'SystemUsesLightTheme')),
    colorPrevalence: toBool(reg.get(PERSONALIZE, 'ColorPrevalence')),
    accentColorMenuExplorer: decodeAbgr(reg.get(ACCENT_EXPLORER, 'AccentColorMenu')),
    startColorMenu: decodeAbgr(reg.get(ACCENT_EXPLORER, 'StartColorMenu'))
  };
}

export const oursReg: RegModel = parseReg(regText);
export const ours: AccentModel = buildModel(oursReg);

/* Stock Windows 11, cited per field -- see the header comment for why there
 * is no fetchable source file. Fields Microsoft does not publish a fixed
 * default for are left undefined; the page must show that honestly instead
 * of inventing a number. */
export const STOCK_NOTE: Record<string, string> = {
  accentColor: 'the documented/community-verified fallback accent when Windows has no wallpaper-derived colour to compute from: "Windows blue" #0078D4 (Microsoft Learn\'s WindowColor unattend reference; corroborated by multiple community sources as the pre-Win11 and OOBE-fallback accent).',
  colorPrevalence: 'default 0 (off) -- "Show accent color on Start and taskbar" ships unchecked; community-verified against a fresh Windows 11 profile\'s registry.',
  autoColorization: 'default 1 (on) -- Windows 11 computes the accent from the desktop wallpaper unless a user picks a colour manually; AccentColor above is only reached once that automatic behaviour is turned off.',
  theme: 'default Light on consumer SKUs; Microsoft has stated commercial/Enterprise SKUs ship Dark by default -- both are real defaults, not a single fixed answer.',
  colorizationColor: 'not asserted: DWM recomputes ColorizationColor/Afterglow and their balance knobs at runtime from AccentColor + wallpaper; Microsoft does not publish a static default for the composited value itself.'
};

export const stock: AccentModel = {
  raw: parseReg(''),
  accentColor: { a: 255, hex: '#0078D4' },
  colorPrevalence: false,
  autoColorization: true,
  appsUseLightTheme: true,
  systemUsesLightTheme: true
};

/* Real DWM behaviour, not just a Sage Ink design choice: Windows computes
 * caption-button glyph colour (and the taskbar's own accent-fill text/icon
 * colour) from the accent's luminance, picking black or white -- exactly
 * the same "the light fill needs the dark token, not a fixed white" pattern
 * already fixed in grub/theme.txt and jetbrains/Indigo Glass.icls this
 * session. sage's accent (#A6C9A6) is light, so real Windows would render
 * dark glyphs on it; this picks PALETTE.base (the project's dark token) to
 * stay on-token rather than a bare #000000. */
export function pickOnAccentText(bgHex: string): string {
  const dark = PALETTE.base ?? '#07080A';
  const light = '#FFFFFF';
  return contrast(dark, bgHex) >= contrast(light, bgHex) ? dark : light;
}

export function laneVars(m: AccentModel): string {
  const accent = m.accentColor?.hex ?? '#0078D4';
  const dark = m.appsUseLightTheme === false;
  return [
    `--wa-accent:${accent}`,
    `--wa-window-bg:${dark ? '#202020' : '#F3F3F3'}`,
    `--wa-window-fg:${dark ? '#FFFFFF' : '#1A1A1A'}`,
    `--wa-taskbar-bg:${dark ? '#202020' : '#F9F9F9'}`,
    `--wa-inactive-title:${dark ? '#2B2B2B' : '#F3F3F3'}`,
    `--wa-inactive-fg:${dark ? '#9E9E9E' : '#6B6B6B'}`
  ].join(';');
}
