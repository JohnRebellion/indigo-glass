## Q1 Commit hygiene

`6bf824d` is the one commit I would correct in history. Your repo rule is explicit that personal-repo commits use the personal identity, while this commit records the employer address. `.mailmap` would only provide a presentation-time mapping for tools that honor it; it would not change the commit object, so it does not actually satisfy that rule. Leaving it is the least disruptive option, but it knowingly preserves a known authorship error.  

Because the commits are already pushed, rewriting `6bf824d` also rewrites the descendants after it, including the merge, exactly as the brief notes. The practical consequence for the chezmoi external is straightforward: an existing clone whose local `main` points into the old history will fetch the rewritten remote but `git pull --ff-only` will refuse to move the local branch to the unrelated rewritten lineage. It will need a reset/reclone/manual reconciliation rather than a fast-forward. A fresh clone after the rewrite is fine. 

So the remedies are:

**Rewrite + force-push**: correct Git identity, satisfies the repo rule, but causes a one-time repair on every existing clone.

**`.mailmap`**: preserves SHAs and makes some history views look cleaner, but the underlying commit still has the wrong email. Good for attribution normalization, not a fix for this repo's rule.

**Leave it**: technically harmless to the tree, but knowingly violates your stated commit identity invariant.

Given there is one contributor and this is a personal repo, I regard rewrite as the clean historical state. The decision to do the irreversible force-push remains yours.

---

## Q2 Guard correctness

The CURRENCY fix is materially better, but its model is still **“detect the immediately preceding token revision,” not “prove repository-wide historical consistency.”** The baseline is explicitly `HEAD` for an uncommitted token edit and `HEAD~1` otherwise. 

That creates the biggest remaining blind spot:

**A stale literal introduced after the token-changing commit can pass silently once that commit is more than one parent behind HEAD.**

Example:

```text
A  token accent = old
B  token accent = new        ← CURRENCY sees this if B is HEAD~1
C  unrelated commit
D  stale hand-typed old hex introduced here
```

At D, tokens equal HEAD, so CURRENCY compares D against `HEAD~1` = C. Both contain `new`; the superseded `old` value is no longer in the one-step comparison, and the stale literal can pass.

A second blind spot is the hard-coded variant set: `for v in indigo lime sage`. If a variant is renamed into a name outside that set, CURRENCY does not inspect the new name. A rename *from* one of those three names is less dangerous than it looks because the old variant's literals become “superseded”; the real hole is variants outside the enumerated set. 

A literal that exists only outside `COLOUR_DIRS` is completely invisible. CURRENCY does not search the repository; it searches only those configured directories. That is a genuine structural blind spot, and it matters directly for things like Fastfetch unless `config/fastfetch` is actually inside that list. 

The `sort`/`comm` point is subtler. Both inherit the same locale, so ordinary locale variation does **not** inherently make one side sorted under a different collation. But `sort -u` is locale-collation based rather than explicitly bytewise. A locale that treats distinct literal spellings as equivalent can collapse entries before `comm` sees them. That is a latent portability problem, not a demonstrated failure from the evidence here. Pinning `LC_ALL=C` around those operations would remove that environmental degree of freedom.

The self-test proves much less than the commit prose implies. It proves exactly one mutation class: **change the active variant's accent by +10°, regenerate, and expect the guard to fail and name four known stale deployables**, plus the clean baseline. 

It does **not** prove:

* a token change two or more commits back is caught;
* every variant is enumerated;
* renamed variants are handled correctly;
* every layer directory is included in `COLOUR_DIRS`;
* every generated accent spelling is found;
* locale-independent behavior;
* stale `accent_hi` / `accent_alt` cases independent of the particular fixture;
* behavior when the token file is absent from `HEAD~1`;
* behavior on a shallow clone or unusual Git state.

So `507d75c` is **correct as a regression fix**, but its claim should be narrower: it closes the tested failure mode, not “historical currency” in general. 

---

## Q3 Host-specific docs

Of the four examples, three are operationally wrong on the second machine; one is merely stale host history.

`~/indigo-glass/` is the clearest problem because the documented commands literally `cd` there. On this host the clone is `~/projects/indigo-glass`, so following the runbook fails immediately. 

`qdbus6` is likewise a bad canonical instruction on the measured machine because it is not installed there; `qdbus` and `qdbus-qt6` exist. That is a command-level portability defect, not harmless prose. 

The claim that `key.txt` is missing is host-state, not architecture. On this machine it is present, so the instruction “skipping encrypted is required” is false here.  

The “absent apps” list is also explicitly host-specific and already contradicted by this machine: Discord is present but undeployed, and SDDM is installed but currently on `sweet-plasma6`.  

What is fine as a dated log is the historical statement that this particular Fedora host lacked `key.txt`, or that the first install was performed from a particular path. The problem is that those facts live inside a document presented as the reusable **Install & Update** procedure.

I would split it into:

`docs/INSTALL-AND-UPDATE.md` → invariant procedure and portable commands.

`hosts/<hostname>.md` or equivalent → clone path, installed apps, key presence, available DBus executable, current deployed themes, odd host conditions.

`hosts/*.toml` → machine-specific sizing/configuration that is already structurally represented there.

The repo has already discovered this architectural boundary for display profiles; the prose lifecycle doc just hasn't followed it yet. 

---

## Q4 Reset script

The core claim is true: it **moves**, rather than deletes, and refuses while `plasmashell` is running. The implementation matches that claim.  

The problem is scope. The wildcards are broader than the documentation's semantic description.

Measured surprises include:

* `~/.config/kwinoutputconfig.json` — monitor/output layout;
* `~/.config/kwinrulesrc` — window rules;
* `~/.config/plasma-localerc` — locale state (`LANG=en_GB.utf8`);
* `~/.config/plasma-nm` — Plasma NetworkManager UI/state;
* `~/.config/kwinrc.bak.*` — KWin backups.

Those are not “theme configuration” in the narrow sense. They are legitimate user state that happens to begin with `kwin` or `plasma`. 

There is also a latent implementation flaw: every destination is `"$BACKUP/$(basename "$src")"`. If two matched paths from different roots ever have the same basename, the backup namespace collides. The current measured set apparently doesn't trigger it, but the script has no protection against it. That makes the wildcard approach more fragile than its simple appearance suggests. 

`/tmp` is acceptable for the intended **single-session reset transaction**. The doc openly states that it disappears on reboot, and the procedure immediately restarts SDDM and verifies the new installation. For that workflow, `/tmp` is a reasonable temporary rollback point. It is not acceptable as the only durable backup, and the document correctly says so. 

So: the script is honest about “move, don't delete,” but its description understates what “Plasma/KWin config” means.

---

## Q5 Wikipedia 0.2.0

The change is **not adequately validated by the current harness**.

The new selector explicitly requires `.skin-theme-clientpref-os` or `.skin-theme-clientpref-night`, but the harness is actually rendering `.skin-theme-clientpref-day`. Therefore the selector containing `.navbox-group` and the other prefixed targets is never exercised. The measured result confirms it: 34 old navbox cells remain untouched. 

That means the commit currently has two different evidentiary states:

* `th.infobox-header` really is fixed, because it was added to the unconditional rule.
* `.navbox-group` / related prefixed targets are **untested in the mode the harness actually renders**.

The rule itself may be correct for a real browser running Wikipedia's night mode. The brief explicitly says the owner's real-browser mode is unknown, so the current evidence cannot establish that. 

The minimal correction I would make is **to fix the harness, not broaden the CSS merely to make the test green**. The CSS comment describes a night-mode-specific conflict; the test should instantiate that mode and then assert the expected navbox result. Otherwise you're quietly turning a test-fixture defect into a style semantic change.

The 12 black-on-ink cells are more serious. They remain at contrast ratio ~1.05 in both versions, and the new change does not touch them. 

I would treat those as a **follow-up only if the repo explicitly considers contrast debt outside this change's scope**. They are not evidence that the new navbox/radius fixes are themselves wrong. But they absolutely should not be described as evidence that Wikipedia 0.2.0 is broadly “fixed”; they are a persistent known failure in the same audited surface.

The new comparison-table rules themselves are conceptually coherent: they repaint background and label together, and they deliberately scope to semantic template classes rather than nuking arbitrary inline-coloured cells. 

---

## Q6 Fastfetch mark

The two ASCII files and the config change belong in **one atomic commit**. The config literally points at those files, and `install.sh` was changed to copy both, so committing only the tracked config diff would create a broken installation path.  

The `~` path is not a current problem: Fastfetch 2.66.0 was actually tested and expands it successfully. Keep it; it is more portable than embedding this machine's username. 

The colour literals are actually well chosen conceptually: `#C0E3C0` and `#89A889` correspond to the active `accent_hi` and `accent_alt`. The right mechanism here is **not another generator**. Keep Fastfetch as a hand-authored layer, but make sure `config/fastfetch` is inside `COLOUR_DIRS`. Then CURRENCY will catch the old literals when those token-derived colours move. The current self-test should also add `config/fastfetch/config.jsonc` to its expected stale-deployable list, otherwise the guard could regress in that directory while still reporting its current three tests as green.  

The untracked 2.4 MB research directory should **not** be made an accidental dependency of the shipped config. Right now the comment points at it, creating a dangling provenance reference if the research is ignored. Either put a small stable provenance note in a committed docs location, or remove the path reference from the config comment. There is no need to drag 64 PNGs and 57 SVGs into the main shipping history just to preserve that relationship. 

One concrete documentation error also needs fixing: the mark measures **29 columns / 23 columns**, while `REFERENCE.md` says **30 / 24**. Either the asset dimensions are intentional and the docs are wrong, or the asset needs one more column. Don't leave both statements in circulation. 

---

## Q7 What is missing

The biggest missing piece is an **identity guard**. You had an explicit repo-wide rule for commit identity and still landed one employer-address commit. The existing pre-commit infrastructure proves hooks are viable; it just guards palette drift, not authorship. A lightweight pre-commit check rejecting a non-personal `GIT_AUTHOR_EMAIL` would eliminate this exact class of mistake before it becomes history.  

Second, the guard needs a **broader mutation test matrix**, not just the successful 10° active-accent fixture. The current test is excellent as a regression test for the bug you found, but it is not yet a coverage test for the guard as a whole. 

Third, the browser harness needs **mode-specific fixtures**. Adding a second URL is good, but the new CSS selector depends on a DOM state the harness never enters. The important missing artifact isn't another screenshot; it's a test fixture that explicitly exercises the selectors' intended mode.

Fourth, the repo needs a **clean separation between portable procedure and host observations**. The existing host-profile structure is already the right conceptual home; the install document is currently mixing those two layers.

Fifth, shipped hand-authored assets need **dependency completeness checks**. Fastfetch exposed the exact failure mode: a tracked config plus untracked required payloads can look “mostly committed” while the installer is incomplete. A simple package/install manifest assertion would catch that class.

---

## Q8 What measurement would change your answer

For Q1, the decisive measurement is the actual **clone topology**: whether any chezmoi external or working clone is currently at the old `main` history. A scratch remote with the rewritten graph plus an old clone doing `git pull --ff-only` would make the breakage concrete rather than theoretical.

For Q2, the useful experiment is a four-case mutation matrix: token change one commit back, token change two+ commits back, renamed/new variant, and a stale literal under a directory outside `COLOUR_DIRS`; run each under `LC_ALL=C` and a UTF-8 locale. That would tell you which “holes” are real rather than merely structurally possible.

For Q5, the decisive measurement is a harness render where Wikipedia's `<html>` is actually in **night mode**, followed by assertions that `.navbox-group` changes and the 12 contrast failures are either resolved or explicitly classified as known debt. Right now that is the missing experiment.

---

## Ranked findings

High | `6bf824d` | commit carries the employer email despite the personal-repo identity rule | pushed history contains `John.Rebellion@mtusa.com`; all other commits use the personal identity 

High | `browser/stylus/sites/wikipedia.user.css` / `scripts/style-check/check.mjs` | 0.2.0's new night-mode selector is not exercised by the harness | harness renders `clientpref-day`; 34 navbox cells remain unchanged 

High | `scripts/check-palette-drift.sh` | CURRENCY only compares against `HEAD`/`HEAD~1`, so older token changes can age out of detection | baseline logic is explicitly one revision deep 

High | `config/fastfetch/config.jsonc` | tracked config currently depends on two untracked payload files | installer copies both files, so they are required shipped artefacts  

Medium | `scripts/reset-to-stock-kde.sh` | `plasma*`/`kwin*` sweep user state broader than the theme description | measured monitor layout, window rules, locale, NetworkManager UI state, and KWin backups are included 

Medium | `docs/INSTALL-AND-UPDATE.md` | reusable runbook contains machine-specific paths, command availability and app state | current host contradicts several of those claims 

Low | `docs/REFERENCE.md` | Fastfetch mark dimensions are documented incorrectly | measured 29/23 columns vs documented 30/24 

Low | `config/fastfetch/config.jsonc` | provenance comment points at an untracked 2.4 MB research tree | reference becomes dangling unless that research directory is shipped 

---

## Rejected as non-issues

The generated-output policy is internally coherent; the measurements show `codegen.py --check` clean and no forbidden generated files touched. 

The `Co-Authored-By: Claude Opus 5` trailers are not themselves a Git hygiene defect.

The `hosts/README` DPI correction looks sound; the reported arithmetic matches the stated values. 

The reset script's refusal while `plasmashell` is alive and its use of `mv` rather than `rm` are exactly what the implementation claims. 

The two footer attribution plates and the deliberate Wikipedia vendor colour exception are explicitly scoped decisions, not accidental palette drift. 

The `~` Fastfetch source path is empirically valid on the tested Fastfetch version, so changing it just for aesthetic purity would be churn. 

---

## Confidence and caveats

Confidence is high on Q1, Q3, Q4, Q5's harness mismatch, and Q6's packaging dependency because those are directly demonstrated measurements.

The main caveat is Q2: the brief does not expose the actual `COLOUR_DIRS` definition or every surrounding guard filter, so I would not claim that `config/fastfetch` is definitely outside the scan without that line of code. The structural warning is certain; the specific Fastfetch coverage is not.

I would also not call the Wikipedia 0.2.0 CSS itself wrong solely because the harness is in day mode. The defensible conclusion is narrower: **the change is insufficiently validated, and the current audit cannot substantiate its night-mode-specific claims.** 

**Net:** the guard fix is a real improvement, the documentation work is mostly substantively good, and the repo is not suffering from fundamental architectural sloppiness. But I would **not land the current working tree unchanged**: fix the Wikipedia fixture/audit boundary, make the Fastfetch payload atomic, remove host facts from the generic runbook, and decide explicitly whether you're cleaning the pushed author history or accepting that one permanent exception.
