# react-native-drum-picker

Android-native iOS-style wheel picker for React Native (Fabric). **Android only** — React Native 0.76+, New Architecture.

## Install

```sh
npm install react-native-drum-picker
```

Rebuild the Android app after install.

---

## DrumPicker

Generic wheel for any `string[]`. You provide `items`; the library does not ship preset lists.

### Basic

```tsx
import { DrumPicker } from 'react-native-drum-picker';

<DrumPicker
  items={['Mon', 'Tue', 'Wed']}
  selectedIndex={0}
  onChange={({ nativeEvent }) => {
    console.log(nativeEvent.index, nativeEvent.value);
  }}
  style={{ width: 150, height: 220 }}
/>
```

`height` ≈ `itemHeight * visibleItemCount` (default `44 * 5 = 220`).

### Controlled value

```tsx
const [index, setIndex] = useState(0);

<DrumPicker
  items={hours}
  selectedIndex={index}
  onChange={(e) => setIndex(e.nativeEvent.index)}
/>
```

### Time columns (hour + minute)

```tsx
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

<View style={{ flexDirection: 'row' }}>
  <DrumPicker items={hours} selectedIndex={hour} onChange={onHourChange} style={{ width: 64, height: 220 }} />
  <DrumPicker items={minutes} selectedIndex={minute} onChange={onMinuteChange} style={{ width: 64, height: 220 }} />
</View>
```

### Transparent background (default)

Backgrounds are transparent by default. Override only if needed:

```tsx
<DrumPicker
  items={items}
  backgroundColor="transparent"
  containerBackgroundColor="transparent"
  itemBackgroundColor="transparent"
/>
```

### Styling

```tsx
<DrumPicker
  items={items}
  textColor="#8E8E93"
  selectedTextColor="#1C1C1E"
  textSize={20}
  selectedTextSize={22}
  showSelectionIndicator
  selectionIndicatorColor="#D1D1D6"
  selectionIndicatorHeight={1}
/>
```

---

## DateDrumPicker

Date wheels built on `DrumPicker` (TypeScript only). Renders **only columns** — no titles like `"day"` above the wheel. Add labels in your own UI if needed.

`onChange` returns `{ day?, month?, year? }` (numbers). Hidden fields stay in state but are not shown.

### Full date (day → month → year)

```tsx
import { DateDrumPicker } from 'react-native-drum-picker';

const [date, setDate] = useState({ day: 10, month: 9, year: 2026 });

<DateDrumPicker
  mode="day-month-year"
  value={date}
  onChange={setDate}
/>
```

### Modes (column order)

| `mode` | Columns shown (left → right) |
|--------|------------------------------|
| `day` | day |
| `month` | month |
| `year` | year |
| `day-month` | day, month |
| `month-year` | month, year |
| `day-month-year` | day, month, year |
| `month-day-year` | month, day, year |
| `year-month-day` | year, month, day |

**Day only**

```tsx
<DateDrumPicker mode="day" value={{ day: 21 }} onChange={setDate} />
```

**Day + month**

```tsx
<DateDrumPicker mode="day-month" value={{ day: 21, month: 5 }} onChange={setDate} />
```

**Month + year**

```tsx
<DateDrumPicker
  mode="month-year"
  value={{ month: 5, year: 2026 }}
  onChange={setDate}
/>
```

**Month, day, year (US order)**

```tsx
<DateDrumPicker mode="month-day-year" value={date} onChange={setDate} />
```

**Year, month, day**

```tsx
<DateDrumPicker mode="year-month-day" value={date} onChange={setDate} />
```

### Month labels

```tsx
// Jan, Feb, Mar … (default)
<DateDrumPicker monthFormat="short" locale="en" />

// January, February …
<DateDrumPicker monthFormat="long" locale="en" />

// 01, 02, 03 …
<DateDrumPicker monthFormat="number" />
```

### Year range

```tsx
<DateDrumPicker
  mode="day-month-year"
  minYear={2020}
  maxYear={2035}
  value={{ day: 1, month: 1, year: 2024 }}
  onChange={setDate}
/>
```

Defaults: `minYear = now - 100`, `maxYear = now + 50`.

### Column width

Default widths: day `64`, month `110`, year `86`. Override per column:

```tsx
<DateDrumPicker
  mode="day-month-year"
  columnStyle={{ width: 72 }}
  style={{ alignSelf: 'center' }}
/>
```

`DateDrumPicker` also accepts DrumPicker props: `itemHeight`, `visibleItemCount`, colors, selection indicator, backgrounds.

---

## License

MIT — see [CONTRIBUTING.md](CONTRIBUTING.md).
