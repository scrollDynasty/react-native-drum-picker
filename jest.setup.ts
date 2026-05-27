import '@testing-library/jest-native/extend-expect';

jest.mock('./src/DrumPickerViewNativeComponent', () =>
  require('./src/__mocks__/DrumPickerViewNativeComponent')
);

const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    const message = String(args[0] ?? '');
    if (
      message.includes(
        'react-native-drum-picker: DrumPicker needs a visible height'
      ) ||
      message.includes('read-only web preview')
    ) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
