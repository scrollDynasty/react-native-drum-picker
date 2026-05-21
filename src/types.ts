import type { NativeSyntheticEvent, ViewStyle } from 'react-native';

export type DrumPickerChangeEvent = {
  index: number;
  value: string;
};

export type DrumPickerProps = {
  items: string[];
  selectedIndex?: number;
  itemHeight?: number;
  visibleItemCount?: number;
  textColor?: string;
  selectedTextColor?: string;
  textSize?: number;
  selectedTextSize?: number;
  onChange?: (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => void;
  style?: ViewStyle;
};
