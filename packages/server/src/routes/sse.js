import { Router } from 'express';

/**
 * SSE endpoint — clients subscribe here and receive push events when files change.
 * Event format: { type: 'add' | 'change' | 'unlink', path: string }
 */
export function createSSERouter(emitter) {
  const router = Router();

  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Heartbeat to keep connection alive through proxies
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30_000);

    emitter.on('file-change', send);

    req.on('close', () => {
      clearInterval(heartbeat);
      emitter.off('file-change', send);
    });
  });

  return router;
}
