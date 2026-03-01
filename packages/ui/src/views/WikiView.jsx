import React, { useState, useEffect } from 'react';
import FileTree from '../components/FileTree.jsx';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import Editor from '../components/Editor.jsx';
import { useFile } from '../hooks/useWorkflow.js';

export default function WikiView({ wikiPages, initialPath }) {
  const [selectedPath, setSelectedPath] = useState(initialPath || wikiPages[0]?.path || null);
  const [editing, setEditing] = useState(false);
  const { data: file, loading, error } = useFile(selectedPath);

  // Navigate to a new path from outside (e.g. search result)
  useEffect(() => {
    if (initialPath) setSelectedPath(initialPath);
  }, [initialPath]);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 overflow-y-auto bg-gray-50">
        <div className="px-3 py-3 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pages</h2>
        </div>
        <FileTree files={wikiPages} onSelect={setSelectedPath} selectedPath={selectedPath} />
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {loading && <div className="text-gray-400 text-sm">Loading…</div>}

        {!loading && error && (
          <div className="text-red-500 text-sm">Error: {error}</div>
        )}

        {!loading && file && (
          <>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {file.frontmatter?.title || file.path.replace(/\.md$/, '')}
              </h1>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                Edit
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-6 font-mono">{file.path}</p>
            <MarkdownRenderer html={file.html} frontmatter={file.frontmatter} />
          </>
        )}

        {!loading && !file && !error && (
          <div className="text-gray-400">Select a file from the sidebar.</div>
        )}
      </main>

      {/* Inline editor overlay */}
      {editing && file && (
        <Editor
          file={file}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </div>
  );
}
