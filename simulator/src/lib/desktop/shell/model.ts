/* Shell integration: Starship prompt + fastfetch banner, rendered inside a
 * terminal that uses the SAME palette the Konsole surface renders (a prompt
 * or a `fastfetch` run does not repaint the terminal — it prints into
 * whatever palette the terminal already has), so this model reuses
 * ../konsole/model's `ours`/`stock` rather than re-deriving a palette.
 *
 * Stock: vanilla zsh with no theme (`PROMPT` unset — zsh's own default is
 * `%m%#␠`, Zsh Manual "Prompt Expansion") and fastfetch run with no
 * ~/.config/fastfetch/config.jsonc at all. fastfetch ships no default
 * config FILE to diff against — like Konsole's fallback profile, its
 * zero-config behaviour is compiled in (auto-detected distro logo, a fixed
 * built-in module list, no custom `color` keys — plain terminal-default
 * text). There is nothing to fetch upstream for this one (no
 * `default.jsonc` in fastfetch-cli/fastfetch; `--gen-config` only exists to
 * generate a file to edit, it is not shipped). The stock module list and
 * logo below are reconstructed from fastfetch's documented default output
 * (README "Showcase" screenshots + wiki), at lower fidelity than the
 * Konsole/starship reconstructions, which have a citable source file.
 */
import starshipText from '../../../../../config/starship.toml?raw';
import fastfetchText from '../../../../../config/fastfetch/config.jsonc?raw';
import markText from '../../../../../config/fastfetch/sage-ink-mark.txt?raw';
import markSmallText from '../../../../../config/fastfetch/sage-ink-mark-small.txt?raw';
import zshrcText from '../../../../../shell/zshrc-snippet.zsh?raw';
import bashrcText from '../../../../../shell/bashrc-snippet.bash?raw';
import profileText from '../../../../../shell/profile-snippet.sh?raw';
import { parseStarshipToml } from './toml';
import { parseJsoncDoc } from './jsonc';
import { parseStarshipStyle, parseBracketed, type ParsedStyle } from './style';
import { ours as ksOurs, stock as ksStock, laneVars as ksLaneVars, type KonsoleModel } from '../konsole/model';
import { cssVars } from '../surface';
import type { IniDoc } from '../ini';
import type { KeyVars } from '../coverage';

export type PromptToken =
  | { kind: 'connector'; text: string; style: ParsedStyle }
  | { kind: 'segment'; name: string; text: string; style: ParsedStyle }
  | { kind: 'break' };

export type ShellModel = {
  konsole: KonsoleModel;
  starship: IniDoc | null;
  fastfetch: IniDoc | null;
  palette: Record<string, string>;
  prompt: PromptToken[];
  fastfetchLines: { key: string; value: string; keyColor?: string }[];
  fastfetchTitle: { user: string; at: string; host: string; userColor?: string; atColor?: string; hostColor?: string };
  logoMark: string;
  logoColor1?: string;
  logoColor2?: string;
  zshrc: string;
  bashrc: string;
  profileSnippet: string;
  usesStarship: boolean;
};

/* Turns the parsed `format` string into an ordered token list: bracket
 * connector groups (`[](bg:.. fg:..)`), `$module` references (resolved
 * against that module's own `style`/`format`/symbol keys), and the
 * line-break token — the same three constructs the real string is built
 * from (checked against config/starship.toml; see toml.test.ts). */
function tokenizeFormat(format: string, doc: IniDoc, ansi: (s: string) => string): PromptToken[] {
  const out: PromptToken[] = [];
  const re = /\[[^\]]*\]\([^)]*\)|\$\w+/g;
  let m: RegExpExecArray | null;
  const style = (s: string) => parseStarshipStyle(s, ansi as never);
  while ((m = re.exec(format))) {
    const tok = m[0];
    if (tok.startsWith('$')) {
      const name = tok.slice(1);
      out.push(...moduleToken(name, doc, style));
    } else {
      const b = parseBracketed(tok)!;
      out.push({ kind: 'connector', text: b.text, style: style(b.style) });
    }
  }
  return out;
}

const LANG_SAMPLE: Record<string, string> = { nodejs: 'v20.11.1', rust: '1.82.0', golang: '1.23.4', python: '3.12.7', java: '21.0.2' };

function moduleToken(name: string, doc: IniDoc, style: (s: string) => ParsedStyle): PromptToken[] {
  if (name === 'line_break') return [{ kind: 'break' }];
  if (name === 'character') {
    const symbol = doc.get('character', 'success_symbol') ?? '';
    const b = parseBracketed(symbol);
    return b ? [{ kind: 'segment', name, text: b.text, style: style(b.style) }] : [];
  }
  if (name === 'os') {
    const s = doc.get('os', 'style') ?? '';
    const glyph = doc.get('os.symbols', 'Linux') ?? '';
    return [{ kind: 'segment', name, text: `${glyph} `.trim(), style: style(s) }];
  }
  if (name === 'username') {
    const s = doc.get('username', 'style_user') ?? '';
    return [{ kind: 'segment', name, text: 'johnn', style: style(s) }];
  }
  if (name === 'directory') {
    const s = doc.get('directory', 'style') ?? '';
    return [{ kind: 'segment', name, text: '…/indigo-glass', style: style(s) }];
  }
  if (name === 'git_branch') {
    const s = doc.get('git_branch', 'style') ?? '';
    const sym = doc.get('git_branch', 'symbol') ?? '';
    return [{ kind: 'segment', name, text: `${sym} main`.trim(), style: style(s) }];
  }
  if (name === 'git_status') {
    const s = doc.get('git_status', 'style') ?? '';
    return [{ kind: 'segment', name, text: '[+2 ~1]', style: style(s) }];
  }
  if (name in LANG_SAMPLE) {
    const s = doc.get(name, 'style') ?? '';
    const sym = doc.get(name, 'symbol') ?? '';
    return [{ kind: 'segment', name, text: `${sym} ${LANG_SAMPLE[name]}`.trim(), style: style(s) }];
  }
  if (name === 'time') {
    const s = doc.get('time', 'style') ?? '';
    return [{ kind: 'segment', name, text: '♥ 21:07', style: style(s) }];
  }
  return [];
}

function ansiFor(ks: KonsoleModel) {
  return (slot: string) => `var(--ks-ansi-${slot})`;
}

function buildOurs(): ShellModel {
  const starship = parseStarshipToml(starshipText);
  const fastfetch = parseJsoncDoc(fastfetchText);
  const ansi = ansiFor(ksOurs);
  const format = starship.get('', 'format') ?? '';
  const palette: Record<string, string> = {};
  for (const k of ['accent', 'accent_hi', 'accent_alt', 'amber', 'text', 'muted', 'bg_0', 'bg_1', 'bg_2'])
    palette[k] = starship.get('palettes.sage_ink', k) ?? '';

  return {
    konsole: ksOurs,
    starship,
    fastfetch,
    palette,
    prompt: tokenizeFormat(format, starship, ansi),
    fastfetchLines: [
      { key: '  os', value: 'Fedora Linux 44 (KDE Plasma)' },
      { key: '  kr', value: '6.x-cachyos' },
      { key: '  up', value: '2 days, 4 hours' },
      { key: ' 󰏖 pk', value: '2143 (rpm), 31 (flatpak)' },
      { key: '  sh', value: 'zsh 5.9' },
      { key: '  de', value: 'Plasma 6.6' },
      { key: '  tm', value: 'konsole 25.08' }
    ].map((l) => ({ ...l, keyColor: fastfetch.get('', 'display.color.keys') })),
    fastfetchTitle: {
      user: 'johnn', at: '@', host: 'sage-ink',
      userColor: fastfetch.get('', 'modules.0.color.user'),
      atColor: fastfetch.get('', 'modules.0.color.at'),
      hostColor: fastfetch.get('', 'modules.0.color.host')
    },
    logoMark: markText,
    logoColor1: fastfetch.get('', 'logo.color.1'),
    logoColor2: fastfetch.get('', 'logo.color.2'),
    zshrc: zshrcText,
    bashrc: bashrcText,
    profileSnippet: profileText,
    usesStarship: true
  };
}

/* No starship, no ~/.config/fastfetch: zsh's own default PROMPT and
 * fastfetch's compiled-in default output (see file header). Everything
 * renders in the terminal's own default foreground/background — there is no
 * per-segment palette to parse because none is shipped. */
function buildStock(): ShellModel {
  const ansi = ansiFor(ksStock);
  return {
    konsole: ksStock,
    starship: null,
    fastfetch: null,
    palette: {},
    prompt: [{ kind: 'segment', name: 'zsh-default', text: 'sage-ink %', style: parseStarshipStyle('', ansi as never) }],
    fastfetchLines: [
      { key: 'OS', value: 'Fedora Linux 44 (KDE Plasma)' },
      { key: 'Kernel', value: '6.x-cachyos' },
      { key: 'Uptime', value: '2 days, 4 hours' },
      { key: 'Packages', value: '2143 (rpm), 31 (flatpak)' },
      { key: 'Shell', value: 'zsh 5.9' },
      { key: 'DE', value: 'Plasma 6.6' },
      { key: 'Terminal', value: 'konsole 25.08' }
    ],
    fastfetchTitle: { user: 'johnn', at: '@', host: 'sage-ink' },
    logoMark: markSmallText.replace(/\$1|\$2/g, ''),
    zshrc: '', bashrc: '', profileSnippet: '',
    usesStarship: false
  };
}

export const ours = buildOurs();
export const stock = buildStock();

export function laneVars(m: ShellModel): string {
  const base = m.usesStarship ? ksLaneVars(ksOurs) : ksLaneVars(ksStock);
  return m.usesStarship ? `${base};${cssVars({ 'sh-logo-1': m.logoColor1, 'sh-logo-2': m.logoColor2 })}` : base;
}

/* Coverage map: every colour-bearing key in the shipped files must resolve
 * to a CSS var a specimen references. Non-colour keys ($schema, format
 * templates, module `type`/`key`/padding/width, symbols, the fastfetch
 * "logo.source"/"type") are read via doc.get() in the Page instead (shown
 * literally), which iniCoverage counts as covered without a KEY_VARS entry —
 * see coverage.ts. */
export const KEY_VARS: KeyVars = {};
