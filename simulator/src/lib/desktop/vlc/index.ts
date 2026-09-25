import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, stock } from './model';

export const meta: SurfaceMeta = {
  id: 'vlc',
  name: 'VLC',
  group: 'linux',
  order: 14,
  shipped: [
    { path: 'vlc/vlc-qt-interface.ini' },
    { path: 'tokens/out/vlcrc.ini', generated: true }
  ],
  stockSource:
    'VLC 3.0.x *_TB_DEFAULT toolbar macros (modules/gui/qt/components/controller.hpp, branch commit 04d8fcb9) and the qt.cpp module option defaults (branch commit 35f126b6), reconstructed into fixtures/stock/vlc/ since a fresh profile never writes these until the toolbar editor runs or an option is set. Installed host: vlc-3.0.23-10.fc44.x86_64.',
  fidelity: 'medium',
  fidelityWhy:
    'The toolbar layout, the seek/volume shiny flags, and the three vlcrc keys are decoded from the real files and rendered in the order VLC parses them, so the layout and the shiny-vs-plain difference are exact. The window chrome reuses the KDE colour model (VLC\'s Qt5 window really does read it via plasma-integration-qt5), but the specimens are a mock-up of VLC\'s widgets, not Qt-rendered pixels, and the Breeze corner-rounding / groove-mix limitations noted in vlc/README.md are not modelled.',
  live: 'Open VLC (Ctrl+Alt+... none needed, `vlc` is on PATH): the seek bar and volume slider should be flat accent fills with square corners aside from Breeze\'s own rounding, not a blue/traffic-light gradient; the fullscreen controller (press F, move the mouse) should be fully opaque, not translucent; window/toolbar/playlist colours should match System Settings > Colours. `python3 scripts/apply-vlc.py --dry-run` also prints what it would change. Checkable on this host (vlc is installed) but not run by this agent per the brief.'
};

/* KDE role tokens VLC's window chrome actually paints, mirrored from
   ../kde-colors/index.ts's own BG/token mapping for the same sets so the two
   surfaces agree on what each set means -- this file does not redefine the
   mapping, it reads the same parsed KdeModel. */
const kdeRoles: Role[] = [
  { role: 'Window.BackgroundNormal', ours: ours.kde.c('Window', 'BackgroundNormal'), stock: stock.kde.c('Window', 'BackgroundNormal'), token: 'surface' },
  { role: 'Window.ForegroundNormal', ours: ours.kde.c('Window', 'ForegroundNormal'), stock: stock.kde.c('Window', 'ForegroundNormal'), token: 'text' },
  { role: 'Button.BackgroundNormal (toolbar)', ours: ours.kde.c('Button', 'BackgroundNormal'), stock: stock.kde.c('Button', 'BackgroundNormal'), token: 'surface_alt' },
  { role: 'Button.ForegroundNormal (toolbar)', ours: ours.kde.c('Button', 'ForegroundNormal'), stock: stock.kde.c('Button', 'ForegroundNormal'), token: 'text' },
  { role: 'View.BackgroundNormal (playlist)', ours: ours.kde.c('View', 'BackgroundNormal'), stock: stock.kde.c('View', 'BackgroundNormal'), token: 'base' },
  { role: 'View.ForegroundNormal (playlist)', ours: ours.kde.c('View', 'ForegroundNormal'), stock: stock.kde.c('View', 'ForegroundNormal'), token: 'text' },
  { role: 'Selection.BackgroundNormal (playlist)', ours: ours.kde.c('Selection', 'BackgroundNormal'), stock: stock.kde.c('Selection', 'BackgroundNormal'), token: 'accent' }
];

export const roles: Role[] = [
  ...kdeRoles,
  {
    role: 'qt-slider-colours (seek/volume fill)',
    ours: ours.sliderHex,
    stock: stock.sliderHex,
    token: 'accent',
    note: 'codegen sets all four gradient stops to the same accent hex, so the shiny widgets paint flat even if re-enabled in the toolbar editor'
  }
];

export const contrast: ContrastPair[] = [
  { name: 'Toolbar button label', fg: ours.kde.c('Button', 'ForegroundNormal'), bg: ours.kde.c('Button', 'BackgroundNormal'), min: 4.5 },
  { name: 'Playlist row text', fg: ours.kde.c('View', 'ForegroundNormal'), bg: ours.kde.c('View', 'BackgroundNormal'), min: 4.5 },
  /* Selection really fills with accent under Breeze (VLC 3 has no Qt5 Klassy
     build, vlc/README.md "Known limits"); mirrors kde-colors' own convention
     of checking the selected label against the view background rather than
     the accent fill it may sit on -- the same Tier C question, not a new one. */
  { name: 'Playlist selected item text', fg: ours.kde.c('Selection', 'ForegroundNormal'), bg: ours.kde.c('View', 'BackgroundNormal'), min: 4.5 },
  { name: 'Time label on window', fg: ours.kde.c('Window', 'ForegroundNormal'), bg: ours.kde.c('Window', 'BackgroundNormal'), min: 4.5 },
  { name: 'Seek/volume accent fill vs groove', fg: ours.sliderHex, bg: ours.kde.c('Button', 'BackgroundNormal'), min: 3 }
];
