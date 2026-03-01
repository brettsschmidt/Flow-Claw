import React, { useEffect } from 'react';

const SECTIONS = [
  {
    label: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], desc: 'Open search' },
      { keys: ['?'],       desc: 'Show keyboard shortcuts' },
      { keys: ['Esc'],     desc: 'Close modal / editor' },
    ],
  },
  {
    label: 'Editor',
    items: [
      { keys: ['⌘', 'S'], desc: 'Save file' },
      { keys: ['Esc'],     desc: 'Discard and close' },
    ],
  },
  {
    label: 'Search',
    items: [
      { keys: ['↑', '↓'], desc: 'Navigate results' },
      { keys: ['↵'],       desc: 'Open selected result' },
      { keys: ['Esc'],     desc: 'Close search' },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { keys: ['drag'],    desc: 'Move card between columns' },
    ],
  },
];

export default function ShortcutsModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === '?') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-96 overflow-hidden border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-96 overflow-y-auto">
          {SECTIONS.map(({ label, items }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                {label}
              </p>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono text-gray-600 dark:text-gray-300"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 text-center">
          Press <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">?</kbd> or{' '}
          <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
