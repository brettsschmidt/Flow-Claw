import React, { useState, useRef, useMemo } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import FrontmatterEditor from '../components/FrontmatterEditor.jsx';
import Editor from '../components/Editor.jsx';
import NewFileModal from '../components/NewFileModal.jsx';
import { useFile } from '../hooks/useWorkflow.js';
import { patchFrontmatter } from '../api.js';
import { STATUSES } from '../constants.js';

const STATUS_COLUMNS = STATUSES;

const STATUS_LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  complete:    'Complete',
  blocked:     'Blocked',
};

const STATUS_COLORS = {
  pending:     'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40',
  in_progress: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30',
  complete:    'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30',
  blocked:     'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30',
};

const CARD_ACCENT = {
  pending:     'border-l-gray-400',
  in_progress: 'border-l-blue-500',
  complete:    'border-l-green-500',
  blocked:     'border-l-red-500',
};

function WorkflowCard({ node, isSelected, onClick, onDragStart }) {
  const status = node.frontmatter?.status || 'pending';
  const title  = node.frontmatter?.title || node.path.replace(/\.md$/, '');
  const tags   = node.frontmatter?.tags || [];

  return (
    <button
      draggable
      onDragStart={onDragStart}
      className={`w-full text-left p-3 rounded border bg-white dark:bg-gray-900 shadow-sm border-l-4 transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
        CARD_ACCENT[status] || CARD_ACCENT.pending
      } ${isSelected ? 'ring-2 ring-blue-400' : 'dark:border-gray-700'}`}
      onClick={onClick}
    >
      <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{title}</p>
      {node.frontmatter?.step !== undefined && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Step {node.frontmatter.step}</p>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
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
  const [detailTab, setDetailTab] = useState('preview'); // 'preview' | 'metadata'
  const [editing, setEditing] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [activeTags, setActiveTags] = useState(new Set());
  const [dropTarget, setDropTarget] = useState(null);
  const draggingPath = useRef(null);

  const { data: file, loading } = useFile(selectedPath);

  // All unique tags across workflow nodes
  const allTags = useMemo(
    () => [...new Set(workflowNodes.flatMap((n) => n.frontmatter?.tags || []))].sort(),
    [workflowNodes]
  );

  // Node IDs for the depends_on picker
  const allNodeMeta = useMemo(
    () => workflowNodes.map((n) => ({
      id: n.id,
      path: n.path,
      title: n.frontmatter?.title || n.id,
    })),
    [workflowNodes]
  );

  // Apply tag filter
  const filteredNodes = activeTags.size === 0
    ? workflowNodes
    : workflowNodes.filter((n) => (n.frontmatter?.tags || []).some((t) => activeTags.has(t)));

  const toggleTag = (tag) =>
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  // Progress stats
  const total    = workflowNodes.length;
  const done     = workflowNodes.filter((n) => n.frontmatter?.status === 'complete').length;
  const inProg   = workflowNodes.filter((n) => n.frontmatter?.status === 'in_progress').length;
  const blocked  = workflowNodes.filter((n) => n.frontmatter?.status === 'blocked').length;
  const pct      = total ? Math.round((done / total) * 100) : 0;

  // Drag-and-drop handlers
  const handleDrop = async (newStatus) => {
    const p = draggingPath.current;
    if (!p) return;
    draggingPath.current = null;
    setDropTarget(null);
    await patchFrontmatter(p, { status: newStatus }).catch(() => {});
  };

  const columns = STATUS_COLUMNS.map((status) => ({
    status,
    nodes: filteredNodes
      .filter((n) => (n.frontmatter?.status || 'pending') === status)
      .sort((a, b) => (a.frontmatter?.step ?? Infinity) - (b.frontmatter?.step ?? Infinity)),
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Progress + controls bar */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 space-y-2">
        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {done} / {total} complete
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {inProg > 0 && `${inProg} in progress`}
                {inProg > 0 && blocked > 0 && ' · '}
                {blocked > 0 && <span className="text-red-400">{blocked} blocked</span>}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setShowNewFile(true)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            + New
          </button>
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                  activeTags.has(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                #{tag}
              </button>
            ))}
            {activeTags.size > 0 && (
              <button
                onClick={() => setActiveTags(new Set())}
                className="px-2 py-0.5 rounded-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Kanban board */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map(({ status, nodes }) => (
              <div
                key={status}
                className={`w-64 rounded-lg border-2 ${STATUS_COLORS[status]} flex flex-col transition-all ${
                  dropTarget === status ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                }`}
                onDragOver={(e) => { e.preventDefault(); setDropTarget(status); }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null);
                }}
                onDrop={(e) => { e.preventDefault(); handleDrop(status); }}
              >
                <div className="px-3 py-2 border-b border-inherit">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {STATUS_LABELS[status]}
                    <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                      ({nodes.length})
                    </span>
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {nodes.map((node) => (
                    <WorkflowCard
                      key={node.path}
                      node={node}
                      isSelected={selectedPath === node.path}
                      onDragStart={() => { draggingPath.current = node.path; }}
                      onClick={() =>
                        setSelectedPath(selectedPath === node.path ? null : node.path)
                      }
                    />
                  ))}
                  {nodes.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                      Drop here
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selectedPath && (
          <aside className="w-96 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900 shrink-0">
            {/* Panel header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 shrink-0">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                {file?.frontmatter?.title || selectedPath}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                {file && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setSelectedPath(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
              {['preview', 'metadata'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                    detailTab === tab
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && <div className="text-gray-400 text-sm">Loading…</div>}
              {!loading && file && detailTab === 'preview' && (
                <MarkdownRenderer html={file.html} frontmatter={file.frontmatter} />
              )}
              {!loading && file && detailTab === 'metadata' && (
                <FrontmatterEditor file={file} allNodes={allNodeMeta} />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Inline editor overlay */}
      {editing && file && (
        <Editor file={file} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
      )}

      {/* New file modal */}
      {showNewFile && (
        <NewFileModal
          onClose={() => setShowNewFile(false)}
          onCreated={(path) => setSelectedPath(path)}
          defaultStatus="pending"
        />
      )}
    </div>
  );
}
