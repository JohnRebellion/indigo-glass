# Stock VS Code theme: Dark Modern

VS Code's default dark colour theme ("Dark Modern") and the two files it
`include`s, frozen byte-for-byte for the `vscode` layer on `/components/`.

| File | Origin |
| :--- | :--- |
| `dark_modern.json` | https://raw.githubusercontent.com/microsoft/vscode/2ec783d855253a817b5787fb48bc6c3d8d31c0c5/extensions/theme-defaults/themes/dark_modern.json |
| `dark_plus.json` | https://raw.githubusercontent.com/microsoft/vscode/2ec783d855253a817b5787fb48bc6c3d8d31c0c5/extensions/theme-defaults/themes/dark_plus.json |
| `dark_vs.json` | https://raw.githubusercontent.com/microsoft/vscode/2ec783d855253a817b5787fb48bc6c3d8d31c0c5/extensions/theme-defaults/themes/dark_vs.json |

- Repository: microsoft/vscode, branch `main`
- Commit: `2ec783d855253a817b5787fb48bc6c3d8d31c0c5` (committed 2026-09-25T06:36:53Z)
- Fetched: 2026-09-25
- Licence: MIT (Microsoft Corporation)

The files are JSONC (`//` comments, trailing commas), as VS Code reads them.
`dark_modern.json` includes `dark_plus.json`, which includes `dark_vs.json`;
the including file's `colors` win. Keys none of the three sets fall back to
VS Code's colour registry defaults (`src/vs/platform/theme/common/colors/*.ts`
and `src/vs/workbench/common/theme.ts` at the same commit); the handful the
layer needs are tabulated in
`simulator/src/lib/components/layers/vscode/theme.ts`, not vendored here.
