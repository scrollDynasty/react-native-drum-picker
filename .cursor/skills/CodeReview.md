You are a senior React Native native library engineer.

I am building an open-source React Native Fabric View library called `react-native-drum-picker`.

The library provides an Android-native iOS-style drum/wheel picker for React Native.

Your task:
Perform a complete production-grade code review of the entire library.

Do NOT rewrite the code immediately.
First inspect the project carefully and produce a detailed review report.
Then suggest specific fixes.
Only after the review, provide patches if needed.

Review scope:
- React Native Fabric View implementation
- Android Kotlin native code
- RecyclerView / Adapter / SnapHelper implementation
- TypeScript public API
- Codegen / Fabric component registration
- Example app
- npm package configuration
- Build scripts
- Security
- Performance
- Memory leaks
- Production readiness
- Open-source readiness

Files to inspect:
- package.json
- bob.config.js / react-native-builder-bob config if present
- src/**
- android/**
- example/**
- README.md
- tsconfig.json
- eslint config
- gradle files
- generated Fabric/codegen files if present

Important:
This is an Android-first library.
Do not add iOS or Swift.
Do not add Expo.
Do not add unnecessary dependencies.
Do not use third-party wheel picker libraries.
Do not use Android NumberPicker.

Review categories:

1. Native Android memory leaks
Check for:
- Activity / Context leaks
- improper use of ThemedReactContext
- RecyclerView references not cleaned up
- listeners not removed
- scroll listeners leaking the view
- SnapHelper lifecycle issues
- Adapter holding stale references
- unnecessary strong references
- anonymous inner classes causing leaks
- missing cleanup when view is detached from window

Check if the view needs:
- override fun onDetachedFromWindow()
- recyclerView.clearOnScrollListeners()
- recyclerView.adapter = null
- snapHelper.attachToRecyclerView(null)

2. Android performance
Check for:
- unnecessary notifyDataSetChanged()
- too many layout recalculations
- heavy work inside onBindViewHolder
- excessive object allocations during scroll
- text size/color updates on every frame
- inefficient selected item detection
- poor RecyclerView recycling
- bad use of smoothScrollToPosition
- UI thread blocking
- unnecessary re-rendering when props do not change

Suggest improvements:
- DiffUtil or minimal update strategy if useful
- avoid resetting adapter unnecessarily
- update only changed selected rows
- debounce onChange during scroll
- use RecyclerView.post safely
- avoid duplicate selection events

3. Scroll and snapping correctness
Check:
- selected item always snaps to center
- first and last items can align center
- top/bottom padding is correct
- selectedIndex works on initial render
- selectedIndex updates from JS after mount
- onChange fires only when selection actually changes
- no infinite event loop between selectedIndex prop and onChange
- scroll state handling is correct
- orientation and layout changes are handled

4. Fabric / React Native bridge correctness
Check:
- native component name matches JS spec
- props are typed correctly
- events are emitted correctly
- event payload is stable:
  {
    index: number;
    value: string;
  }
- items prop works with any string[]
- empty items do not crash
- invalid selectedIndex does not crash
- selectedIndex is clamped safely
- component works after reload / fast refresh
- Android package registration is correct
- codegen config is correct

5. TypeScript API review
Check:
- exported types are clean
- public API is minimal and stable
- `style` prop works
- `onChange` type uses NativeSyntheticEvent correctly
- default props are handled consistently
- no hardcoded demo values inside the library
- no unnecessary `any`
- no broken exports
- import path works:
  import { DrumPicker } from 'react-native-drum-picker';

6. Security review
Check:
- no secrets or private data
- no suspicious scripts
- no unsafe postinstall scripts
- no unnecessary network calls
- no eval / Function constructor
- no dangerous file system access
- no logging of user data in production
- no debug logs left in release code
- no malicious dependency risks
- dependencies are minimal
- package files do not include private files

Also check:
- npm publish safety
- `.npmignore` or package.json `files`
- no `.env`
- no Android build artifacts published
- no example build output published
- no local machine paths published

7. NPM package readiness
Check:
- package name
- version
- main/module/types/react-native fields
- files field
- sideEffects if needed
- peerDependencies
- devDependencies
- react-native-builder-bob output
- generated lib folder
- npm pack result
- README installation instructions
- license
- repository URL
- keywords
- author
- release config

Suggest exact changes to package.json if needed.

8. Open-source quality
Check:
- README clarity
- usage examples
- prop table
- Android-only limitation clearly documented
- compatibility section
- troubleshooting section
- contribution guide if needed
- license exists
- example app is clean
- no debug UI left
- no temporary logs left

9. Production crash cases
Test mentally and inspect code for:
- items = []
- items = undefined/null from JS
- selectedIndex < 0
- selectedIndex > items.length - 1
- very long lists, e.g. 1000 items
- very short lists, e.g. 1 item
- changing items while picker is scrolling
- changing selectedIndex while picker is scrolling
- component unmounts while scrolling
- repeated hot reloads
- multiple DrumPicker instances on same screen
- different itemHeight values
- different visibleItemCount values
- odd and even visibleItemCount values

10. Accessibility
Check:
- content descriptions if useful
- touch target issues
- font scaling behavior
- large text support
- TalkBack behavior
- whether important accessibility notes should be documented

11. Build and testing
Check that these commands work or suggest fixes:
- yarn lint
- yarn build
- cd example && yarn android
- npm pack --dry-run

Also suggest additional useful commands:
- yarn typecheck
- yarn test
- ./gradlew lint
- ./gradlew assembleDebug

12. Required output format

First produce:

# Production Code Review Report

## Summary
Give a short honest assessment:
- Is it production-ready?
- What are the biggest risks?
- What must be fixed before npm publish?

## Critical Issues
List only serious problems that can cause crashes, memory leaks, security issues, or broken npm package.

For each issue include:
- file path
- problem
- why it matters
- recommended fix

## High Priority Issues
Performance, bridge correctness, API stability, lifecycle problems.

## Medium Priority Issues
Code quality, maintainability, README, typings.

## Low Priority / Nice to Have
Polish and future improvements.

## Memory Leak Review
Detailed native Android lifecycle review.

## Performance Review
Detailed RecyclerView/Fabric performance review.

## Security Review
Detailed npm/security review.

## NPM Publish Review
Whether this package is safe to publish.

## Exact Fix Plan
Give a numbered checklist of fixes in the best order.

## Patch Plan
After the report, ask before applying changes, unless the fixes are obviously safe and small.

Important:
Be strict. Do not be nice just to be nice.
If something is bad, say it clearly.
This library should be safe for production and open-source npm publishing.