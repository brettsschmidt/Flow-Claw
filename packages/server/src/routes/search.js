import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { collectMarkdownFiles } from '../parser.js';

export function createSearchRouter(getWorkflowDir) {
  const router = Router();

  router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ results: [] });

    const query = q.trim().toLowerCase();
    const rootDir = getWorkflowDir();

    try {
      const relativePaths = await collectMarkdownFiles(rootDir, rootDir);

      const results = (
        await Promise.all(
          relativePaths.map(async (rel) => {
            const raw = await fs.readFile(path.join(rootDir, rel), 'utf-8');
            const { data: frontmatter, content } = matter(raw);

            // Build a single searchable text blob from all relevant fields
            const searchable = [
              content,
              frontmatter.title,
              frontmatter.description,
              ...(frontmatter.tags || []),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            if (!searchable.includes(query)) return null;

            // Extract a snippet around the first match
            const idx = searchable.indexOf(query);
            const start = Math.max(0, idx - 80);
            const end = Math.min(searchable.length, idx + query.length + 80);
            const snippet =
              (start > 0 ? '…' : '') +
              searchable.slice(start, end) +
              (end < searchable.length ? '…' : '');

            return {
              path: rel,
              title: frontmatter.title || rel.replace(/\.md$/, ''),
              frontmatter,
              snippet,
            };
          })
        )
      ).filter(Boolean);

      res.json({ results });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
