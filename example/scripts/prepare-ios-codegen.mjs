import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const exampleRoot = path.resolve(scriptDir, '..');
const generatedSource = path.join(exampleRoot, 'build', 'generated');
const generatedTarget = path.join(exampleRoot, 'ios', 'build', 'generated');

execSync('yarn react-native codegen --platform ios', {
  cwd: exampleRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    RCT_NEW_ARCH_ENABLED: process.env.RCT_NEW_ARCH_ENABLED ?? '1',
  },
});

if (!fs.existsSync(generatedSource)) {
  throw new Error(
    `Expected codegen output at ${generatedSource}. Run from the example app root.`
  );
}

fs.rmSync(generatedTarget, { recursive: true, force: true });
fs.mkdirSync(path.dirname(generatedTarget), { recursive: true });
fs.cpSync(generatedSource, generatedTarget, { recursive: true });

console.log(`Synced iOS codegen: ${generatedSource} -> ${generatedTarget}`);
