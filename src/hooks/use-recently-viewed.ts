import { useEffect, useState, useCallback } from "react";

const KEY = "aipt_recently_viewed";
const MAX = 8;

function readIds(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((n): n is number => typeof n === "number");
  } catch {
    return [];
  }
}

export function useRecentlyViewed(): { ids: number[]; track: (id: number) => void; clear: () => void } {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    setIds(readIds());
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setIds(readIds());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const track = useCallback((id: number) => {
    const current = readIds();
    const next = [id, ...current.filter(x => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setIds([]);
  }, []);

  return { ids, track, clear };
}
