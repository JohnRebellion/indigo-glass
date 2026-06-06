import type { Theme } from './parser';
import type { ThemeAssets } from './icon';
import { parseTheme } from './parser';
import type { PFF2Font } from './pff2';
import { parsePFF2 } from './pff2';

export interface PresetManifest {
  name: string;
  themeTxt: string;
  background: string;
  fonts: string[];
  assets: string[];
  icons: string[];
}

export interface LoadedPreset {
  id: string;
  manifest: PresetManifest;
  theme: Theme;
  assets: ThemeAssets;
  fonts: Map<string, PFF2Font>;
  /** Relative-path → ArrayBuffer for export. */
  rawFiles: Map<string, ArrayBuffer>;
}

export async function loadPreset(presetId: string, baseUrl = './presets'): Promise<LoadedPreset> {
  const base = `${baseUrl}/${presetId}`;
  const manifest: PresetManifest = await fetch(`${base}/manifest.json`).then((r) => r.json());
  const themeTxt = await fetch(`${base}/${manifest.themeTxt}`).then((r) => r.text());
  const theme = parseTheme(themeTxt);

  const files = new Map<string, string>();
  const rawFiles = new Map<string, ArrayBuffer>();

  // Background, assets, icons → URLs
  const assetPaths = [manifest.background, ...manifest.assets, ...manifest.icons];
  await Promise.all(
    assetPaths.map(async (rel) => {
      const r = await fetch(`${base}/${rel}`);
      const buf = await r.arrayBuffer();
      rawFiles.set(rel, buf);
      const blob = new Blob([buf], { type: rel.endsWith('.jpg') ? 'image/jpeg' : 'image/png' });
      files.set(rel, URL.createObjectURL(blob));
    })
  );

  // theme.txt itself
  rawFiles.set(manifest.themeTxt, new TextEncoder().encode(themeTxt).buffer);

  // Fonts
  const fonts = new Map<string, PFF2Font>();
  await Promise.all(
    manifest.fonts.map(async (rel) => {
      const buf = await fetch(`${base}/${rel}`).then((r) => r.arrayBuffer());
      rawFiles.set(rel, buf);
      const font = parsePFF2(buf);
      fonts.set(font.name, font);
    })
  );

  return {
    id: presetId,
    manifest,
    theme,
    assets: { files },
    fonts,
    rawFiles
  };
}
