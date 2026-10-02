import "server-only";
import { catalogEditorialPrompt } from "../prompt";
import { providerFetch, providerResult, ProviderError } from "./http";
import type { AIProvider, CatalogAnalysisInput } from "./types";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  readonly model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  async analyzeCatalog(input: CatalogAnalysisInput) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new ProviderError(this.name, null, true);
    const response = await providerFetch(this.name, "https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, max_tokens: 16000, temperature: 0,
        system: catalogEditorialPrompt(input.filename),
        messages: [{ role: "user", content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: input.pdf.toString("base64") } },
          { type: "text", text: input.reviewInstructions || "Prepara los candidatos en JSON." },
        ] }],
      }),
    }, input.signal);
    const payload = await response.json() as { stop_reason?: string; content?: Array<{ type: string; text?: string }>; usage?: { input_tokens?: number; output_tokens?: number } };
    if (payload.stop_reason && payload.stop_reason !== "end_turn") throw new ProviderError(this.name, null, false);
    const text = payload.content?.filter((c) => c.type === "text").map((c) => c.text).join("");
    if (!text) throw new ProviderError(this.name, null, false);
    return providerResult(this.name, text, payload.usage?.input_tokens, payload.usage?.output_tokens);
  }
}
