import React, { useState, useEffect } from 'react';
import FileTree from '../components/FileTree.jsx';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import Editor from '../components/Editor.jsx';
import NewFileModal from '../components/NewFileModal.jsx';
import { useFile } from '../hooks/useWorkflow.js';

export default function WikiView({ wikiPages, initialPath }) {
  const [selectedPath, setSelectedPath] = useState(initialPath || wikiPages[0]?.path || null);
  const [editing, setEditing] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const { data: file, loading, error } = useFile(selectedPath);

  useEffect(() => {
    if (initialPath) setSelectedPath(initialPath);
  }, [initialPath]);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Pages
          </h2>
          <button
            onClick={() => setShowNewFile(true)}
            className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="New file"
          >
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileTree files={wikiPages} onSelect={setSelectedPath} selectedPath={selectedPath} />
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto p-8 bg-white dark:bg-gray-900">
        {loading && (
          <div className="text-gray-400 text-sm">Loading…</div>
        )}
        {!loading && error && (
          <div className="text-red-500 text-sm">Error: {error}</div>
        )}
        {!loading && file && (
          <>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {file.frontmatter?.title || file.path.replace(/\.md$/, '')}
              </h1>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Edit
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono">
              {file.path}
            </p>
            <MarkdownRenderer html={file.html} frontmatter={file.frontmatter} />
          </>
        )}
        {!loading && !file && !error && (
          <div className="text-gray-400 dark:text-gray-500">Select a file from the sidebar.</div>
        )}
      </main>

      {editing && file && (
        <Editor file={file} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
      )}

      {showNewFile && (
        <NewFileModal
          onClose={() => setShowNewFile(false)}
          onCreated={(path) => { setSelectedPath(path); }}
        />
      )}
    </div>
  );
}
