import { useEffect, useRef, useState } from 'react';

const PREFIX = 'jobhunter:v2:';

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const stored = JSON.parse(raw);
    // Merge plain objects over defaults so fields added in new releases still exist
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    if (isObj(fallback) && isObj(stored)) return { ...fallback, ...stored };
    if (Array.isArray(fallback) && !Array.isArray(stored)) return fallback;
    return stored;
  } catch {
    return fallback;
  }
}

/**
 * useState that survives reloads. Writes are debounced so fast typing
 * doesn't hammer localStorage, and quota errors never crash the app.
 */
export function usePersistentState(key, fallback, { delay = 250 } = {}) {
  const [state, setState] = useState(() => {
    const initial = typeof fallback === 'function' ? fallback() : fallback;
    return read(key, initial);
  });
  const timer = useRef();
  const pending = useRef(null);

  useEffect(() => {
    const write = () => {
      if (pending.current === null) return;
      try {
        window.localStorage.setItem(PREFIX + key, pending.current);
      } catch (err) {
        // Storage full or blocked (private mode). The app keeps working in memory.
        if (import.meta.env.DEV) console.warn(`[storage] could not save "${key}"`, err);
      }
      pending.current = null;
    };
    pending.current = JSON.stringify(state);
    clearTimeout(timer.current);
    timer.current = setTimeout(write, delay);
    // Flush immediately if the tab is closed or reloaded before the debounce fires
    window.addEventListener('pagehide', write);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('pagehide', write);
    };
  }, [key, state, delay]);

  return [state, setState];
}

export function clearPersistedState() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
