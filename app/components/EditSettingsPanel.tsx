export function EditSettingsPanel({
  systemPrompt,
  onChangeSystemPrompt,
  aspectRatio,
  onChangeAspectRatio,
}: {
  systemPrompt: string;
  onChangeSystemPrompt: (v: string) => void;
  aspectRatio: string;
  onChangeAspectRatio: (v: string) => void;
}) {
  return (
    <aside className="h-full border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Edit settings
      </h2>

      <div className="mt-4 space-y-6">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            System prompt
          </h3>
          <textarea
            value={systemPrompt}
            onChange={(e) => onChangeSystemPrompt(e.target.value)}
            className="mt-2 w-full min-h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/10"
            placeholder="How the model should behave while editing…"
          />
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Output
          </h3>
          <div className="mt-2 space-y-3 text-sm">
            <label className="block">
              <div className="mb-1 text-xs text-zinc-500">Aspect ratio</div>
              <select
                value={aspectRatio}
                onChange={(e) => onChangeAspectRatio(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/10"
              >
                <option value="1:1">1:1 (square)</option>
                <option value="4:5">4:5 (portrait)</option>
                <option value="3:2">3:2</option>
                <option value="16:9">16:9 (wide)</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </aside>
  );
}
