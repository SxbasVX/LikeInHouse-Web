import "server-only";
import { catalogEditorialPrompt } from "../prompt";
import { providerFetch, providerResult, ProviderError } from "./http";
import type { AIProvider, CatalogAnalysisInput } from "./types";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  async analyzeCatalog(input: CatalogAnalysisInput) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new ProviderError(this.name, null, true);
    const response = await providerFetch(this.name, "https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model, store: false, max_output_tokens: 32768,
        instructions: catalogEditorialPrompt(input.filename),
        input: [{ role: "user", content: [
          { type: "input_text", text: input.reviewInstructions || "Prepara las fichas editoriales de todos los tours en JSON." },
          { type: "input_file", filename: input.filename, file_data: `data:application/pdf;base64,${input.pdf.toString("base64")}` },
        ] }], text: { format: { type: "json_object" } },
      }),
    }, input.signal);
    const payload = await response.json() as {
      status?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    if (payload.status && payload.status !== "completed") throw new ProviderError(this.name, null, false);
    const text = payload.output?.filter((o) => o.type === "message").flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("");
    if (!text) throw new ProviderError(this.name, null, false);
    return providerResult(this.name, text, payload.usage?.input_tokens, payload.usage?.output_tokens);
  }
}
