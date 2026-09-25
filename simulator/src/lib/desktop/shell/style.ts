/* Starship style-string parser: "bold fg:#hex bg:#hex", "bold #hex" (a bare
 * colour with no fg:/bg: prefix is the foreground), and starship's named
 * ANSI colours (black/red/green/yellow/blue/purple/cyan/white, each with a
 * bright- prefix) — which this surface resolves through the SAME terminal
 * palette the Konsole surface renders (../konsole/model), because a named
 * colour in a prompt is exactly the ANSI slot a terminal emulator paints,
 * not an independent value. See https://starship.rs/config/#style-strings.
 */
import type { AnsiSlot } from '../konsole/ansi';

const NAMED: Record<string, AnsiSlot> = {
  black: 'black', red: 'red', green: 'green', yellow: 'yellow', blue: 'blue', purple: 'magenta', magenta: 'magenta', cyan: 'cyan', white: 'white',
  'bright-black': 'bright_black', 'bright-red': 'bright_red', 'bright-green': 'bright_green', 'bright-yellow': 'bright_yellow',
  'bright-blue': 'bright_blue', 'bright-purple': 'bright_magenta', 'bright-magenta': 'bright_magenta', 'bright-cyan': 'bright_cyan', 'bright-white': 'bright_white'
};

export type ParsedStyle = { fg?: string; bg?: string; bold: boolean; underline: boolean; italic: boolean; dimmed: boolean; inverted: boolean };

/* `ansi` resolves a named starship colour or a literal #hex to a CSS value
 * (a CSS var() for named colours, so the swatch tracks the terminal palette
 * the same way every other specimen in this surface does — never a literal
 * hex baked into the parser). */
export function parseStarshipStyle(style: string, ansi: (slot: AnsiSlot) => string): ParsedStyle {
  const out: ParsedStyle = { bold: false, underline: false, italic: false, dimmed: false, inverted: false };
  for (const raw of style.trim().split(/\s+/).filter(Boolean)) {
    const tok = raw.toLowerCase();
    if (tok === 'bold') out.bold = true;
    else if (tok === 'underline') out.underline = true;
    else if (tok === 'italic') out.italic = true;
    else if (tok === 'dimmed') out.dimmed = true;
    else if (tok === 'inverted') out.inverted = true;
    else if (tok === 'none') continue;
    else {
      const m = tok.match(/^(bg:|fg:)?(.+)$/)!;
      const slot = m[1] === 'bg:' ? 'bg' : 'fg';
      const value = m[2];
      const resolved = value.startsWith('#') ? value.toUpperCase() : NAMED[value] ? ansi(NAMED[value]) : undefined;
      if (resolved) out[slot] = resolved;
    }
  }
  return out;
}

/* `[text](style)` — the bracket-group starship uses for a literal segment
 * (the powerline connector glyphs in `format`, and character/*_symbol). */
export function parseBracketed(spec: string): { text: string; style: string } | null {
  const m = spec.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
  return m ? { text: m[1], style: m[2] } : null;
}
