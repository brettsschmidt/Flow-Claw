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
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflow();

    // Subscribe to SSE for live updates
    const es = new EventSource('/api/events');
    es.onmessage = () => fetchWorkflow();
    es.onerror = () => {}; // Silently handle reconnects

    return () => es.close();
  }, [fetchWorkflow]);

  return { data, loading, error, refetch: fetchWorkflow };
}

/**
 * Fetches a single file by its relative path.
 */
export function useFile(filePath) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    fetch(`/api/file?path=${encodeURIComponent(filePath)}`)
      .then((r) => r.json())
      .then((json) => { setData(json); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filePath]);

  return { data, loading, error };
}
