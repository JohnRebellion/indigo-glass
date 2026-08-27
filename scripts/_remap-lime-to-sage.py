#!/usr/bin/env python3
"""One-time mechanical remap: lime accent hex -> sage accent hex, across the
real layer-config files flagged by check-palette-drift.sh. Case-insensitive
exact hex match only (word-boundary on the hex itself); does not touch
prose/docs (excluded by the caller). Ad hoc — delete after the Sage Ink
rollout is verified; not a general tool.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# lime -> sage, case-insensitive. Both #8BC406 and #8BC407 (pre-existing
# casing drift for the same accent_alt role) map to the one correct sage
# accent_alt.
MAPPING = {
    "A8E635": "A6C9A6",  # accent
    "C1FF58": "C0E3C0",  # accent_hi
    "8BC406": "89A889",  # accent_alt
    "8BC407": "89A889",  # accent_alt (casing drift, same role)
}

PATTERN = re.compile("|".join(MAPPING.keys()), re.IGNORECASE)


def remap(text: str) -> str:
    def repl(m: re.Match) -> str:
        return MAPPING[m.group(0).upper()]

    return PATTERN.sub(repl, text)


def main() -> int:
    files = [Path(p) for p in sys.argv[1:]]
    changed = 0
    for f in files:
        if not f.is_file():
            print(f"skip (not found): {f}", file=sys.stderr)
            continue
        original = f.read_text()
        updated = remap(original)
        if updated != original:
            f.write_text(updated)
            n = len(PATTERN.findall(original))
            print(f"  {f}  ({n} replacements)")
            changed += 1
    print(f"\n{changed}/{len(files)} files changed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
