/**
 * Runs every test/*.test.mjs in its own process.
 *
 * The tests drive the MCP server against a real ONVIF Controller and its mock
 * camera, so they need a controller checkout (see test/harness.mjs):
 *   CONTROLLER_REPO=/path/to/onvif_controller npm test
 * or a sibling clone named onvif_controller.
 */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findController } from './harness.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const controller = findController();
if (!controller) {
  console.error('No ONVIF Controller checkout found.\n'
    + '  git clone https://github.com/Emre-Diricanli/onvif_controller ../onvif_controller && npm install --prefix ../onvif_controller\n'
    + '  or: CONTROLLER_REPO=/path/to/onvif_controller npm test');
  process.exit(1);
}
console.log(`Testing against the controller at ${controller}`);

const filter = process.argv[2] ?? '';
const files = readdirSync(HERE).filter((f) => f.endsWith('.test.mjs') && f.includes(filter)).sort();
const failed = [];
for (const file of files) {
  console.log(`\n=== ${file}`);
  const ok = await new Promise((resolve) => {
    spawn(process.execPath, [path.join(HERE, file)], { stdio: 'inherit' }).on('exit', (code) => resolve(code === 0));
  });
  if (!ok) failed.push(file);
}
console.log(`\n=== ${files.length - failed.length}/${files.length} test files passed`);
process.exit(failed.length ? 1 : 0);
