import React, { useMemo } from 'react';

function buildTree(files) {
  const root = {};
  for (const file of files) {
    const parts = file.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      node[parts[i]] = node[parts[i]] || {};
      node = node[parts[i]];
    }
    const name = parts[parts.length - 1];
    node[name] = file;
  }
  return root;
}

function TreeNode({ name, node, depth = 0, onSelect, selectedPath }) {
  const isFile = node && typeof node.path === 'string';
  const indent = depth * 12;

  if (isFile) {
    const title = node.frontmatter?.title || name.replace(/\.md$/, '');
    const status = node.frontmatter?.status;
    const statusColor = {
      complete: 'text-green-600',
      in_progress: 'text-blue-600',
      blocked: 'text-red-500',
      pending: 'text-gray-400',
    }[status] || 'text-gray-400';

    return (
      <button
        className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-1 hover:bg-gray-100 transition-colors ${
          selectedPath === node.path ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => onSelect(node.path)}
      >
        <span className="shrink-0">📄</span>
        <span className="truncate">{title}</span>
        {status && <span className={`ml-auto text-xs shrink-0 ${statusColor}`}>{status}</span>}
      </button>
    );
  }

  return (
    <div>
      <div
        className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        <span>📁</span> {name}
      </div>
      {Object.entries(node).map(([childName, childNode]) => (
        <TreeNode
          key={childName}
          name={childName}
          node={childNode}
          depth={depth + 1}
          onSelect={onSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

export default function FileTree({ files, onSelect, selectedPath }) {
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <nav className="py-2">
      {Object.entries(tree).map(([name, node]) => (
        <TreeNode
          key={name}
          name={name}
          node={node}
          depth={0}
          onSelect={onSelect}
          selectedPath={selectedPath}
        />
      ))}
    </nav>
  );
}
