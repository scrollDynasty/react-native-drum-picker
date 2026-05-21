# Contributing

Thank you for helping improve **react-native-drum-picker**. Please read the [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Requirements

- **Node.js** — see [`.nvmrc`](./.nvmrc)
- **Yarn** 4.x (workspaces)
- **Android Studio** (for native debugging)
- **JDK 17+**
- **Android SDK** and **adb**
- A device or emulator with **New Architecture** enabled (React Native 0.76+)

## Project setup

```sh
git clone https://github.com/scrollDynasty/react-native-drum-picker.git
cd react-native-drum-picker
yarn
yarn build
cd example
yarn android
```

The example app uses the local library via Yarn workspaces (`react-native-drum-picker: workspace:*`).

- **JS/TS changes** in `src/` — reload Metro (Fast Refresh).
- **Kotlin changes** in `android/` — rebuild the example app.

## Development workflow

1. Create a branch from `main`.
2. Edit library code in `src/` and/or `android/`.
3. Verify in `example/`.
4. Run checks before opening a PR:

```sh
yarn lint
yarn build
yarn typecheck
```

Before publishing (maintainers):

```sh
yarn install
yarn lint
yarn build
npm pack --dry-run
```

Confirm `npm pack --dry-run` lists `package/README.md`. If you changed `package.json` (especially `peerDependencies`), commit the updated **`yarn.lock`** — CI runs `yarn install --immutable` and fails when the lockfile is out of sync.

**npm page shows “This package does not have a README”** but `npm view react-native-drum-picker readme` prints content: that is usually an npmjs.com UI/cache glitch right after publish. Hard-refresh (Ctrl+F5) or wait a few minutes; the README is still in the tarball.

## Branch naming

- `feat/...` — new feature
- `fix/...` — bug fix
- `docs/...` — documentation only
- `chore/...` — tooling, CI, deps
- `refactor/...` — internal refactor without API change

## Commit messages

Use clear prefixes when possible:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `chore:` maintenance
- `refactor:` code structure

## Pull request checklist

- [ ] Tested on **Android** (example app or consumer app)
- [ ] `yarn lint` passes
- [ ] `yarn build` passes
- [ ] Docs updated if the public API changed
- [ ] Types updated if props/exports changed
- [ ] No debug logs (`Log.`, `console.log` in library code)
- [ ] No hardcoded demo labels/data in `src/` or `android/` (example-only data stays in `example/`)
- [ ] No unnecessary dependencies
- [ ] Native changes reviewed for memory leaks and scroll performance

Use the [pull request template](./.github/PULL_REQUEST_TEMPLATE.md).

## Code style

### TypeScript (`src/`)

- Keep the public API small and stable.
- Platform-specific entry: `DrumPicker.native.tsx` / `DrumPicker.tsx`.
- Do not add dependencies without a strong reason.

### Kotlin (`android/`)

- No **Android `NumberPicker`** and no third-party wheel libraries.
- In `onDetachedFromWindow`, remove only listeners/callbacks this view owns. Do **not** set `recyclerView.adapter = null` or detach `SnapHelper` during screen transitions (react-native-screens).
- Avoid heavy work every scroll frame; prefer throttled style updates.
- Keep `RecyclerView` recycling efficient; avoid full `notifyDataSetChanged()` when a smaller update works.
- Do not store `Activity` references on the view.

## Reporting bugs

Open a [bug report](https://github.com/scrollDynasty/react-native-drum-picker/issues/new?template=bug_report.md) and include:

- React Native version
- Library version (`0.1.4` or git commit)
- Android version
- Device or emulator
- New Architecture enabled (yes/no)
- Minimal reproduction steps
- Logs or stack trace
- Screenshots or GIF for UI issues

## Feature requests

Open a [feature request](https://github.com/scrollDynasty/react-native-drum-picker/issues/new?template=feature_request.md) with:

- Problem / use case
- Proposed API or behavior
- Alternatives considered

For large API changes, open an issue before a PR.

## Questions

Use [GitHub Discussions](https://github.com/scrollDynasty/react-native-drum-picker/discussions) or the [question template](https://github.com/scrollDynasty/react-native-drum-picker/issues/new?template=question.md).

## Publishing (maintainers)

Releases use [release-it](https://github.com/release-it/release-it). Run `yarn release` only after lint/build pass. Do not commit secrets or `.env` files.
