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
  itemHeight?: CodegenTypes.Float;
  visibleItemCount?: CodegenTypes.Int32;
  textColor?: ColorValue;
  selectedTextColor?: ColorValue;
  textSize?: CodegenTypes.Float;
  selectedTextSize?: CodegenTypes.Float;
  showSelectionIndicator?: CodegenTypes.WithDefault<boolean, true>;
  selectionIndicatorColor?: ColorValue;
  selectionIndicatorHeight?: CodegenTypes.Float;
  onValueChange?: CodegenTypes.DirectEventHandler<DrumPickerChangeEventPayload>;
}

export default codegenNativeComponent<NativeProps>('DrumPickerView');
