# Example app

Bare React Native app used to **manually try** the library and to run **Detox E2E** tests in CI. It depends on the local package via Yarn workspaces (`react-native-drum-picker: workspace:*`).

## Run locally

From the **repository root**:

```sh
yarn
yarn build
cd example
yarn start          # Metro, in one terminal
yarn android        # or: yarn ios (macOS)
```

**iOS** (first time or after pod/native changes):

```sh
cd example/ios
bundle install --gemfile=../Gemfile
bundle exec pod install
cd ..
yarn ios
```

## Demo tabs (`src/App.tsx`)

| Tab | Purpose |
|-----|---------|
| Basic | Single `DrumPicker` |
| Time | Hour + minute columns |
| Height / weight | Two pickers in a row |
| Date | `DateDrumPicker` |
| Controlled | External `selectedIndex` |
| Debounce | Debounced `onChange` demo |
| **E2E** | Compact Detox fixtures (`e2e-screen`, `testID`s). Default tab when the app loads. |

Keep **demo-only** labels, buttons, and layout experiments in this app — not in `src/` or `android/` / `ios/` library code.

## Contributing E2E coverage

1. Add or extend UI on the **E2E** tab with stable `testID` props.
2. Add a spec under [`e2e/`](./e2e/) named `*.e2e.ts` (e.g. `my-flow.e2e.ts`).
3. CI runs it automatically on PRs — see [CONTRIBUTING.md](../CONTRIBUTING.md#where-to-add-tests-so-ci-picks-them-up).

Optional local run (emulator/simulator required):

```sh
yarn build:e2e:android && yarn test:e2e:android
yarn build:e2e:ios && yarn test:e2e:ios   # embeds main.jsbundle via scripts/bundle-ios-for-detox.sh
```

Full contributor workflow: [CONTRIBUTING.md](../CONTRIBUTING.md).
