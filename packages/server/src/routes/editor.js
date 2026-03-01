import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

function guardPath(rootDir, filePath) {
  const full = path.resolve(rootDir, filePath);
  if (!full.startsWith(rootDir + path.sep) && full !== rootDir) {
    throw Object.assign(new Error('Path is outside the workflow directory'), { status: 403 });
  }
  if (!full.endsWith('.md')) {
    throw Object.assign(new Error('Only .md files can be edited'), { status: 400 });
  }
  return full;
}

export function createEditorRouter(getWorkflowDir) {
  const router = Router();

  // PUT /api/file — overwrite entire file content
  router.put('/file', async (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'path and content are required' });
    }
    try {
      const rootDir = path.resolve(getWorkflowDir());
      const fullPath = guardPath(rootDir, filePath);
      await fs.writeFile(fullPath, content, 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // PATCH /api/file — merge specific frontmatter fields (send null to delete a key)
  router.patch('/file', async (req, res) => {
    const { path: filePath, frontmatter: updates } = req.body;
    if (!filePath || !updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'path and frontmatter object are required' });
    }
    try {
      const rootDir = path.resolve(getWorkflowDir());
      const fullPath = guardPath(rootDir, filePath);

      const raw = await fs.readFile(fullPath, 'utf-8');
      const { data: fm, content } = matter(raw);

      const merged = { ...fm };
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) delete merged[key];
        else merged[key] = value;
      }

      await fs.writeFile(fullPath, matter.stringify(content, merged), 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // POST /api/file — create a new file (409 if already exists)
  router.post('/file', async (req, res) => {
    const { path: filePath, content = '' } = req.body;
    if (!filePath) return res.status(400).json({ error: 'path is required' });
    try {
      const rootDir = path.resolve(getWorkflowDir());
      const fullPath = guardPath(rootDir, filePath);

      try {
        await fs.access(fullPath);
        return res.status(409).json({ error: `File already exists: ${filePath}` });
      } catch {}

      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  return router;
}
