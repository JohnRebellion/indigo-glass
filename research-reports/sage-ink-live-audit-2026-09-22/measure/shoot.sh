#!/bin/bash
# Capture one freshly launched window, window-only (never full screen: a Teams
# PWA with client material is open on this host). Usage:
#   shoot.sh <name> <window-class-regex> <title-regex> -- <launch cmd...>
set -u
out="$(dirname "$0")/../shots"; name=$1; cls=$2; ttl=$3; shift 4
before=$(kdotool search --class "$cls" 2>/dev/null | sort)
setsid "$@" >/dev/null 2>&1 &
for i in $(seq 1 40); do
  sleep 0.5
  now=$(kdotool search --class "$cls" 2>/dev/null | sort)
  new=$(comm -13 <(echo "$before") <(echo "$now") | head -1)
  [ -z "$new" ] && [ "$ttl" != "-" ] && new=$(kdotool search --class "$cls" --name "$ttl" 2>/dev/null | tail -1)
  [ -n "$new" ] && break
done
[ -z "$new" ] && { echo "FAIL $name: no window"; exit 1; }
kdotool windowactivate "$new"; sleep ${SETTLE:-2.5}
spectacle -a -b -n -o "$out/$name.png" 2>/dev/null; sleep 1
echo "$new" > "$out/$name.wid"
echo "OK $name $(identify -format '%wx%h' "$out/$name.png" 2>/dev/null) title=$(kdotool getwindowname $new | cut -c1-60)"
