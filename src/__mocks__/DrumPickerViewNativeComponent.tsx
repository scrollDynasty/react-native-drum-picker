import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import type { DrumPickerChangeEventPayload } from '../DrumPickerViewNativeComponent';

type MockProps = ViewProps & {
  items?: ReadonlyArray<string>;
  selectedIndex?: number;
  hapticFeedback?: boolean;
  onValueChange?: (event: {
    nativeEvent: DrumPickerChangeEventPayload;
  }) => void;
};

let latestProps: MockProps | null = null;

export function resetNativeDrumPickerMocks(): void {
  latestProps = null;
}

export function getLatestNativeDrumPickerProps(): MockProps | null {
  return latestProps;
}

export function fireNativeDrumPickerChange(index: number, value: string): void {
  latestProps?.onValueChange?.({
    nativeEvent: { index, value },
  });
}

function DrumPickerViewNativeComponent(props: MockProps) {
  latestProps = props;

  useEffect(() => {
    latestProps = props;
  });

  return <View testID="drum-picker-native" {...props} />;
}

export default DrumPickerViewNativeComponent;
