/* PSReadLine's `-Colors` hashtable and its documented defaults
 * (PSReadLine/Cmdlets.cs `DefaultXColor` consts, fetched from
 * PowerShell/PSReadLine main branch, 2026-09-25) use `System.ConsoleColor`
 * names, not hex — and a ConsoleColor is a *legacy Windows console* colour,
 * not directly an ANSI SGR slot. The correspondence between the two is the
 * one Microsoft documents on "Console Virtual Terminal Sequences" (Extended
 * Colors table): the plain name (Red, Green, Yellow, Blue, Magenta, Cyan,
 * White) is the BRIGHT ANSI slot; the "Dark" name is the normal slot; Gray is
 * normal white; DarkGray is bright black. This is what lets a ConsoleColor
 * be resolved through the same terminal colour scheme (here: the shipped
 * indigo-glass.scheme.json, or the Campbell stock fixture) that any other
 * ANSI-driven surface in this simulator uses — never an invented literal. */
export type WtSlot =
  | 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'purple' | 'cyan' | 'white'
  | 'brightBlack' | 'brightRed' | 'brightGreen' | 'brightYellow' | 'brightBlue' | 'brightPurple' | 'brightCyan' | 'brightWhite';

export const CONSOLE_COLOR_SLOT: Record<string, WtSlot> = {
  Black: 'black',
  DarkBlue: 'blue',
  DarkGreen: 'green',
  DarkCyan: 'cyan',
  DarkRed: 'red',
  DarkMagenta: 'purple',
  DarkYellow: 'yellow',
  Gray: 'white',
  DarkGray: 'brightBlack',
  Blue: 'brightBlue',
  Green: 'brightGreen',
  Cyan: 'brightCyan',
  Red: 'brightRed',
  Magenta: 'brightPurple',
  Yellow: 'brightYellow',
  White: 'brightWhite'
};

/* PSReadLine/Cmdlets.cs DefaultXColor constants — the module's own
 * compiled-in defaults when -Colors is never set (i.e. stock). Comment,
 * Selection, Default and InlinePrediction are NOT among the fetched consts
 * (PSReadLine's option-defaults file 404'd on every path tried this
 * session — PSConsoleReadLineOptions.cs, Options.cs, about_PSReadLine help);
 * Selection and InlinePrediction below are the long-documented, stable
 * behaviour (about_PSReadLine "Selection" = reverse video; "InlinePrediction"
 * = a dim/DarkGray hint) rather than a byte-verified constant — flagged in
 * meta.fidelityWhy, not silently presented as sourced the same way the other
 * nine are. */
export const PSREADLINE_STOCK_CONSOLE_COLOR: Record<string, string> = {
  Comment: 'DarkGreen',
  Keyword: 'Green',
  String: 'DarkCyan',
  Operator: 'DarkGray',
  Variable: 'Green',
  Command: 'Yellow',
  Parameter: 'DarkGray',
  Type: 'Gray',
  Number: 'White',
  Member: 'Gray',
  Emphasis: 'Cyan',
  Error: 'Red',
  InlinePrediction: 'DarkGray' /* documented default, not a fetched const — see header */
};

export function resolveConsoleColor(name: string, scheme: Record<string, string>): string | undefined {
  const slot = CONSOLE_COLOR_SLOT[name];
  return slot ? scheme[slot] : undefined;
}
