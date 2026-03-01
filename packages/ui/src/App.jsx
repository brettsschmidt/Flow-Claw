import React, { useState, useEffect, useCallback } from 'react';
import { useWorkflow } from './hooks/useWorkflow.js';
import { useDarkMode } from './hooks/useDarkMode.js';
import WikiView from './views/WikiView.jsx';
import WorkflowView from './views/WorkflowView.jsx';
import GraphView from './views/GraphView.jsx';
import LogView from './views/LogView.jsx';
import SearchModal from './components/SearchModal.jsx';
import ShortcutsModal from './components/ShortcutsModal.jsx';

const VIEWS = [
  { id: 'workflow', label: 'Workflow' },
  { id: 'graph',    label: 'Graph'    },
  { id: 'wiki',     label: 'Wiki'     },
  { id: 'logs',     label: 'Logs'     },
];

export default function App() {
  const [view, setView]               = useState('workflow');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [wikiTarget, setWikiTarget]   = useState(null);
  const [dark, toggleDark]            = useDarkMode();
  const { data, loading, error }      = useWorkflow();

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in inputs / textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setShortcutsOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNavigate = useCallback((result) => {
    setWikiTarget(result.path);
    setView('wiki');
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Topbar */}
      <header className="flex items-center gap-3 px-4 h-12 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-900 z-10">
        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm tracking-tight shrink-0">
          ⚙ Flow-Claw
        </span>

        {/* View tabs */}
        <nav className="flex gap-1">
          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === id
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-gray-300 dark:text-gray-600 font-mono text-xs">⌘K</kbd>
          </button>

          {/* Shortcuts hint */}
          <button
            onClick={() => setShortcutsOpen(true)}
            className="px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs font-mono"
            title="Keyboard shortcuts (?)"
          >
            ?
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☀' : '☾'}
          </button>

          {data && (
            <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0 hidden md:block">
              {data.wikiPages.length} pages · {data.workflowNodes.length} nodes
            </span>
          )}
        </div>
      </header>

      {/* Main content — all views stay mounted to preserve state */}
      <main className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Loading workflow…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-500">
            Error: {error}
          </div>
        )}
        {!loading && !error && data && (
          <>
            <div className={`absolute inset-0 ${view === 'workflow' ? '' : 'hidden'}`}>
              <WorkflowView workflowNodes={data.workflowNodes} />
            </div>
            <div className={`absolute inset-0 ${view === 'graph' ? '' : 'hidden'}`}>
              <GraphView workflowNodes={data.workflowNodes} />
            </div>
            <div className={`absolute inset-0 ${view === 'wiki' ? '' : 'hidden'}`}>
              <WikiView wikiPages={data.wikiPages} initialPath={wikiTarget} />
            </div>
            <div className={`absolute inset-0 ${view === 'logs' ? '' : 'hidden'}`}>
              <LogView />
            </div>
          </>
        )}
        {!loading && !error && data?.wikiPages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <p className="text-lg">No markdown files found.</p>
            <p className="text-sm">
              Add <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.md</code> files to your workflow directory.
            </p>
          </div>
        )}
      </main>

      {searchOpen   && <SearchModal   onClose={() => setSearchOpen(false)}   onNavigate={handleNavigate} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}
