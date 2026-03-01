import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { createFilesRouter } from './routes/files.js';
import { createSSERouter } from './routes/sse.js';
import { watchDirectory } from './watcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startServer({ workflowDir, port = 3001, openBrowser = false }) {
  let currentWorkflowDir = workflowDir;
  const emitter = new EventEmitter();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // API routes
  app.use('/api', createFilesRouter(() => currentWorkflowDir));
  app.use('/api', createSSERouter(emitter));

  // Expose the watched directory path to the UI
  app.get('/api/config', (req, res) => {
    res.json({ workflowDir: currentWorkflowDir });
  });

  // Serve built UI in production; in dev the Vite server handles this
  const uiDist = path.join(__dirname, '../../ui/dist');
  app.use(express.static(uiDist));
  app.get('*', (req, res) => {
    const index = path.join(uiDist, 'index.html');
    res.sendFile(index, (err) => {
      if (err) {
        // UI not built yet — send a helpful message
        res.status(200).send(`
          <html><body style="font-family:monospace;padding:2rem">
            <h2>Flow-Claw server is running</h2>
            <p>UI not built. Run <code>npm run build</code> in packages/ui, or start the dev server with <code>npm run dev</code>.</p>
            <p>API available at <a href="/api/workflow">/api/workflow</a></p>
          </body></html>
        `);
      }
    });
  });

  // Watch for file changes and broadcast via SSE
  watchDirectory(currentWorkflowDir, (type, filePath) => {
    const relative = path.relative(currentWorkflowDir, filePath);
    console.log(`[watch] ${type}: ${relative}`);
    emitter.emit('file-change', { type, path: relative });
  });

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      if (openBrowser) {
        // Lazy import to avoid errors in Docker/headless envs
        import('open').then(({ default: open }) => open(`http://localhost:${port}`)).catch(() => {});
      }
      resolve(server);
    });
  });
}
