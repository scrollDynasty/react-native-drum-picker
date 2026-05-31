# react-native-drum-picker

[![CI](https://github.com/scrollDynasty/react-native-drum-picker/actions/workflows/ci.yml/badge.svg)](https://github.com/scrollDynasty/react-native-drum-picker/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/scrollDynasty/react-native-drum-picker/badge.svg)](https://codecov.io/gh/scrollDynasty/react-native-drum-picker)
[![npm version](https://img.shields.io/npm/v/react-native-drum-picker.svg)](https://www.npmjs.com/package/react-native-drum-picker)
[![license](https://img.shields.io/github/license/scrollDynasty/react-native-drum-picker.svg)](https://github.com/scrollDynasty/react-native-drum-picker/blob/main/LICENSE)
[![platform - android](https://img.shields.io/badge/platform-Android-3DDC84.svg)](https://reactnative.dev)
[![platform - ios](https://img.shields.io/badge/platform-iOS-000000.svg)](https://reactnative.dev)
[![React Native](https://img.shields.io/badge/React%20Native-%E2%89%A50.76-61DAFB.svg)](https://reactnative.dev)

A smooth **cross-platform native** iOS-style drum/wheel picker for React Native (Fabric / New Architecture).

## Preview

`DateDrumPicker` preview (Android) (day · month · year):

![DateDrumPicker preview — day, month, year columns](https://raw.githubusercontent.com/scrollDynasty/react-native-drum-picker/main/img/image.png)

iOS preview coming soon — see the `ios-build` CI job for validation status.

## Features

- Android native implementation (Kotlin + `RecyclerView`)
- iOS native implementation (Swift + `UIPickerView`)
- iOS-style wheel / drum picker with smooth snapping
- Center selection indicator (optional)
- Transparent background by default
- Custom text colors and sizes
- TypeScript API
- Flexible `DateDrumPicker` wrapper (day / month / year columns)
- Flexible `TimeDrumPicker` wrapper (hour / minute / second / AM·PM columns, 12h or 24h, minute & second intervals)
- Fabric View / New Architecture

## Installation

```sh
yarn add react-native-drum-picker
```

```sh
npm install react-native-drum-picker
```

This package includes **native Android and iOS code**. Rebuild your app after installing:

```sh
npx pod-install
npx react-native run-ios
npx react-native run-android
```

## Platform support

| Platform | Status |
|----------|--------|
| Android | Supported |
| iOS | Supported |
| Web | Fallback (`<select>` element, accessible, no drum animation) |

Requires **React Native 0.76+** with the **New Architecture** enabled.

## Compatibility

| Environment | Status |
|-------------|--------|
| React Native New Architecture | **Required** |
| Fabric | **Required** |
| Android | Supported |
| iOS | Supported |
| iOS Old Architecture (Paper) | Not supported — Fabric required |
| Expo Go | **Not supported** (native library) |
| Expo SDK 54 + dev build / prebuild | Tested |
| `react-native-screens` navigation | Tested (use **0.1.4+** for detach safety) |

### Tested with

| Tool | Version |
|------|---------|
| Expo SDK | 54 |
| React Native | 0.81.5, 0.85.0 (example app) |
| New Architecture | enabled |
| Android | emulator / device |

**Intended range:** `react-native >= 0.76` with New Architecture. The package is **actively tested on RN 0.81.x / 0.85.x**. Older 0.76–0.80 may work but are not CI-guaranteed.

This package is an **Android Fabric View** library. Use a **development build** or `expo run:android` after `expo prebuild` — not Expo Go.

### Web fallback

On web (Expo Web, `react-native-web`, or SSR contexts), `DrumPicker`
renders a native HTML `<select>` element instead of throwing at module
load. This means:

- The library is **SSR-safe** — `import { DrumPicker } from 'react-native-drum-picker'`
  in a server-rendered React app no longer crashes the bundle.
- The web rendering is **keyboard-navigable and screen-reader-friendly by
  default** (browser-provided semantics).
- The `onChange` contract matches native — callers read
  `event.nativeEvent.index` and `event.nativeEvent.value` the same way
  cross-platform, so app code doesn't need a `Platform.OS` branch.

A full drum-style scroll wheel on web is a future enhancement; the
current fallback prioritizes correctness and accessibility.

### React Native 0.81+ event dispatch

If Android Kotlin compile fails with `No value passed for parameter 'uiManagerType'`, upgrade to **0.1.3+** (Fabric `UIManagerType.FABRIC`).

## Basic usage

```tsx
import { DrumPicker } from 'react-native-drum-picker';

export function Example() {
  return (
    <DrumPicker
      items={['Mon 7 Sep', 'Tue 8 Sep', 'Wed 9 Sep']}
      selectedIndex={1}
      itemHeight={44}
      visibleItemCount={5}
      onChange={(event) => {
        console.log(event.nativeEvent.index, event.nativeEvent.value);
      }}
      style={{ width: 150, height: 220 }}
    />
  );
}
```

### Layout defaults (0.1.5+)

The JS wrapper applies **`minWidth: 64`** and, unless you use flex or pass `height` / `minHeight`, **`height: itemHeight * visibleItemCount`** (default **220**). Native Android also sets matching `minimumWidth` / `minimumHeight`.

For production layouts, still pass explicit dimensions:

```tsx
style={{ width: 120, height: itemHeight * visibleItemCount }}
```

In `__DEV__`, a **one-time** warning is logged if neither height nor flex sizing is provided.

## Examples

### Time picker (hour · minute)

```tsx
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <DrumPicker items={hours} style={{ width: 72, height: 220 }} />
  <DrumPicker items={minutes} style={{ width: 72, height: 220 }} />
</View>
```

### Height / weight row (onboarding style)

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <DrumPicker items={heightsCm} style={{ width: 90, height: 220 }} />
  <DrumPicker items={weightsKg} style={{ width: 96, height: 220 }} />
</View>
```

### Controlled `selectedIndex`

```tsx
const [index, setIndex] = useState(1);

<DrumPicker
  items={items}
  selectedIndex={index}
  onChange={(e) => setIndex(e.nativeEvent.index)}
  style={{ width: 120, height: 220 }}
/>
```

### Labeled items: display one thing, receive another

When you want to render human-readable text but receive a typed identifier
(an enum value, database id, country code, etc.) on selection, pass
`{ label, value }` items instead of strings:

```tsx
type CountryCode = 'us' | 'de' | 'jp';

const COUNTRIES: Array<{ label: string; value: CountryCode }> = [
  { label: 'United States', value: 'us' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
];

<DrumPicker<CountryCode>
  items={COUNTRIES}
  onChange={(event) => {
    // event.nativeEvent.value === 'United States'  (the label that was shown)
    // event.nativeEvent.item  === 'us'             (the typed value, fully inferred)
    setCountry(event.nativeEvent.item);
  }}
/>
```

Plain string items keep working exactly as before — for them, `item` simply
equals `value`, so `event.nativeEvent.item` is always safe to read.

`value` can be any type — primitives, ids, or full objects:

```tsx
<DrumPicker
  items={[
    { label: 'United States', value: { id: 1, iso: 'us' } },
    { label: 'Germany',       value: { id: 2, iso: 'de' } },
  ]}
  onChange={(e) => console.log(e.nativeEvent.item.iso)}
/>
```

### `onChange` and expensive side effects

Native emits `onChange` when the wheel **snaps to idle** and the **centered index changes** (duplicate indices are ignored). Use it for UI state. For AsyncStorage, APIs, or analytics, **debounce** in your app:

```tsx
const save = useMemo(() => {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (value: string) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      // persist value
    }, 300);
  };
}, []);

<DrumPicker onChange={(e) => save(e.nativeEvent.value)} ... />
```

See the **example** app (`example/src/App.tsx`) for basic, time, height/weight, date, controlled, and debounced demos.

## DateDrumPicker

Higher-level date columns (TypeScript only). Renders **wheels only** — no built-in titles; add labels in your app if needed.

```tsx
import { useState } from 'react';
import { DateDrumPicker } from 'react-native-drum-picker';

export function DateExample() {
  const [date, setDate] = useState({ day: 21, month: 5, year: 2026 });

  return (
    <DateDrumPicker
      mode="day-month-year"
      value={date}
      onChange={setDate}
    />
  );
}
```

```tsx
<DateDrumPicker
  mode="month-year"
  monthFormat="long"
  minYear={2020}
  maxYear={2035}
  value={{ month: 5, year: 2026 }}
  onChange={(value) => console.log(value)}
/>
```

**Controlled:** pass `value` and update in `onChange`.  
**Uncontrolled:** omit `value`; internal state updates and `onChange` still fires.

Day count follows month/year (e.g. February has 28/29 days).

## API reference

### `DrumPicker`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array<string \| { label: string; value: T }>` | required | Wheel rows. Strings are used as both label and value; labeled items render `label` and report `value` back on `onChange` |
| `selectedIndex` | `number` | `0` | Selected row index |
| `itemHeight` | `number` | `44` | Row height (dp) |
| `visibleItemCount` | `number` | `5` | Visible rows (odd recommended) |
| `textColor` | `string` | `#8E8E93` | Unselected text |
| `selectedTextColor` | `string` | `#1C1C1E` | Selected text |
| `textSize` | `number` | `20` | Unselected size (sp) |
| `selectedTextSize` | `number` | `22` | Selected size (sp) |
| `backgroundColor` | `string` | `transparent` | Root view background |
| `containerBackgroundColor` | `string` | `transparent` | `RecyclerView` background |
| `itemBackgroundColor` | `string` | `transparent` | Row background |
| `showSelectionIndicator` | `boolean` | `true` | Center lines |
| `selectionIndicatorColor` | `string` | `#D1D1D6` | Line color |
| `selectionIndicatorHeight` | `number` | `1` | Line thickness (dp) |
| `hapticFeedback` | `boolean` | `false` | Light haptic on snap (Android + iOS) |
| `onChange` | `function` | — | `nativeEvent: { index, value }` |
| `style` | `ViewStyle` | — | Size and layout |

### `DateDrumPicker`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `DateDrumPickerMode` | `day-month-year` | Which columns to show |
| `value` | `{ day?, month?, year? }` | — | Controlled value |
| `onChange` | `function` | — | `{ day, month, year }` |
| `minYear` | `number` | now − 100 | Year range start |
| `maxYear` | `number` | now + 50 | Year range end |
| `monthFormat` | `'short' \| 'long' \| 'number'` | `short` | Month labels |
| `locale` | `string` | `en` | `Intl` locale for month names |
| `itemHeight` | `number` | `44` | Passed to each column |
| `visibleItemCount` | `number` | `5` | Passed to each column |
| `textColor` | `string` | — | Passed to each column |
| `selectedTextColor` | `string` | — | Passed to each column |
| `textSize` | `number` | — | Passed to each column |
| `selectedTextSize` | `number` | — | Passed to each column |
| `showSelectionIndicator` | `boolean` | — | Passed to each column |
| `selectionIndicatorColor` | `string` | — | Passed to each column |
| `selectionIndicatorHeight` | `number` | — | Passed to each column |
| `backgroundColor` | `string` | `transparent` | Passed to each column |
| `itemBackgroundColor` | `string` | `transparent` | Passed to each column |
| `containerBackgroundColor` | `string` | `transparent` | Passed to each column |
| `hapticFeedback` | `boolean` | `false` | Passed to each column |
| `style` | `ViewStyle` | — | Row container |
| `columnStyle` | `ViewStyle` | — | All columns |
| `columnStyles` | `object` | — | Per column: `day`, `month`, `year` |

### `DateDrumPicker` modes

Column order is left → right:

| `mode` | Columns |
|--------|---------|
| `day` | day |
| `month` | month |
| `year` | year |
| `day-month` | day, month |
| `month-year` | month, year |
| `day-month-year` | day, month, year |
| `month-day-year` | month, day, year |
| `year-month-day` | year, month, day |

```ts
type DateDrumPickerMode =
  | 'day'
  | 'month'
  | 'year'
  | 'day-month'
  | 'month-year'
  | 'day-month-year'
  | 'month-day-year'
  | 'year-month-day';
```

## TimeDrumPicker

A composed wrapper for picking a time of day. It is built on top of `DrumPicker`, so it
inherits the same native rendering, theming, and haptics — no extra native dependencies.

```tsx
import { TimeDrumPicker } from 'react-native-drum-picker';

function Example() {
  const [time, setTime] = useState({ hour: 9, minute: 30 });

  return (
    <TimeDrumPicker
      mode="hour-minute-period"
      value={time}
      minuteInterval={15}
      onChange={setTime}
    />
  );
}
```

Hour values in `value` / `onChange` are **always 24-hour** (`0..23`), regardless of
display mode. The component handles the 12h ↔ 24h conversion internally so callers
do not have to track AM/PM state separately.

### `TimeDrumPicker` props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `TimeDrumPickerMode` | `'hour-minute'` | Which columns to show |
| `value` | `{ hour?: 0..23; minute?: 0..59; second?: 0..59 }` | now | Controlled value (24h) |
| `onChange` | `(value) => void` | – | Called with the full clamped `{ hour, minute, second }` |
| `hourFormat` | `'12' \| '24'` | inferred from `mode` | Force a specific hour column format |
| `minuteInterval` | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 10 \| 12 \| 15 \| 20 \| 30` | `1` | Step between minute items (mirrors `UIDatePicker.minuteInterval`) |
| `secondInterval` | same as `minuteInterval` | `1` | Step between second items |
| `padWithZero` | `boolean` | `true` | Pad single-digit values with `0` |
| `amLabel` / `pmLabel` | `string` | `'AM'` / `'PM'` | Localized period labels |
| `columnTestIDs` | `Partial<Record<'hour' \| 'minute' \| 'second' \| 'period', string>>` | – | Per-column `testID`s |

All shared visual props from `DrumPicker` (`itemHeight`, `visibleItemCount`,
`textColor`, `selectedTextColor`, `textSize`, `selectedTextSize`,
`showSelectionIndicator`, `selectionIndicatorColor`, `selectionIndicatorHeight`,
`backgroundColor`, `itemBackgroundColor`, `containerBackgroundColor`,
`hapticFeedback`) are forwarded to every column.

### `TimeDrumPicker` modes

| Mode | Columns |
|------|---------|
| `hour` | hour |
| `minute` | minute |
| `hour-minute` | hour, minute |
| `hour-minute-second` | hour, minute, second |
| `hour-minute-period` | hour (12h), minute, AM/PM |
| `hour-minute-second-period` | hour (12h), minute, second, AM/PM |

```ts
type TimeDrumPickerMode =
  | 'hour'
  | 'minute'
  | 'hour-minute'
  | 'hour-minute-second'
  | 'hour-minute-period'
  | 'hour-minute-second-period';
```

### Behavior notes

- **Controlled value clamping.** If you pass a value outside the supported range
  (e.g. `minute: 53` with `minuteInterval={15}`), the component clamps to the
  nearest valid value and calls `onChange` once so your state stays in sync with
  what the picker actually shows. This mirrors `DateDrumPicker`'s clamp-and-notify
  contract for invalid February dates.
- **Uncontrolled mode.** Omit `value` and the component manages its own state; it
  initializes from `new Date()`.
- **12h ↔ 24h.** `value` and `onChange` are always 24-hour. Flipping AM/PM keeps
  the displayed 12h hour and shifts the 24h hour by ±12.

## Accessibility

`DrumPicker` accepts an `accessibilityLabel` prop. It is forwarded to the
native view's `accessibilityLabel` and, on web, to the `<select>` element's
`aria-label` (defaults to `Picker`).

`DateDrumPicker` and `TimeDrumPicker` render multiple columns and give each a
distinct default label (`Day` / `Month` / `Year`,
`Hour` / `Minute` / `Second` / `AM/PM`) so assistive technologies can tell the
wheels apart instead of announcing every column as "Picker". Override per
column with `columnAccessibilityLabels`:

```tsx
<TimeDrumPicker
  mode="hour-minute"
  columnAccessibilityLabels={{ hour: 'Hours', minute: 'Minutes' }}
/>
```

## Styling

Backgrounds are **transparent by default**. Only text and optional indicator lines are visible.

```tsx
<DrumPicker
  items={['Small', 'Medium', 'Large']}
  selectedTextColor="#111827"
  textColor="#9CA3AF"
  selectionIndicatorColor="#D1D1D6"
  backgroundColor="transparent"
  style={{ width: 120, height: 220 }}
/>
```

Use an **odd** `visibleItemCount` (e.g. `5`) for a symmetric wheel.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Must rebuild after install | Native library — run a full Android rebuild |
| Metro shows old code | `npx react-native start --reset-cache` |
| Gradle / build errors | `cd android && ./gradlew clean` (Windows: `.\gradlew clean`) |
| `adb` not found | Install Android SDK Platform-Tools; add to `PATH` |
| Empty or white picker | Enable New Architecture; upgrade to **0.1.5+** for layout defaults; or set `style={{ width, height: itemHeight * visibleItemCount }}` |
| Wrong initial row / off-center | Upgrade to **0.1.5+**; avoid `key` remount hacks unless needed for other reasons |
| Props not applied | Rebuild app after native changes; run `yarn build` in the library before packing |
| iOS build issues | Run `pod install` in `example/ios`; use New Architecture; see [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Expo Go | Use prebuild + dev build; this library is not in Expo Go |
| RN 0.81 `uiManagerType` compile error | Upgrade to 0.1.3+ |
| Crash when leaving a screen | Upgrade to 0.1.4+ (safe `onDetachedFromWindow` with react-native-screens) |
| npm shows “no README” | Often a registry UI lag; run `npm view react-native-drum-picker readme` — if content appears, hard-refresh the package page |

### Android build fails in Expo / React Native 0.81+

```sh
cd android
./gradlew clean
```

Windows:

```sh
cd android
.\gradlew clean
```

Then rebuild the native app (`npx expo run:android` or `npx react-native run-android`).

### Crash when leaving a screen

If the app crashes when navigating away from a screen with `DrumPicker` (especially with `react-native-screens` transitions), upgrade to **0.1.4+**, which avoids unsafe RecyclerView cleanup during `onDetachedFromWindow`.

**New Architecture:** This library is a Fabric view. Ensure New Architecture is enabled in your app (required for RN 0.76+).

## Development & contributing

```sh
git clone https://github.com/scrollDynasty/react-native-drum-picker.git
cd react-native-drum-picker
yarn
yarn build
cd example
yarn android   # or yarn ios
```

Before a pull request:

```sh
yarn lint
yarn build
yarn typecheck
yarn test
```

**Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md) — setup, where to put code and tests, what CI runs on every PR, and review checklist.  
**Example app:** [example/README.md](./example/README.md).

## License

[MIT](./LICENSE) © Umar Matyokubov
