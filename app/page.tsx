"use client";

import { useEffect, useMemo, useState } from "react";
import { HistorySidebar } from "./components/HistorySidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { GeneratorPanel } from "./components/GeneratorPanel";
import type { HistoryItem } from "./lib/types";
import { clearHistory, loadHistory, saveHistory } from "./lib/storage";

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [defaultPrompt, setDefaultPrompt] = useState(
    "Generate a realistic, high-quality food photo. Use soft natural light. No text.",
  );
  const [recipeText, setRecipeText] = useState("");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // hydrate from localStorage
  useEffect(() => {
    const loaded = loadHistory();
    setItems(loaded);
    setSelectedId(loaded[0]?.id ?? null);
  }, []);

  // persist
  useEffect(() => {
    saveHistory(items);
  }, [items]);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  async function onGenerate() {
    if (!recipeText.trim() || busy) return;

    const id = newId();
    const createdAt = Date.now();
    const finalPrompt = [defaultPrompt.trim(), recipeText.trim()]
      .filter(Boolean)
      .join("\n\n");

    const optimistic: HistoryItem = {
      id,
      createdAt,
      recipeText: recipeText.trim(),
      defaultPrompt: defaultPrompt.trim(),
      finalPrompt,
      status: "loading",
    };

    setBusy(true);
    setItems((prev) => [optimistic, ...prev]);
    setSelectedId(id);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: recipeText, defaultPrompt }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; imageDataUrl?: string; finalPrompt?: string; error?: string }
        | null;

      if (!res.ok || !data?.imageDataUrl) {
        throw new Error(data?.error || "Generation failed");
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: "done",
                imageDataUrl: data.imageDataUrl,
                finalPrompt: data.finalPrompt ?? it.finalPrompt,
              }
            : it,
        ),
      );
      setRecipeText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: "error",
                error: message,
              }
            : it,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function onClear() {
    clearHistory();
    setItems([]);
    setSelectedId(null);
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-black">
      <div className="grid h-full grid-cols-[320px_1fr_320px]">
        <HistorySidebar
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onClear={onClear}
        />
        <GeneratorPanel
          recipeText={recipeText}
          setRecipeText={setRecipeText}
          onGenerate={onGenerate}
          busy={busy}
          selected={selected}
        />
        <SettingsPanel
          defaultPrompt={defaultPrompt}
          onChangeDefaultPrompt={setDefaultPrompt}
        />
      </div>
    </div>
  );
}

