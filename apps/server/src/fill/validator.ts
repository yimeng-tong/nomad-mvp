import Ajv from 'ajv/dist/2020';
import meta2020 from 'ajv/dist/refs/json-schema-2020-12.json' with { type: 'json' };
import schema from '../../../../packages/prompts/schemas/fill-output.schema.json' with { type: 'json' };

const ajv = new Ajv({ allErrors: true, strict: false } as any);
ajv.addMetaSchema(meta2020 as any);
const validate = ajv.compile(schema as any);

export function validateFillOutput(data: unknown) {
  const ok = validate(data);
  return { ok: !!ok, errors: validate.errors };
}


