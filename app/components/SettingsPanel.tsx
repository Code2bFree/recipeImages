export const ASPECT_RATIOS = ["3:2", "16:9", "2:3", "1:1", "9:16", "4:3", "3:4"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const RESOLUTIONS = ["512", "2K", "4K"] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

const RESOLUTION_LABELS: Record<string, string> = {
  "4K": "4K (only upscaling)",
};

export function SettingsPanel({
  defaultPrompt,
  onChangeDefaultPrompt,
  aspectRatio,
  onChangeAspectRatio,
  resolution,
  onChangeResolution,
}: {
  defaultPrompt: string;
  onChangeDefaultPrompt: (v: string) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (v: AspectRatio) => void;
  resolution: Resolution;
  onChangeResolution: (v: Resolution) => void;
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
            placeholder="(optional) Change the rules/style prompt here…"
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
            <SelectRow
              label="Aspect ratio"
              value={aspectRatio}
              options={ASPECT_RATIOS as unknown as string[]}
              onChange={(v) => onChangeAspectRatio(v as AspectRatio)}
            />
            <SelectRow
              label="Resolution"
              value={resolution}
              options={RESOLUTIONS as unknown as string[]}
              optionLabels={RESOLUTION_LABELS}
              onChange={(v) => onChangeResolution(v as Resolution)}
            />
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

function SelectRow({
  label,
  value,
  options,
  optionLabels = {},
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-zinc-600 dark:text-zinc-400">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-50/10"
      >
        {options.map((o) => (
          <option key={o} value={o}>{optionLabels[o] ?? o}</option>
        ))}
      </select>
    </div>
  );
}
