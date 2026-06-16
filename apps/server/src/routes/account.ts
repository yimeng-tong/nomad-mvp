import fp from 'fastify-plugin';
import { authGuard } from '../plugins/auth.js';

export default fp(async (app) => {
  app.post('/account/export', { preHandler: authGuard }, async (req: any) => {
    const taskId = `exp_${Date.now()}`;
    await app.queues.exportQueue.add('export', { user_id: req.user!.id, task_id: taskId }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
    return { task_id: taskId, status: 'queued' };
  });

  app.delete('/account', { preHandler: authGuard }, async (req: any) => {
    const taskId = `del_${Date.now()}`;
    await app.queues.deleteQueue.add('delete', { user_id: req.user!.id, task_id: taskId }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
    return { task_id: taskId, status: 'queued' };
  });
});


