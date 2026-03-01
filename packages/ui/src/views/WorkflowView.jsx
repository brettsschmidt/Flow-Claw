import React, { useState } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import Editor from '../components/Editor.jsx';
import { useFile } from '../hooks/useWorkflow.js';

const STATUS_COLUMNS = ['pending', 'in_progress', 'complete', 'blocked'];

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  complete: 'Complete',
  blocked: 'Blocked',
};

const STATUS_COLORS = {
  pending:     'border-gray-300 bg-gray-50',
  in_progress: 'border-blue-300 bg-blue-50',
  complete:    'border-green-300 bg-green-50',
  blocked:     'border-red-300 bg-red-50',
};

const CARD_ACCENT = {
  pending:     'border-l-gray-400',
  in_progress: 'border-l-blue-500',
  complete:    'border-l-green-500',
  blocked:     'border-l-red-500',
};

function WorkflowCard({ node, isSelected, onClick }) {
  const status = node.frontmatter?.status || 'pending';
  const title = node.frontmatter?.title || node.path.replace(/\.md$/, '');
  const tags = node.frontmatter?.tags || [];

  return (
    <button
      className={`w-full text-left p-3 rounded border bg-white shadow-sm border-l-4 transition-all hover:shadow-md ${
        CARD_ACCENT[status] || CARD_ACCENT.pending
      } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
      onClick={onClick}
    >
      <p className="font-medium text-sm text-gray-800 truncate">{title}</p>
      {node.frontmatter?.step !== undefined && (
        <p className="text-xs text-gray-400 mt-0.5">Step {node.frontmatter.step}</p>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function WorkflowView({ workflowNodes }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const [editing, setEditing] = useState(false);
  const { data: file, loading } = useFile(selectedPath);

  const columns = STATUS_COLUMNS.map((status) => ({
    status,
    nodes: workflowNodes
      .filter((n) => (n.frontmatter?.status || 'pending') === status)
      .sort((a, b) => (a.frontmatter?.step ?? Infinity) - (b.frontmatter?.step ?? Infinity)),
  }));

  return (
    <div className="flex h-full">
      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map(({ status, nodes }) => (
            <div
              key={status}
              className={`w-64 rounded-lg border-2 ${STATUS_COLORS[status]} flex flex-col`}
            >
              <div className="px-3 py-2 border-b border-inherit">
                <h3 className="text-sm font-semibold text-gray-700">
                  {STATUS_LABELS[status]}
                  <span className="ml-2 text-xs font-normal text-gray-400">({nodes.length})</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {nodes.map((node) => (
                  <WorkflowCard
                    key={node.path}
                    node={node}
                    isSelected={selectedPath === node.path}
                    onClick={() =>
                      setSelectedPath(selectedPath === node.path ? null : node.path)
                    }
                  />
                ))}
                {nodes.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Empty</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedPath && (
        <aside className="w-96 border-l border-gray-200 overflow-y-auto bg-white shrink-0">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-700 truncate">
              {file?.frontmatter?.title || selectedPath}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              {file && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedPath(null)}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-4">
            {loading && <div className="text-gray-400 text-sm">Loading…</div>}
            {!loading && file && (
              <MarkdownRenderer html={file.html} frontmatter={file.frontmatter} />
            )}
          </div>
        </aside>
      )}

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
