# Contributing

Thank you for helping improve **react-native-drum-picker**. This guide explains how to set up the project, where to put your changes, and what happens when you open a pull request.

Please read the [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Quick start

1. **Fork** the repo and clone your fork (or clone upstream and create a branch).
2. Install dependencies and build the library (see [Project setup](#project-setup)).
3. Make changes in the right folders (see [Repository layout](#repository-layout)).
4. Try the **example** app (`example/`) on a device or emulator.
5. Run [checks before a PR](#checks-before-opening-a-pr).
6. Open a **pull request** targeting `main` — [CI runs automatically](#what-runs-on-your-pull-request).

For large API or behavior changes, open an [issue](https://github.com/scrollDynasty/react-native-drum-picker/issues) first so we can agree on the approach.

## Requirements

| Tool | Notes |
|------|--------|
| **Node.js** | Version in [`.nvmrc`](./.nvmrc) |
| **Yarn** | 4.x (workspaces) |
| **JDK** | 17+ |
| **Android Studio** | SDK, emulator or device, `adb` |
| **Xcode** (for iOS work) | macOS only; simulator |
| **React Native** | New Architecture (**required**); see example app (RN 0.85) |

You do **not** need to run every CI job locally. At minimum, run lint, build, and unit tests from the repo root before opening a PR.

## Repository layout

| Path | Purpose | Who edits it |
|------|---------|----------------|
| [`src/`](./src/) | Public TypeScript API (`DrumPicker`, `DateDrumPicker`) | Feature / bugfix authors |
| [`src/__tests__/`](./src/__tests__/) | Jest unit & snapshot tests | Same PR as `src/` changes |
| [`android/`](./android/) | Android native view (Kotlin) | Native Android changes |
| [`android/src/androidTest/`](./android/src/androidTest/) | Android instrumented (Espresso) tests | Native behavior you want verified on device |
| [`ios/`](./ios/) | iOS native view (Swift) | Native iOS changes |
| [`ios/DrumPickerTests/`](./ios/DrumPickerTests/) | iOS unit (XCTest) tests | Native iOS behavior |
| [`example/`](./example/) | Demo React Native app (workspaces) | UI demos, manual QA |
| [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | CI pipeline | Only when changing **how** CI runs |

**Rule of thumb:** library code and tests live in the **package root** (`src/`, `android/`, `ios/`). Demo labels and tabs stay in **`example/`** — do not hardcode sample data in `src/` or native library sources.

## Project setup

```sh
git clone https://github.com/scrollDynasty/react-native-drum-picker.git
cd react-native-drum-picker
yarn
yarn build
```

Run the example app (uses the local library via `workspace:*`):

```sh
cd example
yarn android    # or: yarn ios (macOS, after pod install)
```

**iOS pods** (first time or after native dep changes):

```sh
cd example/ios
bundle install --gemfile=../Gemfile
bundle exec pod install
```

**After you change:**

- `src/` — Metro Fast Refresh in the example app (or reload).
- `android/` or `ios/` — rebuild the example app (`yarn android` / `yarn ios`).

See [example/README.md](./example/README.md) for the demo tabs.

## Development workflow

1. Branch from `main` (see [Branch naming](#branch-naming)).
2. Implement the change + tests in the [correct folders](#where-to-add-tests-so-ci-picks-them-up).
3. Verify in `example/` on at least one platform you touched.
4. Run [local checks](#checks-before-opening-a-pr).
5. Open a PR to `main` and fill out the [PR template](./.github/PULL_REQUEST_TEMPLATE.md).
6. Wait for CI — fix anything red; maintainers will review.

## What runs on your pull request

Every PR and push to `main` triggers the [**CI** workflow](https://github.com/scrollDynasty/react-native-drum-picker/actions/workflows/ci.yml). You do **not** register tests manually: if files are in the right place and named correctly, they are included.

| CI job | What it does | Your action |
|--------|----------------|-------------|
| `lint-and-typecheck` | ESLint + `tsc` | Fix reported issues |
| `js-tests` | `yarn build` + `yarn test` (Jest) | Add/update tests under `src/__tests__/` |
| `android-build` | Compile Android AAR / example | Fix Kotlin / Gradle errors |
| `ios-build` | Build iOS / pods | Fix Swift / pod errors |
| `android-instrumented` | Espresso on emulator | Add `*Test.kt` under `android/src/androidTest/` |
| `ios-unit-tests` | XCTest via CocoaPods test spec | Add `*.swift` under `ios/DrumPickerTests/` |
| `all-checks-passed` | Gate — all above must be green | — |

**When you do *not* need to edit CI:** new Jest files, new Espresso/XCTest files, or example-only UI — CI discovers them automatically.

**When you *do* need to edit CI:** new job type, different Gradle task, new emulator/OS version, or new package that requires install steps in the workflow.

## Where to add tests (so CI picks them up)

| You changed… | Add or update tests here | CI job |
|--------------|---------------------------|--------|
| TypeScript API / logic | `src/__tests__/**/*.test.ts(x)` | `js-tests` |
| Android native view | `android/src/androidTest/java/com/drumpicker/*Test.kt` | `android-instrumented` |
| iOS native view | `ios/DrumPickerTests/*.swift` | `ios-unit-tests` |

**Android instrumented notes:**

- Tests must live in package `com.drumpicker` under `android/src/androidTest/`.
- They run in a small `TestActivity`, not the full RN example app.

## Checks before opening a PR

**Minimum (every PR):**

```sh
yarn lint
yarn build
yarn typecheck
yarn test
```

**If you changed `package.json` dependencies:** commit an updated `yarn.lock`. CI uses `yarn install --immutable` and fails if the lockfile is out of date.

**Optional locally (slower, matches CI):**

```sh
# Android instrumented (device/emulator)
cd example/android
./gradlew :react-native-drum-picker:connectedDebugAndroidTest

# iOS unit tests (macOS)
cd example/ios
bundle exec pod lib lint ../../DrumPicker.podspec --test-specs=Tests --platforms=ios --allow-warnings
```

## How CI checks your work (plain overview)

Think of CI as **layers**, from fast to slow:

1. **Static checks** — Do files lint and typecheck? Does the library compile to `lib/`?
2. **Jest** — Does the TypeScript API behave as expected in Node (with mocks)? Fast, no emulator.
3. **Native compile** — Do Android and iOS native projects still build?
4. **Native unit tests** — Android Espresso and iOS XCTest run the **native view only** (scroll, props, selection) on emulators/simulators.

GitHub runs these jobs on a clean machine with your PR branch. If you add `src/__tests__/MyFeature.test.tsx`, job `js-tests` runs it automatically — no YAML change.

## Pull request checklist

- [ ] Tested on **Android** and/or **iOS** (whichever platforms you changed)
- [ ] `yarn lint`, `yarn build`, `yarn typecheck`, `yarn test` pass locally
- [ ] Tests added or updated in the [right folder](#where-to-add-tests-so-ci-picks-them-up)
- [ ] Docs/README updated if the **public API** changed
- [ ] Types/codegen updated if props or Fabric spec changed
- [ ] No debug logs in library code (`Log.`, `console.log` in `src/` / native lib)
- [ ] No demo-only strings or sample data in `src/`, `android/`, or `ios/` library code
- [ ] No unnecessary dependencies
- [ ] Native changes reviewed for leaks and scroll performance

Use the [pull request template](./.github/PULL_REQUEST_TEMPLATE.md).

## Branch naming

- `feat/...` — new feature
- `fix/...` — bug fix
- `docs/...` — documentation only
- `chore/...` — tooling, CI, deps
- `refactor/...` — internal refactor without API change

## Commit messages

Clear prefixes help reviewers:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `test:` tests only
- `chore:` maintenance
- `refactor:` code structure

## Code style

### TypeScript (`src/`)

- Keep the public API small and stable.
- Native entry: `DrumPicker.native.tsx`; web stub: `DrumPicker.tsx`.
- Avoid new dependencies unless necessary.

### Kotlin (`android/`)

- No Android `NumberPicker` or third-party wheel libraries.
- In `onDetachedFromWindow`, clean up only what this view owns — do **not** set `recyclerView.adapter = null` during screen transitions (`react-native-screens`).
- Avoid heavy work every scroll frame; prefer throttled updates.
- Do not hold `Activity` references on the view.

### Swift (`ios/`)

- Match existing `DrumPickerWheelView` patterns and Fabric bridge APIs.
- Keep delegate/callback lifetimes safe when the view is removed from the hierarchy.

## CodeQL

Advanced CodeQL runs separately (`.github/workflows/codeql.yml`). If it fails with *default setup is enabled*, see [.github/CODEQL.md](./.github/CODEQL.md) (repository admins).

## Reporting bugs

[Open a bug report](https://github.com/scrollDynasty/react-native-drum-picker/issues/new?template=bug_report.md) with RN version, library version, platform, New Architecture yes/no, steps to reproduce, and logs.

## Feature requests

[Open a feature request](https://github.com/scrollDynasty/react-native-drum-picker/issues/new?template=feature_request.md). For large API changes, discuss in an issue before coding.

## Questions

[GitHub Discussions](https://github.com/scrollDynasty/react-native-drum-picker/discussions) or the [question template](https://github.com/scrollDynasty/react-native-drum-picker/issues/new?template=question.md).

## Publishing (maintainers only)

Releases use [release-it](https://github.com/release-it/release-it). Before release:

```sh
yarn install
yarn lint
yarn build
npm pack --dry-run
```

Confirm `npm pack --dry-run` lists `package/README.md`. Do not commit secrets or `.env` files.

If `package.json` `peerDependencies` change, commit **`yarn.lock`**.
