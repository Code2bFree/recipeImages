import type { EditHistoryItem } from "../lib/editTypes";
import { TopNav } from "./TopNav";

function guessExtensionFromDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/jpeg")) return "jpg";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  return "png";
}

export function EditPanel({
  prompt,
  setPrompt,
  inputImagePreviewUrl,
  onPickFile,
  onEdit,
  isBusy,
  selected,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  inputImagePreviewUrl: string | null;
  onPickFile: (file: File | null) => void;
  onEdit: () => void;
  isBusy: boolean;
  selected: EditHistoryItem | null;
}) {
  return (
    <main className="h-full bg-zinc-50 p-4 dark:bg-black">
      <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
        <TopNav />
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Image editor
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Upload an image, describe what to change, and Nano Banana will edit
            it.
          </p>

          <div className="mt-4 grid gap-3">
            <label className="block">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Input image
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border file:border-zinc-200 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-50 dark:text-zinc-200 dark:file:border-zinc-800 dark:file:bg-zinc-950 dark:file:text-zinc-200 dark:hover:file:bg-zinc-900"
              />
            </label>

            {inputImagePreviewUrl ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inputImagePreviewUrl}
                  alt="Input preview"
                  className="max-h-64 w-full rounded-lg object-contain"
                />
              </div>
            ) : null}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-28 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/10"
              placeholder="e.g. Remove the background clutter, make the lighting warmer, and fix the crooked horizon."
            />

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                {isBusy ? "Working…" : "Ready"}
              </div>
              <button
                onClick={onEdit}
                disabled={isBusy}
                className={
                  "rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 " +
                  (isBusy
                    ? "bg-zinc-400"
                    : "bg-indigo-600 hover:bg-indigo-500") +
                  " dark:text-zinc-900"
                }
              >
                {isBusy ? "Editing…" : "Edit image"}
              </button>
            </div>
          </div>
        </section>

        <section className="flex-1 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Preview
            </h2>
            {selected?.status === "done" && selected.outputImageDataUrl ? (
              <a
                href={selected.outputImageDataUrl}
                download={`edited-${selected.id}.${guessExtensionFromDataUrl(
                  selected.outputImageDataUrl,
                )}`}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Download
              </a>
            ) : null}
          </div>

          <div className="mt-3">
            {selected ? (
              selected.status === "loading" ? (
                <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800">
                  Loading…
                </div>
              ) : selected.status === "error" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                  {selected.error || "Edit failed"}
                </div>
              ) : selected.outputImageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.outputImageDataUrl}
                  alt="Edited"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800"
                />
              ) : null
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800">
                Select an item from history, or run your first edit.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
