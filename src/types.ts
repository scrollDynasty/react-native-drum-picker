import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

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
  showSelectionIndicator?: boolean;
  selectionIndicatorColor?: string;
  selectionIndicatorHeight?: number;
  backgroundColor?: string;
  itemBackgroundColor?: string;
  containerBackgroundColor?: string;
  onChange?: (event: NativeSyntheticEvent<DrumPickerChangeEvent>) => void;
  style?: StyleProp<ViewStyle>;
};
