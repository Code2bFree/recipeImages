import type { HistoryItem } from "../lib/types";

function guessExtensionFromDataUrl(dataUrl: string): string {
  // e.g. data:image/png;base64,...
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/jpeg")) return "jpg";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  if (dataUrl.startsWith("data:image/svg+xml")) return "svg";
  return "png";
}

export function GeneratorPanel({
  recipeText,
  setRecipeText,
  onGenerate,
  isInCooldown,
  cooldownRemainingMs,
  cooldownMs,
  selected,
}: {
  recipeText: string;
  setRecipeText: (v: string) => void;
  onGenerate: () => void;
  isInCooldown: boolean;
  cooldownRemainingMs: number;
  cooldownMs: number;
  selected: HistoryItem | null;
}) {
  const secondsLeft = Math.ceil(cooldownRemainingMs / 1000);
  const progress = cooldownMs > 0 ? 1 - cooldownRemainingMs / cooldownMs : 1;
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <main className="h-full bg-zinc-50 p-4 dark:bg-black">
      <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recipe Pic Gen
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Enter recipe details and generate an image. Each run is saved to your
            local history.
          </p>

          <div className="mt-4 grid gap-3">
            <textarea
              value={recipeText}
              onChange={(e) => setRecipeText(e.target.value)}
              className="w-full min-h-36 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/10"
              placeholder="e.g. Classic lasagna with layers of pasta, beef ragu, béchamel..."
            />

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                {isInCooldown
                  ? `Cooldown… (${secondsLeft}s)`
                  : "Ready"}
              </div>
              <button
                onClick={onGenerate}
                disabled={isInCooldown || !recipeText.trim()}
                className={
                  "rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 " +
                  (isInCooldown
                    ? "bg-zinc-400"
                    : "bg-emerald-600 hover:bg-emerald-500") +
                  " dark:text-zinc-900"
                }
              >
                {isInCooldown ? `Wait ${secondsLeft}s` : "Generate"}
              </button>
            </div>

            {/* Cooldown progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className={
                  "h-full transition-[width] duration-100 " +
                  (isInCooldown ? "bg-zinc-400" : "bg-emerald-500")
                }
                style={{ width: `${isInCooldown ? pct : 100}%` }}
              />
            </div>
          </div>
        </section>

        <section className="flex-1 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Preview
            </h2>
            {selected?.status === "done" && selected.imageDataUrl ? (
              <a
                href={selected.imageDataUrl}
                download={`recipe-pic-${selected.id}.${guessExtensionFromDataUrl(
                  selected.imageDataUrl,
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
                  {selected.error || "Generation failed"}
                </div>
              ) : selected.imageDataUrl ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.imageDataUrl}
                    alt="Generated"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800"
                  />

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                    <div className="mb-1 font-semibold">Prompt used</div>
                    <pre className="whitespace-pre-wrap break-words font-mono leading-relaxed">
                      {selected.finalPrompt}
                    </pre>
                  </div>
                </div>
              ) : null
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800">
                Select an item from history, or generate your first image.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
