import fp from 'fastify-plugin';
import { authGuard } from '../plugins/auth.js';

const safeSourcePattern = /^[a-zA-Z0-9_.-]{1,64}$/;

function feedbackProductUrl(source?: string) {
  const productId = process.env.FEEDBACK_PRODUCT_ID || 'nomad-mvp';
  const url = new URL(`https://support.qq.com/product/${encodeURIComponent(productId)}`);
  if (source && safeSourcePattern.test(source)) url.searchParams.set('source', source);
  return url.toString();
}

export default fp(async (app) => {
  app.get('/feedback/link', { preHandler: authGuard }, async (req: any) => {
    const query = (req.query ?? {}) as { source?: string };
    return { url: feedbackProductUrl(query.source) };
  });
});
