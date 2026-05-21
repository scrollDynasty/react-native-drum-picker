import type { ColorValue, ViewProps } from 'react-native';

type Props = ViewProps & {
  color?: ColorValue;
};

export function DrumPickerView(_props: Props): never {
  throw new Error(
    "'react-native-drum-picker' is only supported on native platforms."
  );
}
