# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0](https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.2.4...v0.3.0) (2026-07-27)


### ⚠ BREAKING CHANGES

* DateDrumPickerValue now requires day, month and year; use DateDrumPickerPartialValue where an incomplete date is intentional.

### Bug Fixes

* **android:** correct row positioning under selection indicator and improve centering logic ([5059aa4](https://github.com/scrollDynasty/react-native-drum-picker/commit/5059aa4e7f42e5de34828fa5b10280c00ab5ac8d))
* **android:** improve user interaction by releasing change suppression on drag start ([b856aba](https://github.com/scrollDynasty/react-native-drum-picker/commit/b856aba5d66c8419b2c9afe44a8f469d4af2e241))
* centre without a viewport and keep the selected value ([a1bcaa7](https://github.com/scrollDynasty/react-native-drum-picker/commit/a1bcaa7f7a32b591623c54204563936096a641d6))
* centre without a viewport and keep the selected value ([08097e8](https://github.com/scrollDynasty/react-native-drum-picker/commit/08097e80c6a8170d74968df3ed28c150021edfda))

## [0.3.0](https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.2.4...v0.3.0) (2026-07-27)

Fixes the integration defects that forced consumers to work around the picker with delayed
mounting, two-phase range changes and `onChange` suppression flags.

### ⚠ BREAKING CHANGES

* **types:** `DateDrumPickerValue` now requires `day`, `month` and `year`. A partial value passed to
  `DateDrumPicker.value` silently fell back to today's date for the missing fields. Use the new
  `DateDrumPickerPartialValue` where an incomplete date is intentional — `scrollToDate` and
  `clampDateDrumPickerValue` both accept it. Migration: `useState<DateDrumPickerValue>({})` becomes
  an explicit `{ day, month, year }`.
* **android:** changing `items` now restores the selected **value** instead of the scroll position,
  and no longer emits `onChange`. Code that relied on the old drift (or on the spurious event) will
  see different behaviour.

### Bug Fixes

* **android:** put the selected row under the selection indicator instead of
  `(visibleItemCount - 1) / 2` rows below it. `scrollToPositionWithOffset` measures its offset from
  the layout manager's start *after padding*, but the offset was computed from the viewport centre
  as if padding did not exist — and the picker reserves exactly that many rows of top padding. The
  wheel therefore showed a row two positions early at the default `visibleItemCount = 5`. It went
  unnoticed because the old code then forced `selectedIndex` to the requested value regardless of
  where the wheel had actually landed, which is why the reported symptom was "JS state is correct,
  only the rendering disagrees".
* **android:** center on `selectedIndex` when the picker mounts without a size. Centering was
  scheduled through nested `post` calls and computed its offset from a height that was still `0`,
  so a picker mounted in a collapsed container stayed on index 0. The request is now parked and
  flushed from `onLayout`, where the real height is known.
* **android:** draw the rows around the selection after a programmatic scroll.
  `scrollToPositionWithOffset` only parks an anchor and calls `requestLayout()`; React Native's
  root view does not lay out native children, so the anchor went unused and the wheel was left
  with just the centre row until the user dragged it.
* **android:** keep the selected value when `items` or the date range changes.
  `selectedIndex` was clamped against the list it was replacing — Fabric applies props in
  arbitrary order — which permanently moved the selection. The raw requested index is now kept and
  re-resolved against the new list, and `DrumPickerViewManager` applies size, list and position
  props in a fixed order.
* **android:** never emit `onChange` while props are being applied, so a controlled parent no
  longer needs a ref flag to mute events during reconfiguration.
* **android:** hand the touch sequence to React Native via `NativeGestureUtil` when the wheel
  starts scrolling and back when it settles, so the JS responder system stops competing for it.
  This is what makes the wheel spin inside a `Modal`, where
  `DialogRootViewGroup.requestDisallowInterceptTouchEvent` is an empty method and the usual signal
  is discarded.
* **android:** re-centre when `itemHeight` or `visibleItemCount` changes. Both feed the centering
  offset while often leaving the picker's own bounds untouched, so `onLayout` reported no change
  and nothing re-centred.
* **ios:** re-resolve the selection from the requested index on `setItems`, and reassert it in
  `layoutSubviews`, matching the Android behaviour for zero-size mounts and list swaps.
* **android:** stop swallowing the user's `onChange` when they grab the wheel mid-animation. An
  animated programmatic scroll armed change suppression until the wheel settled; a drag that
  interrupted it settled under that same flag, so the row the user chose was applied silently.
  Suppression is now released as soon as a drag starts, and is never armed when the target row is
  already centred (no scroll would follow, so nothing would release it).
* **DateDrumPicker:** clamp the year column's `selectedIndex` like the day and month columns.

### Features

* **dev:** warn in `__DEV__` about empty `items`, an out-of-range `selectedIndex` that outlives a
  render, and a picker still measuring zero after ~1.5s.
* **docs:** new "Common problems" section covering hidden containers, `Modal`, dependent columns
  and controlled usage, with an "open on the current date" example.

### Verification

Fixes were derived from React Native 0.86's own layout and touch plumbing —
`ReactViewGroup.requestLayout()` and `ReactViewGroup.onLayout()` are both empty, and
`DialogRootViewGroup.requestDisallowInterceptTouchEvent` likewise — which is why the picker now
drives the RecyclerView's measure/layout itself and hands gestures over explicitly.

The JS suite and a standalone compile against RN 0.86 both pass. `DrumPickerRegressionTest` ran on
an emulator in CI and caught the centering-offset bug above, which every pre-existing test had
missed because they only asserted the *reported* index and never the row actually sitting under the
indicator.

Still unverified: the iOS `DrumPickerWheelViewTests` additions, and the reporter's `Modal` scenario
on a device.

## [0.2.4](https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.2.3...v0.2.4) (2026-05-28)


### Features

* add circular prop for infinite loop scrolling ([b2ee0f6](https://github.com/scrollDynasty/react-native-drum-picker/commit/b2ee0f6475f0c9e54e239766f5e1be07ea4ee582))
* add custom item rendering support to DrumPicker ([b6fc727](https://github.com/scrollDynasty/react-native-drum-picker/commit/b6fc727bb11a4c2af7dfa3d5fd78bbf2e4863761))
* add Row component and enhance renderItem test in DrumPicker ([b45aea5](https://github.com/scrollDynasty/react-native-drum-picker/commit/b45aea5d066eb992fefc8e400a16ad2e64b819a4))
* enhance DrumPicker to notify picker group on index change ([a956ee7](https://github.com/scrollDynasty/react-native-drum-picker/commit/a956ee7565b57a921c9184af1fe9f31312cbb891))
* enhance DrumPicker with pickerGroup and pickerName support ([840f090](https://github.com/scrollDynasty/react-native-drum-picker/commit/840f090c6a5d2a2f48c9b0a0c38b6b4aafcae18b))
* enhance renderItem functionality in withVirtualized ([f23f3f0](https://github.com/scrollDynasty/react-native-drum-picker/commit/f23f3f0f7878a7b32e1ef48689ce3ffddae7e8ca))
* introduce PickerGroup for synchronized DrumPickers ([51f97c0](https://github.com/scrollDynasty/react-native-drum-picker/commit/51f97c0b72058fd57c091b06f7cf732ecfc4e23d))


### Bug Fixes

* synchronize currentIndex and changingIndex with selectedIndex in DrumPicker ([a9a32e0](https://github.com/scrollDynasty/react-native-drum-picker/commit/a9a32e0a19a979c4d3bbd8c9ffff51837b98ce99))
* update event types in TestTimePicker for better type safety ([61fe1f5](https://github.com/scrollDynasty/react-native-drum-picker/commit/61fe1f5d4affbf1253daf6daf1a00be94d740a0d))
* update README images to use direct URLs and improve DrumPicker item handling ([c9909a3](https://github.com/scrollDynasty/react-native-drum-picker/commit/c9909a3240a83fb016d27e8476daeaf179e2be32))

## [0.2.3](https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.2.2...v0.2.3) (2026-05-27)

### Features

- add booking option to App and enhance DateDrumPicker with min/max date warnings ([79d2068](https://github.com/scrollDynasty/react-native-drum-picker/commit/79d2068818931ea6efb86290882b97eaec18e049))
- add minDate/maxDate constraints to DateDrumPicker ([8477992](https://github.com/scrollDynasty/react-native-drum-picker/commit/8477992bf569df1a191d850241845dd5f88a1e30))
- add onValueChanging event for live scroll tracking ([3c018fd](https://github.com/scrollDynasty/react-native-drum-picker/commit/3c018fd3dcf2377b4ae79601dff0d4a276c7c1b8))
- add read-only web preview and enhance testing for DrumPicker ([0ad0c88](https://github.com/scrollDynasty/react-native-drum-picker/commit/0ad0c88a70083fdda961d9873ce696b251a2a572))
- add scroll animation support to DrumPicker components ([da8d9dc](https://github.com/scrollDynasty/react-native-drum-picker/commit/da8d9dcb7f6537f880c1beb06ec32a8d44dd12a6))
- enhance DateDrumPicker and DrumPicker with improved scrolling and ref handling ([fb1ad33](https://github.com/scrollDynasty/react-native-drum-picker/commit/fb1ad336c86512ffe32b9c74306efdbda7766b21))
- enhance DateDrumPicker with improved date constraints and event handling ([1eff42d](https://github.com/scrollDynasty/react-native-drum-picker/commit/1eff42d30175ccfcf8171fd6c07a5abe34feb661))
- enhance onValueChanging functionality for improved user experience ([26d866f](https://github.com/scrollDynasty/react-native-drum-picker/commit/26d866f295a9a850bc3601de04ce0373a3ebc083))
- implement BookingDatePicker component with integrated DateDrumPicker ([6bc7521](https://github.com/scrollDynasty/react-native-drum-picker/commit/6bc7521fe60ce0f698785fcfcb0ddf7deef63ab1))
- implement enhanced scroll tracking for DrumPicker components ([8b3d737](https://github.com/scrollDynasty/react-native-drum-picker/commit/8b3d737528ce69f99451113af9c66d60530b9d55))
- refine date constraint logic in resolveConstraints and enhance DateDrumPicker notifications ([0eb4906](https://github.com/scrollDynasty/react-native-drum-picker/commit/0eb49066b2309ea6ca2ae4b0422181a33c889649))
- update DateWithToday component to manage selected date state ([c0c3bcb](https://github.com/scrollDynasty/react-native-drum-picker/commit/c0c3bcb89a0de645108bdf41364a7100444f8051))

### Bug Fixes

- ensure clamping of selected index in DrumPicker ([9eff4c2](https://github.com/scrollDynasty/react-native-drum-picker/commit/9eff4c26d861ab9cee275e3ae463282181048ba6))
- improve onValueChanging logic and add index validation ([ab47136](https://github.com/scrollDynasty/react-native-drum-picker/commit/ab47136541d71793359174705c48a06b94b5f1a2))
- prevent infinite render loop in native mock ([6c99a16](https://github.com/scrollDynasty/react-native-drum-picker/commit/6c99a16855d605c2063206a512fbbd43eacd9f8e))

## [Unreleased]

### Added

- `usePickerGroup()` — creates a shared group handle for multiple pickers.
- `usePickerGroupChangedEffect(group, cb)` — fires when any picker in the group settles (`onChange`).
- `usePickerGroupChangingEffect(group, cb)` — fires on every scroll tick of any picker (`onValueChanging`).
- `pickerGroup` and `pickerName` props on `DrumPicker`.
- `group.getState()` — snapshot of current values for all registered pickers.
- Pure JS implementation (no native changes, zero overhead when unused).
- `renderItem` prop on `DrumPicker` for custom row rendering with React components. Receives `{ item, label, index, isSelected }` while preserving native scroll physics and snap behavior.
- `minDate` / `maxDate` props on `DateDrumPicker` for constraining selectable date range (inclusive, partial). Year/month/day columns update dynamically based on current selection. Values outside range are auto-clamped. Backward compatible with existing `minYear` / `maxYear` props. `onValueChanging` uses calendar indices; uncontrolled mode fires `onChange` when constraints change.
- `onValueChanging` event — fires on every scroll tick while the user is dragging, before the picker settles. Enables live synchronization between multiple pickers.
- `withVirtualized` remaps `onValueChanging` indices to the full list (same as `onChange`).
- `DateDrumPicker.onValueChanging(column, event)` passes the column key (`day` / `month` / `year`) as the first argument.
- Imperative ref API: `DrumPickerRef` with `scrollToIndex`, `scrollToValue`, `getCurrentIndex`, `getCurrentValue`.
- `DateDrumPickerRef` with `scrollToDate` and `getCurrentDate` — enables "Today" button and external date navigation.
- `withVirtualized` forwards `DrumPickerRef` (real indices). Imperative scroll syncs controlled `selectedIndex` via `onChange`. `scrollToDate` clamps invalid days.
- Web `DrumPicker` stub: read-only preview + ref API (no throw on render).
- `circular` prop — infinite loop scrolling. Wraps last item to first and first to last. Uses multiplied items array for native scroll physics. `onChange` always returns real index (0..N-1). Works with `onValueChanging`, ref API, `renderItem`, and PickerGroup.
- Android/iOS instrumented tests for `setSelectedIndex(animated)` / `scrollAnimated` prop path.

## [0.2.2](https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.2.1...v0.2.2) (2026-05-25)

### Features

- add withVirtualized HOC and enableScrollByTapOnItem prop ([01f3123](https://github.com/scrollDynasty/react-native-drum-picker/commit/01f31239b819a47e7a6f2bdbf8576bb233a4a5c3))
- enhance DrumPicker tap functionality with touch listener ([c3e270b](https://github.com/scrollDynasty/react-native-drum-picker/commit/c3e270b8cec671d09c8a3269e9d0873ed89ce573))
- enhance DrumPicker tests with improved synchronization and scrolling logic ([38b83ac](https://github.com/scrollDynasty/react-native-drum-picker/commit/38b83ac198ea45d8d81f598bcd2b3e3bb6027229))
- enhance DrumPicker with improved tap-to-scroll functionality ([2061e4a](https://github.com/scrollDynasty/react-native-drum-picker/commit/2061e4a2653c1724d2dc6b3ab22bbbd5548ea508))
- enhance withVirtualized HOC and documentation for item list handling ([d3a35a6](https://github.com/scrollDynasty/react-native-drum-picker/commit/d3a35a648e66c732e507d4fbe82d0d973c251167))
- enhance withVirtualized HOC with edge recentering and documentation updates ([27a3e02](https://github.com/scrollDynasty/react-native-drum-picker/commit/27a3e02a7579fe821ec0c11083b31d988a43540b))
- improve DrumPicker documentation and enhance tap-to-scroll functionality ([0bbae09](https://github.com/scrollDynasty/react-native-drum-picker/commit/0bbae094f805abe79374f72e878a6c3d29335b52))
- improve tap handling in DrumPickerAdapter for enhanced user interaction ([1bfc9f0](https://github.com/scrollDynasty/react-native-drum-picker/commit/1bfc9f07efa2ae149576a5a5b65e2ddd1aad6344))
- refactor DrumPicker tap tests and enhance touch handling ([e861d54](https://github.com/scrollDynasty/react-native-drum-picker/commit/e861d54119d1d4632009b121bc270fe9cd0d27ed))
- update withVirtualized HOC with improved recentering and documentation ([23b37b2](https://github.com/scrollDynasty/react-native-drum-picker/commit/23b37b2c7e371c67a488ac4bab29871243435bd3))

### Bug Fixes

- **ci:** prepare iOS codegen before pod install and xcodebuild ([fbd74b3](https://github.com/scrollDynasty/react-native-drum-picker/commit/fbd74b301f4c562c04b84db9930f05c1dcf6c3d5))
- **ci:** resolve js-tests build and codecov action ([262904e](https://github.com/scrollDynasty/react-native-drum-picker/commit/262904e82bbfe34497dc414b5496336c138ddb1b))
- **ci:** resolve js-tests build and codecov action ([581ce80](https://github.com/scrollDynasty/react-native-drum-picker/commit/581ce80a132079e9a908923f5bb27452b73c65c1))
- update release-please workflow token for improved security ([81167d4](https://github.com/scrollDynasty/react-native-drum-picker/commit/81167d4fb7ba665afb62b819797bc1ad1fea1c7f))
- update release-please workflow token for improved security ([1cb6a09](https://github.com/scrollDynasty/react-native-drum-picker/commit/1cb6a09d4f1d51ee2a9fd4e70ea8f5632d1abb8f))

## [0.2.1](https://github.com/scrollDynasty/react-native-drum-picker/compare/react-native-drum-picker-v0.2.0...react-native-drum-picker-v0.2.1) (2026-05-25)

### Features

- add withVirtualized HOC and enableScrollByTapOnItem prop ([01f3123](https://github.com/scrollDynasty/react-native-drum-picker/commit/01f31239b819a47e7a6f2bdbf8576bb233a4a5c3))
- enhance DrumPicker tap functionality with touch listener ([c3e270b](https://github.com/scrollDynasty/react-native-drum-picker/commit/c3e270b8cec671d09c8a3269e9d0873ed89ce573))
- enhance DrumPicker tests with improved synchronization and scrolling logic ([38b83ac](https://github.com/scrollDynasty/react-native-drum-picker/commit/38b83ac198ea45d8d81f598bcd2b3e3bb6027229))
- enhance DrumPicker with improved tap-to-scroll functionality ([2061e4a](https://github.com/scrollDynasty/react-native-drum-picker/commit/2061e4a2653c1724d2dc6b3ab22bbbd5548ea508))
- enhance withVirtualized HOC and documentation for item list handling ([d3a35a6](https://github.com/scrollDynasty/react-native-drum-picker/commit/d3a35a648e66c732e507d4fbe82d0d973c251167))
- enhance withVirtualized HOC with edge recentering and documentation updates ([27a3e02](https://github.com/scrollDynasty/react-native-drum-picker/commit/27a3e02a7579fe821ec0c11083b31d988a43540b))
- improve DrumPicker documentation and enhance tap-to-scroll functionality ([0bbae09](https://github.com/scrollDynasty/react-native-drum-picker/commit/0bbae094f805abe79374f72e878a6c3d29335b52))
- improve tap handling in DrumPickerAdapter for enhanced user interaction ([1bfc9f0](https://github.com/scrollDynasty/react-native-drum-picker/commit/1bfc9f07efa2ae149576a5a5b65e2ddd1aad6344))
- refactor DrumPicker tap tests and enhance touch handling ([e861d54](https://github.com/scrollDynasty/react-native-drum-picker/commit/e861d54119d1d4632009b121bc270fe9cd0d27ed))
- update withVirtualized HOC with improved recentering and documentation ([23b37b2](https://github.com/scrollDynasty/react-native-drum-picker/commit/23b37b2c7e371c67a488ac4bab29871243435bd3))

### Bug Fixes

- **ci:** prepare iOS codegen before pod install and xcodebuild ([fbd74b3](https://github.com/scrollDynasty/react-native-drum-picker/commit/fbd74b301f4c562c04b84db9930f05c1dcf6c3d5))
- **ci:** resolve js-tests build and codecov action ([262904e](https://github.com/scrollDynasty/react-native-drum-picker/commit/262904e82bbfe34497dc414b5496336c138ddb1b))
- **ci:** resolve js-tests build and codecov action ([581ce80](https://github.com/scrollDynasty/react-native-drum-picker/commit/581ce80a132079e9a908923f5bb27452b73c65c1))
- update release-please workflow token for improved security ([81167d4](https://github.com/scrollDynasty/react-native-drum-picker/commit/81167d4fb7ba665afb62b819797bc1ad1fea1c7f))
- update release-please workflow token for improved security ([1cb6a09](https://github.com/scrollDynasty/react-native-drum-picker/commit/1cb6a09d4f1d51ee2a9fd4e70ea8f5632d1abb8f))

## [0.2.0] - 2026-05-22

### Added

#### iOS Native Support

- `DrumPicker` and `DateDrumPicker` work on iOS via `UIPickerView` (Swift + Fabric).
- Full prop parity with the Android implementation and the same `onChange` payload.

#### Tests

- Jest unit and snapshot tests for `DrumPicker` and `DateDrumPicker`.
- Android instrumented tests (Espresso) for props and programmatic selection.

#### CI/CD

- GitHub Actions: `lint-and-typecheck`, `js-tests`, `android-build`, `ios-build`.
- Codecov upload and README badges.

#### Haptic Feedback

- New `hapticFeedback` prop (default `false`) on `DrumPicker` and `DateDrumPicker`.
- Android: `performHapticFeedback` when the centered index changes after scroll idle.
- iOS: `UISelectionFeedbackGenerator` on user selection.

### Changed

- Library description and README platform tables: iOS is supported.
- `DrumPicker` JS wrapper deduplicates `onChange` when the index is unchanged (aligned with native behavior).

### Fixed

- iOS programmatic `selectedIndex` updates no longer emit spurious `onChange` events.
- CI: CocoaPods cache step and job timeouts for native builds.

## [0.1.5] - 2026-05-22

### Fixed

- Center `selectedIndex` reliably using `scrollToPositionWithOffset` with a computed center offset (after items, layout, and metric changes).
- Cancel pending scroll work and `stopScroll()` on detach; broader lifecycle guards for navigation transitions.

### Changed

- JS `DrumPicker` applies default `minWidth` / `height` (or `minHeight` with flex) so the picker is visible without manual sizing.
- Android native `minimumWidth` / `minimumHeight` aligned with `itemHeight * visibleItemCount`.
- One-time `__DEV__` warning when layout dimensions are missing.

### Documentation

- README: tested compatibility matrix, practical examples, `onChange` / debounce guidance.
- Example app: basic, time, height/weight, date, controlled, debounced demos.
- Bug report template: Expo, react-native-screens, navigation crash, empty picker.

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

[Unreleased]: https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.2.3...HEAD
[0.2.2]: https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.2.1...v0.2.2
[0.1.5]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.1.5
[0.1.4]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.1.4
[0.1.2]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.1.2
[0.1.1]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.1.1
[0.1.0]: https://github.com/scrollDynasty/react-native-drum-picker/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/scrollDynasty/react-native-drum-picker/releases/tag/v0.0.1
