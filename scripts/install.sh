#!/bin/bash
# Sage Ink — Installation script
# Sets up complete design system: KDE Plasma + GTK + Konsole + Starship + Fastfetch
#
# Tested on: Fedora 43 / Nobara 43, KDE Plasma 6.6+, Wayland
# Should work on: any Plasma 6.6+ distro with kf6/qt6 dev packages
#
# Usage:
#   bash install.sh           # full install
#   bash install.sh --themes-only   # skip Klassy/blur builds, install themes + configs only
#   bash install.sh --dry-run       # show what would be done

set -e

DRY_RUN=false
THEMES_ONLY=false
WITH_GRUB=false

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --themes-only) THEMES_ONLY=true ;;
    --with-grub) WITH_GRUB=true ;;
  esac
done

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "▶ Sage Ink installer"
echo "  Source: $REPO_DIR"
echo "  User: $USER"
echo "  Home: $HOME"
[ "$DRY_RUN" = true ] && echo "  ⚠ DRY RUN — no changes will be made"
echo

run() {
  echo "  $ $*"
  if [ "$DRY_RUN" = false ]; then
    eval "$@"
  fi
}

# Apply a generated INI partial (tokens/out/*.ini) to a KDE config via
# kwriteconfig6, key by key. Keeps the token file as the single source of
# truth instead of duplicating values inline. Skips comments + blank lines.
# Usage: apply_ini_to_config <ini-path> <kde-config-file>
apply_ini_to_config() {
  local ini="$1" cfg="$2" group=""
  if [ ! -f "$ini" ]; then
    echo "  ⚠ generated $ini missing — run: python3 tokens/codegen.py"
    return 0
  fi
  while IFS= read -r line; do
    case "$line" in
      ''|\#*) continue ;;                       # blank / comment
      \[*\]) group="${line#[}"; group="${group%]}" ;;
      *=*)
        local key="${line%%=*}" val="${line#*=}"
        run "kwriteconfig6 --file '$cfg' --group '$group' --key '$key' '$val'"
        ;;
    esac
  done < "$ini"
}

# ─── Detect distro ───
if [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO=$ID
else
  DISTRO=unknown
fi
echo "  Distro: $DISTRO"

# ─── Install packages ───
if [ "$THEMES_ONLY" = false ]; then
  echo
  echo "▶ Installing system packages..."
  case $DISTRO in
    fedora|nobara)
      run "sudo dnf install -y --skip-unavailable \
        cmake extra-cmake-modules git \
        qt6-qtbase-devel qt6-qtdeclarative-devel qt6-qtsvg-devel qt6-qttools-devel \
        kdecoration-devel kf6-kguiaddons-devel kf6-kiconthemes-devel \
        kf6-kwidgetsaddons-devel kf6-kwindowsystem-devel kf6-kcoreaddons-devel \
        kf6-kconfig-devel kf6-kcmutils-devel kf6-kglobalaccel-devel \
        kf6-kdbusaddons-devel kf6-kpackage-devel kf6-kirigami-devel \
        kf6-kirigami-addons-devel kf6-kcrash-devel kf6-kio-devel \
        kf6-knotifications-devel kf6-ki18n-devel kf6-frameworkintegration-devel kwin-devel sassc \
        fastfetch jetbrains-mono-fonts cascadia-code-nf-fonts \
        gtk-murrine-engine adwaita-gtk2-theme"
      # starship + JetBrainsMono Nerd Font installed below (not in F44 repos)
      if ! command -v starship &>/dev/null; then
        run "curl -fsSL https://starship.rs/install.sh | sudo sh -s -- -y"
      fi
      if ! fc-list 2>/dev/null | grep -qi 'JetBrainsMono Nerd'; then
        run "mkdir -p \$HOME/.local/share/fonts/JetBrainsMonoNerd && \
             curl -fsSL -o /tmp/JetBrainsMono.zip https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip && \
             unzip -oq /tmp/JetBrainsMono.zip -d \$HOME/.local/share/fonts/JetBrainsMonoNerd && \
             fc-cache -f \$HOME/.local/share/fonts"
      fi
      ;;
    arch|manjaro)
      run "sudo pacman -S --needed --noconfirm \
        cmake extra-cmake-modules git base-devel \
        qt6-base qt6-declarative qt6-svg qt6-tools \
        kdecoration kguiaddons kiconthemes kwidgetsaddons kwindowsystem \
        kcoreaddons kconfig kcmutils kglobalaccel kdbusaddons kpackage \
        kirigami kcrash kio knotifications kwin \
        starship fastfetch ttf-jetbrains-mono-nerd \
        gtk-engine-murrine"
      ;;
    ubuntu|debian|pop)
      run "sudo apt install -y \
        cmake extra-cmake-modules git build-essential \
        qt6-base-dev qt6-declarative-dev libqt6svg6-dev qt6-tools-dev \
        libkdecorations3-dev libkf6guiaddons-dev libkf6iconthemes-dev \
        libkf6widgetsaddons-dev libkf6windowsystem-dev libkf6coreaddons-dev \
        libkf6config-dev libkf6kcmutils-dev libkf6globalaccel-dev \
        libkf6dbusaddons-dev libkf6package-dev libkf6kirigami-dev \
        libkf6crash-dev libkf6kio-dev libkf6notifications-dev \
        starship fastfetch fonts-jetbrains-mono \
        gtk2-engines-murrine gnome-themes-extra"
      ;;
    *)
      echo "  ⚠ Unknown distro. Install equivalent packages manually."
      ;;
  esac
fi

# ─── Build Klassy from source ───
if [ "$THEMES_ONLY" = false ]; then
  echo
  echo "▶ Building Klassy v6.5.3 from source..."
  run "mkdir -p $HOME/src && cd $HOME/src && rm -rf klassy"
  run "cd $HOME/src && git clone --depth 1 https://github.com/paulmcauley/klassy.git"
  run "cd $HOME/src/klassy && mkdir -p build && cd build && cmake .. \
    -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_TESTING=OFF -DKDE_INSTALL_USE_QT_SYS_PATHS=ON \
    -DBUILD_QT5=OFF -DBUILD_QT6=ON"
  run "cd $HOME/src/klassy/build && make -j\$(nproc)"
  run "cd $HOME/src/klassy/build && sudo make install"
fi

# ─── kwin-effects-better-blur-dx: NOT built (Sage Ink v5, 2026-08-28) ───
# Ink has no translucent surface anywhere, so there is nothing for a
# compositor blur pass to blur. tokens/out/kwinrc-blur.ini (applied below)
# explicitly sets better_blur_dxEnabled=false, so building+installing this
# plugin would only be dormant, sudo-gated dead weight on every machine this
# script runs on. If a glass revival ever happens, restore this block from
# git history (this comment's commit) rather than re-authoring it.

# ─── Install themes ───
echo
echo "▶ Installing GTK theme (SageInk)..."
# Own theme now (2026-08-28) - was WhiteSur-Dark-purple (a third-party
# macOS-style theme, only ever accent-tinted, never actually ink-material).
# Repo-tracked at config/gtk-theme/SageInk, no network clone needed.
run "mkdir -p $HOME/.themes"
run "rm -rf $HOME/.themes/SageInk"
run "cp -r '$REPO_DIR/config/gtk-theme/SageInk' '$HOME/.themes/SageInk'"

echo
echo "▶ Installing Plasma Desktop Theme (SageInk)..."
# Based on Klassy's own kite-indigo companion theme, re-authored opaque and
# hard-edged: sharp corners, opacity forced to 1 throughout, soft shadow
# gradients sharpened to a hold-then-cutoff. Repo-tracked at
# config/plasma-theme/SageInk, no network fetch needed.
run "mkdir -p $HOME/.local/share/plasma/desktoptheme"
run "rm -rf $HOME/.local/share/plasma/desktoptheme/SageInk"
run "cp -r '$REPO_DIR/config/plasma-theme/SageInk' '$HOME/.local/share/plasma/desktoptheme/SageInk'"

echo
echo "▶ Installing icon theme (Papirus-Dark)..."
# Flat, solid, high-contrast - no gradient/blend, matches the opaque ink
# material. Was Tela-circle-purple-dark (circle badges over a soft
# gradient fill); switched 2026-08-28 since Tela's icons blend into dark
# backgrounds instead of reading as solid opaque colour.
if ! rpm -q papirus-icon-theme >/dev/null 2>&1; then
  run "sudo dnf install -y papirus-icon-theme"
fi

# ─── Copy theme assets ───
echo
echo "▶ Installing Sage Ink color schemes + Konsole profile..."
run "mkdir -p $HOME/.local/share/color-schemes $HOME/.local/share/konsole"
# Install BOTH variants' schemes so either can be selected; Sage Ink is default.
# NOTE: the file that used to be LimeGlass.colors/.colorscheme/.profile was
# renamed to SageInk.* (2026-08-28) - its CONTENT was already sage, it had
# just never been renamed to match. There is currently no installable Lime
# Glass option; only Indigo and Sage ship. Regenerate one from
# tokens/out/kde-palette.lime.colors if a lime option is ever wanted again.
run "cp '$REPO_DIR/share/color-schemes/SageInk.colors' '$HOME/.local/share/color-schemes/'"
run "cp '$REPO_DIR/share/color-schemes/IndigoGlass.colors' '$HOME/.local/share/color-schemes/'"
run "cp '$REPO_DIR/share/konsole/SageInk.colorscheme' '$HOME/.local/share/konsole/'"
run "cp '$REPO_DIR/share/konsole/IndigoGlass.colorscheme' '$HOME/.local/share/konsole/'"
run "cp '$REPO_DIR/share/konsole/SageInk.profile' '$HOME/.local/share/konsole/'"
run "cp '$REPO_DIR/share/konsole/IndigoGlass.profile' '$HOME/.local/share/konsole/'"

# ─── Install configs ───
echo
echo "▶ Installing config files..."
run "mkdir -p $HOME/.config/{gtk-3.0,gtk-4.0,fastfetch,plasma-workspace/env,klassy}"
# Klassy 6.5+ reads ~/.config/klassy/klassyrc; older builds read ~/.config/klassyrc.
# Write BOTH so the decoration picks up our config regardless of version.
run "cp '$REPO_DIR/config/klassy/klassyrc' '$HOME/.config/klassyrc'"
run "cp '$REPO_DIR/config/klassy/klassyrc' '$HOME/.config/klassy/klassyrc'"
run "cp '$REPO_DIR/config/starship.toml' '$HOME/.config/starship.toml'"
run "cp '$REPO_DIR/config/fastfetch/config.jsonc' '$HOME/.config/fastfetch/config.jsonc'"
run "cp '$REPO_DIR/config/gtk-3.0/settings.ini' '$HOME/.config/gtk-3.0/settings.ini'"
run "cp '$REPO_DIR/config/gtk-3.0/gtk.css' '$HOME/.config/gtk-3.0/gtk.css'"
run "cp '$REPO_DIR/config/gtk-4.0/settings.ini' '$HOME/.config/gtk-4.0/settings.ini'"
run "cp '$REPO_DIR/config/gtk-4.0/gtk.css' '$HOME/.config/gtk-4.0/gtk.css'"
run "cp '$REPO_DIR/config/plasma-workspace/env/gtk.sh' '$HOME/.config/plasma-workspace/env/gtk.sh'"
run "chmod +x $HOME/.config/plasma-workspace/env/gtk.sh"

echo
echo "▶ Patching kdeglobals (color scheme + widget style + icons)..."
run "kwriteconfig6 --file kdeglobals --group 'General' --key 'ColorScheme' 'SageInk'"
run "kwriteconfig6 --file kdeglobals --group 'KDE' --key 'widgetStyle' 'Klassy'"
run "kwriteconfig6 --file kdeglobals --group 'KDE' --key 'LookAndFeelPackage' 'org.kde.breezedark.desktop'"
run "kwriteconfig6 --file kdeglobals --group 'Icons' --key 'Theme' 'Papirus-Dark'"
run "kwriteconfig6 --file kdeglobals --group 'Appmenu Style' --key 'Style' 'Widget'"
run "kwriteconfig6 --file plasmarc --group 'Theme' --key 'name' 'SageInk'"

echo
echo "▶ Patching kwinrc (Klassy decoration + better-blur-dx)..."
# Driven from the token-generated snippet (tokens/out/kwinrc-blur.ini) so the
# blur strength / noise / brightness / corner-radius stay single-sourced.
apply_ini_to_config "$REPO_DIR/tokens/out/kwinrc-blur.ini" kwinrc

echo
echo "▶ Patching klassyrc corner radius (matches better-blur-dx clip)..."
# WindowCornerRadius from tokens/out/klassy-radius.ini. The full klassyrc was
# copied above; this re-asserts the radius from the token source for parity.
# kwriteconfig6 --file with a bare name targets ~/.config/<name>; Klassy 6.5+
# actually reads ~/.config/klassy/klassyrc, so write the absolute path too.
apply_ini_to_config "$REPO_DIR/tokens/out/klassy-radius.ini" klassyrc
apply_ini_to_config "$REPO_DIR/tokens/out/klassy-radius.ini" "$HOME/.config/klassy/klassyrc"

# The Better Blur resume watchdog is NOT installed any more (Sage Ink v5,
# 2026-08-28). It existed to reload kwin-effects-better-blur-dx after
# suspend, which only matters when the effect is enabled - tokens/out/
# kwinrc-blur.ini (applied above) sets better_blur_dxEnabled=false, so the
# watchdog would fail-closed and no-op forever (it checks that key before
# doing anything, by design). A previously-installed watchdog was found
# still `enabled` (though inactive) on this workstation this session and
# was disabled: `systemctl --user disable kwin-blur-watchdog.service`.
# If a glass revival ever re-enables the effect, restore this block from
# git history (this comment's commit) rather than re-authoring it.

# No global window-opacity rule is written any more (Sage Ink v5,
# 2026-08-28). Ink windows are opaque - tokens.toml [opacity].window_active/
# window_inactive are both 1.00 now (were 0.92/0.85). This block used to
# write a NEW uuidgen-keyed rule on every run, which is non-idempotent: a
# prior run of this exact script left a duplicate/orphaned 88%/85% rule in
# ~/.config/kwinrulesrc that had to be found and removed by hand this
# session, directly contradicting "ink is opaque". Don't recreate it.

if [ "$WITH_GRUB" = true ]; then
  echo
  echo "▶ Installing Sage Ink GRUB theme..."
  # Delegate to the single GRUB deploy path (sync-grub-parity.sh --deploy).
  # That script is the ONE place that copies the theme to /boot, writes
  # GRUB_THEME/BACKGROUND *and GRUB_FONT* (the loadfont guard that enables
  # gfxterm), and regenerates grub.cfg atomically with a syntax check. Keeping
  # a second hand-rolled copy here is what let GRUB_FONT drift out of sync.
  # Invoke directly (not via run()) so the parity script's own --dry-run
  # handling prints the planned GRUB edits instead of being suppressed.
  if [ "$DRY_RUN" = true ]; then
    bash "$REPO_DIR/scripts/sync-grub-parity.sh" --deploy --dry-run
  else
    bash "$REPO_DIR/scripts/sync-grub-parity.sh" --deploy
  fi
fi

echo
echo "▶ Reload KWin (live, no plasmashell restart)..."
run "qdbus-qt6 org.kde.KWin /KWin reconfigure"
# NOTE: plasmashell is intentionally NOT killed - KWin reconfigure applies the
# color scheme + blur live. If a panel widget caches the old accent, log out/in
# (also required for GTK env vars). Kept non-destructive so the running session
# is never interrupted mid-install.

echo
echo "✓ Sage Ink installation complete."
echo
echo "Next steps:"
echo "  1. Append shell snippet to ~/.zshrc:"
echo "     cat $REPO_DIR/shell/zshrc-snippet.zsh >> ~/.zshrc"
echo "  2. Append GTK_THEME export to ~/.profile:"
echo "     cat $REPO_DIR/shell/profile-snippet.sh >> ~/.profile"
echo "  3. Set Konsole default profile:"
echo "     Konsole → Settings → Manage Profiles → set 'SageInk' as default"
echo "  4. Optional: install Microsoft Edge Wayland flags:"
echo "     cp /usr/share/applications/microsoft-edge.desktop ~/.local/share/applications/"
echo "     # Then patch Exec= per config/microsoft-edge.desktop.template"
echo "  5. Logout/login to ensure all GTK env vars propagate"
echo "  6. Optional: install matching GRUB theme:"
echo "     bash $REPO_DIR/scripts/install.sh --with-grub --themes-only"
echo
echo "Documentation: $REPO_DIR/docs/REFERENCE.md"
