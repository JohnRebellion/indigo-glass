import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, roleRows } from './model';

export const meta: SurfaceMeta = {
  id: 'obsidian',
  name: 'Obsidian',
  group: 'app',
  order: 1,
  shipped: [
    { path: 'obsidian/Indigo Glass/theme.css' },
    { path: 'obsidian/Indigo Glass/manifest.json' }
  ],
  stockSource:
    'Reconstructed, not copied - Obsidian is not installed on this host. Semantic .theme-dark values from ' +
    'obsidian-community/obsidian-style-settings obsidian-default-theme.css ("default-dark" column, a maintained ' +
    'community reference of Obsidian\'s own unthemed variables); base/extended colour scale, --border-width and ' +
    '--radius-* from the official obsidian-developer-docs CSS variables reference (Foundations/Colors.md, ' +
    'Borders.md, Radiuses.md, fetched 2026-09-25); DOM class names from Obsidian\'s documented plugin/theme API ' +
    'and the shipped file\'s own selectors. See fixtures/stock/obsidian/stock.css header for exact citations.',
  fidelity: 'medium',
  fidelityWhy:
    'Every role this page checks is read from the real theme.css text (roles, coverage and contrast are exact ' +
    'against that file). What it cannot prove: Obsidian is not installed on this host, so the stock lane\'s exact ' +
    'current-version pixel match (padding, the callout icon glyphs, live-preview vs reading-view differences) is ' +
    'reconstructed from documentation, not observed, and a handful of stock values (hover wash strength, some ' +
    'component paddings) have no published default and are reasonable approximations, marked in the stock.css header.',
  live:
    'Not checkable on this host: no rpm/flatpak Obsidian install, no ~/.config/obsidian or vault. On a host with ' +
    'Obsidian: Settings -> Appearance -> Themes -> "Sage Ink" should be selectable (install.sh does not ship this ' +
    'theme - see obsidian/README.md for the manual copy step), then compare the ribbon, sidebar, reading view and ' +
    'editor against this page\'s "ours" lane.'
};

export const roles: Role[] = roleRows();

const g = ours.get;
export const contrast: ContrastPair[] = [
  { name: 'Reading view body text', fg: g('--text-normal'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Sidebar file label', fg: g('--text-normal'), bg: g('--background-secondary'), min: 4.5 },
  { name: 'Active file label (filled)', fg: g('--text-on-accent'), bg: g('--interactive-accent'), min: 4.5 },
  { name: 'Muted text (h6, timestamps)', fg: g('--text-muted'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Resolved link', fg: g('--link-color'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Inline code / code block', fg: g('--code-normal'), bg: g('--code-background'), min: 4.5 },
  { name: 'mod-cta button label', fg: g('--text-on-accent'), bg: g('--interactive-accent'), min: 4.5 },
  { name: 'Error text', fg: g('--text-error'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Success text', fg: g('--text-success'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Focus ring on window', fg: '#FFFFFF', bg: g('--background-primary'), min: 3 }
];
