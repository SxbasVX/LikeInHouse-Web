import "server-only";
import { catalogEditorialPrompt } from "../prompt";
import { providerFetch, providerResult, ProviderError } from "./http";
import type { AIProvider, CatalogAnalysisInput } from "./types";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini" as const;
  readonly model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  async analyzeCatalog(input: CatalogAnalysisInput) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new ProviderError(this.name, null, true);
    const response = await providerFetch(this.name,
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: catalogEditorialPrompt(input.filename) }] },
        contents: [{ parts: [
          { text: input.reviewInstructions || "Prepara las fichas editoriales de todos los tours." },
          { inlineData: { mimeType: "application/pdf", data: input.pdf.toString("base64") } },
        ] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 32768 },
      }),
    }, input.signal);
    const payload = await response.json() as {
      candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
    };
    const candidate = payload.candidates?.[0];
    if (!candidate || (candidate.finishReason && candidate.finishReason !== "STOP")) throw new ProviderError(this.name, null, false);
    const text = candidate.content?.parts?.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
    if (!text) throw new ProviderError(this.name, null, false);
    return providerResult(this.name, text, payload.usageMetadata?.promptTokenCount,
      payload.usageMetadata?.candidatesTokenCount == null ? undefined : payload.usageMetadata.candidatesTokenCount + (payload.usageMetadata.thoughtsTokenCount ?? 0));
  }
}
