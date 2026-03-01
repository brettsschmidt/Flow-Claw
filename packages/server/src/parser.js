import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

/**
 * Recursively collect all .md files under a root directory.
 * Returns paths relative to rootDir.
 */
async function collectMarkdownFiles(dir, rootDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectMarkdownFiles(fullPath, rootDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path.relative(rootDir, fullPath));
    }
  }

  return files;
}

/**
 * Parse a single markdown file, returning frontmatter + rendered HTML.
 */
async function parseFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  const html = marked(content);

  return {
    path: filePath,
    frontmatter,
    content,
    html,
  };
}

/**
 * Load and parse all workflow files in a directory.
 * Files with workflow frontmatter (step or id field) are treated as workflow nodes.
 */
export async function loadWorkflow(rootDir) {
  const relativePaths = await collectMarkdownFiles(rootDir, rootDir);
  const files = await Promise.all(
    relativePaths.map(async (rel) => {
      const full = path.join(rootDir, rel);
      const parsed = await parseFile(full);
      return {
        ...parsed,
        path: rel,
        id: parsed.frontmatter.id || rel.replace(/\.md$/, '').replace(/\//g, '-'),
      };
    })
  );

  // Separate workflow nodes (have step or status frontmatter) from plain wiki pages
  const workflowNodes = files.filter(
    (f) => f.frontmatter.step !== undefined || f.frontmatter.status !== undefined
  );
  const wikiPages = files;

  return { workflowNodes, wikiPages };
}

/**
 * Read and parse a single file by its path relative to rootDir.
 */
export async function readFile(rootDir, relativePath) {
  const full = path.join(rootDir, relativePath);
  const parsed = await parseFile(full);
  return {
    ...parsed,
    path: relativePath,
    id: parsed.frontmatter.id || relativePath.replace(/\.md$/, '').replace(/\//g, '-'),
  };
}
