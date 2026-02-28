import type { HistoryItem } from "../lib/types";

export function HistorySidebar({
  items,
  selectedId,
  onSelect,
  onClear,
}: {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <aside className="h-full border-r border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          History
        </h2>
        <button
          onClick={onClear}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Clear
        </button>
      </div>

      <div className="mt-3 flex h-[calc(100vh-92px)] flex-col gap-2 overflow-auto pr-1">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-sm text-zinc-500 dark:border-zinc-800">
            No images yet.
          </div>
        ) : null}

        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={
              "w-full overflow-hidden rounded-xl border text-left transition-colors " +
              (item.id === selectedId
                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900")
            }
          >
            <div className="flex items-center gap-3 p-2">
              <div className="h-14 w-20 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {item.status === "done" && item.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageDataUrl}
                    alt="Generated thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-zinc-500">
                    {item.status === "loading" ? "Loading…" : "Error"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.recipeText || "(empty)"}
                </div>
                <div className="mt-0.5 truncate text-xs text-zinc-500">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
