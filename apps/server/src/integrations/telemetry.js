"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.langfuse = exports.sentryInit = void 0;
exports.trackFillRun = trackFillRun;
var Sentry = require("@sentry/node");
var langfuse_1 = require("langfuse");
var sentryInit = function () {
    if (!process.env.SENTRY_DSN)
        return;
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
};
exports.sentryInit = sentryInit;
exports.langfuse = (function () {
    if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_HOST)
        return null;
    return new langfuse_1.Langfuse({ publicKey: process.env.LANGFUSE_PUBLIC_KEY, secretKey: process.env.LANGFUSE_SECRET_KEY, baseUrl: process.env.LANGFUSE_HOST });
})();
function trackFillRun(meta) {
    if (!exports.langfuse)
        return;
    exports.langfuse.trace({ name: 'fill_run', input: { prompt_ver: meta.prompt_ver, model_ver: meta.model_ver, seed: meta.seed }, metadata: { cost: meta.cost, latency_ms: meta.latency_ms, trace_id: meta.trace_id } });
}
