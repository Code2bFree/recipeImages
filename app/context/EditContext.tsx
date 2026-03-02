"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { EditHistoryItem } from "../lib/editTypes";
import { clearEditHistory, loadEditHistory, saveEditHistory } from "../lib/editStorage";

type EditContextValue = {
  items: EditHistoryItem[];
  setItems: React.Dispatch<React.SetStateAction<EditHistoryItem[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onClear: () => void;
};

const EditContext = createContext<EditContextValue | null>(null);

export function EditProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<EditHistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const loaded = await loadEditHistory();
      if (canceled) return;
      loadedRef.current = true;
      setItems(loaded);
      setSelectedId(loaded[0]?.id ?? null);
    })();
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    saveEditHistory(items);
  }, [items]);

  function onClear() {
    clearEditHistory();
    setItems([]);
    setSelectedId(null);
  }

  return (
    <EditContext.Provider value={{ items, setItems, selectedId, setSelectedId, onClear }}>
      {children}
    </EditContext.Provider>
  );
}

export function useEdit() {
  const ctx = useContext(EditContext);
  if (!ctx) throw new Error("useEdit must be used within EditProvider");
  return ctx;
}
