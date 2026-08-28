// Accent palette candidates for the Glass & Ink merge.
//
// GENERATED — derived from tokens/codegen.py so hex values cannot drift from
// the OKLCH source of truth. Regenerate rather than hand-editing:
//   python3 tokens/codegen.py   (and the snippet in the palettes route commit)
//
// `oklch` is the triple to paste into [variants.<name>] in
// tokens/indigo-glass.tokens.toml if a candidate wins.

export type Character = 'Vivid' | 'Deep' | 'Muted' | 'Pale';

export interface Palette {
  id: string;
  name: string;
  character: Character;
  temp: 'cool' | 'warm';
  accent: string;
  accentHi: string;
  accentAlt: string;
  accentRgb: string;
  base: string;
  surface: string;
  surfaceAlt: string;
  sidebar: string;
  surfaceRgb: string;
  oklch: [number, number, number];
  contrastBase: number;
  contrastSurface: number;
  note: string;
  collision: string;
}

export const palettes: Palette[] = [
  {
    id: 'lime',
    name: 'Lime',
    character: 'Vivid',
    temp: 'cool',
    accent: '#A8E635',
    accentHi: '#C1FF58',
    accentAlt: '#8BC407',
    accentRgb: '168, 230, 53',
    base: '#07080A',
    surface: '#0D0D10',
    surfaceAlt: '#121216',
    sidebar: '#0A0A0D',
    surfaceRgb: '18, 18, 22',
    oklch: [0.8523, 0.2049, 127.71],
    contrastBase: 13.39,
    contrastSurface: 12.97,
    note: 'Current default. Maximum lightness and maximum chroma at once - the loudest accent this system can hold.',
    collision: 'positive #71F79F is only 25deg away in hue; both are bright greens.'
  },
  {
    id: 'moss',
    name: 'Moss',
    character: 'Muted',
    temp: 'cool',
    accent: '#93B369',
    accentHi: '#ACCC82',
    accentAlt: '#76934F',
    accentRgb: '147, 179, 105',
    base: '#07080A',
    surface: '#0D0D10',
    surfaceAlt: '#121216',
    sidebar: '#0A0A0D',
    surfaceRgb: '18, 18, 22',
    oklch: [0.725, 0.105, 127.71],
    contrastBase: 8.48,
    contrastSurface: 8.22,
    note: 'Identical hue to lime, chroma halved and lightness dropped. Same identity, a third of the volume. The cheapest possible exit.',
    collision: 'Same 25deg gap to positive, but low chroma keeps them apart.'
  },
  {
    id: 'sage',
    name: 'Sage',
    character: 'Pale',
    temp: 'cool',
    accent: '#A6C9A6',
    accentHi: '#C0E3C0',
    accentAlt: '#89A889',
    accentRgb: '166, 201, 166',
    base: '#07080A',
    surface: '#0D0D10',
    surfaceAlt: '#121216',
    sidebar: '#0A0A0D',
    surfaceRgb: '18, 18, 22',
    oklch: [0.8, 0.06, 145.0],
    contrastBase: 11.00,
    contrastSurface: 10.65,
    note: 'Nearly achromatic green. Reads as a tinted neutral rather than an accent; hierarchy has to come from fill and weight.',
    collision: 'Sits 8deg from positive - success green would need to move.'
  },
  {
    id: 'mint',
    name: 'Mint',
    character: 'Muted',
    temp: 'cool',
    accent: '#5DD19E',
    accentHi: '#79ECB7',
    accentAlt: '#40B081',
    accentRgb: '93, 209, 158',
    base: '#07080A',
    surface: '#0D0D10',
    surfaceAlt: '#121216',
    sidebar: '#0A0A0D',
    surfaceRgb: '18, 18, 22',
    oklch: [0.78, 0.13, 162.0],
    contrastBase: 10.57,
    contrastSurface: 10.24,
    note: 'The Supabase register. Cooler and softer than lime, still unmistakably an accent. Reads infra rather than terminal.',
    collision: 'Sits 9deg from positive - success green would need to move.'
  },
  {
    id: 'teal',
    name: 'Teal',
    character: 'Muted',
    temp: 'cool',
    accent: '#5AC0C6',
    accentHi: '#75DAE0',
    accentAlt: '#3EA0A5',
    accentRgb: '90, 192, 198',
    base: '#07080A',
    surface: '#0D0D10',
    surfaceAlt: '#121216',
    sidebar: '#0A0A0D',
    surfaceRgb: '18, 18, 22',
    oklch: [0.75, 0.095, 200.0],
    contrastBase: 9.34,
    contrastSurface: 9.05,
    note: 'Leaves the green family entirely without going warm. Technical, calm, and the only candidate with real separation from every semantic hue.',
    collision: '47deg from positive, 155deg from amber. No collisions.'
  },
  {
    id: 'clay',
    name: 'Clay',
    character: 'Deep',
    temp: 'warm',
    accent: '#DD8963',
    accentHi: '#F8A27C',
    accentAlt: '#B96C49',
    accentRgb: '221, 137, 99',
    base: '#090806',
    surface: '#0F0D0A',
    surfaceAlt: '#15120F',
    sidebar: '#0C0A08',
    surfaceRgb: '21, 18, 15',
    oklch: [0.71, 0.115, 45.0],
    contrastBase: 7.47,
    contrastSurface: 7.24,
    note: 'The hard pivot: warm accent on a warm-neutral base. Anti-SaaS, editorial. Needs the warm base ladder or it fights the cool blacks.',
    collision: '27deg from negative #ED254E - error red gets harder to read as error.'
  },
  {
    id: 'bone',
    name: 'Bone',
    character: 'Pale',
    temp: 'cool',
    accent: '#EBE8DE',
    accentHi: '#FFFCF1',
    accentAlt: '#CAC7BE',
    accentRgb: '235, 232, 222',
    base: '#07080A',
    surface: '#0D0D10',
    surfaceAlt: '#121216',
    sidebar: '#0A0A0D',
    surfaceRgb: '18, 18, 22',
    oklch: [0.93, 0.014, 92.0],
    contrastBase: 16.34,
    contrastSurface: 15.83,
    note: 'Achromatic accent. The Verge\'s white-tile move: the only colour on screen becomes semantic, so warnings and errors carry real weight again.',
    collision: 'No collision - chroma 0.014 reads as neutral.'
  },
  {
    id: 'periwinkle',
    name: 'Periwinkle',
    character: 'Deep',
    temp: 'cool',
    accent: '#8594E8',
    accentHi: '#9DADFF',
    accentAlt: '#6976C3',
    accentRgb: '133, 148, 232',
    base: '#07080A',
    surface: '#0D0D10',
    surfaceAlt: '#121216',
    sidebar: '#0A0A0D',
    surfaceRgb: '18, 18, 22',
    oklch: [0.69, 0.125, 275.21],
    contrastBase: 7.06,
    contrastSurface: 6.84,
    note: 'Indigo Glass\'s own hue, brightened. Familiar but you already called this identity stale.',
    collision: '102deg from negative. No collisions.'
  },
];
