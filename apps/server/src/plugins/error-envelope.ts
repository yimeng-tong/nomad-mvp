import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyReply {
    sendError: (code: string, message: string, status?: number, retriable?: boolean, details?: Record<string, unknown>) => void;
  }
}

export default fp(async (app) => {
  app.decorateReply('sendError', function (code: string, message: string, status = 400, retriable = false, details?: Record<string, unknown>) {
    this.code(status).send({ error_code: code, error_message: message, retriable, details });
  });
});


