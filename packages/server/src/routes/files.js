import { Router } from 'express';
import { loadWorkflow, readFile } from '../parser.js';

export function createFilesRouter(getWorkflowDir) {
  const router = Router();

  // GET /api/workflow — return all nodes and pages
  router.get('/workflow', async (req, res) => {
    try {
      const data = await loadWorkflow(getWorkflowDir());
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/file?path=relative/path.md — return a single parsed file
  router.get('/file', async (req, res) => {
    const { path: filePath } = req.query;
    if (!filePath) return res.status(400).json({ error: 'path query param required' });

    try {
      const file = await readFile(getWorkflowDir(), filePath);
      res.json(file);
    } catch (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'File not found' });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
