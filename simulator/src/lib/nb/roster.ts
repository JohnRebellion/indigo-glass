/* The neobrutalism.dev component roster.
 *
 * Source: registry.json in ekmas/neobrutalism-components — the 44 `items`
 * entries, minus the eight `n*` duplicates (nbutton, ncard, ndialog, ninput,
 * nlabel, nsheet, nskeleton, ntooltip), which are dependency-free rebuilds of
 * components already on the list rather than distinct components. `combobox`
 * and `data-table` are added because the docs site documents them as pages
 * even though they are composed from other primitives and ship no styling of
 * their own.
 *
 * Shared by the /neobrutalism/ page and e2e/neobrutalism.spec.ts, so the
 * coverage claim printed on the page is the same list the test enforces.
 */
export const ROSTER = [
  'accordion', 'alert', 'alert-dialog', 'avatar', 'badge', 'breadcrumb',
  'button', 'calendar', 'card', 'carousel', 'chart', 'checkbox',
  'collapsible', 'combobox', 'command', 'context-menu', 'data-table',
  'dialog', 'drawer', 'dropdown-menu', 'form', 'hover-card', 'image-card',
  'input', 'input-otp', 'label', 'marquee', 'menubar', 'navigation-menu',
  'pagination', 'popover', 'progress', 'radio-group', 'resizable',
  'scroll-area', 'select', 'sheet', 'sidebar', 'skeleton', 'slider',
  'sonner', 'switch', 'table', 'tabs', 'textarea', 'tooltip'
] as const;

export type RosterEntry = (typeof ROSTER)[number];
