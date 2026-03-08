import { NextResponse } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export const runtime = "nodejs";

type EditBody =
  | {
      prompt?: string;
      systemPrompt?: string;
      aspectRatio?: string;
      resolution?: string;
      inputImage?: { mimeType?: string; dataBase64?: string };
    }
  | null;

/**
 * Image edit endpoint (image-to-image).
 *
 * Client uploads an input image (base64) + an edit prompt.
 * We forward both to Gemini image model and return a base64 data URL.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as EditBody;

  const prompt = (body?.prompt ?? "").trim();
  const systemPrompt = (body?.systemPrompt ?? "").trim();
  const aspectRatio = (body?.aspectRatio ?? "3:2").trim();
  const resolution = (body?.resolution ?? "512").trim();
  const inputImageBase64 = (body?.inputImage?.dataBase64 ?? "").trim();
  const inputImageMimeType = (body?.inputImage?.mimeType ?? "image/png").trim();

  if (!prompt) {
    return NextResponse.json(
      { ok: false, error: "Missing edit prompt." },
      { status: 400 },
    );
  }

  // input image is OPTIONAL: if not provided, this endpoint will act like
  // a text-to-image generator using the editor defaults.

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

    const config = {
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      responseModalities: ["IMAGE"] as string[],
      imageConfig: {
        aspectRatio,
        imageSize: resolution,
      },
      systemInstruction: systemPrompt ? [{ text: systemPrompt }] : undefined,
    };

    const model = "gemini-3.1-flash-image-preview";

    const response = await ai.models.generateContent({
      model,
      config,
      contents: [
        {
          role: "user",
          parts: [
            ...(inputImageBase64
              ? [
                  {
                    inlineData: {
                      mimeType: inputImageMimeType,
                      data: inputImageBase64,
                    },
                  },
                ]
              : []),
            { text: prompt },
          ],
        },
      ],
    });

    const inline = findFirstInlineData(response);
    if (!inline?.data || !inline.mimeType) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Gemini did not return image data. Try adjusting the prompt or image settings.",
        },
        { status: 502 },
      );
    }

    const outputImageDataUrl = `data:${inline.mimeType};base64,${inline.data}`;
    return NextResponse.json({ ok: true, outputImageDataUrl });
  } catch (err) {
    let message = "Edit failed";
    let status = 500;

    if (err instanceof Error) {
      message = err.message;
      if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
        message = "Rate limit reached — too many requests. Please wait a moment and try again.";
        status = 429;
      } else if (message.includes("INVALID_ARGUMENT") || message.includes("400")) {
        message = `Invalid request: ${message}`;
        status = 400;
      } else if (message.includes("PERMISSION_DENIED") || message.includes("403")) {
        message = "API key does not have permission for image generation.";
        status = 403;
      } else if (message.includes("SAFETY") || message.includes("blocked")) {
        message = "Content was blocked by safety filters. Try rephrasing your prompt.";
        status = 400;
      }
    }

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

function findFirstInlineData(response: unknown):
  | { mimeType?: string; data?: string }
  | undefined {
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
