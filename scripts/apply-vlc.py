#!/usr/bin/env python3
"""apply-vlc — merge the Sage Ink VLC 3.x partials into a live VLC config.

  tokens/out/vlcrc.ini       -> <config-dir>/vlcrc                 (generated)
  vlc/vlc-qt-interface.ini   -> <config-dir>/vlc-qt-interface.conf (hand-kept)

Why not kwriteconfig6 like the KDE partials: vlcrc repeats section names
([file] three times, [ps], [es], [mp4], [avi], [udp], [http]) and KConfig
merges, reorders and drops them - a live copy went from 4811 lines to 46 and
lost its BOM. vlc-qt-interface.conf is QSettings INI, whose @Variant/@ByteArray
escapes KConfig does not speak either. So this edits lines in place and leaves
everything it was not asked to touch byte-identical:

  vlcrc                  VLC writes every option, commented out at its default
                         ("#qt-fs-opacity=0.800000"). That line is replaced
                         wherever it sits; option names are global, the
                         section header is decoration to VLC's own loader.
  vlc-qt-interface.conf  the key is replaced inside its [group], or appended
                         to the end of that group.

Refuses while VLC is running: VLC keeps vlcrc in memory and rewrites it on
exit when anything changed, which would undo this silently.

Each touched file is snapshotted first to $SAGE_INK_BACKUP_DIR (default
~/.cache/sage-ink/backups) as <name>.<timestamp>.bak; restore with cp.

Usage: apply-vlc.py [--dry-run] [--variant NAME] [--config-dir DIR]
"""
import argparse
import os
import pathlib
import shutil
import subprocess
import sys
import time

REPO = pathlib.Path(__file__).resolve().parent.parent
TOOLBAR_INI = REPO / "vlc" / "vlc-qt-interface.ini"


def parse_partial(path: pathlib.Path) -> list[tuple[str, str, str]]:
    """[(group, key, value)] from a generated/hand-kept INI partial.
    Any line that is not blank, a comment, a [group] or key=value aborts."""
    out, group = [], ""
    for n, raw in enumerate(path.read_text().splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("[") and line.endswith("]"):
            group = line[1:-1]
        elif "=" in line and group:
            key, _, value = line.partition("=")
            out.append((group, key, value))
        else:
            sys.exit(f"✗ {path}:{n} malformed: {raw}")
    return out


def _header_group(line: str) -> str | None:
    """'[qt] # Qt interface' -> 'qt'. vlcrc annotates its headers."""
    s = line.lstrip("﻿")
    if s.startswith("[") and "]" in s:
        return s[1:s.index("]")]
    return None


def set_vlcrc(lines: list[str], group: str, key: str, value: str) -> bool:
    new = f"{key}={value}"
    for i, line in enumerate(lines):
        if line.lstrip("#").startswith(f"{key}="):
            if line == new:
                return False
            lines[i] = new
            return True
    return _insert(lines, group, new)


def set_qsettings(lines: list[str], group: str, key: str, value: str) -> bool:
    new, current = f"{key}={value}", None
    for i, line in enumerate(lines):
        g = _header_group(line)
        if g is not None:
            current = g
        elif current == group and line.startswith(f"{key}="):
            if line == new:
                return False
            lines[i] = new
            return True
    return _insert(lines, group, new)


def _insert(lines: list[str], group: str, new: str) -> bool:
    """Append `new` after the last non-blank line of `group`, creating the
    group at the end of the file if it does not exist."""
    start = next((i for i, line in enumerate(lines)
                  if _header_group(line) == group), None)
    if start is not None:
        end = start
        for i in range(start + 1, len(lines)):
            if _header_group(lines[i]) is not None:
                break
            if lines[i].strip():
                end = i
        lines.insert(end + 1, new)
        return True
    if lines and lines[-1] != "":
        lines.append("")
    lines += [f"[{group}]", new]
    return True


def apply(partial: pathlib.Path, target: pathlib.Path, setter, dry: bool,
          backup_dir: pathlib.Path) -> None:
    entries = parse_partial(partial)
    text = target.read_text(encoding="utf-8") if target.exists() else ""
    trailing_nl = text.endswith("\n") or not text
    lines = text.splitlines()
    changed = [f"[{g}] {k}={v}" for g, k, v in entries if setter(lines, g, k, v)]
    if not changed:
        print(f"  = {target} already current")
        return
    for c in changed:
        print(f"  {'would set' if dry else 'set'} {c}")
    if dry:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        backup_dir.mkdir(parents=True, exist_ok=True)
        snap = backup_dir / f"{target.name}.{time.strftime('%Y%m%d%H%M%S')}.bak"
        shutil.copy2(target, snap)
        print(f"  ↺ snapshot: {snap}")
    tmp = target.with_name(target.name + ".sage-ink.tmp")
    tmp.write_text("\n".join(lines) + ("\n" if trailing_nl else ""), encoding="utf-8")
    os.replace(tmp, target)
    print(f"  ✓ {target}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--variant", help="token variant (default: the unsuffixed default)")
    ap.add_argument("--config-dir", type=pathlib.Path,
                    default=pathlib.Path.home() / ".config" / "vlc")
    args = ap.parse_args()

    name = f"vlcrc.{args.variant}.ini" if args.variant else "vlcrc.ini"
    vlcrc_ini = REPO / "tokens" / "out" / name
    if not vlcrc_ini.exists():
        sys.exit(f"✗ {vlcrc_ini} missing — run: python3 tokens/codegen.py")
    if subprocess.run(["pgrep", "-x", "vlc"], capture_output=True).returncode == 0:
        sys.exit("✗ VLC is running — quit it first, or it rewrites vlcrc on exit")

    backup_dir = pathlib.Path(os.environ.get(
        "SAGE_INK_BACKUP_DIR", pathlib.Path.home() / ".cache" / "sage-ink" / "backups"))
    apply(vlcrc_ini, args.config_dir / "vlcrc", set_vlcrc, args.dry_run, backup_dir)
    apply(TOOLBAR_INI, args.config_dir / "vlc-qt-interface.conf", set_qsettings,
          args.dry_run, backup_dir)


if __name__ == "__main__":
    main()
