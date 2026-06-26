#!/bin/bash
# Indigo Glass — Installation script
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
echo "▶ Indigo Glass installer"
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

# ─── Build kwin-effects-better-blur-dx ───
if [ "$THEMES_ONLY" = false ]; then
  echo
  echo "▶ Building kwin-effects-better-blur-dx..."
  run "cd /tmp && rm -rf kwin-effects-better-blur-dx"
  run "cd /tmp && git clone --depth 1 https://github.com/xarblu/kwin-effects-better-blur-dx.git"
  run "cd /tmp/kwin-effects-better-blur-dx && mkdir -p build && cd build && cmake .. -DCMAKE_INSTALL_PREFIX=/usr"
  run "cd /tmp/kwin-effects-better-blur-dx/build && make -j\$(nproc)"
  run "cd /tmp/kwin-effects-better-blur-dx/build && sudo make install"
fi

# ─── Install themes ───
echo
echo "▶ Installing GTK theme (WhiteSur-Dark-purple)..."
if [ ! -d "$HOME/.themes/WhiteSur-Dark-purple" ]; then
  run "cd /tmp && rm -rf WhiteSur-gtk-theme"
  run "cd /tmp && git clone --depth 1 https://github.com/vinceliuice/WhiteSur-gtk-theme.git"
  run "cd /tmp/WhiteSur-gtk-theme && ./install.sh -c Dark -t purple -m -N glassy"
fi

echo
echo "▶ Installing icon theme (Tela-circle-purple-dark)..."
if [ ! -d "$HOME/.local/share/icons/Tela-circle-purple-dark" ]; then
  run "cd /tmp && rm -rf Tela-circle-icon-theme"
  run "cd /tmp && git clone --depth 1 https://github.com/vinceliuice/Tela-circle-icon-theme.git"
  run "cd /tmp/Tela-circle-icon-theme && ./install.sh -a -d $HOME/.local/share/icons"
fi

# ─── Copy theme assets ───
echo
echo "▶ Installing Indigo Glass color schemes + Konsole profile..."
run "mkdir -p $HOME/.local/share/color-schemes $HOME/.local/share/konsole"
run "cp '$REPO_DIR/share/color-schemes/IndigoGlass.colors' '$HOME/.local/share/color-schemes/'"
run "cp '$REPO_DIR/share/konsole/IndigoGlass.colorscheme' '$HOME/.local/share/konsole/'"
run "cp '$REPO_DIR/share/konsole/IndigoGlass.profile' '$HOME/.local/share/konsole/'"

# ─── Install configs ───
echo
echo "▶ Installing config files..."
run "mkdir -p $HOME/.config/{gtk-3.0,gtk-4.0,fastfetch,plasma-workspace/env}"
run "cp '$REPO_DIR/config/klassy/klassyrc' '$HOME/.config/klassyrc'"
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
run "kwriteconfig6 --file kdeglobals --group 'General' --key 'ColorScheme' 'IndigoGlass'"
run "kwriteconfig6 --file kdeglobals --group 'KDE' --key 'widgetStyle' 'Klassy'"
run "kwriteconfig6 --file kdeglobals --group 'KDE' --key 'LookAndFeelPackage' 'org.kde.breezedark.desktop'"
run "kwriteconfig6 --file kdeglobals --group 'Icons' --key 'Theme' 'Tela-circle-purple-dark'"
run "kwriteconfig6 --file kdeglobals --group 'Appmenu Style' --key 'Style' 'Widget'"

echo
echo "▶ Patching kwinrc (Klassy decoration + better-blur-dx)..."
# Driven from the token-generated snippet (tokens/out/kwinrc-blur.ini) so the
# blur strength / noise / brightness / corner-radius stay single-sourced.
apply_ini_to_config "$REPO_DIR/tokens/out/kwinrc-blur.ini" kwinrc

echo
echo "▶ Patching klassyrc corner radius (matches better-blur-dx clip)..."
# WindowCornerRadius from tokens/out/klassy-radius.ini. The full klassyrc was
# copied above; this re-asserts the radius from the token source for parity.
apply_ini_to_config "$REPO_DIR/tokens/out/klassy-radius.ini" klassyrc

echo
echo "▶ Adding global window opacity rule (88% active / 85% inactive)..."
UUID=$(uuidgen)
run "kwriteconfig6 --file kwinrulesrc --group '$UUID' --key 'Description' 'Indigo Glass — global window opacity'"
run "kwriteconfig6 --file kwinrulesrc --group '$UUID' --key 'opacityactive' '88'"
run "kwriteconfig6 --file kwinrulesrc --group '$UUID' --key 'opacityactiverule' '2'"
run "kwriteconfig6 --file kwinrulesrc --group '$UUID' --key 'opacityinactive' '85'"
run "kwriteconfig6 --file kwinrulesrc --group '$UUID' --key 'opacityinactiverule' '2'"
run "kwriteconfig6 --file kwinrulesrc --group '$UUID' --key 'wmclass' '.*'"
run "kwriteconfig6 --file kwinrulesrc --group '$UUID' --key 'wmclassmatch' '3'"
run "kwriteconfig6 --file kwinrulesrc --group '$UUID' --key 'wmclasscomplete' 'false'"

if [ "$WITH_GRUB" = true ]; then
  echo
  echo "▶ Installing Indigo Glass GRUB theme..."
  GRUB_SRC="$REPO_DIR/share/grub-theme"
  GRUB_DEST="/boot/grub2/themes/indigo-glass"
  if [ -d "$GRUB_SRC" ]; then
    run "sudo mkdir -p $GRUB_DEST"
    run "sudo cp -r $GRUB_SRC/. $GRUB_DEST/"
    run "sudo cp /etc/default/grub /etc/default/grub.bak.$(date +%Y%m%d-%H%M%S)"
    run "sudo sed -i \"s|^GRUB_THEME=.*|GRUB_THEME='$GRUB_DEST/theme.txt'|\" /etc/default/grub"
    if grep -q '^GRUB_THEME=' /etc/default/grub; then :; else
      run "echo \"GRUB_THEME='$GRUB_DEST/theme.txt'\" | sudo tee -a /etc/default/grub"
    fi
    run "sudo sed -i \"s|^GRUB_BACKGROUND=.*|GRUB_BACKGROUND='$GRUB_DEST/background.jpg'|\" /etc/default/grub"
    if [ -d /boot/grub2 ] && [ -f /boot/grub2/grub.cfg ]; then
      run "sudo grub2-mkconfig -o /boot/grub2/grub.cfg"
    elif [ -d /boot/efi/EFI/fedora ] && [ -f /boot/efi/EFI/fedora/grub.cfg ]; then
      run "sudo grub2-mkconfig -o /boot/efi/EFI/fedora/grub.cfg"
    fi
  else
    echo "  ⚠ $GRUB_SRC missing — skipping GRUB theme"
  fi
fi

echo
echo "▶ Reload KWin + plasmashell..."
run "qdbus-qt6 org.kde.KWin /KWin reconfigure"
run "kquitapp6 plasmashell"
run "sleep 2"
run "kstart plasmashell &"

echo
echo "✓ Indigo Glass installation complete."
echo
echo "Next steps:"
echo "  1. Append shell snippet to ~/.zshrc:"
echo "     cat $REPO_DIR/shell/zshrc-snippet.zsh >> ~/.zshrc"
echo "  2. Append GTK_THEME export to ~/.profile:"
echo "     cat $REPO_DIR/shell/profile-snippet.sh >> ~/.profile"
echo "  3. Set Konsole default profile:"
echo "     System Settings → Konsole → Default Profile → IndigoGlass"
echo "  4. Optional: install Microsoft Edge Wayland flags:"
echo "     cp /usr/share/applications/microsoft-edge.desktop ~/.local/share/applications/"
echo "     # Then patch Exec= per config/microsoft-edge.desktop.template"
echo "  5. Logout/login to ensure all GTK env vars propagate"
echo "  6. Optional: install matching GRUB theme:"
echo "     bash $REPO_DIR/scripts/install.sh --with-grub --themes-only"
echo
echo "Documentation: $REPO_DIR/docs/REFERENCE.md"
