import { NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export const runtime = "nodejs";

/**
 * Image generation endpoint.
 *
 * This runs SERVER-SIDE so our Gemini API key stays secret.
 * The client calls this route with recipe text and we return a data URL.
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Server misconfigured: GEMINI_API_KEY missing. Add it to .env.local for local dev and to your hosting provider's environment variables for production.",
      },
      { status: 500 },
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Note: returning very large images as base64 data URLs can hit hosting response limits.
    // Start modest; we can increase later or switch to object storage.
    const config = {
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      responseModalities: ["IMAGE"] as string[],
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "2K",
      },
      systemInstruction: defaultPrompt
        ? [{ text: defaultPrompt }]
        : undefined,
    };

    const model = "gemini-3.1-flash-image-preview";

    const response = await ai.models.generateContent({
      model,
      config,
      contents: [
        {
          role: "user",
          parts: [{ text: recipe }],
        },
      ],
    });

    const inline = findFirstInlineData(response);
    if (!inline?.data || !inline.mimeType) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Gemini did not return image data. Try adjusting the prompt, model, or image settings.",
        },
        { status: 502 },
      );
    }

    const imageDataUrl = `data:${inline.mimeType};base64,${inline.data}`;
    return NextResponse.json({ ok: true, imageDataUrl, finalPrompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function findFirstInlineData(response: unknown):
  | { mimeType?: string; data?: string }
  | undefined {
  // The SDK response shape is nested; we search candidates/parts for inlineData.
  const r = response as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
        }>;
      };
    }>;
  };
  const parts = r.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return undefined;

  for (const p of parts) {
    const inline = p?.inlineData;
    if (inline?.data) return inline;
  }
  return undefined;
}
