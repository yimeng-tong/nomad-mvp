import { Ajv2020 as Ajv } from 'ajv/dist/2020.js';
import schema from '../../../../packages/prompts/schemas/fill-output.schema.json' with { type: 'json' };

const ajv = new Ajv({ allErrors: true, strict: false } as any);
const validate = ajv.compile(schema as any);

export function validateFillOutput(data: unknown) {
  const ok = validate(data);
  return { ok: !!ok, errors: validate.errors };
}


