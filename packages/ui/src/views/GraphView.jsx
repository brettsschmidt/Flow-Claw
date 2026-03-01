import React, { useState, useRef, useCallback, useMemo } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import { useFile } from '../hooks/useWorkflow.js';

const NODE_W = 210;
const NODE_H = 76;
const H_GAP  = 110;
const V_GAP  = 20;
const COL_W  = NODE_W + H_GAP;

const STATUS_THEME = {
  pending:     { border: '#d1d5db', bg: '#f9fafb', dot: '#9ca3af', label: '#6b7280' },
  in_progress: { border: '#93c5fd', bg: '#eff6ff', dot: '#3b82f6', label: '#1d4ed8' },
  complete:    { border: '#86efac', bg: '#f0fdf4', dot: '#22c55e', label: '#15803d' },
  blocked:     { border: '#fca5a5', bg: '#fef2f2', dot: '#ef4444', label: '#dc2626' },
};

const STATUS_THEME_DARK = {
  pending:     { border: '#4b5563', bg: '#1f2937', dot: '#6b7280', label: '#9ca3af' },
  in_progress: { border: '#1d4ed8', bg: '#1e3a5f', dot: '#3b82f6', label: '#60a5fa' },
  complete:    { border: '#166534', bg: '#14532d', dot: '#22c55e', label: '#4ade80' },
  blocked:     { border: '#991b1b', bg: '#450a0a', dot: '#ef4444', label: '#f87171' },
};

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

function GraphNode({ node, isSelected, onClick, dark }) {
  const status = node.frontmatter?.status || 'pending';
  const theme  = (dark ? STATUS_THEME_DARK : STATUS_THEME)[status] || (dark ? STATUS_THEME_DARK : STATUS_THEME).pending;
  const title  = node.frontmatter?.title || node.id;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} data-node="1">
      <rect
        x={node.x} y={node.y}
        width={NODE_W} height={NODE_H}
        rx={7}
        fill={theme.bg}
        stroke={isSelected ? '#3b82f6' : theme.border}
        strokeWidth={isSelected ? 2.5 : 1.5}
        style={{ filter: isSelected ? 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))' }}
      />
      <circle cx={node.x + 14} cy={node.y + 16} r={4} fill={theme.dot} />
      <foreignObject x={node.x + 26} y={node.y + 7} width={NODE_W - 34} height={34}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{ fontSize: 12, fontWeight: 600, color: dark ? '#f3f4f6' : '#111827', lineHeight: '1.35', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {title}
        </div>
      </foreignObject>
      <foreignObject x={node.x + 8} y={node.y + 48} width={NODE_W - 16} height={20}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: theme.label, fontWeight: 500 }}>
            {status.replace('_', ' ')}
          </span>
          {node.frontmatter?.step !== undefined && (
            <span style={{ fontSize: 10, color: dark ? '#6b7280' : '#9ca3af' }}>
              · step {node.frontmatter.step}
            </span>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

export default function GraphView({ workflowNodes, dark }) {
  const [transform, setTransform] = useState({ x: 80, y: 0, scale: 1 });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const isPanning  = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });
  const svgRef     = useRef();

  const { data: file, loading } = useFile(selectedPath);

  const layoutNodes = useMemo(() => computeLayout(workflowNodes), [workflowNodes]);
  const nodeMap     = useMemo(
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

  // Fit all nodes within the viewport
  const handleFit = useCallback(() => {
    if (!layoutNodes.length || !svgRef.current) return;
    const { width: W, height: H } = svgRef.current.getBoundingClientRect();
    const pad = 60;
    const minX = Math.min(...layoutNodes.map((n) => n.x));
    const maxX = Math.max(...layoutNodes.map((n) => n.x)) + NODE_W;
    const minY = Math.min(...layoutNodes.map((n) => n.y));
    const maxY = Math.max(...layoutNodes.map((n) => n.y)) + NODE_H;
    const cW = maxX - minX;
    const cH = maxY - minY;
    if (!cW || !cH) return;
    const scale = Math.min((W - 2 * pad) / cW, (H - 2 * pad) / cH, 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    // screen_x = node.x * scale + tx => cx * scale + tx = W/2 => tx = W/2 - cx*scale
    // screen_y = node.y * scale + ty + H/2 => cy * scale + ty + H/2 = H/2 => ty = -cy*scale
    setTransform({ x: W / 2 - cx * scale, y: -cy * scale, scale });
  }, [layoutNodes]);

  const handleNodeClick = useCallback((node) => {
    const next = selectedId === node.id ? null : node.id;
    setSelectedId(next);
    setSelectedPath(next ? node.path : null);
  }, [selectedId]);

  const svgH   = svgRef.current?.clientHeight || 600;
  const centerY = svgH / 2;

  if (!workflowNodes.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No workflow nodes. Add <code className="mx-1 bg-gray-100 dark:bg-gray-800 px-1 rounded">status</code> or{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">step</code> frontmatter to your .md files.
      </div>
    );
  }

  const edgeColor = dark ? '#374151' : '#d1d5db';
  const edgeColorActive = '#3b82f6';
  const arrowFill = dark ? '#4b5563' : '#d1d5db';

  return (
    <div className="flex h-full">
      <div className="relative flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Controls */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <button
            onClick={handleFit}
            className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            Fit ⊞
          </button>
        </div>
        <div className="absolute top-3 right-3 z-10 text-xs text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-900/80 px-2 py-1 rounded border border-gray-100 dark:border-gray-700 select-none">
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
              <path d="M0,0 L0,6 L8,3 z" fill={arrowFill} />
            </marker>
            <marker id="arrowhead-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
            </marker>
          </defs>

          <g transform={`translate(${transform.x}, ${transform.y + centerY}) scale(${transform.scale})`}>
            {edges.map(({ from, to, key }) => {
              const active = selectedId === from.id || selectedId === to.id;
              return (
                <path
                  key={key}
                  d={bezier(from.x + NODE_W, from.y + NODE_H / 2, to.x, to.y + NODE_H / 2)}
                  fill="none"
                  stroke={active ? edgeColorActive : edgeColor}
                  strokeWidth={active ? 2 : 1.5}
                  markerEnd={active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                />
              );
            })}

            {layoutNodes.map((node) => (
              <GraphNode
                key={node.id}
                node={node}
                isSelected={selectedId === node.id}
                dark={dark}
                onClick={() => handleNodeClick(node)}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Detail panel */}
      {selectedId && (
        <aside className="w-96 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900 shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
              {file?.frontmatter?.title || selectedPath}
            </h2>
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2 shrink-0"
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
