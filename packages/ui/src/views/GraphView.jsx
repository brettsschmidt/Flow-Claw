import React, { useState, useRef, useCallback, useMemo } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import { useFile } from '../hooks/useWorkflow.js';

const NODE_W = 210;
const NODE_H = 76;
const H_GAP = 110;   // horizontal gap between columns
const V_GAP = 20;    // vertical gap between nodes in a column
const COL_W = NODE_W + H_GAP;

const STATUS_THEME = {
  pending:     { border: '#d1d5db', bg: '#f9fafb', dot: '#9ca3af', label: '#6b7280' },
  in_progress: { border: '#93c5fd', bg: '#eff6ff', dot: '#3b82f6', label: '#1d4ed8' },
  complete:    { border: '#86efac', bg: '#f0fdf4', dot: '#22c55e', label: '#15803d' },
  blocked:     { border: '#fca5a5', bg: '#fef2f2', dot: '#ef4444', label: '#dc2626' },
};

/** Topological level assignment with cycle protection */
function computeLayout(nodes) {
  if (!nodes.length) return [];

  const idToNode = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const levels = {};

  function getLevel(id, stack = new Set()) {
    if (levels[id] !== undefined) return levels[id];
    if (stack.has(id)) return 0;
    const node = idToNode[id];
    const deps = (node?.frontmatter?.depends_on || []).filter((d) => idToNode[d]);
    levels[id] =
      deps.length === 0
        ? 0
        : Math.max(...deps.map((d) => getLevel(d, new Set([...stack, id])))) + 1;
    return levels[id];
  }

  nodes.forEach((n) => getLevel(n.id));

  // Group by level, sort within level by step
  const byLevel = {};
  nodes.forEach((n) => {
    const lvl = levels[n.id] || 0;
    (byLevel[lvl] = byLevel[lvl] || []).push(n);
  });
  Object.values(byLevel).forEach((arr) =>
    arr.sort((a, b) => (a.frontmatter?.step ?? 999) - (b.frontmatter?.step ?? 999))
  );

  return nodes.map((n) => {
    const lvl = levels[n.id] || 0;
    const arr = byLevel[lvl];
    const idx = arr.indexOf(n);
    const count = arr.length;
    const totalH = count * NODE_H + (count - 1) * V_GAP;
    return { ...n, x: lvl * COL_W, y: -totalH / 2 + idx * (NODE_H + V_GAP) };
  });
}

function bezier(sx, sy, tx, ty) {
  const cx = Math.abs(tx - sx) * 0.55;
  return `M ${sx} ${sy} C ${sx + cx} ${sy}, ${tx - cx} ${ty}, ${tx} ${ty}`;
}

function GraphNode({ node, isSelected, onClick }) {
  const status = node.frontmatter?.status || 'pending';
  const theme = STATUS_THEME[status] || STATUS_THEME.pending;
  const title = node.frontmatter?.title || node.id;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} data-node="1">
      <rect
        x={node.x} y={node.y}
        width={NODE_W} height={NODE_H}
        rx={7}
        fill={theme.bg}
        stroke={isSelected ? '#3b82f6' : theme.border}
        strokeWidth={isSelected ? 2.5 : 1.5}
        style={{ filter: isSelected ? 'drop-shadow(0 0 8px rgba(59,130,246,0.35))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.07))' }}
      />
      {/* Status dot */}
      <circle cx={node.x + 14} cy={node.y + 16} r={4} fill={theme.dot} />

      {/* Title */}
      <foreignObject x={node.x + 26} y={node.y + 7} width={NODE_W - 34} height={34}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: '1.35', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {title}
        </div>
      </foreignObject>

      {/* Status + step badge */}
      <foreignObject x={node.x + 8} y={node.y + 48} width={NODE_W - 16} height={20}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: theme.label, fontWeight: 500 }}>{status.replace('_', ' ')}</span>
          {node.frontmatter?.step !== undefined && (
            <span style={{ fontSize: 10, color: '#9ca3af' }}>· step {node.frontmatter.step}</span>
          )}
          {(node.frontmatter?.tags || []).slice(0, 1).map((tag) => (
            <span key={tag} style={{ fontSize: 9, background: '#f3f4f6', color: '#6b7280', padding: '1px 5px', borderRadius: 4 }}>
              #{tag}
            </span>
          ))}
        </div>
      </foreignObject>
    </g>
  );
}

export default function GraphView({ workflowNodes }) {
  const [transform, setTransform] = useState({ x: 80, y: 0, scale: 1 });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const svgRef = useRef();

  const { data: file, loading } = useFile(selectedPath);

  const layoutNodes = useMemo(() => computeLayout(workflowNodes), [workflowNodes]);
  const nodeMap = useMemo(
    () => Object.fromEntries(layoutNodes.map((n) => [n.id, n])),
    [layoutNodes]
  );

  const edges = useMemo(() => {
    const result = [];
    for (const node of layoutNodes) {
      for (const depId of node.frontmatter?.depends_on || []) {
        const dep = nodeMap[depId];
        if (dep) result.push({ from: dep, to: node, key: `${depId}->${node.id}` });
      }
    }
    return result;
  }, [layoutNodes, nodeMap]);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('[data-node]')) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.style.cursor = 'grabbing';
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const onMouseUp = useCallback((e) => {
    isPanning.current = false;
    e.currentTarget.style.cursor = 'grab';
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({ ...t, scale: Math.max(0.15, Math.min(3, t.scale * factor)) }));
  }, []);

  const handleNodeClick = useCallback((node) => {
    const next = selectedId === node.id ? null : node.id;
    setSelectedId(next);
    setSelectedPath(next ? node.path : null);
  }, [selectedId]);

  const svgH = svgRef.current?.clientHeight || 600;
  const centerY = svgH / 2;

  if (!workflowNodes.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No workflow nodes. Add <code className="mx-1 bg-gray-100 px-1 rounded">status</code> or <code className="bg-gray-100 px-1 rounded">step</code> frontmatter to your .md files.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="relative flex-1 overflow-hidden bg-gray-50">
        {/* Hint */}
        <div className="absolute top-3 right-3 z-10 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded border border-gray-100 select-none">
          Drag to pan · Scroll to zoom
        </div>

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ cursor: 'grab', display: 'block' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#d1d5db" />
            </marker>
            <marker id="arrowhead-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
            </marker>
          </defs>

          <g transform={`translate(${transform.x}, ${transform.y + centerY}) scale(${transform.scale})`}>
            {/* Edges (render under nodes) */}
            {edges.map(({ from, to, key }) => {
              const active = selectedId === from.id || selectedId === to.id;
              return (
                <path
                  key={key}
                  d={bezier(
                    from.x + NODE_W, from.y + NODE_H / 2,
                    to.x,           to.y   + NODE_H / 2
                  )}
                  fill="none"
                  stroke={active ? '#3b82f6' : '#d1d5db'}
                  strokeWidth={active ? 2 : 1.5}
                  markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                />
              );
            })}

            {/* Nodes */}
            {layoutNodes.map((node) => (
              <GraphNode
                key={node.id}
                node={node}
                isSelected={selectedId === node.id}
                onClick={() => handleNodeClick(node)}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Detail panel */}
      {selectedId && (
        <aside className="w-96 border-l border-gray-200 overflow-y-auto bg-white shrink-0">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 truncate">
              {file?.frontmatter?.title || selectedPath}
            </h2>
            <button
              className="text-gray-400 hover:text-gray-600 ml-2 shrink-0"
              onClick={() => { setSelectedId(null); setSelectedPath(null); }}
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            {loading && <div className="text-gray-400 text-sm">Loading…</div>}
            {!loading && file && (
              <MarkdownRenderer html={file.html} frontmatter={file.frontmatter} />
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
