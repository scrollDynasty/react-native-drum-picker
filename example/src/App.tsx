import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  DrumPicker,
  type DrumPickerChangeEvent,
} from 'react-native-drum-picker';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEM_COUNT = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEM_COUNT;

const dates = [
  'Mon 7 Sep',
  'Tue 8 Sep',
  'Wed 9 Sep',
  'Thu 10 Sep',
  'Fri 11 Sep',
];
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0')
);

export default function App() {
  const [dateIndex, setDateIndex] = useState(0);
  const [hourIndex, setHourIndex] = useState(0);
  const [minuteIndex, setMinuteIndex] = useState(0);

  const onDateChange = useCallback(
    (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
      setDateIndex(event.nativeEvent.index);
    },
    []
  );

  const onHourChange = useCallback(
    (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
      setHourIndex(event.nativeEvent.index);
    },
    []
  );

  const onMinuteChange = useCallback(
    (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => {
      setMinuteIndex(event.nativeEvent.index);
    },
    []
  );

  const selectedDate = dates[dateIndex] ?? dates[0];
  const selectedHour = hours[hourIndex] ?? hours[0];
  const selectedMinute = minutes[minuteIndex] ?? minutes[0];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.screen}
    >
      <Text style={styles.title}>React Native Drum Picker</Text>

      <View style={styles.pickerRow}>
        <View style={styles.pickerContainer}>
          <DrumPicker
            style={styles.datePicker}
            items={dates}
            selectedIndex={dateIndex}
            itemHeight={ITEM_HEIGHT}
            visibleItemCount={VISIBLE_ITEM_COUNT}
            textColor="#9CA3AF"
            selectedTextColor="#111827"
            textSize={18}
            selectedTextSize={22}
            onChange={onDateChange}
          />
        </View>

        <View style={styles.pickerContainer}>
          <DrumPicker
            style={styles.hourPicker}
            items={hours}
            selectedIndex={hourIndex}
            itemHeight={ITEM_HEIGHT}
            visibleItemCount={VISIBLE_ITEM_COUNT}
            textColor="#9CA3AF"
            selectedTextColor="#111827"
            textSize={18}
            selectedTextSize={22}
            onChange={onHourChange}
          />
        </View>

        <View style={styles.pickerContainer}>
          <DrumPicker
            style={styles.minutePicker}
            items={minutes}
            selectedIndex={minuteIndex}
            itemHeight={ITEM_HEIGHT}
            visibleItemCount={VISIBLE_ITEM_COUNT}
            textColor="#9CA3AF"
            selectedTextColor="#111827"
            textSize={18}
            selectedTextSize={22}
            onChange={onMinuteChange}
          />
        </View>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Selected</Text>
        <Text style={styles.resultValue}>
          {selectedDate} · {selectedHour}:{selectedMinute}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 32,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  datePicker: {
    width: 140,
    height: PICKER_HEIGHT,
  },
  hourPicker: {
    width: 70,
    height: PICKER_HEIGHT,
  },
  minutePicker: {
    width: 70,
    height: PICKER_HEIGHT,
  },
  resultCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});
