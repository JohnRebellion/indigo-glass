import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, stock } from './model';
import { PALETTE } from '../tokens';

export const meta: SurfaceMeta = {
  id: 'shell',
  name: 'Shell prompt + fastfetch',
  group: 'linux',
  order: 6,
  shipped: [
    { path: 'config/starship.toml' },
    { path: 'config/fastfetch/config.jsonc' },
    { path: 'config/fastfetch/sage-ink-mark.txt' },
    { path: 'config/fastfetch/sage-ink-mark-small.txt' },
    { path: 'shell/zshrc-snippet.zsh' },
    { path: 'shell/bashrc-snippet.bash' },
    { path: 'shell/profile-snippet.sh' }
  ],
  stockSource:
    "Vanilla zsh with PROMPT unset (zsh's own default, `%m%# `, per the Zsh Manual's Prompt Expansion chapter) and fastfetch run with no ~/.config/fastfetch/config.jsonc — fastfetch ships no default config file to diff against (its zero-config behaviour, like Konsole's fallback profile, is compiled in: auto-detected distro logo, a fixed built-in module list, terminal-default text colour). Reconstructed from fastfetch's documented default output, not a fetched file — lower-fidelity than Konsole/starship, which have one.",
  fidelity: 'medium',
  fidelityWhy:
    'The prompt is driven by a from-scratch TOML-subset parser (toml.ts) reading the real config/starship.toml: every segment style and the format string\'s powerline connector colours are parsed, not hand-copied. fastfetch\'s config.jsonc is read the same way via a JSONC flattener (jsonc.ts). The stock fastfetch banner is an approximation (no shippable stock file exists — see stockSource); the stock zsh prompt is the one documented default string, not a file.',
  live: 'Open a terminal: the prompt shows the Sage Ink segments and `fastfetch` prints the sage-ink-mark logo in accent_hi/accent_alt. Checkable on this host (starship + fastfetch installed check: `command -v starship fastfetch`).'
};

/* PALETTE carries alias duplicates (indigo/lime -> accent, indigo_hi/lime_hi
 * -> accent_hi, violet/lime_alt -> accent_alt), all with the identical hex.
 * A naive hex->name reverse map would key on whichever alias Object.entries
 * happens to visit last (verified: that is "lime"/"lime_hi"/"lime_alt", not
 * the canonical name) — so build the reverse map from the canonical names
 * only, in the order the brief lists them, and let aliases lose ties. */
const CANONICAL_TOKENS = [
  'base', 'surface', 'surface_alt', 'sidebar', 'accent', 'accent_hi', 'accent_alt',
  'amber', 'positive', 'negative', 'text', 'text_muted', 'text_dim',
  'border', 'border_strong', 'select_fill', 'card_fill', 'overlay'
];
const hexToToken = new Map(CANONICAL_TOKENS.filter((k) => k in PALETTE).map((k) => [PALETTE[k], k]));

function roleFor(role: string, hex: string | undefined, stockHex?: string): Role | null {
  if (!hex) return null;
  const token = hexToToken.get(hex.toUpperCase()) ?? null;
  return { role, ours: hex, stock: stockHex, token, note: token ? undefined : 'no exact PALETTE match' };
}

export const roles: Role[] = [
  ...Object.entries(ours.palette)
    .map(([name, hex]) => roleFor(`palettes.sage_ink.${name}`, hex))
    .filter((r): r is Role => r !== null),
  ...(ours.prompt
    .flatMap((t) => {
      if (t.kind === 'break') return [];
      const rows: (Role | null)[] = [];
      if (t.style.fg) rows.push(roleFor(`prompt.${t.kind === 'connector' ? 'connector' : t.name}.fg`, t.style.fg));
      if (t.style.bg) rows.push(roleFor(`prompt.${t.kind === 'connector' ? 'connector' : t.name}.bg`, t.style.bg));
      return rows;
    })
    .filter((r): r is Role => r !== null)),
  ...[
    ['fastfetch.logo.color.1', ours.logoColor1],
    ['fastfetch.logo.color.2', ours.logoColor2],
    ['fastfetch.display.color.keys', ours.fastfetch?.get('', 'display.color.keys')],
    ['fastfetch.display.color.title', ours.fastfetch?.get('', 'display.color.title')],
    ['fastfetch.display.color.output', ours.fastfetch?.get('', 'display.color.output')],
    ['fastfetch.title.user', ours.fastfetchTitle.userColor],
    ['fastfetch.title.at', ours.fastfetchTitle.atColor],
    ['fastfetch.title.host', ours.fastfetchTitle.hostColor]
  ]
    .map(([role, hex]) => roleFor(role as string, hex as string | undefined))
    .filter((r): r is Role => r !== null)
];

/* Contrast the prompt/banner actually paint: every segment's fg on its own
 * bg (the powerline "pill" text), plus fastfetch's key/title/output on the
 * terminal background. */
const bg = ours.konsole.background;
const named = (name: string, fg: string | undefined, min = 4.5): ContrastPair[] => (fg ? [{ name, fg, bg, min }] : []);
export const contrast: ContrastPair[] = [
  ...ours.prompt
    .filter((t): t is Extract<(typeof ours.prompt)[number], { kind: 'segment' }> => t.kind === 'segment' && !!t.style.fg && !!t.style.bg)
    .map((t) => ({ name: `prompt.${t.name} text`, fg: t.style.fg!, bg: t.style.bg!, min: 4.5 })),
  ...named('fastfetch key text', ours.fastfetch?.get('', 'display.color.keys')),
  ...named('fastfetch output text', ours.fastfetch?.get('', 'display.color.output')),
  ...named('fastfetch title user', ours.fastfetchTitle.userColor),
  ...named('fastfetch title host', ours.fastfetchTitle.hostColor),
  ...named('fastfetch title @ (muted)', ours.fastfetchTitle.atColor)
];
