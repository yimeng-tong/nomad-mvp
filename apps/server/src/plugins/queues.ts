import fp from 'fastify-plugin';
import { Queue } from 'bullmq';

declare module 'fastify' {
  interface FastifyInstance {
    queues: {
      exportQueue: Queue,
      deleteQueue: Queue,
    }
  }
}

export default fp(async (app) => {
  const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } } as any;
  app.decorate('queues', {
    exportQueue: new Queue('account-export', connection),
    deleteQueue: new Queue('account-delete', connection),
  });
});


