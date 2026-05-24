# Example app

Bare React Native app to **manually try** the library. It depends on the local package via Yarn workspaces (`react-native-drum-picker: workspace:*`).

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

Keep demo-only labels and layout in this app — not in `src/` or native library code.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for CI and how to add tests.
