# Sage Ink — zsh integration
# Append to ~/.zshrc

# GTK theme env
export GTK_THEME="WhiteSur-Dark-purple"
export GTK_USE_PORTAL=1

# Starship prompt — Sage Ink theme
eval "$(starship init zsh)"

# Fastfetch on shell start (interactive sessions only)
if [[ $- == *i* ]] && command -v fastfetch &>/dev/null; then
  fastfetch
fi

# Backwards-compat alias
alias neofetch='fastfetch'
