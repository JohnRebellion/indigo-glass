// Icon class resolver — matches GRUB's icon_manager.c behavior.
// Walks entry.classes in declared order; first matching theme.icons[<class>] wins.

import type { MenuEntry } from './cfg';

export interface ThemeAssets {
  /** Map relative-path → URL (object URL or data URL or static asset path). */
  files: Map<string, string>;
}

export function resolveIcon(entry: MenuEntry, assets: ThemeAssets): string | null {
  for (const cls of entry.classes) {
    const key = `icons/${cls}.png`;
    const url = assets.files.get(key);
    if (url) return url;
  }
  return null;
}
