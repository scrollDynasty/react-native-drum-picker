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
| Web | Not supported |

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

### Live sync between pickers

Use `onValueChanging` to update a preview while the user is still scrolling — before they lift their finger:

```tsx
const [previewIndex, setPreviewIndex] = useState(1);

<DrumPicker
  items={['AM', 'PM']}
  onValueChanging={({ nativeEvent }) => {
    setPreviewIndex(nativeEvent.index);
  }}
  onChange={({ nativeEvent }) => {
    setPreviewIndex(nativeEvent.index);
  }}
/>
```

`onValueChanging` can fire many times per second while the wheel moves. Keep the handler light; for UI updates prefer a ref or debounce/`requestAnimationFrame` instead of heavy `setState` on every tick. Use `onChange` for the final committed value.

See the **example** app (`example/src/App.tsx`) for basic, time, height/weight, date, controlled, and debounced demos.

## Imperative ref API

Control the picker programmatically using a ref:

```tsx
import { useRef } from 'react';
import { Button } from 'react-native';
import DrumPicker, { type DrumPickerRef } from 'react-native-drum-picker';

const months = ['Jan', 'Feb', 'Mar', 'Jun'];

function MyPicker() {
  const ref = useRef<DrumPickerRef>(null);

  return (
    <>
      <DrumPicker
        ref={ref}
        items={months}
        onChange={({ nativeEvent }) => console.log(nativeEvent.value)}
      />
      <Button
        title="Jump to June"
        onPress={() => ref.current?.scrollToValue('Jun')}
      />
      <Button
        title="Reset to first"
        onPress={() => ref.current?.scrollToIndex(0, { animated: true })}
      />
    </>
  );
}
```

### DateDrumPicker ref — "Today" button

```tsx
import { useRef } from 'react';
import { Button } from 'react-native';
import {
  DateDrumPicker,
  type DateDrumPickerRef,
} from 'react-native-drum-picker';

const today = new Date();
const dateRef = useRef<DateDrumPickerRef>(null);

<>
  <DateDrumPicker ref={dateRef} mode="day-month-year" onChange={setDate} />
  <Button
    title="Today"
    onPress={() =>
      dateRef.current?.scrollToDate(
        {
          day: today.getDate(),
          month: today.getMonth() + 1,
          year: today.getFullYear(),
        },
        { animated: true }
      )
    }
  />
</>;
```

### DrumPickerRef API

| Method | Description |
|--------|-------------|
| `scrollToIndex(index, options?)` | Scroll to index. Clamped to valid range. |
| `scrollToValue(value, options?)` | Scroll to first matching value. No-op if not found. |
| `getCurrentIndex()` | Returns current selected index. |
| `getCurrentValue()` | Returns current selected value string. |

### DateDrumPickerRef API

| Method | Description |
|--------|-------------|
| `scrollToDate(date, options?)` | Scroll columns to given date. Partial updates supported. |
| `getCurrentDate()` | Returns `{ day, month, year }` of current selection. |

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

`onValueChanging`, if used, receives the column key first: `(column, event) => …` where `column` is `'day' | 'month' | 'year'`.

## withVirtualized

For large item lists (cities, timezones, country codes), wrap `DrumPicker` with `withVirtualized` to render only items near the visible window:

```tsx
import { DrumPicker, withVirtualized } from 'react-native-drum-picker';

const VirtualizedDrumPicker = withVirtualized(DrumPicker);

const CITIES = ['Tashkent', 'Moscow', 'London', /* ... */]; // 1000+ items

<VirtualizedDrumPicker
  items={CITIES}
  selectedIndex={selectedIndex}
  windowSize={20} // items above + below visible area (default: 20)
  onChange={({ nativeEvent }) => setIndex(nativeEvent.index)}
/>;
```

`windowSize` controls the render buffer. Higher = smoother fast flings, higher memory. Default of 20 works for most cases.

Optional `windowRecenterDebounceMs` (default `100`) debounces slice recentering when you reach the first or last row of the current window — this prevents scroll feedback loops during fast flings on large lists.

**Platforms:** iOS and Android only (wrap `DrumPicker` from the package — not web). The native wheel always receives a small sliced `items` array on both platforms.

**Requirements:** each entry in `items` must be a **unique** string. Duplicate labels break index recovery during slice swaps and on iOS tap hit-testing.

Not intended for `DateDrumPicker` (small fixed column lists).

`onValueChanging` is supported: indices are remapped to the full list (same as `onChange`), so live preview works on large lists.

### `withVirtualized(DrumPicker)` props

In addition to all `DrumPicker` props (on the wrapped instance):

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `windowSize` | `number` | `20` | Rows rendered above and below the selection |
| `windowRecenterDebounceMs` | `number` | `100` | Debounce before shifting the slice when scrolling hits the window edge |

## API reference

### `DrumPicker`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `string[]` | required | Wheel labels |
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
| `enableScrollByTapOnItem` | `boolean` | `false` | Tap a visible row to scroll it to center (Android + iOS) |
| `onChange` | `function` | — | `nativeEvent: { index, value }` |
| `onValueChanging` | `function` | — | Fires on each scroll tick while dragging. Use for live sync; debounce heavy UI work. |
| `style` | `ViewStyle` | — | Size and layout |

### `DateDrumPicker`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `DateDrumPickerMode` | `day-month-year` | Which columns to show |
| `value` | `{ day?, month?, year? }` | — | Controlled value |
| `onChange` | `function` | — | `{ day, month, year }` |
| `onValueChanging` | `function` | — | `(column, event) => …` while scrolling; `column` is `day` / `month` / `year` |
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
| `enableScrollByTapOnItem` | `boolean` | `false` | Passed to each column |
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
