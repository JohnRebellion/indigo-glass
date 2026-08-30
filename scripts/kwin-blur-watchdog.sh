#!/bin/bash
# Sage Ink — Better Blur resume watchdog
#
# KWin silently drops the better_blur_dx effect across suspend/resume
# (see docs/REFERENCE.md Bug 10). This watchdog listens on the system bus
# for logind's PrepareForSleep signal and re-loads the effect after every
# resume.
#
# Guards:
#   - Only loads when kwinrc has an explicit [Plugins] better_blur_dxEnabled=true
#     (absent key or unreadable config = fail closed, do not load).
#   - If the plugin .so changed on disk since this service started, loading is
#     skipped: KWin still runs the old build in-process, and dlopen'ing the
#     replaced file would mix two builds in one compositor (crash risk on
#     Wayland = dead session). Relogin activates the new build instead.
#   - Holds no logind inhibitor locks — suspend is never delayed by this script.
#
# Usage:
#   kwin-blur-watchdog.sh          # daemon mode (run by systemd user unit)
#   kwin-blur-watchdog.sh --once   # one-shot: ensure effect is loaded, exit

EFFECT="better_blur_dx"
RETRIES=5
RETRY_DELAY=2

log() {
  echo "[kwin-blur-watchdog] $*"
}

# Fail loudly if a required tool is missing — a silent no-op watchdog is
# worse than none (busctl: systemd; gdbus: glib2; kreadconfig6: kf6-kconfig).
for cmd in busctl kreadconfig6 gdbus stdbuf stat; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "missing required command: $cmd — cannot run"
    exit 1
  fi
done

# Baseline the plugin binary KWin loaded this session (service starts with
# the session). A later mtime change means an updated build sits on disk
# that must NOT be dlopen'd into the running compositor.
PLUGIN_SO=""
for p in /usr/lib64/qt6/plugins/kwin/effects/plugins/better_blur_dx.so \
         /usr/lib/qt6/plugins/kwin/effects/plugins/better_blur_dx.so; do
  if [ -e "$p" ]; then
    PLUGIN_SO="$p"
    break
  fi
done
BASELINE_MTIME=""
[ -n "$PLUGIN_SO" ] && BASELINE_MTIME=$(stat -c %Y "$PLUGIN_SO" 2>/dev/null)

plugin_changed_on_disk() {
  [ -n "$PLUGIN_SO" ] && [ -n "$BASELINE_MTIME" ] || return 1
  local now
  now=$(stat -c %Y "$PLUGIN_SO" 2>/dev/null)
  [ "$now" != "$BASELINE_MTIME" ]
}

effect_enabled_in_config() {
  # Fail closed: only an explicit "true" counts. Absent key, unreadable
  # kwinrc, or kreadconfig6 failure all mean "do not touch".
  local enabled
  enabled=$(kreadconfig6 --file kwinrc --group Plugins --key "${EFFECT}Enabled" 2>/dev/null)
  if [ "$enabled" != "true" ]; then
    log "${EFFECT}Enabled is not explicitly true in kwinrc — not loading"
    return 1
  fi
}

effect_loaded() {
  local loaded
  loaded=$(busctl --user get-property org.kde.KWin /Effects org.kde.kwin.Effects loadedEffects 2>/dev/null) || return 1
  [[ $loaded == *"\"${EFFECT}\""* ]]
}

load_effect() {
  busctl --user call org.kde.KWin /Effects org.kde.kwin.Effects loadEffect s "$EFFECT" >/dev/null 2>&1
}

# Ensure the effect is loaded, retrying while KWin settles (e.g. right
# after resume or session start). Returns 0 once loaded or when loading
# is deliberately skipped, 1 if given up.
ensure_loaded() {
  if effect_loaded; then
    return 0
  fi
  effect_enabled_in_config || return 0
  if plugin_changed_on_disk; then
    log "plugin updated on disk — skipping reload, relogin to activate"
    return 0
  fi
  local attempt
  for attempt in $(seq 1 "$RETRIES"); do
    log "$EFFECT not loaded — loading (attempt $attempt/$RETRIES)"
    load_effect
    sleep "$RETRY_DELAY"
    if effect_loaded; then
      log "$EFFECT loaded"
      return 0
    fi
  done
  log "giving up after $RETRIES attempts — is KWin running?"
  return 1
}

if [ "${1:-}" = "--once" ]; then
  ensure_loaded
  exit $?
fi

# Daemon mode: check once at startup, then re-check after every resume.
ensure_loaded || true

log "watching logind PrepareForSleep for resume events"
# Passive signal watch only — takes no delay-inhibitor lock, so suspend is
# never stalled by this process. stderr intentionally NOT suppressed: if
# monitoring fails (bus policy, logind unavailable) the reason must reach
# the journal.
stdbuf -oL gdbus monitor --system --dest org.freedesktop.login1 \
  --object-path /org/freedesktop/login1 |
while IFS= read -r line; do
  case "$line" in
    *PrepareForSleep*false*)
      log "resume detected — verifying $EFFECT"
      ensure_loaded || true
      ;;
  esac
done

# gdbus monitor exited (D-Bus restart / logind gone) — let systemd restart us.
log "monitor pipe closed, exiting for restart"
exit 1
