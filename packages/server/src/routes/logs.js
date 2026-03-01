import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

export function createLogsRouter(getWorkflowDir) {
  const router = Router();

  // List .log files in the workflow directory
  router.get('/logs/files', async (req, res) => {
    try {
      const entries = await fsp.readdir(getWorkflowDir(), { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile() && e.name.endsWith('.log'))
        .map((e) => e.name);
      res.json({ files });
    } catch {
      res.json({ files: [] });
    }
  });

  // SSE endpoint — streams existing content then tails for new lines
  router.get('/logs/events', (req, res) => {
    const { file = 'agent.log' } = req.query;
    const rootDir = path.resolve(getWorkflowDir());
    const logPath = path.resolve(rootDir, file);

    // Security: must stay within workflow directory
    if (!logPath.startsWith(rootDir + path.sep) && logPath !== rootDir) {
      return res.status(403).json({ error: 'Path is outside the workflow directory' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let position = 0;

    // Read existing content, then start tailing
    fsp
      .readFile(logPath, 'utf-8')
      .then((existing) => {
        position = Buffer.byteLength(existing, 'utf-8');
        const lines = existing.split('\n');
        for (const line of lines) {
          if (line) send({ type: 'line', text: line });
        }
      })
      .catch(() => {
        send({ type: 'status', text: `Waiting for ${file}…` });
      });

    // Poll for appended content every 500ms
    const poll = setInterval(async () => {
      try {
        const stat = await fsp.stat(logPath);
        if (stat.size <= position) return;

        const handle = await fsp.open(logPath, 'r');
        const buf = Buffer.alloc(stat.size - position);
        await handle.read(buf, 0, buf.length, position);
        await handle.close();
        position = stat.size;

        const newText = buf.toString('utf-8');
        for (const line of newText.split('\n')) {
          if (line.trim()) send({ type: 'line', text: line });
        }
      } catch {
        // File may not exist yet — keep waiting
      }
    }, 500);

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(': heartbeat\n\n');
    }, 30_000);

    req.on('close', () => {
      clearInterval(poll);
      clearInterval(heartbeat);
    });
  });

  return router;
}
