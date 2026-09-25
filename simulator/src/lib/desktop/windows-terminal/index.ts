import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { PALETTE } from '../tokens';
import { ours, stock, type WtModel } from './model';
import type { WtSlot } from './consoleColors';

export const meta: SurfaceMeta = {
  id: 'windows-terminal',
  name: 'Windows Terminal + PowerShell',
  group: 'windows',
  order: 1,
  shipped: [
    { path: 'windows/terminal/indigo-glass.scheme.json', generated: true },
    { path: 'windows/powershell/Microsoft.PowerShell_profile.ps1' }
  ],
  stockSource:
    '"Campbell" (Windows Terminal / conhost\'s built-in default scheme — fixtures/stock/windows-terminal/Campbell.jsonc, reconstructed from microsoft/terminal source, see that file\'s header) plus PSReadLine\'s own compiled-in default colours (PSReadLine/Cmdlets.cs DefaultXColor consts, resolved through Campbell — see consoleColors.ts). Selection and InlinePrediction defaults could not be found as a fetched constant this session (every PSReadLine option-defaults source file tried 404\'d); they use the long-documented stable behaviour instead — see consoleColors.ts header.',
  fidelity: 'medium',
  fidelityWhy:
    'indigo-glass.scheme.json is read raw and is codegen-generated (emit_wt_scheme(), verified byte-for-byte against a fresh read of that function — not drifted). Microsoft.PowerShell_profile.ps1\'s -Colors hashtable is parsed by a from-scratch reader (psreadline.ts), including the VT truecolor escape pair for Selection. Two of PSReadLine\'s twelve stock default colours are documented behaviour, not a source-verified constant — see stockSource.',
  live: 'This host has no Windows installation (see project machine topology: two Linux machines + Windows). Live verification — opening Windows Terminal with this scheme installed and running PowerShell with the profile loaded — has to happen on the Windows machine; it cannot be checked from here.'
};

/* Canonical PALETTE names only — PALETTE also carries alias duplicates
 * (indigo/lime -> accent, etc., see shell/index.ts for the same problem and
 * a from-scratch verification of the iteration order); building a reverse
 * map from all of PALETTE would key on whichever alias is inserted last. */
const CANONICAL_TOKENS = [
  'base', 'surface', 'surface_alt', 'sidebar', 'accent', 'accent_hi', 'accent_alt',
  'amber', 'positive', 'negative', 'text', 'text_muted', 'text_dim',
  'border', 'border_strong', 'select_fill', 'card_fill', 'overlay'
];
const hexToToken = new Map(CANONICAL_TOKENS.filter((k) => k in PALETTE).map((k) => [PALETTE[k], k]));
const tokenFor = (hex: string | undefined) => (hex ? hexToToken.get(hex.toUpperCase()) ?? null : null);

/* emit_wt_scheme()'s own mapping (tokens/codegen.py) — the source of truth
 * for which scheme.json field is a token and which is a hardcoded literal.
 * Read directly off that function rather than re-derived by hex match, so a
 * literal that happens to collide with a token hex is still reported as a
 * literal. */
const SCHEME_ROLES: { field: keyof WtModel['ansi'] | 'background' | 'foreground' | 'cursorColor' | 'selectionBackground'; token: string | null; note?: string }[] = [
  { field: 'background', token: 'base' },
  { field: 'foreground', token: 'text' },
  { field: 'cursorColor', token: 'indigo_hi' },
  { field: 'selectionBackground', token: 'indigo' },
  { field: 'black', token: 'sidebar' },
  { field: 'red', token: 'negative' },
  { field: 'green', token: 'positive' },
  { field: 'yellow', token: 'amber' },
  { field: 'blue', token: 'indigo' },
  { field: 'purple', token: 'violet' },
  { field: 'cyan', token: null, note: 'hardcoded literal in emit_wt_scheme(), not a token' },
  { field: 'white', token: 'text' },
  { field: 'brightBlack', token: 'text_muted' },
  { field: 'brightRed', token: null, note: '_BRIGHT_RED — hardcoded, shared with Monkeytype\'s extra-error slot so the two cannot drift apart' },
  { field: 'brightGreen', token: null, note: 'hardcoded literal' },
  { field: 'brightYellow', token: null, note: 'hardcoded literal' },
  { field: 'brightBlue', token: 'indigo_hi' },
  { field: 'brightPurple', token: null, note: 'hardcoded literal' },
  { field: 'brightCyan', token: null, note: 'hardcoded literal' },
  { field: 'brightWhite', token: null, note: 'hardcoded literal (Qt::white equivalent)' }
];

function valueOf(m: WtModel, field: string): string {
  return field in m.ansi ? m.ansi[field as WtSlot] : (m as unknown as Record<string, string>)[field];
}

export const roles: Role[] = [
  ...SCHEME_ROLES.map((r) => ({
    role: `scheme.${r.field}`,
    ours: valueOf(ours, r.field),
    stock: valueOf(stock, r.field),
    token: r.token,
    note: r.note
  })),
  ...ours.ps.flatMap((e): Role[] => {
    if (e.kind === 'hex') {
      /* The file's own trailing `# name` comment is prose some of the time
         ("accent primary", "muted") rather than the literal PALETTE key
         ("accent", "text_muted") — only trust it when it resolves to a real
         token whose hex actually matches; otherwise fall back to deriving
         the token from the hex itself, same as everywhere else in this
         surface, and note what the file's comment actually said. */
      const hint = e.tokenHint && e.tokenHint in PALETTE ? e.tokenHint : null;
      const token = hint ?? tokenFor(e.hex);
      const note = hint
        ? undefined
        : e.tokenHint
          ? `comment says "${e.tokenHint}" — resolved by hex match to ${token ?? 'no exact PALETTE match'} instead`
          : token
            ? 'no inline token comment, derived by hex match'
            : 'no exact PALETTE match';
      return [{ role: `ps.${e.name}`, ours: e.hex, token, note }];
    }
    return [
      { role: `ps.${e.name}.fg`, ours: e.fg, token: tokenFor(e.fg), note: tokenFor(e.fg) ? undefined : 'no exact PALETTE match' },
      { role: `ps.${e.name}.bg`, ours: e.bg, token: tokenFor(e.bg), note: tokenFor(e.bg) ? undefined : 'no exact PALETTE match' }
    ];
  })
];

const bg = ours.background;
export const contrast: ContrastPair[] = [
  { name: 'Default text', fg: ours.foreground, bg, min: 4.5 },
  ...ours.ps.map((e): ContrastPair => ({
    name: `PSReadLine ${e.name}`,
    fg: e.kind === 'hex' ? e.hex : e.fg,
    bg: e.kind === 'hex' ? bg : e.bg,
    min: 4.5
  }))
];
