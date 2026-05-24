/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    // Release + embedded bundle (CI has no Metro). Use Debug locally with Metro.
    'ios.sim': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/DrumPickerExample.app',
      build:
        'export SKIP_BUNDLING=0 RCT_NO_LAUNCH_PACKAGER=1 && ' +
        'xcodebuild -workspace ios/DrumPickerExample.xcworkspace ' +
        '-scheme DrumPickerExample ' +
        '-configuration Release ' +
        '-sdk iphonesimulator ' +
        '-derivedDataPath ios/build ' +
        'CODE_SIGNING_ALLOWED=NO',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/debug/' +
        'app-debug-androidTest.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest ' +
        '-DtestBuildType=debug && cd ..',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'test_avd_34' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.sim',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
