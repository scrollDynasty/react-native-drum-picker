import {
  codegenNativeComponent,
  type CodegenTypes,
  type ColorValue,
  type ViewProps,
} from 'react-native';

export type DrumPickerChangeEventPayload = {
  index: CodegenTypes.Int32;
  value: string;
};

interface NativeProps extends ViewProps {
  items: ReadonlyArray<string>;
  selectedIndex?: CodegenTypes.Int32;
  circular?: CodegenTypes.WithDefault<boolean, false>;
  scrollAnimated?: CodegenTypes.WithDefault<boolean, false>;
  itemHeight?: CodegenTypes.Float;
  visibleItemCount?: CodegenTypes.Int32;
  textColor?: ColorValue;
  selectedTextColor?: ColorValue;
  textSize?: CodegenTypes.Float;
  selectedTextSize?: CodegenTypes.Float;
  showSelectionIndicator?: CodegenTypes.WithDefault<boolean, true>;
  selectionIndicatorColor?: ColorValue;
  selectionIndicatorHeight?: CodegenTypes.Float;
  backgroundColor?: ColorValue;
  containerBackgroundColor?: ColorValue;
  itemBackgroundColor?: ColorValue;
  hapticFeedback?: CodegenTypes.WithDefault<boolean, false>;
  disabled?: CodegenTypes.WithDefault<boolean, false>;
  enableScrollByTapOnItem?: CodegenTypes.WithDefault<boolean, false>;
  onValueChangingEnabled?: CodegenTypes.WithDefault<boolean, false>;
  onValueChange?: CodegenTypes.DirectEventHandler<DrumPickerChangeEventPayload>;
  onValueChanging?: CodegenTypes.DirectEventHandler<DrumPickerChangeEventPayload>;
}

export default codegenNativeComponent<NativeProps>('DrumPickerView');
