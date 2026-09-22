#!/usr/bin/env bash
# check-deployment.sh — Sage Ink deployment guard (is the theme actually ON?)
#
# check-palette-drift.sh answers "is the shipped file correct?".
# This answers the question nothing else asks: "was the correct file ever
# installed, and is the host application actually pointed at it?"
#
# ---------------------------------------------------------------------------
# WHY THIS EXISTS (2026-09-06)
#
# A live audit found two defects while all six drift scans were green and the
# 49-test simulator suite was passing. Neither was file drift:
#
#   1. GTK theme. Both ~/.config/gtk-{3,4}.0/settings.ini correctly read
#      SageInk, but `gsettings get org.gnome.desktop.interface gtk-theme`
#      returned 'WhiteSur-Dark-purple'. libadwaita/GTK4 apps and anything
#      routed through xdg-desktop-portal read gsettings and ignore
#      settings.ini entirely, so half the GTK surface was rendering a
#      completely unrelated theme. install.sh never set the key — it only
#      printed a "next step" instruction for the user to run by hand.
#
#   2. Edge theme. browser/edge-theme/'s manifest is CORRECT, including the
#      tints.buttons [H,S,L] triple that no hex-based scan can see (verified:
#      H=0.33 S=0.38 L=0.82 == accent_hi #C0E3C0). But live Edge chrome
#      sampled (25,25,28) against the manifest's (18,18,22), because the
#      profile's `theme id` was empty — the theme had never been loaded.
#
# Both have the same shape: the artefact is right, the consumer never reads
# it. A text scanner over repo files cannot see that, by construction. The
# audit then found the same pattern across most non-desktop layers.
#
# ---------------------------------------------------------------------------
# THREE OUTCOMES, NOT TWO
#
# "Not deployed" is not automatically a failure. Vencord cannot be deployed
# on a machine with no Discord. So each layer reports one of:
#
#   DEPLOYED  — host app present AND pointed at the Sage Ink artefact
#   ABSENT    — host app not installed here; nothing to deploy (informational)
#   UNDEPLOYED— host app IS installed but is NOT using our artefact  <-- fails
#
# Only UNDEPLOYED is an error. This keeps the script honest on a workstation
# that legitimately has no Spotify, while still catching the Edge case where
# the app is right there and simply was never themed.
#
# Usage:  check-deployment.sh [--quiet]
#         --quiet   suppress ABSENT rows (only DEPLOYED / UNDEPLOYED)
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

QUIET=false
case "${1:-}" in
  --quiet) QUIET=true ;;
  "")      ;;
  *) echo "usage: $(basename "$0") [--quiet]" >&2; exit 2 ;;
esac

FAILED=0
N_DEPLOYED=0
N_ABSENT=0

# report <status> <layer> <detail>
report() {
  local status="$1" layer="$2" detail="$3"
  case "$status" in
    DEPLOYED)
      N_DEPLOYED=$((N_DEPLOYED + 1))
      printf '  %-11s %-22s %s\n' "deployed" "$layer" "$detail"
      ;;
    ABSENT)
      N_ABSENT=$((N_ABSENT + 1))
      [ "$QUIET" = true ] || printf '  %-11s %-22s %s\n' "absent" "$layer" "$detail"
      ;;
    UNDEPLOYED)
      FAILED=$((FAILED + 1))
      printf '  %-11s %-22s %s\n' "UNDEPLOYED" "$layer" "$detail"
      ;;
  esac
}

echo "Sage Ink deployment guard"
echo "  repo: $REPO_DIR"
echo ""
echo "KDE / Plasma"

# --- Plasma colour scheme -------------------------------------------------
# kdeglobals [General] ColorScheme is the live selection. The .colors file
# existing in ~/.local/share/color-schemes proves nothing on its own.
scheme="$(kreadconfig6 --file kdeglobals --group General --key ColorScheme 2>/dev/null)"
if [ -z "$scheme" ]; then
  report ABSENT "plasma colour scheme" "kreadconfig6 unavailable or key unset"
elif [ "$scheme" = "SageInk" ]; then
  report DEPLOYED "plasma colour scheme" "ColorScheme=$scheme"
else
  report UNDEPLOYED "plasma colour scheme" "ColorScheme=$scheme (expected SageInk)"
fi

# --- Plasma widget theme --------------------------------------------------
ptheme="$(kreadconfig6 --file plasmarc --group Theme --key name 2>/dev/null)"
if [ -z "$ptheme" ]; then
  report ABSENT "plasma widget theme" "plasmarc [Theme] name unset"
elif [ "$ptheme" = "SageInk" ]; then
  report DEPLOYED "plasma widget theme" "name=$ptheme"
else
  report UNDEPLOYED "plasma widget theme" "name=$ptheme (expected SageInk)"
fi

# --- Qt widget style ------------------------------------------------------
wstyle="$(kreadconfig6 --file kdeglobals --group KDE --key widgetStyle 2>/dev/null)"
if [ -z "$wstyle" ]; then
  report ABSENT "qt widget style" "kdeglobals [KDE] widgetStyle unset"
elif [ "$wstyle" = "Klassy" ]; then
  # The style plugin must also actually exist, or Qt silently falls back.
  if [ -f /usr/lib64/qt6/plugins/styles/klassy6.so ] || [ -f /usr/lib/qt6/plugins/styles/klassy6.so ]; then
    report DEPLOYED "qt widget style" "widgetStyle=$wstyle (plugin present)"
  else
    report UNDEPLOYED "qt widget style" "widgetStyle=Klassy but klassy6.so not installed"
  fi
else
  report UNDEPLOYED "qt widget style" "widgetStyle=$wstyle (expected Klassy)"
fi

# --- Stray plugin copies --------------------------------------------------
# Qt's style loader globs the whole plugins/styles directory. A backup left
# alongside the real plugin (klassy6.so.backup-YYYYMMDD) can be loaded INSTEAD
# of it — this genuinely happened on 2026-09-06 and made a verified-correct
# fix appear not to work. Backups belong outside the scan path.
for d in /usr/lib64/qt6/plugins/styles /usr/lib/qt6/plugins/styles; do
  [ -d "$d" ] || continue
  strays="$(find "$d" -maxdepth 1 -name 'klassy6.so.*' 2>/dev/null)"
  if [ -n "$strays" ]; then
    report UNDEPLOYED "qt style plugin dir" "stray copy shadows the real plugin: $(echo "$strays" | tr '\n' ' ')"
  fi
done

echo ""
echo "GTK"

# --- GTK settings.ini (GTK3 reads this) -----------------------------------
for v in 3.0 4.0; do
  f="$HOME/.config/gtk-$v/settings.ini"
  if [ ! -f "$f" ]; then
    report UNDEPLOYED "gtk$v settings.ini" "missing ($f)"
    continue
  fi
  name="$(sed -n 's/^gtk-theme-name=//p' "$f" | tail -1)"
  if [ "$name" = "SageInk" ]; then
    report DEPLOYED "gtk$v settings.ini" "gtk-theme-name=$name"
  else
    report UNDEPLOYED "gtk$v settings.ini" "gtk-theme-name=${name:-unset} (expected SageInk)"
  fi
done

# --- gsettings (GTK4/libadwaita/portal read this) -------------------------
# This is Finding 1. settings.ini being correct says nothing about this key.
if command -v gsettings >/dev/null 2>&1; then
  g="$(gsettings get org.gnome.desktop.interface gtk-theme 2>/dev/null | tr -d "'")"
  if [ "$g" = "SageInk" ]; then
    report DEPLOYED "gsettings gtk-theme" "$g"
  else
    report UNDEPLOYED "gsettings gtk-theme" "${g:-unset} (expected SageInk) — GTK4/libadwaita render this, not settings.ini"
  fi
else
  report ABSENT "gsettings gtk-theme" "gsettings not installed"
fi

# --- The theme package itself must exist ----------------------------------
if [ -d "$HOME/.themes/SageInk" ] || [ -d "$HOME/.local/share/themes/SageInk" ]; then
  report DEPLOYED "gtk theme package" "~/.themes/SageInk present"
else
  report UNDEPLOYED "gtk theme package" "SageInk not in ~/.themes or ~/.local/share/themes"
fi

echo ""
echo "Terminal / shell"

# --- Konsole --------------------------------------------------------------
if command -v konsole >/dev/null 2>&1; then
  kp="$(sed -n 's/^DefaultProfile=//p' "$HOME/.config/konsolerc" 2>/dev/null | tail -1)"
  if [ "$kp" = "SageInk.profile" ]; then
    report DEPLOYED "konsole profile" "DefaultProfile=$kp"
  else
    report UNDEPLOYED "konsole profile" "DefaultProfile=${kp:-unset} (expected SageInk.profile)"
  fi
else
  report ABSENT "konsole profile" "konsole not installed"
fi

# --- Cursor theme ---------------------------------------------------------
if [ -d "$HOME/.icons/Bibata-IndigoGlass" ] || [ -d "$HOME/.local/share/icons/Bibata-IndigoGlass" ]; then
  report DEPLOYED "cursor theme" "Bibata-IndigoGlass present"
else
  # Optional by design — README documents it as a manual, non-install.sh step.
  report ABSENT "cursor theme" "Bibata-IndigoGlass not installed (optional)"
fi

echo ""
echo "Browsers"

# --- Edge theme + extensions (every profile) -----------------------------
# This is Finding 2. The manifest can be byte-perfect and still be unloaded;
# only a profile's own `theme id` proves it is in use. Daily use runs through
# the ~/.local/bin/edge-* wrappers, each with its own --user-data-dir under
# ~/.config/edge-*, so ~/.config/microsoft-edge/Default alone is the wrong
# place to look (it is the unwrapped launcher's profile, normally themeless).
# An unpacked extension's id is sha256(absolute path)[:32] mapped 0-f -> a-p,
# so the expected theme id is computed, not hardcoded.
edge_theme_dir="$REPO_DIR/browser/edge-theme/indigo-glass"
edge_profiles=()
for udd in "$HOME"/.config/edge-* "$HOME/.config/microsoft-edge"; do
  [ -d "$udd" ] || continue
  for prof in "$udd"/Default "$udd"/Profile\ [0-9]*; do
    case "$prof" in *.bak*) continue ;; esac
    [ -f "$prof/Preferences" ] && edge_profiles+=("$prof")
  done
done
if [ ${#edge_profiles[@]} -eq 0 ]; then
  report ABSENT "edge" "no Edge profiles found"
else
  expect_tid="$(python3 -c "
import hashlib,sys
h=hashlib.sha256(sys.argv[1].encode()).hexdigest()[:32]
print(''.join(chr(97+int(c,16)) for c in h))
" "$(realpath "$edge_theme_dir")")"
  themed=0
  for prof in "${edge_profiles[@]}"; do
    label="edge ${prof#"$HOME"/.config/}"
    tid="$(python3 -c "
import json,sys
try:
    d=json.load(open(sys.argv[1]))
except Exception:
    print('parse-error'); raise SystemExit
print(d.get('extensions',{}).get('theme',{}).get('id') or '')
" "$prof/Preferences" 2>/dev/null)"
    case "$tid" in
      parse-error)   report UNDEPLOYED "$label" "could not parse Preferences" ;;
      "$expect_tid") themed=$((themed+1))
                     ext=""
                     # Dark Reader: Edge Add-ons id, not the Chrome Web Store one.
                     for pair in "Stylus:clngdbkpkpeebahjckkjfobafhncgmne" "Dark Reader:ifoakfbpdcdoeenechcleahebpibofpc"; do
                       [ -d "$prof/Extensions/${pair##*:}" ] || ext="$ext, no ${pair%%:*}"
                     done
                     if [ -z "$ext" ]; then report DEPLOYED "$label" "Sage Ink theme + Stylus + Dark Reader"
                     else report UNDEPLOYED "$label" "Sage Ink theme loaded${ext}"; fi ;;
      "")            # Profiles of the unwrapped launcher are expected to be themeless.
                     case "$prof" in "$HOME/.config/microsoft-edge/"*) continue ;; esac
                     report UNDEPLOYED "$label" "theme id unset — wrapper not passing --load-extension?" ;;
      *)             report UNDEPLOYED "$label" "foreign theme id=$tid (expected $expect_tid)" ;;
    esac
  done
  [ "$themed" -eq 0 ] && report UNDEPLOYED "edge theme" "no profile has browser/edge-theme/ loaded"
fi

echo ""
echo "Applications"

# --- Vencord / Discord ----------------------------------------------------
# Discord ships native, flatpak, and snap; check all three config roots
# before calling it absent.
discord_root=""
for c in "$HOME/.config/Vencord" \
         "$HOME/.var/app/com.discordapp.Discord/config/Vencord" \
         "$HOME/snap/discord/current/.config/Vencord"; do
  [ -d "$c" ] && { discord_root="$c"; break; }
done
discord_installed=false
command -v discord >/dev/null 2>&1 && discord_installed=true
flatpak list --app 2>/dev/null | grep -q com.discordapp.Discord && discord_installed=true

if [ "$discord_installed" = false ]; then
  report ABSENT "vencord theme" "Discord not installed"
elif [ -z "$discord_root" ]; then
  report UNDEPLOYED "vencord theme" "Discord present but Vencord not installed"
elif ls "$discord_root"/themes/*.css >/dev/null 2>&1 && \
     grep -rlq "Sage Ink\|indigo-glass" "$discord_root"/themes/ 2>/dev/null; then
  report DEPLOYED "vencord theme" "theme css in $discord_root/themes"
else
  report UNDEPLOYED "vencord theme" "Vencord present but no Sage Ink theme in $discord_root/themes"
fi

# --- Spicetify / Spotify --------------------------------------------------
if command -v spotify >/dev/null 2>&1 || flatpak list --app 2>/dev/null | grep -q com.spotify.Client; then
  if command -v spicetify >/dev/null 2>&1; then
    cur="$(spicetify config current_theme 2>/dev/null | tail -1 | awk '{print $NF}')"
    case "$cur" in
      *SageInk*|*IndigoGlass*) report DEPLOYED "spicetify theme" "current_theme=$cur" ;;
      "")  report UNDEPLOYED "spicetify theme" "current_theme unreadable" ;;
      *)   report UNDEPLOYED "spicetify theme" "current_theme=$cur (expected a Sage Ink theme)" ;;
    esac
  else
    report UNDEPLOYED "spicetify theme" "Spotify installed but spicetify not"
  fi
else
  report ABSENT "spicetify theme" "Spotify not installed"
fi

# --- Obsidian -------------------------------------------------------------
obs_installed=false
command -v obsidian >/dev/null 2>&1 && obs_installed=true
flatpak list --app 2>/dev/null | grep -q md.obsidian.Obsidian && obs_installed=true
if [ "$obs_installed" = false ]; then
  report ABSENT "obsidian theme" "Obsidian not installed"
else
  # Vault location is user-chosen, so this is a best-effort search.
  if find "$HOME" -maxdepth 6 -type d -path '*/.obsidian/themes/Indigo Glass' \
       -not -path '*/node_modules/*' 2>/dev/null | grep -q .; then
    report DEPLOYED "obsidian theme" "theme dir present in a vault"
  else
    report UNDEPLOYED "obsidian theme" "Obsidian installed but no vault has the Indigo Glass theme"
  fi
fi

echo ""
echo "Boot / login"

# --- SDDM -----------------------------------------------------------------
if [ -d /usr/share/sddm/themes ]; then
  cur="$(grep -rhs '^Current=' /etc/sddm.conf /etc/sddm.conf.d/*.conf 2>/dev/null | tail -1 | cut -d= -f2)"
  case "$cur" in
    indigo-glass|sage-ink|SageInk) report DEPLOYED "sddm theme" "Current=$cur" ;;
    "")  report UNDEPLOYED "sddm theme" "Current unset (stock theme in use)" ;;
    *)   report UNDEPLOYED "sddm theme" "Current=$cur (expected indigo-glass)" ;;
  esac
else
  report ABSENT "sddm theme" "SDDM not installed"
fi

# --- GRUB -----------------------------------------------------------------
if [ -f /etc/default/grub ]; then
  # Strip BOTH quote styles: sync-grub-parity.sh writes GRUB_THEME='...' with
  # single quotes, and `tr -d '"'` alone left them in, so every -f test failed.
  gt="$(sed -n 's/^GRUB_THEME=//p' /etc/default/grub | tail -1 | tr -d "\"'")"
  # /boot/grub2 is drwx------ (root-only) on Fedora/Nobara, so `[ -f ]` on an
  # installed theme is false for a normal user. Existence is only decidable
  # when the parent dir is readable; otherwise judge on the configured path.
  gt_dir="$(dirname "${gt:-/}")"
  if [ -n "$gt" ] && { [ ! -r "$gt_dir" ] || [ -f "$gt" ]; }; then
    case "$gt" in
      *indigo-glass*|*sage*) report DEPLOYED "grub theme" "GRUB_THEME=$gt" ;;
      *) report UNDEPLOYED "grub theme" "GRUB_THEME=$gt (not a Sage Ink theme)" ;;
    esac
  elif [ -n "$gt" ]; then
    report UNDEPLOYED "grub theme" "GRUB_THEME=$gt (file missing)"
  else
    # Optional by design — install.sh only deploys GRUB with --with-grub.
    report ABSENT "grub theme" "GRUB_THEME unset (optional, needs --with-grub)"
  fi
else
  report ABSENT "grub theme" "no /etc/default/grub"
fi

# --- JetBrains ------------------------------------------------------------
if [ -d "$HOME/.config/JetBrains" ]; then
  if find "$HOME/.config/JetBrains" -maxdepth 4 -name '*.icls' 2>/dev/null | grep -qi 'indigo\|sage'; then
    report DEPLOYED "jetbrains scheme" "colour scheme installed"
  else
    report UNDEPLOYED "jetbrains scheme" "JetBrains present but scheme not imported"
  fi
else
  report ABSENT "jetbrains scheme" "no JetBrains IDE config"
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "clean — $N_DEPLOYED layer(s) deployed, $N_ABSENT absent (no host app)"
  exit 0
else
  echo "$FAILED layer(s) UNDEPLOYED — host app is installed but not using the Sage Ink artefact."
  echo ""
  echo "  A correct file in the repo is not a deployed theme. Re-run"
  echo "  scripts/install.sh, or install the layer's host-specific artefact"
  echo "  by hand (browser themes and extensions cannot be installed"
  echo "  non-interactively — see the per-layer README)."
  echo ""
  echo "  'absent' rows are NOT failures: the host application is not"
  echo "  installed on this machine, so there is nothing to deploy."
  exit 1
fi
