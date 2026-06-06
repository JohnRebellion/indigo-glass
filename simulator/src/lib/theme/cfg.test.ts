import { describe, it, expect } from 'vitest';
import { parseGrubCfg } from './cfg';

describe('parseGrubCfg', () => {
  it('extracts menuentry title + classes', () => {
    const src = `
set timeout=5
set default=0

menuentry 'Nobara Linux (7.0.1-200.nobara.fc43.x86_64)' --class nobara --class gnu-linux --class gnu --class os {
    echo "Booting Nobara..."
}
menuentry 'Windows 11' --class windows --class os --id 'windows-11' {
    echo "Booting Windows..."
}
menuentry 'UEFI Firmware Settings' --class uefi-firmware {
    fwsetup
}
    `;
    const cfg = parseGrubCfg(src);
    expect(cfg.entries).toHaveLength(3);
    expect(cfg.entries[0].title).toBe('Nobara Linux (7.0.1-200.nobara.fc43.x86_64)');
    expect(cfg.entries[0].classes).toEqual(['nobara', 'gnu-linux', 'gnu', 'os']);
    expect(cfg.entries[1].title).toBe('Windows 11');
    expect(cfg.entries[1].id).toBe('windows-11');
    expect(cfg.timeout).toBe(5);
    expect(cfg.defaultIndex).toBe(0);
  });

  it('handles double-quoted titles', () => {
    const src = `menuentry "Memory test" --class memtest { foo }`;
    const cfg = parseGrubCfg(src);
    expect(cfg.entries[0].title).toBe('Memory test');
    expect(cfg.entries[0].classes).toEqual(['memtest']);
  });

  it('extracts set theme + gfxmode', () => {
    const src = `
      set theme=/boot/grub2/themes/indigo-glass/theme.txt
      set gfxmode=2560x1440,1920x1080,auto
      menuentry 'X' --class os { foo }
    `;
    const cfg = parseGrubCfg(src);
    expect(cfg.theme).toContain('indigo-glass/theme.txt');
    expect(cfg.gfxmode).toContain('2560x1440');
  });
});
