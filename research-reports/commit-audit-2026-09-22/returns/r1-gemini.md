## 1. Commit hygiene

A `.mailmap` file is the correct remedy. Map `John.Rebellion@mtusa.com` to `John Rebellion <johnnecirrebellion@gmail.com>`.

Force-pushing to rewrite `6bf824d` will permanently break the update lifecycle on all three installed machines. `INSTALL-AND-UPDATE.md` documents that both the working clone and the `~/.local/share/chezmoi` sources update via `git pull --ff-only`. If you rewrite history, the chezmoi external clone will abort its pull on the divergence. The `.mailmap` fixes the author attribution in logs without detonating the `--ff-only` update path.

## 2. Correctness of the guard change (`507d75c`)

The guard will silently pass an inconsistent state under these conditions:

* **Locale sorting mismatch:** If `scripts/check-palette-drift.sh` does not explicitly export `LC_ALL=C`, tools like `comm` and `sort` will sort hex strings differently depending on the host's byte-order configuration, silently dropping unmatched literals or masking drift.
* **Unscanned paths:** A hand-typed literal hiding in a directory not explicitly listed in the guard's target array (e.g., if `config/fastfetch` is omitted) will never be diffed against the token outputs.

The self-test proves the guard can catch a hex mismatch against the *current* token state in a throwaway tree. It **does not prove** the guard can detect a superseded accent that was completely deleted. If a legacy token file is removed, the guard has no source of truth to diff the old literals against, which requires the guard to maintain a hardcoded blacklist of old hex values to catch them.

## 3. Docs written on one host, read on another

* **Fundamentally wrong (will fail execution):** The hardcoded `~/indigo-glass/` path (it is cloned at `~/projects/indigo-glass` on the Nobara machine) and the `qdbus6` binary command (the binary is named `qdbus` or `qdbus-qt6` here).
* **Factual but misleading:** Claiming `key.txt` is "missing" and Discord/SDDM are "absent". These are point-in-time facts true only for the authoring host. On this host, `key.txt` and Discord are present, and SDDM is deployed.

Host-specific environmental facts—binary names, paths, absent host apps, and age key statuses—belong in `hosts/README` or `.chezmoiexternal.toml` comments. Baking them into a universal `INSTALL-AND-UPDATE.md` guarantees the document will rot immediately upon execution on a second machine.

## 4. The reset script

No, it does not safely do what it claims. While it successfully moves files and blocks execution if `plasmashell` is alive, the globs are reckless and the backup location is volatile.

**Collateral damage sweep:** By globbing `~/.config/kwin*` and `~/.config/plasma*`, the script destroys configurations the user never intended to wipe during a theme reset. Based on the measurements, the owner will unexpectedly lose:

* `kwinoutputconfig.json` (Monitor layout and resolution)
* `kwinrulesrc` (Custom window rules)
* `plasma-localerc` (System locale settings)
* `plasma-nm` (NetworkManager profiles and WiFi connections)

**The `/tmp` backup risk:** `/tmp` is unacceptably dangerous for a pre-logout destructive backup. The doc instructs the user to log out to a TTY, run the script, and restart SDDM. If SDDM hangs during the restart—a common occurrence when wiping Qt caches—and requires a hard reboot, `/tmp` (typically a `tmpfs` mount) will instantly clear. The user will lose their layout, network config, and all legacy backups permanently.

## 5. The Wikipedia 0.2.0 change

The change makes a claim the harness cannot back. Because the harness renders against Wikipedia's anonymous `skin-theme-clientpref-day` HTML class, the newly added `.skin-theme-clientpref-night` prefix never fires during the audit. The harness is entirely blind to whether the 34 off-palette navbox fills are actually fixed.

**Minimal edit:** Configure the `check.mjs` headless browser to force Wikipedia's night mode layer by appending `?useskintheme=night` to the URL.

The 12 black-on-ink infobox cells should not block the 0.2.0 commit if the goal is to land the navbox fixes. However, the uncommitted `browser/stylus/sites/README.md` must be updated to explicitly document these 12 remaining contrast failures, rather than claiming the file is fixed.

## 6. The fastfetch mark

* **Commit:** The two untracked text files (`sage-ink-mark.txt` and `sage-ink-mark-small.txt`).
* **Archive/Ignore:** The 2.4 MB `research-reports/sage-ink-mark-2026-09-17/` directory violates the repo's artefact retention rule. Extract the Markdown synthesis to commit, and explicitly `.gitignore` or externally archive the 2.3 MB `renders/` folder holding the 122 generator scratch images.
* **Token tying:** Since the hand-typed literals `#C0E3C0` and `#89A889` live inside `config.jsonc`, the `config/fastfetch` directory must be appended to the drift guard's search paths to ensure the script scans the JSONC file against the generated `--ig-accent-hi` token outputs.

## 7. What is missing

The uncommitted working tree contains `research-reports/necir-ph-native-app-2026-09-17/`. This is leaked AI scratch from an entirely unrelated web domain/portfolio project. It violates the repository's isolation boundaries and should have been removed or gitignored before staging.

## 8. What measurement would change your answer

* **Question 2:** If `scripts/check-palette-drift.sh` already explicitly declares `LC_ALL=C` at the top of the file, the locale byte-sorting vulnerability is a non-issue.
* **Question 4:** If `/tmp` on this specific Fedora configuration is mounted on a persistent physical partition rather than `tmpfs`, the KDE reset backup is theoretically safe from a hard reboot.
* **Question 5:** If Wikipedia's upstream CSS actually relies on `clientpref-dark` instead of `clientpref-night` for OS-level media query matching, the 0.2.0 Stylus prefix is fundamentally broken for the owner's real browser, not just untested.