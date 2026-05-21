import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DateDrumPicker,
  type DateDrumPickerValue,
} from 'react-native-drum-picker';

export default function App() {
  const [date, setDate] = useState<DateDrumPickerValue>({
    day: 10,
    month: 9,
    year: 2026,
  });

  return (
    <View style={styles.screen}>
      <DateDrumPicker
        mode="day-month-year"
        value={date}
        onChange={setDate}
        monthFormat="short"
      />
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
});
