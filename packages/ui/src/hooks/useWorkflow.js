import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Shared EventSource — one connection regardless of how many hooks subscribe
// ---------------------------------------------------------------------------
let _es = null;
const _listeners = new Set();

function subscribeToFileChanges(callback) {
  if (!_es || _es.readyState === EventSource.CLOSED) {
    _es = new EventSource('/api/events');
    _es.onmessage = () => _listeners.forEach((fn) => fn());
    _es.onerror = () => {};
  }
  _listeners.add(callback);
  return () => {
    _listeners.delete(callback);
    if (_listeners.size === 0) {
      _es?.close();
      _es = null;
    }
  };
}

// ---------------------------------------------------------------------------
// useWorkflow — loads the full workflow and live-reloads on file changes
// ---------------------------------------------------------------------------
export function useWorkflow() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkflow = useCallback(async () => {
    try {
      const res = await fetch('/api/workflow');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflow();
    return subscribeToFileChanges(fetchWorkflow);
  }, [fetchWorkflow]);

  return { data, loading, error, refetch: fetchWorkflow };
}

// ---------------------------------------------------------------------------
// useFile — loads a single file and re-fetches on file-change SSE events
// ---------------------------------------------------------------------------
export function useFile(filePath) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const doFetch = useCallback(async () => {
    if (!filePath) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      const json = await r.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  useEffect(() => {
    if (!filePath) { setData(null); return; }
    doFetch();
    return subscribeToFileChanges(doFetch);
  }, [doFetch, filePath]);

  return { data, loading, error, refetch: doFetch };
}
