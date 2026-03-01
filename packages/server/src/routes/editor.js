import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

export function createEditorRouter(getWorkflowDir) {
  const router = Router();

  router.put('/file', async (req, res) => {
    const { path: filePath, content } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'path and content are required' });
    }

    const rootDir = path.resolve(getWorkflowDir());
    const fullPath = path.resolve(rootDir, filePath);

    // Security: must stay within the workflow directory
    if (!fullPath.startsWith(rootDir + path.sep) && fullPath !== rootDir) {
      return res.status(403).json({ error: 'Path is outside the workflow directory' });
    }

    // Only allow editing .md files
    if (!fullPath.endsWith('.md')) {
      return res.status(400).json({ error: 'Only .md files can be edited' });
    }

    try {
      await fs.writeFile(fullPath, content, 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
