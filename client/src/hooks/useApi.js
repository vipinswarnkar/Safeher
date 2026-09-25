import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

// Loads data from a GET endpoint.
// Returns { data, error, loading, reload }.
// - `error` is the axios error (check error.response?.status)
// - call `reload()` after a change to fetch fresh data
export default function useApi(url) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ data: null, error: null, version: -1 });

  useEffect(() => {
    let cancelled = false;

    api
      .get(url)
      .then((response) => {
        if (!cancelled) setResult({ data: response.data, error: null, version });
      })
      .catch((error) => {
        if (!cancelled) setResult({ data: null, error, version });
      });

    // Ignore the response if the page closed or the URL changed meanwhile
    return () => {
      cancelled = true;
    };
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: result.data,
    error: result.error,
    // Only show the spinner on the first load, not on every reload
    loading: result.version === -1,
    reload,
  };
}
