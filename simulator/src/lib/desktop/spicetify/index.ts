import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, roleRows } from './model';

export const meta: SurfaceMeta = {
  id: 'spicetify',
  name: 'Spicetify',
  group: 'app',
  order: 3,
  shipped: [
    { path: 'spicetify/Themes/indigo-glass/color.ini' },
    { path: 'spicetify/Themes/indigo-glass/user.css' }
  ],
  stockSource:
    "Reconstructed, not copied - Spotify publishes no design-token reference for its desktop client (checked " +
    'developer.spotify.com/documentation/design: brand-guideline colours only, no UI component tokens). Values are ' +
    'third-party Spotify brand-colour citations (main #121212, card/surface #282828, border #404040; text ramp ' +
    "#FFFFFF/#B3B3B3/#6A6A6A; brand green #1ED760) plus one internally-corroborated value (notification-error " +
    '#E22134, which also appears untouched in several community Spicetify colour schemes, including spicetify-cli\'s ' +
    "own bundled default). Several keys (player, selected-row, tab-active, button-active, shadow, sidebar) have no " +
    'direct citation and are approximated from the cited ramp - see fixtures/stock/spicetify/color.ini\'s header for ' +
    'the exact split. The [base]/[dark] section split is a comparison device mirroring the shipped file\'s own two ' +
    "sections; Spotify itself ships no colour-scheme ini. Component-rule geometry (card/button/menu radii, shadow " +
    'softness) reflects the client\'s well-known rounded/pill/soft-shadow look, not a cited spec.',
  fidelity: 'low',
  fidelityWhy:
    'Every role and colour this page checks is read from the real color.ini/user.css text, so role values and ' +
    'contrast are exact against what those files declare. What it cannot prove: Spotify\'s actual default colours ' +
    '(no vendor token doc exists, so stock is a third-party-cited reconstruction with several disclosed ' +
    "approximations - see stockSource); the shipped file's real class names (`.main-card-card` etc are community-" +
    'corroborated, not vendor-documented, and Spotify\'s own class names can change between client releases); one ' +
    "shipped selector this page adds theming for (`.main-contextMenu-menu`) is inferred from this file's own BEM " +
    'naming convention, not independently confirmed; and the search-input specimen has no confirmed real Spotify ' +
    'selector at all, so it renders a plain `input[type=\"search\"]` driven by the same color.ini values instead. ' +
    'Neither Spotify nor Spicetify is installed on this host, so none of this has been checked against a live client.',
  live:
    'Not checkable on this host: Spotify is not installed (no flatpak/snap/native package, no ~/.config/spotify), ' +
    'and Spicetify requires a Spotify install to attach to - installing either is out of scope for this pass (not ' +
    'performed). To verify live: install Spotify desktop + Spicetify CLI, `cp -r spicetify/Themes/indigo-glass ' +
    '"$(spicetify -c | xargs dirname)/Themes/"`, `spicetify config current_theme indigo-glass color_scheme dark`, ' +
    '`spicetify apply`, then compare the sidebar, a card shelf, a track list, the now-playing bar, a right-click ' +
    'context menu and the search box against this page\'s "Sage Ink" lane.'
};

export const roles: Role[] = roleRows();

const g = (key: string) => `#${ours.get(key)}`;
export const contrast: ContrastPair[] = [
  { name: 'Track/list text', fg: g('text'), bg: g('main'), min: 4.5 },
  { name: 'Sidebar subtext', fg: g('subtext'), bg: g('sidebar'), min: 4.5 },
  { name: 'Card text', fg: g('text'), bg: g('card'), min: 4.5 },
  { name: 'Play button label', fg: '#07080A', bg: g('button'), min: 4.5 },
  { name: 'Now-playing bar text', fg: g('text'), bg: g('player'), min: 4.5 }
];
