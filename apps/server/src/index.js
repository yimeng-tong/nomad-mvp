"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fastify_1 = require("fastify");
var rate_limit_1 = require("@fastify/rate-limit");
var fastify_plugin_1 = require("fastify-plugin");
var fastify_sse_v2_1 = require("fastify-sse-v2");
var node_crypto_1 = require("node:crypto");
var trace_id_js_1 = require("./plugins/trace-id.js");
var error_envelope_js_1 = require("./plugins/error-envelope.js");
var idempotency_js_1 = require("./plugins/idempotency.js");
var idempotency_redis_js_1 = require("./plugins/idempotency-redis.js");
var telemetry_js_1 = require("./integrations/telemetry.js");
var flags_js_1 = require("./integrations/flags.js");
var schemas_js_1 = require("./schemas.js");
var renderer_js_1 = require("./export/renderer.js");
var service_js_1 = require("./fill/service.js");
(0, telemetry_js_1.sentryInit)();
var app = (0, fastify_1.default)({ logger: true });
await (0, flags_js_1.initFlags)();
var RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
var SSE_HEARTBEAT_MS = Number(process.env.SSE_HEARTBEAT_MS || 10000);
var SSE_IDLE_TIMEOUT_MS = Number(process.env.SSE_IDLE_TIMEOUT_MS || 30000);
await app.register(rate_limit_1.default, {
    max: 1000,
    timeWindow: RATE_LIMIT_WINDOW_MS,
    keyGenerator: function (req) { var _a; return "".concat((_a = req.headers['x-device-id']) !== null && _a !== void 0 ? _a : 'nodev', ":").concat(req.ip); }
});
await app.register(fastify_sse_v2_1.default);
await app.register(trace_id_js_1.default);
await app.register(error_envelope_js_1.default);
await app.register(idempotency_js_1.default);
await app.register(idempotency_redis_js_1.default);
// SSE helper plugin: standard ping and headers
await app.register((0, fastify_plugin_1.default)(function (f) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        f.decorate('ssePing', function (reply, traceId, seq) {
            reply.sse({ event: 'ping', data: JSON.stringify({ trace_id: traceId, seq: seq, heartbeat_ms: 10000, ts: Date.now() }) });
        });
        f.decorate('sendError', function (reply, code, message, retriable, details) {
            if (retriable === void 0) { retriable = false; }
            reply.code(400).send({ error_code: code, error_message: message, retriable: retriable, details: details });
        });
        return [2 /*return*/];
    });
}); }));
// Health
app.get('/health', function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, ({ status: 'ok' })];
}); }); });
// Minimal ingest start (ACK 202)
app.post('/ingest/start', { config: { rateLimit: { max: 30, timeWindow: 24 * 60 * 60 * 1000 } } }, function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var traceId, parsed, cached, ingestId, res;
    var _a;
    return __generator(this, function (_b) {
        traceId = req.traceId || (0, node_crypto_1.randomUUID)();
        parsed = schemas_js_1.IngestStartBody.safeParse((_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!parsed.success)
            return [2 /*return*/, reply.sendError('PLAN_PARAMS_INVALID', 'invalid ingest body', 400, false, { issues: parsed.error.issues })];
        cached = app.checkIdempotency('/ingest/start', req.body, 24 * 60 * 60 * 1000);
        if (cached)
            return [2 /*return*/, reply.header('X-Trace-Id', traceId).code(202).send(cached)];
        ingestId = "ing_".concat((0, node_crypto_1.randomUUID)());
        res = { ingest_id: ingestId, state: 'created', sse_url: "/sse/ingest/".concat(ingestId) };
        app.storeIdempotency('/ingest/start', req.body, 24 * 60 * 60 * 1000, res);
        reply.header('X-Trace-Id', traceId).code(202).send(res);
        return [2 /*return*/];
    });
}); });
// SSE mock streams
app.get('/sse/ingest/:id', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var traceId, ingestId, lastEvent, ping;
    return __generator(this, function (_a) {
        traceId = req.headers['x-trace-id'] || (0, node_crypto_1.randomUUID)();
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Connection', 'keep-alive');
        ingestId = req.params.id;
        reply.sse({ event: 'ingest', data: JSON.stringify({ trace_id: traceId, ingest_id: ingestId, state: 'created', retry: 0, ts: Date.now() }) });
        lastEvent = Date.now();
        ping = setInterval(function () {
            var now = Date.now();
            if (now - lastEvent > SSE_IDLE_TIMEOUT_MS) {
                reply.sse({ event: 'error', data: JSON.stringify({ error_code: 'SSE_IDLE_TIMEOUT', error_message: 'idle timeout', retriable: true, ts: now }) });
                clearInterval(ping);
                try {
                    reply.raw.end();
                }
                catch (_a) { }
                return;
            }
            reply.sse({ event: 'ping', data: JSON.stringify({ trace_id: traceId, seq: now, heartbeat_ms: SSE_HEARTBEAT_MS, ts: now }) });
        }, SSE_HEARTBEAT_MS);
        req.raw.on('close', function () { return clearInterval(ping); });
        return [2 /*return*/];
    });
}); });
// Plan generate → ACK 202 and stream phases
app.post('/plan/generate', { config: { rateLimit: { max: 60, timeWindow: 24 * 60 * 60 * 1000 } } }, function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var traceId, parsed, cached, planId, planJobId, res;
    var _a;
    return __generator(this, function (_b) {
        traceId = req.traceId || (0, node_crypto_1.randomUUID)();
        parsed = schemas_js_1.PlanGenerateBody.safeParse((_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!parsed.success)
            return [2 /*return*/, reply.sendError('PLAN_PARAMS_INVALID', 'invalid plan body', 400, false, { issues: parsed.error.issues })];
        cached = app.checkIdempotency('/plan/generate', req.body, 10 * 60 * 1000);
        if (cached)
            return [2 /*return*/, reply.header('X-Trace-Id', traceId).code(202).send(cached)];
        planId = "pl_".concat((0, node_crypto_1.randomUUID)());
        planJobId = "pj_".concat((0, node_crypto_1.randomUUID)());
        res = { plan_id: planId, plan_job_id: planJobId, sse_url: "/sse/plan/".concat(planJobId) };
        app.storeIdempotency('/plan/generate', req.body, 10 * 60 * 1000, res);
        reply.header('X-Trace-Id', traceId).code(202).send(res);
        return [2 /*return*/];
    });
}); });
app.get('/sse/plan/:jobId', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var traceId, jobId, phases, idx, tick, ping;
    return __generator(this, function (_a) {
        traceId = req.headers['x-trace-id'] || (0, node_crypto_1.randomUUID)();
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Connection', 'keep-alive');
        jobId = req.params.jobId;
        phases = ['started', 'anchor', 'cluster', 'validate', 'persist', 'done'];
        idx = 0;
        tick = function () {
            var phase = phases[idx];
            var now = Date.now();
            reply.sse({ event: 'plan', data: JSON.stringify({ trace_id: traceId, plan_job_id: jobId, phase: phase, unplaced_count: 0, ts: now }) });
            idx += 1;
            if (idx >= phases.length)
                return;
            setTimeout(tick, 1500);
        };
        tick();
        ping = setInterval(function () { return reply.sse({ event: 'ping', data: JSON.stringify({ trace_id: traceId, seq: Date.now(), heartbeat_ms: SSE_HEARTBEAT_MS, ts: Date.now() }) }); }, SSE_HEARTBEAT_MS);
        req.raw.on('close', function () { return clearInterval(ping); });
        return [2 /*return*/];
    });
}); });
// Plan edit slot (optimistic lock placeholder)
app.patch('/plan/slots/:slotId', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var undo;
    return __generator(this, function (_a) {
        undo = "u_".concat((0, node_crypto_1.randomUUID)());
        reply.send({ undo_token: undo, plan_rev: 2 });
        return [2 /*return*/];
    });
}); });
// AI Fill → 202 and SSE
app.post('/plan/ai-fill', { config: { rateLimit: { max: 10, timeWindow: 60 * 60 * 1000 } } }, function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var traceId, parsed, fillRunId, res;
    var _a;
    return __generator(this, function (_b) {
        traceId = req.traceId || (0, node_crypto_1.randomUUID)();
        parsed = schemas_js_1.AiFillBody.safeParse((_a = req.body) !== null && _a !== void 0 ? _a : {});
        if (!parsed.success)
            return [2 /*return*/, reply.sendError('PLAN_PARAMS_INVALID', 'invalid fill body', 400, false, { issues: parsed.error.issues })];
        fillRunId = "fr_".concat((0, node_crypto_1.randomUUID)());
        res = { fill_run_id: fillRunId, sse_url: "/sse/fill/".concat(fillRunId) };
        reply.header('X-Trace-Id', traceId).code(202).send(res);
        return [2 /*return*/];
    });
}); });
app.get('/sse/fill/:runId', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var traceId, runId, done, total, step, ping;
    return __generator(this, function (_a) {
        traceId = req.headers['x-trace-id'] || (0, node_crypto_1.randomUUID)();
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Connection', 'keep-alive');
        runId = req.params.runId;
        reply.sse({ event: 'fill', data: JSON.stringify({ trace_id: traceId, fill_run_id: runId, phase: 'started', ts: Date.now() }) });
        done = 0;
        total = 4;
        step = setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
            var simulated, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        done += 1;
                        if (!(done < total)) return [3 /*break*/, 1];
                        reply.sse({ event: 'fill', data: JSON.stringify({ trace_id: traceId, fill_run_id: runId, phase: 'progress', batch_done: done, batch_total: total, ok: done, invalid: 0, ts: Date.now() }) });
                        return [3 /*break*/, 6];
                    case 1:
                        simulated = { items: [{ slot_id: 's1', do: ['步行到西湖', '拍照'], prepare: ['充电'], notice: ['避开人流'] }] };
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        (0, service_js_1.validateOrThrow)(simulated);
                        return [4 /*yield*/, (0, service_js_1.persistFillOutput)(runId, simulated)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        reply.sse({ event: 'error', data: JSON.stringify({ error_code: 'FILL_VALIDATION_FAILED', error_message: 'schema validation failed', retriable: true, details: e_1 === null || e_1 === void 0 ? void 0 : e_1.details, ts: Date.now() }) });
                        return [3 /*break*/, 5];
                    case 5:
                        // Langfuse tracking stub
                        (0, telemetry_js_1.trackFillRun)({ prompt_ver: '2025-10-26', model_ver: 'gpt-4o-mini', latency_ms: 1500 * total, trace_id: traceId });
                        reply.sse({ event: 'fill', data: JSON.stringify({ trace_id: traceId, fill_run_id: runId, phase: 'done', ts: Date.now() }) });
                        clearInterval(step);
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); }, 1500);
        ping = setInterval(function () { return reply.sse({ event: 'ping', data: JSON.stringify({ trace_id: traceId, seq: Date.now(), heartbeat_ms: SSE_HEARTBEAT_MS, ts: Date.now() }) }); }, SSE_HEARTBEAT_MS);
        req.raw.on('close', function () { clearInterval(step); clearInterval(ping); });
        return [2 /*return*/];
    });
}); });
// Export PNG/WebP (mock)
app.post('/export/png', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, body, width, slice, out;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                parsed = schemas_js_1.ExportBody.safeParse((_a = req.body) !== null && _a !== void 0 ? _a : {});
                if (!parsed.success)
                    return [2 /*return*/, reply.sendError('PLAN_PARAMS_INVALID', 'invalid export body', 400, false, { issues: parsed.error.issues })];
                body = parsed.data;
                width = (_b = body.width_px) !== null && _b !== void 0 ? _b : 1080;
                slice = (_c = body.slice_by_day) !== null && _c !== void 0 ? _c : true;
                return [4 /*yield*/, (0, renderer_js_1.renderPlanToImages)(body.plan_id, width, slice)];
            case 1:
                out = _d.sent();
                reply.send(out);
                return [2 /*return*/];
        }
    });
}); });
var port = Number(process.env.PORT || 3000);
app.listen({ port: port, host: '0.0.0.0' }).then(function () {
    app.log.info("server listening on ".concat(port));
});
