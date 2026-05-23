# CodeQL setup

This repository uses **CodeQL advanced setup** (`.github/workflows/codeql.yml`).

GitHub allows **only one** CodeQL mode per repository. If **default setup** is enabled in repository settings, the advanced workflow fails on upload with:

```text
CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled
```

## Fix (repository admin)

1. Open **Settings** → **Code security** (or **Advanced Security**).
2. Under **Code scanning** → **CodeQL analysis**.
3. Choose **Disable CodeQL** / **Switch to advanced** (disable default setup).
4. Re-run the **CodeQL** workflow.

Docs: [Upload rejected because default setup is enabled](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning/troubleshooting-sarif-uploads/default-setup-enabled)

The workflow tries to set default setup to `not-configured` via the GitHub API at the start of each run. If that step fails with `403`, disable default setup manually using the steps above.

## What we scan

| Language | Scope |
|----------|--------|
| `javascript-typescript` | `src/`, `example/` (TypeScript API) |
| `java-kotlin` | `android/` (Kotlin Fabric view) |
| `actions` | `.github/workflows/` |
