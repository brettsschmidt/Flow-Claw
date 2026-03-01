import React, { useState } from 'react';
import FileTree from '../components/FileTree.jsx';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import { useFile } from '../hooks/useWorkflow.js';

export default function WikiView({ wikiPages }) {
  const [selectedPath, setSelectedPath] = useState(wikiPages[0]?.path || null);
  const { data: file, loading } = useFile(selectedPath);

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
        {loading && (
          <div className="text-gray-400 text-sm">Loading...</div>
        )}
        {!loading && file && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {file.frontmatter?.title || file.path.replace(/\.md$/, '')}
            </h1>
            <p className="text-xs text-gray-400 mb-6 font-mono">{file.path}</p>
            <MarkdownRenderer html={file.html} frontmatter={file.frontmatter} />
          </>
        )}
        {!loading && !file && (
          <div className="text-gray-400">Select a file from the sidebar.</div>
        )}
      </main>
    </div>
  );
}
