import React, { useState, useEffect } from 'react';
import { patchFrontmatter } from '../api.js';
import { STATUSES } from '../constants.js';

export default function FrontmatterEditor({ file, allNodes }) {
  const [fm, setFm] = useState(file?.frontmatter || {});
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset local state when a different file is opened
  useEffect(() => {
    setFm(file?.frontmatter || {});
    setTagInput('');
    setError(null);
  }, [file?.path]);

  const patch = async (updates) => {
    setSaving(true);
    setError(null);
    // Optimistic local update
    setFm((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(updates)) {
        if (v === null) delete next[k];
        else next[k] = v;
      }
      return next;
    });
    try {
      await patchFrontmatter(file.path, updates);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTag = (raw) => {
    const tag = raw.trim().replace(/^#/, '');
    if (!tag) return;
    patch({ tags: [...new Set([...(fm.tags || []), tag])] });
    setTagInput('');
  };

  const removeTag = (tag) =>
    patch({ tags: (fm.tags || []).filter((t) => t !== tag) });

  const toggleDep = (id) => {
    const deps = fm.depends_on || [];
    patch({ depends_on: deps.includes(id) ? deps.filter((d) => d !== id) : [...deps, id] });
  };

  const otherNodes = (allNodes || []).filter((n) => n.path !== file?.path);

  const inputCls =
    'w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400';
  const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

  return (
    <div className="space-y-4 text-sm">
      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded">
          {error}
        </p>
      )}

      {/* Status */}
      <div>
        <label className={labelCls}>Status</label>
        <select
          value={fm.status || 'pending'}
          onChange={(e) => patch({ status: e.target.value })}
          className={inputCls}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Step */}
      <div>
        <label className={labelCls}>Step</label>
        <input
          type="number"
          value={fm.step ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            patch({ step: v === '' ? null : Number(v) });
          }}
          className={inputCls}
          placeholder="—"
          min={0}
        />
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Tags</label>
        {(fm.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {(fm.tags || []).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
              >
                #{tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-gray-400 hover:text-red-500 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { addTag(tagInput); e.preventDefault(); }
            }}
            className={inputCls + ' text-xs'}
            placeholder="Add tag and press Enter…"
          />
          <button
            onClick={() => addTag(tagInput)}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
          >
            Add
          </button>
        </div>
      </div>

      {/* Depends on */}
      {otherNodes.length > 0 && (
        <div>
          <label className={labelCls}>Depends on</label>
          <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded p-1">
            {otherNodes.map(({ id, title, path: p }) => (
              <label
                key={id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={(fm.depends_on || []).includes(id)}
                  onChange={() => toggleDep(id)}
                  className="rounded accent-blue-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {title || p}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {saving && (
        <p className="text-xs text-gray-400 text-right">Saving…</p>
      )}
    </div>
  );
}
