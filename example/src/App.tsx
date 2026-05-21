import { useCallback, useState } from 'react';
import { StyleSheet, View, type NativeSyntheticEvent } from 'react-native';
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

  return (
    <View style={styles.screen}>
      <View style={styles.pickerRow}>
        <DrumPicker
          style={styles.datePicker}
          items={dates}
          selectedIndex={dateIndex}
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          onChange={onDateChange}
        />
        <DrumPicker
          style={styles.hourPicker}
          items={hours}
          selectedIndex={hourIndex}
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          onChange={onHourChange}
        />
        <DrumPicker
          style={styles.minutePicker}
          items={minutes}
          selectedIndex={minuteIndex}
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          onChange={onMinuteChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePicker: {
    width: 150,
    height: PICKER_HEIGHT,
  },
  hourPicker: {
    width: 64,
    height: PICKER_HEIGHT,
  },
  minutePicker: {
    width: 64,
    height: PICKER_HEIGHT,
  },
});
