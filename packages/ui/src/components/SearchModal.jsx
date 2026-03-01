import React, { useState, useEffect, useRef } from 'react';

export default function SearchModal({ onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIdx(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      e.preventDefault();
    }
    if (e.key === 'ArrowUp') {
      setSelectedIdx((i) => Math.max(i - 1, 0));
      e.preventDefault();
    }
    if (e.key === 'Enter' && results[selectedIdx]) {
      onNavigate(results[selectedIdx]);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-200">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages…"
            className="flex-1 py-4 text-sm outline-none text-gray-900 placeholder-gray-400"
          />
          {loading && <span className="text-xs text-gray-400 shrink-0">Searching…</span>}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {results.map((r, i) => (
              <li key={r.path}>
                <button
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${
                    i === selectedIdx ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => { onNavigate(r); onClose(); }}
                >
                  <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{r.path}</p>
                  {r.snippet && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {r.snippet}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            No results for <span className="font-medium text-gray-600">"{query}"</span>
          </div>
        )}

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
