import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, roleRows } from './model';

export const meta: SurfaceMeta = {
  id: 'vencord',
  name: 'Vencord',
  group: 'app',
  order: 2,
  shipped: [{ path: 'vencord/indigo-glass.theme.css' }],
  stockSource:
    "Reconstructed, not copied - Discord's compiled CSS variables aren't published by Discord itself. Values are " +
    "docs.betterdiscord.app/discord/variables' HSL colour ramp (fetched 2026-09-25), converted to hex " +
    '(saturation-factor 1, no accessibility override): the --primary-* neutral ramp (including the well-known ' +
    "#313338 'new dark' background shipped since Discord's 2023 redesign) and the --brand-* blurple ramp " +
    '(--brand-500 #5865F2, Discord\'s known brand colour). Three brand-experiment steps (100/200/360) and ' +
    'channeltextarea-background have no cited value and are disclosed approximations. DOM class names are ' +
    'Discord\'s own hash-obfuscated build classes modelled as substring tokens (`[class*="x"]`), the same ' +
    "convention the shipped theme.css's own selectors use, since there is no stable literal class to target. " +
    'See fixtures/stock/vencord/stock.css header for exact citations and every disclosed gap.',
  fidelity: 'medium',
  fidelityWhy:
    "Every role this page checks is read from the real theme.css text. What it cannot prove: Discord's actual " +
    'compiled class names (hashed, rotate every release) so this stock DOM approximates by substring only, not by ' +
    "exact structure; three brand-ramp steps and one background var have no cited source (flagged in stock.css); " +
    'and Vencord itself is not installed on this host (Discord is, via flatpak, but no Vencord/BetterDiscord ' +
    'config directory exists), so the shipped theme has never been loaded in a real client on this machine.',
  live:
    'Partially checkable on this host: Discord is installed (flatpak com.discordapp.Discord). Vencord/BetterDiscord ' +
    'is NOT (~/.var/app/com.discordapp.Discord/config/Vencord and ~/.config/Vencord both absent) - installing a ' +
    'client mod is out of scope for this pass (not performed). To verify live: install Vencord, Settings -> ' +
    'Vencord -> Themes -> Local Themes, drop in indigo-glass.theme.css, toggle on, then compare the server rail, ' +
    "channel list, chat and composer against this page's \"ours\" lane."
};

export const roles: Role[] = roleRows();

const g = ours.get;
export const contrast: ContrastPair[] = [
  { name: 'Chat message text', fg: g('--text-normal'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Channel list label', fg: g('--channels-default'), bg: g('--background-secondary'), min: 4.5 },
  { name: 'Muted text (timestamps)', fg: g('--text-muted'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Link text', fg: g('--text-link'), bg: g('--background-primary'), min: 4.5 },
  // Both fills clear ELEVATION.md's 0.179 on-light luminance threshold, so the shipped
  // file overrides Discord's stock white label with an ink one (see theme.css's
  // [class*="button"][class*="colorBrand/colorDanger"] rule, 2026-09-25 /desktop/vencord pass).
  { name: 'Brand button label', fg: g('--ig-base'), bg: g('--brand-experiment'), min: 4.5 },
  { name: 'Danger button label', fg: g('--ig-base'), bg: g('--status-danger-text'), min: 4.5 },
  { name: 'Success text', fg: g('--text-positive'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Warning text', fg: g('--text-warning'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Header primary', fg: g('--header-primary'), bg: g('--background-primary'), min: 4.5 },
  { name: 'Focus ring on window', fg: '#FFFFFF', bg: g('--background-primary'), min: 3 }
];
