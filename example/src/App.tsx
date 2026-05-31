import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  DateDrumPicker,
  DrumPicker,
  TimeDrumPicker,
  type DateDrumPickerValue,
  type TimeDrumPickerValue,
} from 'react-native-drum-picker';

type CountryCode = 'us' | 'de' | 'jp' | 'uz';

const COUNTRIES: Array<{ label: string; value: CountryCode }> = [
  { label: 'United States', value: 'us' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
  { label: 'Uzbekistan', value: 'uz' },
];

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const SIZES = ['Small', 'Medium', 'Large'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0')
);
const HEIGHTS = Array.from({ length: 121 }, (_, i) => String(100 + i));
const WEIGHTS = Array.from({ length: 341 }, (_, i) =>
  (30 + i * 0.5).toFixed(1)
);

function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delayMs);
    },
    [callback, delayMs]
  );
}

export default function App() {
  const [example, setExample] = useState<
    | 'basic'
    | 'labeled'
    | 'timepicker'
    | 'time'
    | 'hw'
    | 'date'
    | 'controlled'
    | 'debounce'
  >('basic');

  const [sizeIndex, setSizeIndex] = useState(1);
  const [hourIndex, setHourIndex] = useState(9);
  const [minuteIndex, setMinuteIndex] = useState(30);
  const [heightIndex, setHeightIndex] = useState(75);
  const [weightIndex, setWeightIndex] = useState(90);
  const [controlledIndex, setControlledIndex] = useState(2);
  const [country, setCountry] = useState<CountryCode>('uz');
  const [time, setTime] = useState<TimeDrumPickerValue>({
    hour: 9,
    minute: 30,
  });
  const [debouncedLog, setDebouncedLog] = useState('—');
  const [date, setDate] = useState<DateDrumPickerValue>({
    day: 10,
    month: 9,
    year: 2026,
  });

  const saveDebounced = useDebouncedCallback((value: string) => {
    setDebouncedLog(value);
  }, 300);

  const tabs = useMemo(
    () =>
      [
        ['basic', 'Basic'],
        ['labeled', 'Labeled'],
        ['timepicker', 'TimePicker'],
        ['time', 'Time'],
        ['hw', 'Height / weight'],
        ['date', 'Date'],
        ['controlled', 'Controlled'],
        ['debounce', 'Debounce'],
      ] as const,
    []
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>react-native-drum-picker</Text>
      <View style={styles.tabs}>
        {tabs.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setExample(key)}
            style={[styles.tab, example === key && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, example === key && styles.tabTextActive]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {example === 'basic' && (
        <View style={styles.section}>
          <Text style={styles.label}>Size</Text>
          <DrumPicker
            items={SIZES}
            selectedIndex={sizeIndex}
            onChange={(e) => setSizeIndex(e.nativeEvent.index)}
            style={styles.pickerW120}
          />
          <Text style={styles.value}>{SIZES[sizeIndex]}</Text>
        </View>
      )}

      {example === 'labeled' && (
        <View style={styles.section}>
          <Text style={styles.label}>
            Labeled items (label shown, value returned)
          </Text>
          <DrumPicker<CountryCode>
            items={COUNTRIES}
            selectedIndex={COUNTRIES.findIndex((c) => c.value === country)}
            onChange={(e) => setCountry(e.nativeEvent.item)}
            accessibilityLabel="Country"
            style={styles.pickerW120}
          />
          <Text style={styles.value}>Selected code: {country}</Text>
        </View>
      )}

      {example === 'timepicker' && (
        <View style={styles.section}>
          <Text style={styles.label}>TimeDrumPicker (12h, 15-min steps)</Text>
          <TimeDrumPicker
            mode="hour-minute-period"
            value={time}
            minuteInterval={15}
            onChange={setTime}
          />
          <Text style={styles.value}>
            {String(time.hour ?? 0).padStart(2, '0')}:
            {String(time.minute ?? 0).padStart(2, '0')}
          </Text>
        </View>
      )}

      {example === 'time' && (
        <View style={styles.section}>
          <Text style={styles.label}>Time (hour · minute)</Text>
          <View style={styles.row}>
            <DrumPicker
              items={HOURS}
              selectedIndex={hourIndex}
              onChange={(e) => setHourIndex(e.nativeEvent.index)}
              style={styles.pickerW72}
            />
            <Text style={styles.sep}>:</Text>
            <DrumPicker
              items={MINUTES}
              selectedIndex={minuteIndex}
              onChange={(e) => setMinuteIndex(e.nativeEvent.index)}
              style={styles.pickerW72}
            />
          </View>
          <Text style={styles.value}>
            {HOURS[hourIndex]}:{MINUTES[minuteIndex]}
          </Text>
        </View>
      )}

      {example === 'hw' && (
        <View style={styles.section}>
          <Text style={styles.label}>Onboarding-style row</Text>
          <View style={styles.row}>
            <DrumPicker
              items={HEIGHTS}
              selectedIndex={heightIndex}
              onChange={(e) => setHeightIndex(e.nativeEvent.index)}
              style={styles.pickerW90}
            />
            <Text style={styles.unit}>cm</Text>
            <DrumPicker
              items={WEIGHTS}
              selectedIndex={weightIndex}
              onChange={(e) => setWeightIndex(e.nativeEvent.index)}
              style={styles.pickerW96}
            />
            <Text style={styles.unit}>kg</Text>
          </View>
          <Text style={styles.value}>
            {HEIGHTS[heightIndex]} cm · {WEIGHTS[weightIndex]} kg
          </Text>
        </View>
      )}

      {example === 'date' && (
        <View style={styles.section}>
          <Text style={styles.label}>DateDrumPicker</Text>
          <DateDrumPicker
            mode="day-month-year"
            value={date}
            onChange={setDate}
            monthFormat="short"
          />
          <Text style={styles.value}>
            {date.day}.{date.month}.{date.year}
          </Text>
        </View>
      )}

      {example === 'controlled' && (
        <View style={styles.section}>
          <Text style={styles.label}>Controlled selectedIndex</Text>
          <DrumPicker
            items={SIZES}
            selectedIndex={controlledIndex}
            onChange={(e) => setControlledIndex(e.nativeEvent.index)}
            style={styles.pickerW120}
          />
          <View style={styles.row}>
            <Pressable
              style={styles.button}
              onPress={() => setControlledIndex((i) => Math.max(0, i - 1))}
            >
              <Text>−</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() =>
                setControlledIndex((i) => Math.min(SIZES.length - 1, i + 1))
              }
            >
              <Text>+</Text>
            </Pressable>
          </View>
          <Text style={styles.value}>{SIZES[controlledIndex]}</Text>
        </View>
      )}

      {example === 'debounce' && (
        <View style={styles.section}>
          <Text style={styles.label}>
            UI updates immediately; persistence is debounced
          </Text>
          <DrumPicker
            items={SIZES}
            selectedIndex={sizeIndex}
            onChange={(e) => {
              const value = e.nativeEvent.value;
              setSizeIndex(e.nativeEvent.index);
              saveDebounced(value);
            }}
            style={styles.pickerW120}
          />
          <Text style={styles.value}>UI: {SIZES[sizeIndex]}</Text>
          <Text style={styles.hint}>Debounced save: {debouncedLog}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#3C3C43',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  section: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: {
    fontSize: 22,
    marginHorizontal: 8,
    color: '#1C1C1E',
  },
  unit: {
    fontSize: 16,
    marginHorizontal: 8,
    color: '#8E8E93',
  },
  value: {
    marginTop: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: '#8E8E93',
  },
  button: {
    marginHorizontal: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
  },
  pickerW72: {
    width: 72,
    height: PICKER_HEIGHT,
  },
  pickerW90: {
    width: 90,
    height: PICKER_HEIGHT,
  },
  pickerW96: {
    width: 96,
    height: PICKER_HEIGHT,
  },
  pickerW120: {
    width: 120,
    height: PICKER_HEIGHT,
  },
});
