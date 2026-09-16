# Install & Update — Sage Ink on Fedora KDE Plasma 6

The lifecycle for landing (and later re-landing) the Sage Ink stack on a
Plasma 6 host managed by [chezmoi](https://chezmoi.io). Companion to
[`../CLAUDE.md`](../CLAUDE.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), and
`scripts/install.sh`.

## Layout

- `~/indigo-glass/` — the working clone you edit and read (repo `indigo-glass`).
- `~/.local/share/chezmoi-externals/indigo-glass/` — the chezmoi-managed clone
  used by the run_onchange installer. Separate from the working clone; refreshed
  every 168 h. Do not edit here.
- `~/.local/share/chezmoi/` — chezmoi source tree (repo `dotfiles`), holds
  `.chezmoiexternal.toml` + the `run_onchange_after_60-install-indigo-glass.sh.tmpl`
  script that fires the installer on chezmoi apply.
- `~/.config/chezmoi/key.txt` — age identity, **manually copied** to each host.
  Missing on this fedora box → all `chezmoi apply` calls exclude encrypted.

## First-time install (this fedora box)

The current host had **LimeGlass** applied (color scheme + Konsole profile) with
**Klassy** decoration and **WhiteSur-Dark** GTK. The plan wipes those, lets
Plasma rebuild defaults, then lays Sage Ink on top.

### 1. Pull all sources

```bash
cd ~/.local/share/chezmoi && git pull --ff-only
cd ~/.claude-public       && git pull --ff-only
cd ~/indigo-glass         && git checkout main && git pull --ff-only
cd ~/.claude              && git pull            # merge (session sync)
```

Notes:
- `~/.claude` uses merge (not rebase) per session-sync convention. Stash local
  session jsonl files if `pull` aborts, then pop after.
- `~/.claude-public` vendored `claude/skills/color-expert` directly in
  2026-08+. If a legacy nested clone still lives at
  `claude/skills/color-expert/.git`, move it to `/tmp/` first — otherwise pull
  aborts with "would be overwritten by merge".

### 2. Land config (skip installer)

```bash
chezmoi apply --exclude=encrypted,scripts --force
```

- `encrypted` — this host has no `key.txt`; `.gnupg/*.age` and `.ssh/*.age`
  cannot decrypt. Skipping is required.
- `scripts` — suppresses the run_onchange installer so it does not fire during
  the reset window (installer runs manually in step 4).
- `--force` — accept upstream on any file that drifted since chezmoi last wrote
  it. Any drift on `~/.config/kdeglobals` is about to be wiped anyway.

This step also clones `~/.local/share/chezmoi-externals/indigo-glass` if
missing.

### 3. Reset to stock KDE (destructive; needs logout)

The reset moves — never deletes — every Plasma/KWin/Klassy config to a
timestamped `/tmp` directory, then rebuilds sycoca. On next login Plasma
rebuilds defaults.

```bash
# from a Plasma session
loginctl terminate-session $XDG_SESSION_ID    # or logout from menu
# switch to TTY (Ctrl+Alt+F3), log in as johnn
bash ~/indigo-glass/scripts/reset-to-stock-kde.sh
sudo systemctl restart sddm                    # back to greeter
# log in; you now have stock Breeze Dark
```

Backed up: `~/.config/plasma*`, `~/.config/kwin*`, `~/.config/kdeglobals`,
`~/.config/klassy`, `~/.config/klassyrc`, `~/.config/kscreenlockerrc`,
`~/.config/ksmserverrc`, `~/.config/kactivitymanagerdrc`,
`~/.local/share/plasma*`, `~/.local/share/kwin`, the IndigoGlass/LimeGlass
color schemes, and the Plasma/KWin caches.

Backup location: `/tmp/kde-reset-<UTCstamp>/`. Keep the folder around until
after you have confirmed the new install is behaving; `/tmp` clears on reboot,
so copy elsewhere if you want it long-term.

### 4. Install Sage Ink

```bash
bash ~/indigo-glass/scripts/install.sh --themes-only
```

Idempotent. Deploys color scheme (`SageInk.colors`), Plasma theme
(`SageInk`), GTK 3/4 theme (`SageInk`), Konsole profile (`SageInk.profile`),
Klassy config, starship prompt, fastfetch splash, GRUB theme. Browser and
editor themes (Edge, VSCode, Vencord, Spicetify, Obsidian) require the host
app to be running and are not part of `--themes-only` — see per-layer READMEs.

### 5. Verify

```bash
bash ~/indigo-glass/scripts/check-deployment.sh
```

Every KDE row should say `deployed`. Rows marked `absent` are host apps that
are not installed on the machine (Discord, Spotify, Obsidian, SDDM, JetBrains)
— those are not failures.

If a KDE row still says `UNDEPLOYED`, the file was written but the running
Plasma session has not picked it up. Restart the affected component:

```bash
plasmashell --replace &                        # panel + widget theme
qdbus6 org.kde.KWin /KWin reconfigure          # window deco + kwin scripts
```

## Updating later

When any of these change upstream, the update cadence is:

```bash
# refresh the four sources
cd ~/.local/share/chezmoi && git pull --ff-only
cd ~/indigo-glass         && git pull --ff-only
cd ~/.claude              && git pull
cd ~/.claude-public       && git pull

# land config + re-run installer via chezmoi's run_onchange hook
chezmoi apply --exclude=encrypted
```

`--exclude=scripts` is dropped on the update path so the installer fires. The
hook is gated on the sha of the chezmoi-external's `main` ref, so the installer
runs iff indigo-glass has actually changed since the last apply.

To force a reinstall without an upstream change:

```bash
bash ~/indigo-glass/scripts/install.sh --themes-only
```

## Rollback

If the new install misbehaves:

```bash
STAMP=$(ls -1t /tmp | grep '^kde-reset-' | head -1)
# stop plasma first (log out to TTY)
cp -a /tmp/$STAMP/. ~/.config/                 # or mv per-directory
kbuildsycoca6 --noincremental
# log back in
```

The IndigoGlass and LimeGlass `.colors` and Konsole `.profile` files are
inside the backup — the whole legacy variant is recoverable.

## Other hosts

- **nobara-wsl2** — no KDE session; the installer's KDE steps no-op harmlessly,
  but running `install.sh --themes-only` still deploys GTK, Konsole (if
  installed), starship, fastfetch. `key.txt` missing here too, so
  `chezmoi apply --exclude=encrypted` still applies. Do not run the reset
  script (there is no Plasma to reset).
- **acer-a514-54** — same fedora pattern as this box. Copy `key.txt` first if
  the machine needs decrypted sources; otherwise the same `--exclude=encrypted`
  path works.
- **desktop-5700x3d (nobara)** — Nobara ships its own KDE customizations; the
  reset script backs those up too. Restore them from `/tmp/kde-reset-<stamp>/`
  if you want the Nobara defaults back after uninstalling Sage Ink.

## Provenance

- 2026-09-16 — first written. Fedora 44 KDE 6 Wayland, migrating LimeGlass →
  SageInk. Companion `~/indigo-glass/scripts/reset-to-stock-kde.sh` created same session.
