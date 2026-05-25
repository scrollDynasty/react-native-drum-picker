import type { DrumPickerProps } from './types';

export function DrumPicker<T = string>(_props: DrumPickerProps<T>): never {
  throw new Error(
    "'react-native-drum-picker' is only supported on native platforms."
  );
}
