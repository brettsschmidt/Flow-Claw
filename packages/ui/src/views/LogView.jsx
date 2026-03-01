import React, { useState, useEffect, useRef } from 'react';

export default function LogView() {
  const [lines, setLines] = useState([]);
  const [logFile, setLogFile] = useState('agent.log');
  const [availableFiles, setAvailableFiles] = useState([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef();
  const esRef = useRef();

  // Fetch list of .log files in the workflow directory
  useEffect(() => {
    fetch('/api/logs/files')
      .then((r) => r.json())
      .then(({ files }) => {
        setAvailableFiles(files);
        if (files.length && !files.includes(logFile)) setLogFile(files[0]);
      })
      .catch(() => {});
  }, []);

  // Subscribe to SSE for the selected log file
  useEffect(() => {
    setLines([]);
    setConnected(false);
    esRef.current?.close();

    const es = new EventSource(`/api/logs/events?file=${encodeURIComponent(logFile)}`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setLines((prev) => [...prev, data]);
      } catch {}
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [logFile]);

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const allLogFiles = Array.from(new Set(['agent.log', ...availableFiles]));

  return (
    <div className="flex flex-col h-full bg-gray-950 text-green-400 font-mono text-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-red-500'}`}
          title={connected ? 'Connected' : 'Disconnected'}
        />
        <span className="text-gray-400 text-xs font-sans">Agent Log</span>

        <select
          value={logFile}
          onChange={(e) => setLogFile(e.target.value)}
          className="ml-auto bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700 font-sans"
        >
          {allLogFiles.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <button
          onClick={() => setLines([])}
          className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800 font-sans transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
        {lines.length === 0 && (
          <p className="text-gray-600">Waiting for output in <span className="text-gray-400">{logFile}</span>…</p>
        )}
        {lines.map((line, i) => {
          const text = line.text || line.content || '';
          const isStatus = line.type === 'status';

          // Colorize by content
          const color = isStatus
            ? 'text-gray-500 italic'
            : text.match(/\b(error|fail|fatal|exception)\b/i)
            ? 'text-red-400'
            : text.match(/\b(warn|warning)\b/i)
            ? 'text-yellow-400'
            : text.match(/\b(done|success|complete|ok)\b/i)
            ? 'text-green-300'
            : 'text-green-400';

          return (
            <div key={i} className={`leading-5 whitespace-pre-wrap break-all ${color}`}>
              {text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
