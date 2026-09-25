import fp from 'fastify-plugin';
import { authGuard } from '../plugins/auth.js';

export default fp(async (app) => {
  app.post('/account/export', { preHandler: authGuard }, async (req: any, reply) => {
    if (app.authAuthority) return reply.sendError('FEATURE_NOT_AVAILABLE', 'Account export is not available yet', 503, false);
    const taskId = `exp_${Date.now()}`;
    await app.queues.exportQueue.add('export', { user_id: req.user!.id, task_id: taskId }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
    return { task_id: taskId, status: 'queued' };
  });

  app.delete('/account', { preHandler: authGuard }, async (req: any, reply) => {
    if (app.authAuthority) return reply.sendError('FEATURE_NOT_AVAILABLE', 'Account deletion is not available yet', 503, false);
    const taskId = `del_${Date.now()}`;
    await app.queues.deleteQueue.add('delete', { user_id: req.user!.id, task_id: taskId }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
    return { task_id: taskId, status: 'queued' };
  });
});

