/**
 * Shared fetch helpers for the Flow-Claw API.
 */

/**
 * Merge frontmatter fields into an existing file.
 * Pass null as a value to delete that key from frontmatter.
 */
export async function patchFrontmatter(filePath, updates) {
  const res = await fetch('/api/file', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, frontmatter: updates }),
  });
  if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
}
