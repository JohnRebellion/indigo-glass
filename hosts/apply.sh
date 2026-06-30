#!/usr/bin/env bash
# Lime Glass - apply host-specific font sizes to Linux configs
#
# Reads hosts/<profile>.toml and writes the values into live config
# files. Idempotent: re-running with the same profile is a no-op for
# already-correct files.
#
# Usage:
#   bash hosts/apply.sh                  # auto-detect by hostname
#   bash hosts/apply.sh --host aspire5-14-1080p
#   bash hosts/apply.sh --host _default  # force default (Nobara desktop)
#   bash hosts/apply.sh --dry-run        # show what would change

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOSTS_DIR="$SCRIPT_DIR"
HOST=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help)
      sed -n '2,/^set/p' "$0" | sed -n '/^#/p' | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

# Auto-detect host via hostname if not given
if [[ -z "$HOST" ]]; then
  HN=$(hostname -s | tr '[:upper:]' '[:lower:]')
  if [[ -f "$HOSTS_DIR/$HN.toml" ]]; then
    HOST="$HN"
  else
    case "$HN" in
      *aspire*5*|*aspire5*) HOST="aspire5-14-1080p" ;;
      *) HOST="_default" ;;
    esac
  fi
fi

PROFILE="$HOSTS_DIR/$HOST.toml"
if [[ ! -f "$PROFILE" ]]; then
  echo "ERROR: profile not found: $PROFILE" >&2
  ls "$HOSTS_DIR"/*.toml >&2
  exit 1
fi

echo "Profile: $HOST"
grep -E '^(name|description)' "$PROFILE" | head -2
echo ""

read_toml() {
  local section="$1" key="$2"
  python3 -c "
import tomllib
with open('$PROFILE', 'rb') as f:
    d = tomllib.load(f)
v = d.get('$section', {}).get('$key', '')
if v != '':
    print(v)
"
}

BODY_PT=$(read_toml fonts body_pt)
MONO_PT=$(read_toml fonts mono_pt)
MENU_PT=$(read_toml fonts menu_pt)
TOOLBAR_PT=$(read_toml fonts toolbar_pt)
SMALLEST_PT=$(read_toml fonts smallest_pt)
KONSOLE_SZ=$(read_toml konsole font_size)
VSC_EDITOR=$(read_toml vscode editor_fontsize)
VSC_CHAT=$(read_toml vscode chat_fontsize)
VSC_TERM=$(read_toml vscode terminal_fontsize)
GTK_PT=$(read_toml gtk font_pt)

echo "Fonts: body=$BODY_PT mono=$MONO_PT menu=$MENU_PT toolbar=$TOOLBAR_PT smallest=$SMALLEST_PT"
echo "Konsole: $KONSOLE_SZ"
echo "VSCode: editor=$VSC_EDITOR chat=$VSC_CHAT terminal=$VSC_TERM"
echo "GTK: $GTK_PT"
echo ""

apply_sed() {
  local file="$1" pattern="$2" replacement="$3"
  if [[ ! -f "$file" ]]; then
    echo "  SKIP $file (not found)"
    return
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "  [dry-run] sed pattern '$pattern' -> '$replacement' in $file"
    return
  fi
  sed -i -E "s|$pattern|$replacement|" "$file"
  echo "  patched $file"
}

echo "[1/5] kdeglobals"
KDE_FILE="$HOME/.config/kdeglobals"
apply_sed "$KDE_FILE" '^font=Carlito,[0-9]+' "font=Carlito,$BODY_PT"
apply_sed "$KDE_FILE" '^fixed=Iosevka Custom Condensed,[0-9]+' "fixed=Iosevka Custom Condensed,$MONO_PT"
apply_sed "$KDE_FILE" '^menuFont=SF Pro Display,[0-9]+' "menuFont=SF Pro Display,$MENU_PT"
apply_sed "$KDE_FILE" '^toolBarFont=SF Pro Display,[0-9]+' "toolBarFont=SF Pro Display,$TOOLBAR_PT"
apply_sed "$KDE_FILE" '^smallestReadableFont=SF Pro Display,[0-9]+' "smallestReadableFont=SF Pro Display,$SMALLEST_PT"

echo "[2/5] GTK"
apply_sed "$HOME/.config/gtk-3.0/settings.ini" '^gtk-font-name=Carlito [0-9]+' "gtk-font-name=Carlito $GTK_PT"
apply_sed "$HOME/.config/gtk-4.0/settings.ini" '^gtk-font-name=Carlito [0-9]+' "gtk-font-name=Carlito $GTK_PT"

echo "[3/5] Konsole"
apply_sed "$HOME/.local/share/konsole/IndigoGlass.profile" \
  '^Font=Iosevka Custom Condensed,[0-9]+' \
  "Font=Iosevka Custom Condensed,$KONSOLE_SZ"

echo "[4/5] VSCode"
for VSC in "$HOME/.config/Code - Insiders/User/settings.json" "$HOME/.config/Code/User/settings.json"; do
  if [[ -f "$VSC" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "  [dry-run] would set editor=$VSC_EDITOR chat=$VSC_CHAT terminal=$VSC_TERM in $VSC"
    else
      python3 - "$VSC" "$VSC_EDITOR" "$VSC_CHAT" "$VSC_TERM" <<'PY'
import json, sys, re
path, ed, ch, tm = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
with open(path) as f:
    text = f.read()
clean = re.sub(r'//[^\n]*', '', text)
clean = re.sub(r',(\s*[}\]])', r'\1', clean)
try:
    d = json.loads(clean)
except json.JSONDecodeError as e:
    print(f'  parse fail {path}: {e}', file=sys.stderr); sys.exit(0)
d['editor.fontSize'] = ed
d['chat.fontSize'] = ch
d['chat.editor.fontSize'] = ch
d['terminal.integrated.fontSize'] = tm
d['scm.inputFontSize'] = ch
with open(path, 'w') as f:
    json.dump(d, f, indent=2)
print(f'  patched {path}')
PY
    fi
  else
    echo "  SKIP $VSC (not found)"
  fi
done

echo "[5/5] done"
echo ""
echo "Apply changes:"
echo "  KDE   : kquitapp6 plasmashell; kstart plasmashell"
echo "  GTK   : restart GTK apps"
echo "  VSCode: Ctrl+Shift+P -> Developer: Reload Window"
echo "  Konsole: close + reopen IndigoGlass profile"
