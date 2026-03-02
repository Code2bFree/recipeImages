"use client";

import { useEffect, useMemo, useState } from "react";
import { EditHistorySidebar } from "../components/EditHistorySidebar";
import { EditSettingsPanel } from "../components/EditSettingsPanel";
import { EditPanel } from "../components/EditPanel";
import type { EditHistoryItem } from "../lib/editTypes";
import {
  clearEditHistory,
  loadEditHistory,
  saveEditHistory,
} from "../lib/editStorage";

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  // Convert to base64 without data URL prefix
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function EditPage() {
  const [systemPrompt, setSystemPrompt] = useState(
    "you pay great attention to detail and edit only what I tell you",
  );
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [prompt, setPrompt] = useState("");
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputPreviewUrl, setInputPreviewUrl] = useState<string | null>(null);

  const [items, setItems] = useState<EditHistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Cooldown (like recipe generator)
  const cooldownMs = 7000;
  const [cooldownEndsAtMs, setCooldownEndsAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const cooldownRemainingMs = Math.max(0, (cooldownEndsAtMs ?? 0) - nowMs);
  const isInCooldown = cooldownRemainingMs > 0;

  useEffect(() => {
    let canceled = false;
    (async () => {
      const loaded = await loadEditHistory();
      if (canceled) return;
      setItems(loaded);
      setSelectedId(loaded[0]?.id ?? null);
    })();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    saveEditHistory(items);
  }, [items]);

  useEffect(() => {
    if (!inputFile) {
      setInputPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(inputFile);
    setInputPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [inputFile]);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  async function onEdit() {
    if (busy || isInCooldown) return;
    if (!prompt.trim()) {
      alert("Please enter edit instructions.");
      return;
    }

    const id = newId();
    const createdAt = Date.now();

    const finalPrompt = [systemPrompt.trim(), prompt.trim()]
      .filter(Boolean)
      .join("\n\n");

    const optimistic: EditHistoryItem = {
      id,
      createdAt,
      prompt: prompt.trim(),
      finalPrompt,
      aspectRatio,
      status: "loading",
    };

    setItems((prev) => [optimistic, ...prev]);
    setSelectedId(id);
    setBusy(true);

    // Start cooldown immediately (same UX as generator)
    setCooldownEndsAtMs(Date.now() + cooldownMs);

    try {
      const inputImageBase64 = inputFile ? await fileToBase64(inputFile) : null;
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          systemPrompt: systemPrompt.trim(),
          aspectRatio,
          inputImage: inputFile
            ? {
                mimeType: inputFile.type || "image/png",
                dataBase64: inputImageBase64,
              }
            : undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            outputImageDataUrl?: string;
            error?: string;
          }
        | null;

      if (!res.ok || !data?.outputImageDataUrl) {
        throw new Error(data?.error || "Edit failed");
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: "done",
                outputImageDataUrl: data.outputImageDataUrl,
              }
            : it,
        ),
      );
      setPrompt("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Edit failed";
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
    clearEditHistory();
    setItems([]);
    setSelectedId(null);
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-black">
      <div className="grid h-full grid-cols-[320px_1fr_320px]">
        <EditHistorySidebar
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onClear={onClear}
        />

        <EditPanel
          prompt={prompt}
          setPrompt={setPrompt}
          inputImagePreviewUrl={inputPreviewUrl}
          onPickFile={setInputFile}
          onEdit={onEdit}
          isBusy={busy}
          isInCooldown={isInCooldown}
          cooldownRemainingMs={cooldownRemainingMs}
          cooldownMs={cooldownMs}
          selected={selected}
        />

        <EditSettingsPanel
          systemPrompt={systemPrompt}
          onChangeSystemPrompt={setSystemPrompt}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
        />
      </div>
    </div>
  );
}
