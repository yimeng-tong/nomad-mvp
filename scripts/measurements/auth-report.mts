import { readFile, writeFile, stat } from 'node:fs/promises';
import { createAuthMeasurementReport, validateAuthMeasurementManifest } from '../../packages/types/src/auth-measurements.js';
const [input, output] = process.argv.slice(2);
try {
  if (!input || (await stat(input)).size > 8 * 1024 * 1024) throw new Error();
  const raw = JSON.parse(await readFile(input, 'utf8')) as { manifest: unknown; samples: unknown[] };
  validateAuthMeasurementManifest(raw.manifest);
  const report = createAuthMeasurementReport(raw.manifest, raw.samples), text = JSON.stringify(report, null, 2) + '\n';
  if (output) await writeFile(output, text, { flag: 'wx' }); else process.stdout.write(text);
} catch { process.stderr.write('AUTH_MEASUREMENT_REPORT_INPUT_INVALID\n'); process.exitCode = 1; }
