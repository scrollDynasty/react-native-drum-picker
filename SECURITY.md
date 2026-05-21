# Security Policy

## Supported versions


| Version | Supported                 |
| ------- | ------------------------- |
| `0.1.x` | Yes (latest release line) |
| `< 0.1` | No                        |


Security fixes are applied to the latest minor release when possible.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report them privately using one of:

- [GitHub Security Advisories](https://github.com/scrollDynasty/react-native-drum-picker/security/advisories/new) (preferred)
- Contact the maintainer listed in [package.json](./package.json) (`author` field)

We will acknowledge reports as soon as possible and work on a fix or mitigation. Please allow reasonable time before public disclosure.

## Scope

This library:

- Renders native Android UI and passes user-provided strings through events
- Does **not** collect analytics, store personal data, or perform network requests by itself
- Does **not** execute arbitrary code from props

Still treat **dependency supply chain** seriously: verify package integrity when installing from npm, pin versions in apps, and audit your lockfile.

## Out of scope

Issues in **React Native**, **Android**, or **app code** that merely uses this picker are usually not vulnerabilities in this package. Report those to the appropriate projects unless they stem from this library’s native implementation.

## Safe usage

- Install from the official npm package name: `react-native-drum-picker`
- Rebuild native code after upgrades
- Do not commit `.env`, keystores, or tokens to the example app or your fork

