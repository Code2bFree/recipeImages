"use client";

import { useEffect, useMemo, useState } from "react";
import { EditHistorySidebar } from "../components/EditHistorySidebar";
import { EditSettingsPanel } from "../components/EditSettingsPanel";
import { EditPanel } from "../components/EditPanel";
import { useEdit } from "../context/EditContext";

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function EditPage() {
  const { items, setItems, selectedId, setSelectedId, onClear } = useEdit();

  const [systemPrompt, setSystemPrompt] = useState(
    "you pay great attention to detail and edit only what I tell you",
  );
  const [aspectRatio, setAspectRatio] = useState("3:2");
  const [resolution, setResolution] = useState("512");
  const [prompt, setPrompt] = useState("");
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputPreviewUrl, setInputPreviewUrl] = useState<string | null>(null);
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
    if (!inputFile) { setInputPreviewUrl(null); return; }
    const url = URL.createObjectURL(inputFile);
    setInputPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [inputFile]);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  async function onEdit() {
    if (isInCooldown) return;
    const plainPrompt = stripHtml(prompt).trim();
    if (!plainPrompt) { alert("Please enter edit instructions."); return; }

    const id = newId();
    const createdAt = Date.now();
    const finalPrompt = [systemPrompt.trim(), plainPrompt].filter(Boolean).join("\n\n");

    setItems((prev) => [
      { id, createdAt, prompt: plainPrompt, finalPrompt, aspectRatio, status: "loading" },
      ...prev,
    ]);
    setSelectedId(id);
    setCooldownEndsAtMs(Date.now() + cooldownMs);

    const inputImageBase64 = inputFile ? await fileToBase64(inputFile) : null;

    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: plainPrompt,
          systemPrompt: systemPrompt.trim(),
          aspectRatio,
          resolution,
          inputImage: inputFile
            ? { mimeType: inputFile.type || "image/png", dataBase64: inputImageBase64 }
            : undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; outputImageDataUrl?: string; error?: string }
        | null;

      if (!res.ok || !data?.outputImageDataUrl) {
        const errorDetail = data?.error || `Server responded with status ${res.status}`;
        throw new Error(errorDetail);
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: "done", outputImageDataUrl: data.outputImageDataUrl } : it,
        ),
      );
    } catch (err) {
      let message = "Edit failed";
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        message = "Network error — check your internet connection or try again.";
      } else if (err instanceof Error) {
        message = err.message;
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: "error", error: message } : it,
        ),
      );
    }

    setPrompt("");
  }

  return (
    <div className="min-h-screen w-screen overflow-auto bg-zinc-50 dark:bg-black">
      <div className="grid grid-cols-[320px_1fr_320px]">
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
          isInCooldown={isInCooldown}
          cooldownRemainingMs={cooldownRemainingMs}
          cooldownMs={cooldownMs}
          aspectRatio={aspectRatio}
          selected={selected}
        />

        <EditSettingsPanel
          systemPrompt={systemPrompt}
          onChangeSystemPrompt={setSystemPrompt}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
          resolution={resolution}
          onChangeResolution={setResolution}
        />
      </div>
    </div>
  );
}
