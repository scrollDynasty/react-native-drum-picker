## Summary

What does this PR change and why?

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactor / chore
- [ ] Native change (Android Kotlin / iOS Swift)
- [ ] Tests only

## Checklist

- [ ] I read [CONTRIBUTING.md](../CONTRIBUTING.md)
- [ ] I tested on **Android** and/or **iOS** (platforms I changed)
- [ ] I ran `yarn lint`, `yarn build`, `yarn typecheck`, and `yarn test` from the repo root
- [ ] I added or updated tests in the correct folder (see [CONTRIBUTING.md — tests](../CONTRIBUTING.md#where-to-add-tests-so-ci-picks-them-up))
- [ ] I updated docs if the **public API** changed
- [ ] I committed `yarn.lock` if `package.json` dependencies changed
- [ ] I did **not** add unnecessary dependencies
- [ ] I removed debug logs from library code
- [ ] I did **not** hardcode demo values in `src/`, `android/`, or `ios/` (example app only)
- [ ] For native changes: I considered memory leaks and scroll performance

## CI

PRs to `main` run the full [CI workflow](https://github.com/scrollDynasty/react-native-drum-picker/actions/workflows/ci.yml) automatically. New tests in standard locations are picked up without editing `ci.yml`.

## Screenshots / recordings (UI changes)

If applicable, add before/after visuals.

## Related issues

Fixes # (issue number)
