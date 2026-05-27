import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  DateDrumPicker,
  DrumPicker,
  withVirtualized,
  type DateDrumPickerValue,
} from 'react-native-drum-picker';

const VirtualizedDrumPicker = withVirtualized(DrumPicker);
const CITIES = Array.from({ length: 500 }, (_, i) => `City ${i}`);

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
    'basic' | 'time' | 'hw' | 'date' | 'controlled' | 'debounce' | 'large'
  >('basic');
  const [cityIndex, setCityIndex] = useState(0);

  const [sizeIndex, setSizeIndex] = useState(1);
  const [hourIndex, setHourIndex] = useState(9);
  const [minuteIndex, setMinuteIndex] = useState(30);
  const [previewHourIndex, setPreviewHourIndex] = useState(9);
  const [previewMinuteIndex, setPreviewMinuteIndex] = useState(30);
  const [heightIndex, setHeightIndex] = useState(75);
  const [weightIndex, setWeightIndex] = useState(90);
  const [controlledIndex, setControlledIndex] = useState(2);
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
        ['time', 'Time'],
        ['hw', 'Height / weight'],
        ['date', 'Date'],
        ['controlled', 'Controlled'],
        ['debounce', 'Debounce'],
        ['large', 'Large list'],
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
            enableScrollByTapOnItem
            onChange={(e) => setSizeIndex(e.nativeEvent.index)}
            style={styles.pickerW120}
          />
          <Text style={styles.value}>{SIZES[sizeIndex]}</Text>
        </View>
      )}

      {example === 'time' && (
        <View style={styles.section}>
          <Text style={styles.label}>Time (hour · minute)</Text>
          <View style={styles.row}>
            <DrumPicker
              items={HOURS}
              selectedIndex={hourIndex}
              onValueChanging={(e) => setPreviewHourIndex(e.nativeEvent.index)}
              onChange={(e) => {
                const index = e.nativeEvent.index;
                setHourIndex(index);
                setPreviewHourIndex(index);
              }}
              style={styles.pickerW72}
            />
            <Text style={styles.sep}>:</Text>
            <DrumPicker
              items={MINUTES}
              selectedIndex={minuteIndex}
              onValueChanging={(e) =>
                setPreviewMinuteIndex(e.nativeEvent.index)
              }
              onChange={(e) => {
                const index = e.nativeEvent.index;
                setMinuteIndex(index);
                setPreviewMinuteIndex(index);
              }}
              style={styles.pickerW72}
            />
          </View>
          <Text style={styles.value}>
            {HOURS[previewHourIndex]}:{MINUTES[previewMinuteIndex]}
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

      {example === 'large' && (
        <View style={styles.section}>
          <Text style={styles.label}>withVirtualized (500 cities)</Text>
          <VirtualizedDrumPicker
            items={CITIES}
            selectedIndex={cityIndex}
            windowSize={20}
            enableScrollByTapOnItem
            onChange={(e) => setCityIndex(e.nativeEvent.index)}
            style={styles.pickerW140}
          />
          <Text style={styles.value}>{CITIES[cityIndex]}</Text>
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
  pickerW140: {
    width: 140,
    height: PICKER_HEIGHT,
  },
});
