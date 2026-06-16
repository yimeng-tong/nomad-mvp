"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFillOutput = validateFillOutput;
var _2020_1 = require("ajv/dist/2020");
var json_schema_2020_12_json_1 = require("ajv/dist/refs/json-schema-2020-12.json");
var fill_output_schema_json_1 = require("../../../../packages/prompts/schemas/fill-output.schema.json");
var ajv = new _2020_1.default({ allErrors: true, strict: false });
ajv.addMetaSchema(json_schema_2020_12_json_1.default);
var validate = ajv.compile(fill_output_schema_json_1.default);
function validateFillOutput(data) {
    var ok = validate(data);
    return { ok: !!ok, errors: validate.errors };
}
