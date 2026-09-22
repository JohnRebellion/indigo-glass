#!/usr/bin/env python3
"""check-ink-contract — lint hand-typed dark CSS layers against the ink contract.

The palette drift guard only hunts stale hex values, so it stays green while a
layer ships translucent shadows, invisible borders or invented colours (all
four found live on 2026-09-22, research-reports/sage-ink-live-audit-2026-09-22).
This checks the *contract*, not the palette:

  1. no translucent shadow  - rgba()/alpha() inside box-shadow
  2. no translucent fill    - rgba()/alpha() outside a transient hover rule
                              (STATE_GRAMMAR.md exempts hover washes, except on
                              scrollbar/slider, which are Tier D identity fills)
  3. token-only hex         - every #RRGGBB must be a dark-variant token
                              (on_light values like #000000 are not allowed here)
  4. 2px on controls        - no 1px border on entry/check/radio/switch/button

A line carrying a `drift-allow` comment is skipped: that marker already means
"reviewed functional alpha" for the palette guard.

Usage: check-ink-contract.py [FILE...]   (default: the shipped dark GTK CSS)
Exit 0 clean, 1 violations.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT = [
    "config/gtk-theme/SageInk/gtk-3.0/gtk-dark.css",
    "config/gtk-3.0/gtk.css",
    "config/gtk-4.0/gtk.css",
]
CONTROL = re.compile(r"(^|[\s,>])(entry|check|radio|switch|button)\b")


def token_hexes() -> set[str]:
    css = (ROOT / "tokens/out/css-vars.css").read_text()
    root_block = css.split("}", 1)[0]  # default (sage) :root only
    found = {h.upper() for h in re.findall(r"--ig-(?!on-light)[\w-]+:\s*(#[0-9A-Fa-f]{6})\b", root_block)}
    return found


def strip_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)


def lint(path: pathlib.Path, allowed: set[str]) -> list[str]:
    out = []
    selector = ""
    raw = path.read_text().splitlines()
    for n, line in enumerate(strip_comments(path.read_text()).splitlines(), 1):
        if "drift-allow" in raw[n - 1]:
            continue  # reviewed functional alpha (e.g. libadwaita press-state shade)
        if "{" in line:
            selector = line.split("{", 1)[0].strip() or selector
        s = line.strip()
        where = f"{path.relative_to(ROOT)}:{n}"
        translucent = re.search(r"\brgba\([^)]*,\s*0?\.\d+\s*\)|\balpha\(", s)
        if translucent and "box-shadow" in s:
            out.append(f"{where}: translucent shadow: {s}")
        elif translucent:
            hover = "hover" in selector and not re.search(r"scrollbar|slider", selector)
            if not hover:
                out.append(f"{where}: translucent fill outside a hover wash [{selector}]: {s}")
        for h in re.findall(r"#[0-9A-Fa-f]{6}\b", s):
            if h.upper() not in allowed:
                out.append(f"{where}: {h} is not a dark-variant token: {s}")
        if re.search(r"\bborder(-width)?\s*:\s*1px", s) and CONTROL.search(selector) \
                and not re.search(r"header|separator|headerbar|titlebar", selector):
            out.append(f"{where}: 1px border on a control [{selector}] (contract: 2px)")
    return out


def main() -> int:
    files = [pathlib.Path(a).resolve() for a in sys.argv[1:]] or [ROOT / f for f in DEFAULT]
    allowed = token_hexes()
    problems = [p for f in files if f.exists() for p in lint(f, allowed)]
    for p in problems:
        print(p)
    print(f"ink contract: {len(problems)} violation(s) in {len(files)} file(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
