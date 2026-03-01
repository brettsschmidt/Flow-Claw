import chokidar from 'chokidar';

/**
 * Watch a directory for markdown file changes.
 * Calls onChange with the event type and file path when a .md file changes.
 */
export function watchDirectory(dir, onChange) {
  const watcher = chokidar.watch(`${dir}/**/*.md`, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  watcher
    .on('add', (filePath) => onChange('add', filePath))
    .on('change', (filePath) => onChange('change', filePath))
    .on('unlink', (filePath) => onChange('unlink', filePath));

  return watcher;
}
