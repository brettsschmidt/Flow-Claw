import React, { useState } from 'react';
import { useWorkflow } from './hooks/useWorkflow.js';
import WikiView from './views/WikiView.jsx';
import WorkflowView from './views/WorkflowView.jsx';

const VIEWS = ['workflow', 'wiki'];

export default function App() {
  const [view, setView] = useState('workflow');
  const { data, loading, error } = useWorkflow();

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      {/* Topbar */}
      <header className="flex items-center gap-4 px-4 h-12 border-b border-gray-200 shrink-0 bg-white z-10">
        <span className="font-bold text-gray-800 text-sm tracking-tight">⚙ Flow-Claw</span>

        <div className="flex gap-1 ml-2">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors capitalize ${
                view === v
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {data && (
          <div className="ml-auto text-xs text-gray-400">
            {data.wikiPages.length} pages · {data.workflowNodes.length} workflow nodes
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading workflow...
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-red-500">
            Error: {error}
          </div>
        )}
        {!loading && !error && data && (
          <>
            {view === 'workflow' && <WorkflowView workflowNodes={data.workflowNodes} />}
            {view === 'wiki' && <WikiView wikiPages={data.wikiPages} />}
          </>
        )}
        {!loading && !error && data && data.wikiPages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <p className="text-lg">No markdown files found.</p>
            <p className="text-sm">Add <code className="bg-gray-100 px-1 rounded">.md</code> files to your workflow directory.</p>
          </div>
        )}
      </main>
    </div>
  );
}
