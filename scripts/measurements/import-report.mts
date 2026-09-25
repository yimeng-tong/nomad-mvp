import { readFile, writeFile } from 'node:fs/promises';
import { createImportMeasurementReport, validateImportMeasurementManifest } from '../../packages/types/src/import-measurements.js';

const [input, output] = process.argv.slice(2);
try {
  if (!input) throw new Error();
  const raw = JSON.parse(await readFile(input, 'utf8')) as { manifest: unknown; samples: unknown[] };
  validateImportMeasurementManifest(raw.manifest);
  const report = createImportMeasurementReport(raw.manifest, raw.samples);
  const text = JSON.stringify(report, null, 2) + '\n';
  if (output) await writeFile(output, text); else process.stdout.write(text);
} catch { process.stderr.write('MEASUREMENT_REPORT_INPUT_INVALID\n'); process.exitCode = 1; }
