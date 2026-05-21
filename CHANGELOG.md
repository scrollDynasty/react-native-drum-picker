# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_No changes yet._

## [0.1.4] - 2026-05-22

### Fixed

- Fixed a crash during screen unmount/navigation by avoiding unsafe RecyclerView cleanup in `onDetachedFromWindow` (`adapter = null`, `clearOnScrollListeners`, SnapHelper detach during react-native-screens transitions).
- Prevented `onChange` events from dispatching after the view is detached.
- Fixed Android Kotlin compilation on React Native 0.81+ by dispatching Fabric events with `UIManagerType.FABRIC`.

### Documentation

- Added compatibility and troubleshooting notes for React Native 0.81+, Expo SDK 54, Expo Go, and navigation crashes.

## [0.1.2] - 2026-05-22

### Fixed

- README preview image displays on [npm](https://www.npmjs.com/package/react-native-drum-picker): `img/` included in published tarball; preview uses GitHub raw URL.

## [0.1.1] - 2026-05-22

### Added

- README preview screenshot (`img/image.png`).
- Open-source docs: `CONTRIBUTING.md`, `SECURITY.md`, GitHub issue/PR templates.

### Changed

- README license badge uses GitHub (not npm) when package metadata is unavailable.
- `react-native.config.js` documents Android-only autolinking.

### Fixed

- CI: `gradlew` executable bit on Linux (`chmod +x`).
- CI: `yarn typecheck` excludes `src/**/__tests__`.
- CI: `build-library` runs `yarn build` instead of missing `yarn prepare`.

## [0.1.0] - 2026-05-21

First release on [npm](https://www.npmjs.com/package/react-native-drum-picker).

### Added

- Android-native `DrumPicker` Fabric view (Kotlin, `RecyclerView`, snap-to-center).
- TypeScript public API and codegen spec (`DrumPickerView`).
- `DateDrumPicker` wrapper with flexible modes (`day`, `month`, `year`, and combinations).
- Transparent background support (`backgroundColor`, `containerBackgroundColor`, `itemBackgroundColor`).
- iOS-style center selection indicator (optional).
- Distance-based text fade and size interpolation while scrolling.
- Date logic: days per month/year, year range normalization, controlled and uncontrolled `DateDrumPicker`.

## [0.0.1] - 2026-05-21

Initial GitHub release. See [v0.0.1](https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.0.1).

[Unreleased]: https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.1.4...HEAD
[0.1.4]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.1.4
[0.1.2]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.1.2
[0.1.1]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.1.1
[0.1.0]: https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.0.1
