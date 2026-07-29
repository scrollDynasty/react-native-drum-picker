/**
 * Verifies that the tarball npm would publish actually contains everything a
 * consumer needs to build the native code.
 *
 * This exists because the `files` array in package.json is an allow-list: a file
 * can be present in git, exercised by CI (which builds the example straight from
 * the workspace) and still be missing from the published package. That is exactly
 * how DrumPicker.podspec went missing in 0.2.4/0.3.0 — without it CocoaPods
 * autolinking cannot find the pod and iOS renders
 * "Unimplemented component: <DrumPickerView>". See issue #21.
 *
 * Run after `yarn build`, since the JS entry points are checked too.
 */

const { execFileSync } = await import('node:child_process');
const { readFileSync } = await import('node:fs');

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

// Files that must be at an exact path in the tarball.
const REQUIRED_FILES = [
  // Resolved by the RN CLI via a `*.podspec` glob over the package root, so the
  // path has to stay at the root — a nested copy would not be autolinked.
  'DrumPicker.podspec',
  'react-native.config.js',
  'android/build.gradle',
  'android/src/main/AndroidManifest.xml',
  'android/src/main/java/com/drumpicker/DrumPickerPackage.kt',
  'android/src/main/java/com/drumpicker/DrumPickerViewManager.kt',
  // Entry points declared in package.json, checked wherever they point.
  pkg.main,
  pkg.module,
  pkg.types,
  pkg.source,
].filter(Boolean);

// At least one file must match each of these, otherwise the podspec/gradle
// globs resolve to nothing and the native target compiles empty.
const REQUIRED_PATTERNS = [
  {
    label: 'iOS sources (DrumPicker.podspec source_files)',
    test: (p) => /^ios\/.+\.(h|m|mm|swift|cpp)$/.test(p),
  },
  {
    label: 'Android Kotlin sources',
    test: (p) => /^android\/src\/main\/java\/com\/drumpicker\/.+\.kt$/.test(p),
  },
];

const normalize = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '');

let raw;
try {
  raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
  });
} catch {
  console.error('❌ `npm pack --dry-run --json` failed — see the output above.');
  process.exit(1);
}

let packed;
try {
  packed = JSON.parse(raw)[0].files.map((f) => normalize(f.path));
} catch {
  console.error('❌ Could not parse the output of `npm pack --dry-run --json`.');
  process.exit(1);
}

const missingFiles = [...new Set(REQUIRED_FILES.map(normalize))].filter(
  (f) => !packed.includes(f)
);
const missingPatterns = REQUIRED_PATTERNS.filter(
  (p) => !packed.some((f) => p.test(f))
);

if (missingFiles.length === 0 && missingPatterns.length === 0) {
  console.log(
    `✅ Package contents OK — ${packed.length} files, all required native and JS artifacts present.`
  );
  process.exit(0);
}

console.error('❌ The published package would be missing required files:\n');
for (const f of missingFiles) {
  console.error(`   - ${f}`);
}
for (const p of missingPatterns) {
  console.error(`   - no file matching: ${p.label}`);
}
console.error(
  '\nAdd the missing paths to the "files" array in package.json.' +
    '\nIf a JS entry point is missing, run `yarn build` first.'
);
process.exit(1);
