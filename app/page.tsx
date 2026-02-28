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
    [
      "Make an ultra realistic close up and casual food picture of this, with a soft white kitchen towel with blue lines next to it.",
      "",
      "Rules:",
      "- The plate should be fully in frame (ample negative space around the dish)",
      "- Half of the image (right side) should be completely negative space",
      "- It should be on a butcher block countertop",
      "- NO text on the image at all, only the recipe picture",
      "- The image should be very bright, shiny, and appetizing (studio lights)",
      "- The plate and food should take at least 60% of the image space, filling the screen vertically",
    ].join("\n"),
  );
  const [recipeText, setRecipeText] = useState("");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cooldownEndsAtMs, setCooldownEndsAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // hydrate from localStorage + IndexedDB (async)
  useEffect(() => {
    let canceled = false;
    (async () => {
      const loaded = await loadHistory();
      if (canceled) return;
      setItems(loaded);
      setSelectedId(loaded[0]?.id ?? null);
    })();
    return () => {
      canceled = true;
    };
  }, []);

  // persist
  useEffect(() => {
    saveHistory(items);
  }, [items]);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  // update the timer frequently enough for a smooth-ish progress bar
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const cooldownMs = 5000;
  const cooldownRemainingMs = Math.max(
    0,
    (cooldownEndsAtMs ?? 0) - nowMs,
  );
  const isInCooldown = cooldownRemainingMs > 0;

  async function onGenerate() {
    if (!recipeText.trim() || isInCooldown) return;

    const id = newId();
    const createdAt = Date.now();
    const finalPrompt = [defaultPrompt.trim(), recipeText.trim()]
      .filter(Boolean)
      .join("\n\n");

    // Start the cooldown immediately so the user can type the next recipe while
    // the current request is still in flight.
    setCooldownEndsAtMs(Date.now() + cooldownMs);

    const optimistic: HistoryItem = {
      id,
      createdAt,
      recipeText: recipeText.trim(),
      defaultPrompt: defaultPrompt.trim(),
      finalPrompt,
      status: "loading",
    };

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
      // no global "busy" lock; we allow overlapping generations
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
          isInCooldown={isInCooldown}
          cooldownRemainingMs={cooldownRemainingMs}
          cooldownMs={cooldownMs}
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

