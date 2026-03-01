import { useState, useEffect, useCallback } from 'react';

/**
 * Fetches workflow data and subscribes to SSE for live updates.
 */
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
    const es = new EventSource('/api/events');
    es.onmessage = () => fetchWorkflow();
    es.onerror = () => {};
    return () => es.close();
  }, [fetchWorkflow]);

  return { data, loading, error, refetch: fetchWorkflow };
}

/**
 * Fetches a single file by its relative path and re-fetches on SSE file-change events.
 */
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
    // Keep detail panel fresh whenever any file changes
    const es = new EventSource('/api/events');
    es.onmessage = doFetch;
    es.onerror = () => {};
    return () => es.close();
  }, [doFetch, filePath]);

  return { data, loading, error, refetch: doFetch };
}
