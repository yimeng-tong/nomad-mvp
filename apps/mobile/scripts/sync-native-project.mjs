import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alignAppSpmMinimum } from './native-config-proof.mjs';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Capacitor 8 generates the App SPM major version from Xcode; preserve our approved minor floor.
const result = spawnSync('cap', ['sync', ...process.argv.slice(2)], { cwd: mobile, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const spm = resolve(mobile, 'ios/App/CapApp-SPM/Package.swift');
const original = readFileSync(spm, 'utf8');
const aligned = alignAppSpmMinimum(original);
if (aligned !== original) writeFileSync(spm, aligned);
console.log('App SPM minimum aligned to approved iOS 16.4; runtime evidence remains separate.');
