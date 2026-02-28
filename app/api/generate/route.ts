import { NextResponse } from "next/server";

/**
 * Temporary stub for "Nano Banana 2".
 *
 * When you provide the real API details, we’ll replace the internals of this
 * route and keep the UI unchanged.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { recipe?: string; defaultPrompt?: string }
    | null;

  const recipe = (body?.recipe ?? "").trim();
  const defaultPrompt = (body?.defaultPrompt ?? "").trim();
  const finalPrompt = [defaultPrompt, recipe].filter(Boolean).join("\n\n");

  if (!finalPrompt) {
    return NextResponse.json(
      { ok: false, error: "Missing recipe text." },
      { status: 400 },
    );
  }

  // Simulate latency
  await new Promise((r) => setTimeout(r, 900));

  // Simple SVG image placeholder, returned as a data URL.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="44%" text-anchor="middle" fill="#e5e7eb" font-size="44" font-family="ui-sans-serif, system-ui, -apple-system">
    Recipe Pic Gen (Mock)
  </text>
  <text x="50%" y="54%" text-anchor="middle" fill="#9ca3af" font-size="20" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace">
    ${escapeXml(finalPrompt).slice(0, 160)}
  </text>
</svg>`;

  const imageDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    svg,
  )}`;

  return NextResponse.json({ ok: true, imageDataUrl, finalPrompt });
}

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
