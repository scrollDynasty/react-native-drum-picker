# react-native-drum-picker

Android-native iOS-style drum (wheel) picker for React Native (Fabric / New Architecture).

**Android only.** iOS is not supported in this release.

## Requirements

- React Native 0.76+ (New Architecture enabled)
- Android

## Installation

```sh
npm install react-native-drum-picker
```

Rebuild the Android app after installing (native code).

## Usage

```tsx
import { DrumPicker } from 'react-native-drum-picker';

const items = ['Mon 7 Sep', 'Tue 8 Sep', 'Wed 9 Sep'];

<DrumPicker
  items={items}
  selectedIndex={0}
  itemHeight={44}
  visibleItemCount={5}
  onChange={({ nativeEvent }) => {
    console.log(nativeEvent.index, nativeEvent.value);
  }}
  style={{ width: 150, height: 220 }}
/>;
```

`items` is required and can be any `string[]`. The library does not ship preset dates, hours, or labels.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `string[]` | (required) | Values shown in the wheel |
| `selectedIndex` | `number` | `0` | Initially selected row |
| `itemHeight` | `number` | `44` | Row height (dp) |
| `visibleItemCount` | `number` | `5` | Visible rows (odd recommended) |
| `textColor` | `string` | `#8E8E93` | Unselected label color |
| `selectedTextColor` | `string` | `#1C1C1E` | Selected label color |
| `textSize` | `number` | `20` | Unselected font size (sp) |
| `selectedTextSize` | `number` | `22` | Selected font size (sp) |
| `showSelectionIndicator` | `boolean` | `true` | Center selection lines |
| `selectionIndicatorColor` | `string` | `#D1D1D6` | Line color |
| `selectionIndicatorHeight` | `number` | `1` | Line thickness (dp) |
| `backgroundColor` | `string` | `transparent` | Root native view background |
| `containerBackgroundColor` | `string` | `transparent` | RecyclerView background |
| `itemBackgroundColor` | `string` | `transparent` | Row label background |
| `onChange` | `function` | — | Fires when centered value changes |
| `style` | `ViewStyle` | — | Container size (`width`, `height`, …) |

### DateDrumPicker

Higher-level date columns built on `DrumPicker` (TypeScript only):

```tsx
import { DateDrumPicker } from 'react-native-drum-picker';

<DateDrumPicker
  mode="day-month-year"
  value={{ day: 21, month: 5, year: 2026 }}
  onChange={(value) => console.log(value)}
/>;
```

Modes: `day`, `month`, `year`, `day-month`, `month-year`, `day-month-year`, `month-day-year`, `year-month-day`.

`DateDrumPicker` renders only picker columns (day / month / year wheels). It does **not** render mode labels such as `"day"` or `"day-month"`. Add any captions in your own layout outside the component.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
