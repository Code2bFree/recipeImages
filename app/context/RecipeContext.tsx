"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { HistoryItem } from "../lib/types";
import { clearHistory, loadHistory, saveHistory } from "../lib/storage";

type RecipeContextValue = {
  items: HistoryItem[];
  setItems: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onClear: () => void;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const loaded = await loadHistory();
      if (canceled) return;
      loadedRef.current = true;
      setItems(loaded);
      setSelectedId(loaded[0]?.id ?? null);
    })();
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    saveHistory(items);
  }, [items]);

  function onClear() {
    clearHistory();
    setItems([]);
    setSelectedId(null);
  }

  return (
    <RecipeContext.Provider value={{ items, setItems, selectedId, setSelectedId, onClear }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipe() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error("useRecipe must be used within RecipeProvider");
  return ctx;
}
