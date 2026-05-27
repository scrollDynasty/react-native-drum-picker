import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { View, type ViewProps } from 'react-native';
import type { DrumPickerChangeEventPayload } from '../DrumPickerViewNativeComponent';

type MockProps = ViewProps & {
  items?: ReadonlyArray<string>;
  selectedIndex?: number;
  scrollAnimated?: boolean;
  hapticFeedback?: boolean;
  enableScrollByTapOnItem?: boolean;
  onValueChangingEnabled?: boolean;
  onValueChange?: (event: {
    nativeEvent: DrumPickerChangeEventPayload;
  }) => void;
  onValueChanging?: (event: {
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

export function fireNativeDrumPickerChanging(
  index: number,
  value: string
): void {
  latestProps?.onValueChanging?.({
    nativeEvent: { index, value },
  });
}

const DrumPickerViewNativeComponent = forwardRef<
  { setNativeProps: (props: Partial<MockProps>) => void },
  MockProps
>(function DrumPickerViewNativeComponent(props, ref) {
  const [renderedProps, setRenderedProps] = useState(props);

  useEffect(() => {
    setRenderedProps(props);
    latestProps = props;
  }, [props]);

  useImperativeHandle(ref, () => ({
    setNativeProps(updates: Partial<MockProps>) {
      setRenderedProps((prev) => {
        const next = { ...prev, ...updates };
        latestProps = next;
        return next;
      });
    },
  }));

  return <View testID="drum-picker-native" {...renderedProps} />;
});

export default DrumPickerViewNativeComponent;
