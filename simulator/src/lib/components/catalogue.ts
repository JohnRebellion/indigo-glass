/* The UI components /components/<id>/ compares across layers, and the slots
 * each one is measured on.
 *
 * A slot is one paint of the component (its fill, its label, its edge, the
 * ring a focused copy draws). Every layer's specimen marks the element that
 * paints it with data-probe, and the page reads the value back off the
 * rendered DOM (probe.ts), in both lanes. So a slot value is what the shipped
 * file actually paints through that layer's renderer, not what a model says.
 *
 * `expect` is the design contract, and only where a document states it:
 *   docs/STATE_GRAMMAR.md  — Tier C: on-select/focus is a solid white or
 *                            near-white outline and no fill wash; Tier D: a scrollbar
 *                            thumb is an opaque accent step;
 *   docs/ELEVATION.md      — level 0 controls and level 2 overlays carry a
 *                            2px `border_strong` edge; a primary button is
 *                            accent-filled with an ink (`base`) label.
 * Slots with no stated contract (most fills) have `expect: null`: the page
 * reports whether the layers agree, and enforces only the rules every slot
 * obeys — the value is opaque and is a palette token (STATE_GRAMMAR
 * principles 1 and 2). Contract changes belong in those documents first.
 */

export type ProbeProp = 'bg' | 'color' | 'border' | 'outline' | 'ring' | 'fill' | 'stroke';

export type Expect =
  | { token: string; source: string }
  | { oneOf: string[]; source: string }
  /* The slot must paint the same colour as another slot of the same lane:
     Tier C's "no fill wash" — a selected row's fill is the view's fill. */
  | { sameAs: string; source: string };

export type Slot = {
  id: string;
  label: string;
  prop: ProbeProp;
  expect: Expect | null;
};

export type Pair = { name: string; fg: string; bg: string; min: number };

export type ComponentDef = {
  id: string;
  name: string;
  lead: string;
  slots: Slot[];
  contrast: Pair[];
};

const TIER_C = 'docs/STATE_GRAMMAR.md Tier C (outline, not fill; white/near-white on dark)';
const TIER_D = 'docs/STATE_GRAMMAR.md Tier D (opaque accent step for a scrollbar thumb)';
const EDGE_0 = 'docs/ELEVATION.md level 0 (2px border_strong edge)';
const EDGE_2 = 'docs/ELEVATION.md level 2 (2px border_strong edge)';
const PRIMARY = 'docs/ELEVATION.md level 1 (accent fill, ink label)';
const LABEL = 'tokens [variants.sage] text: the one label colour on dark surfaces';
const MUTED = 'tokens [variants.sage] text_muted: secondary text (5.1:1+ on every surface)';
const ACCENT = ['accent', 'accent_hi', 'accent_alt'];
/* Tier C: near-white (`text`) or white (`ring`, probe.ts CONTRACT_EXTRAS). */
const RING = ['text', 'ring'];

export const COMPONENTS: ComponentDef[] = [
  {
    id: 'button',
    name: 'Button',
    lead: 'A default (secondary) push button at rest, a focused copy, and the one primary (suggested / default / accent) button of a group.',
    slots: [
      { id: 'fill', label: 'fill', prop: 'bg', expect: null },
      { id: 'label', label: 'label', prop: 'color', expect: { token: 'text', source: LABEL } },
      { id: 'edge', label: 'edge', prop: 'border', expect: { token: 'border_strong', source: EDGE_0 } },
      { id: 'focus', label: 'focus ring', prop: 'ring', expect: { oneOf: RING, source: TIER_C } },
      { id: 'primary-fill', label: 'primary fill', prop: 'bg', expect: { oneOf: ACCENT, source: PRIMARY } },
      { id: 'primary-label', label: 'primary label', prop: 'color', expect: { token: 'base', source: PRIMARY } }
    ],
    contrast: [
      { name: 'label on fill', fg: 'label', bg: 'fill', min: 4.5 },
      { name: 'primary label on primary fill', fg: 'primary-label', bg: 'primary-fill', min: 4.5 },
      { name: 'focus ring on fill', fg: 'focus', bg: 'fill', min: 3 }
    ]
  },
  {
    id: 'menu',
    name: 'Menu',
    lead: 'A popup / context menu: its surface, an item, and the hovered or keyboard-selected item.',
    slots: [
      { id: 'fill', label: 'fill', prop: 'bg', expect: null },
      { id: 'label', label: 'item label', prop: 'color', expect: { token: 'text', source: LABEL } },
      { id: 'edge', label: 'frame edge', prop: 'border', expect: { token: 'border_strong', source: EDGE_2 } },
      { id: 'selected-fill', label: 'selected item fill', prop: 'bg', expect: { sameAs: 'fill', source: TIER_C } },
      { id: 'selected-edge', label: 'selected item outline', prop: 'ring', expect: { oneOf: RING, source: TIER_C } },
      { id: 'selected-label', label: 'selected item label', prop: 'color', expect: { token: 'text', source: LABEL } }
    ],
    contrast: [
      { name: 'item label on fill', fg: 'label', bg: 'fill', min: 4.5 },
      { name: 'selected label on selected fill', fg: 'selected-label', bg: 'selected-fill', min: 4.5 },
      { name: 'selected outline on fill', fg: 'selected-edge', bg: 'fill', min: 3 }
    ]
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    lead: 'A hover tooltip: surface, text and frame.',
    slots: [
      { id: 'fill', label: 'fill', prop: 'bg', expect: null },
      { id: 'label', label: 'text', prop: 'color', expect: { token: 'text', source: LABEL } },
      { id: 'edge', label: 'frame edge', prop: 'border', expect: { token: 'border_strong', source: EDGE_2 } }
    ],
    contrast: [{ name: 'text on fill', fg: 'label', bg: 'fill', min: 4.5 }]
  },
  {
    id: 'text-field',
    name: 'Text field',
    lead: 'A single-line text input: empty with its placeholder, filled, and focused.',
    slots: [
      { id: 'fill', label: 'fill', prop: 'bg', expect: null },
      { id: 'text', label: 'typed text', prop: 'color', expect: { token: 'text', source: LABEL } },
      { id: 'placeholder', label: 'placeholder', prop: 'color', expect: { token: 'text_muted', source: MUTED } },
      { id: 'edge', label: 'edge', prop: 'border', expect: { token: 'border_strong', source: EDGE_0 } },
      { id: 'focus', label: 'focus ring', prop: 'ring', expect: { oneOf: RING, source: TIER_C } }
    ],
    contrast: [
      { name: 'typed text on fill', fg: 'text', bg: 'fill', min: 4.5 },
      { name: 'placeholder on fill', fg: 'placeholder', bg: 'fill', min: 4.5 },
      { name: 'focus ring on fill', fg: 'focus', bg: 'fill', min: 3 }
    ]
  },
  {
    id: 'list-selection',
    name: 'List selection',
    lead: 'A list / tree view with one selected row (item views, sidebars, file lists).',
    slots: [
      { id: 'fill', label: 'view fill', prop: 'bg', expect: null },
      { id: 'label', label: 'row label', prop: 'color', expect: { token: 'text', source: LABEL } },
      { id: 'selected-fill', label: 'selected row fill', prop: 'bg', expect: { sameAs: 'fill', source: TIER_C } },
      { id: 'selected-edge', label: 'selected row outline', prop: 'ring', expect: { oneOf: RING, source: TIER_C } },
      { id: 'selected-label', label: 'selected row label', prop: 'color', expect: { token: 'text', source: LABEL } }
    ],
    contrast: [
      { name: 'row label on view', fg: 'label', bg: 'fill', min: 4.5 },
      { name: 'selected label on selected fill', fg: 'selected-label', bg: 'selected-fill', min: 4.5 },
      { name: 'selected outline on view', fg: 'selected-edge', bg: 'fill', min: 3 }
    ]
  },
  {
    id: 'scrollbar',
    name: 'Scrollbar',
    lead: 'A vertical scrollbar: its track (groove) and thumb (slider) at rest.',
    slots: [
      { id: 'track', label: 'track', prop: 'bg', expect: null },
      { id: 'thumb', label: 'thumb', prop: 'bg', expect: { oneOf: ACCENT, source: TIER_D } }
    ],
    contrast: [{ name: 'thumb on track', fg: 'thumb', bg: 'track', min: 3 }]
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    lead: 'An unchecked and a checked checkbox with their labels.',
    slots: [
      { id: 'box-fill', label: 'unchecked box fill', prop: 'bg', expect: null },
      { id: 'box-edge', label: 'box edge', prop: 'border', expect: { token: 'border_strong', source: EDGE_0 } },
      { id: 'checked-fill', label: 'checked box fill', prop: 'bg', expect: { oneOf: ACCENT, source: PRIMARY } },
      { id: 'mark', label: 'check mark', prop: 'color', expect: null },
      { id: 'label', label: 'label', prop: 'color', expect: { token: 'text', source: LABEL } },
      { id: 'surface', label: 'surface behind', prop: 'bg', expect: null }
    ],
    contrast: [
      { name: 'check mark on checked fill', fg: 'mark', bg: 'checked-fill', min: 3 },
      { name: 'box edge on surface', fg: 'box-edge', bg: 'surface', min: 3 },
      { name: 'label on surface', fg: 'label', bg: 'surface', min: 4.5 }
    ]
  },
  {
    id: 'tab',
    name: 'Tab',
    lead: 'A tab bar with the current tab and an inactive one.',
    slots: [
      { id: 'fill', label: 'bar fill', prop: 'bg', expect: null },
      { id: 'active-fill', label: 'current tab fill', prop: 'bg', expect: null },
      { id: 'active-label', label: 'current tab label', prop: 'color', expect: { token: 'text', source: LABEL } },
      { id: 'active-marker', label: 'current tab marker', prop: 'ring', expect: { oneOf: RING, source: TIER_C } },
      { id: 'inactive-label', label: 'inactive tab label', prop: 'color', expect: null }
    ],
    contrast: [
      { name: 'current label on its fill', fg: 'active-label', bg: 'active-fill', min: 4.5 },
      { name: 'inactive label on bar', fg: 'inactive-label', bg: 'fill', min: 4.5 },
      { name: 'current marker on bar', fg: 'active-marker', bg: 'fill', min: 3 }
    ]
  }
];

export type ComponentId = string;
export const COMPONENT_IDS: ComponentId[] = COMPONENTS.map((c) => c.id);
export const componentById = (id: string) => COMPONENTS.find((c) => c.id === id);
