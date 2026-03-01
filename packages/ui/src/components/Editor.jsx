import React, { useState } from 'react';

export default function Editor({ file, onClose, onSaved }) {
  const [content, setContent] = useState(file.raw || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, content }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Cmd+S / Ctrl+S to save
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0 bg-white">
        <span className="text-xs font-mono text-gray-500 truncate">
          {file.path}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">{error}</span>
          )}
          <span className="text-xs text-gray-400 hidden sm:block">
            {(e => e.metaKey ? '⌘S' : 'Ctrl+S')(navigator)}<span className="sr-only">to save</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 p-6 font-mono text-sm text-gray-800 resize-none outline-none border-0 leading-relaxed"
        placeholder="Write markdown here…"
        spellCheck={false}
        autoFocus
      />
    </div>
  );
}
