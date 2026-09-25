import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, stock } from './model';

export const meta: SurfaceMeta = {
  id: 'sddm',
  name: 'SDDM login screen',
  group: 'linux',
  order: 10,
  shipped: [
    { path: 'sddm/indigo-glass/Main.qml' },
    { path: 'sddm/indigo-glass/theme.conf' },
    { path: 'sddm/indigo-glass/metadata.desktop' },
    { path: 'sddm/indigo-glass/background.svg' }
  ],
  stockSource:
    'Breeze greeter from plasma-desktop tag v6.7.4 (sddm-theme/Main.qml, Login.qml, SessionButton.qml, KeyboardButton.qml, theme.conf.cmake, metadata.desktop; commit 95e51519), verbatim in fixtures/stock/sddm. org.kde.breeze.components (Clock, UserDelegate, ActionButton, SessionManagementScreen) and BreezeLight.colors copied from this host (plasma-workspace / plasma-breeze-common 6.7.4-2.fc44); Fedora\'s sddm-breeze package is not installed here. Next wallpaper downscaled and pre-blurred (plasma-defaults.conf says how).',
  fidelity: 'low',
  fidelityWhy:
    'QML cannot run in the browser, so both lanes are HTML reimplementations. Ours is driven by a parse of every painted Main.qml binding (colours, sizes, fonts, texts, the failed-login handler), with QML\'s own name-scoping rule applied; it was cross-checked against an offscreen Qt 6 render of the file. Breeze\'s structure and unit maths come from the upstream files, but its Plasma SVG frames (field, button) are approximated and the wallpaper blur is baked into the fixture.',
  live:
    'Not checkable on this host: it runs plasma-login-manager (plasmalogin.service); the sddm greeter binary is not installed, and /etc/sddm.conf.d/kde_settings.conf is a leftover naming sweet-plasma6. On an SDDM host: sudo cp -r sddm/indigo-glass /usr/share/sddm/themes/ (install.sh does not ship SDDM), set [Theme] Current=indigo-glass, then preview with `sddm-greeter --test-mode --theme /usr/share/sddm/themes/indigo-glass` (metadata.desktop has no QtVersion=6, so SDDM picks the Qt 5 greeter; use sddm-greeter-qt6 once that key is added); scripts/check-deployment.sh reports the Current= theme.'
};

/* Token each painted role must equal. */
const R = (role: string, v: string, token: string | null, stockVar?: string, note?: string): Role => ({
  role, ours: String(ours.vars[v]), stock: stockVar ? String(stock.vars[stockVar]) : undefined, token, note
});

export const roles: Role[] = [
  R('screen fill (root.color)', 'sd-desk', 'base', 'sd-desk', 'shows only where background.svg is missing; stock is theme.conf color='),
  R('theme.conf color=', 'sd-conf-color', 'base', 'sd-conf-color', 'not read by Main.qml (no config.* reference)'),
  R('panel fill', 'sd-panel-bg', 'base'),
  R('panel edge', 'sd-panel-edge', 'border_strong'),
  R('panel shadow', 'sd-shadow', 'accent_alt', undefined, '[shadow].ink_lg = 7px 7px 0 0 accent_alt (docs/PHILOSOPHY.md); was Qt.rgba(0,0,0,0.9)'),
  R('brand dot', 'sd-dot', 'accent'),
  R('brand label', 'sd-brand-fg', 'text'),
  R('user selector fill', 'sd-user-bg', 'surface_alt', 'sd-user-bg'),
  R('user selector edge', 'sd-user-edge', 'border_strong'),
  R('user selector edge (focused)', 'sd-user-edge-on', 'accent'),
  R('user name', 'sd-user-fg', 'text', 'sd-user-fg'),
  R('password fill', 'sd-pw-bg', 'surface_alt', 'sd-pw-bg'),
  R('password edge', 'sd-pw-edge', 'border_strong', 'sd-pw-edge'),
  R('password edge (focused)', 'sd-pw-edge-on', 'accent', 'sd-pw-edge-on'),
  R('password dots', 'sd-pw-fg', 'text', 'sd-pw-fg'),
  R('password placeholder', 'sd-pw-ph', 'text_muted', 'sd-pw-ph'),
  R('sign-in fill', 'sd-btn-bg', 'accent', 'sd-btn-bg'),
  R('sign-in fill (pressed)', 'sd-btn-bg-on', 'accent_hi', 'sd-btn-bg-on'),
  R('sign-in label', 'sd-btn-fg', 'base', 'sd-btn-fg'),
  R('session selector edge', 'sd-sess-edge', 'border_strong'),
  R('session label', 'sd-sess-fg', 'text_muted', 'sd-sess-fg'),
  R('clock', 'sd-clock-fg', 'text_muted', 'sd-clock-fg')
];

const v = (k: string) => String(ours.vars[k]);
export const contrast: ContrastPair[] = [
  { name: 'Brand label on panel', fg: v('sd-brand-fg'), bg: v('sd-panel-bg'), min: 4.5 },
  { name: 'User name on selector', fg: v('sd-user-fg'), bg: v('sd-user-bg'), min: 4.5 },
  { name: 'Password dots on field', fg: v('sd-pw-fg'), bg: v('sd-pw-bg'), min: 4.5 },
  { name: 'Placeholder on field', fg: v('sd-pw-ph'), bg: v('sd-pw-bg'), min: 4.5 },
  { name: 'Sign-in label on accent', fg: v('sd-btn-fg'), bg: v('sd-btn-bg'), min: 4.5 },
  { name: 'Sign-in label on accent_hi (pressed)', fg: v('sd-btn-fg'), bg: v('sd-btn-bg-on'), min: 4.5 },
  /* The session selector's background is "transparent": its label sits on the panel. */
  { name: 'Session label on panel', fg: v('sd-sess-fg'), bg: v('sd-panel-bg'), min: 4.5 },
  /* Over background.svg in reality; base is its floor colour and the fallback fill. */
  { name: 'Clock on screen fill', fg: v('sd-clock-fg'), bg: v('sd-desk'), min: 4.5 },
  { name: 'Focus edge on field', fg: v('sd-pw-edge-on'), bg: v('sd-pw-bg'), min: 3 },
  /* The field fill is surface_alt on a base panel: the 2px edge is what outlines the control. */
  { name: 'Field edge on panel', fg: v('sd-pw-edge'), bg: v('sd-panel-bg'), min: 3 }
];
