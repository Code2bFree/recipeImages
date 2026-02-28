export function SettingsPanel({
  defaultPrompt,
  onChangeDefaultPrompt,
}: {
  defaultPrompt: string;
  onChangeDefaultPrompt: (v: string) => void;
}) {
  return (
    <aside className="h-full border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Settings
      </h2>

      <div className="mt-4 space-y-6">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Default prompt
          </h3>
          <textarea
            value={defaultPrompt}
            onChange={(e) => onChangeDefaultPrompt(e.target.value)}
            className="mt-2 w-full min-h-28 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/10"
            placeholder="e.g. Cinematic food photo, soft natural light..."
          />
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Run settings
          </h3>

          <div className="mt-2 space-y-3 text-sm">
            <ReadonlyRow label="Model" value="Nano Banana 2" />
            <ReadonlyRow label="System instructions" value="(placeholder)" />
            <ReadonlyRow label="Output format" value="Images only" />
            <ReadonlyRow label="Aspect ratio" value="16:9" />
            <ReadonlyRow label="Resolution" value="2K" />
            <ReadonlyRow label="Thinking level" value="Minimal" />
          </div>
        </section>
      </div>
    </aside>
  );
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="font-medium text-zinc-900 dark:text-zinc-50">{value}</div>
    </div>
  );
}
