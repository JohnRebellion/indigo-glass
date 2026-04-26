# Indigo Glass — bash integration
# Append to ~/.bashrc

export GTK_THEME="WhiteSur-Dark-purple"
export GTK_USE_PORTAL=1
eval "$(starship init bash)"

if [ -t 1 ] && command -v fastfetch &>/dev/null; then
  fastfetch
fi
alias neofetch='fastfetch'
