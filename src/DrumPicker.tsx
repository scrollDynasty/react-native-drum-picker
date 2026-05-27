import { forwardRef } from 'react';
import type { DrumPickerProps, DrumPickerRef } from './types';

export const DrumPicker = forwardRef<DrumPickerRef, DrumPickerProps>(
  function DrumPicker(_props, _ref) {
    throw new Error(
      "'react-native-drum-picker' is only supported on native platforms."
    );
  }
);

DrumPicker.displayName = 'DrumPicker';
