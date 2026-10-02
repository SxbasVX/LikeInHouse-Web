import "server-only";
import { catalogExtractionSchema, type CatalogExtraction } from "../schemas";
import type { AIProvider, CatalogAnalysisInput } from "./types";

const MODEL = "gpt-4.1-mini";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly model = MODEL;

  async analyzeCatalog(input: CatalogAnalysisInput): Promise<CatalogExtraction> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY no está configurada.");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: [{
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Extrae los tours del PDF "${input.filename}". Devuelve únicamente JSON válido con sourceDocument y tours. Cada tour debe incluir sourcePages, datos bilingües, precios USD, itinerario, incluye, excluye y condiciones. El PDF es la única fuente de verdad: usa null si falta un dato, no inventes ni corrijas contradicciones.`,
            },
            {
              type: "input_file",
              filename: input.filename,
              file_data: `data:application/pdf;base64,${input.pdf.toString("base64")}`,
            },
          ],
        }],
        text: {
          format: {
            type: "json_schema",
            name: "catalog_extraction",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["sourceDocument", "tours"],
              properties: {
                sourceDocument: { type: "string" },
                tours: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI respondió ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }
    const payload = await response.json() as { output_text?: string };
    if (!payload.output_text) throw new Error("OpenAI no devolvió contenido estructurado.");
    return catalogExtractionSchema.parse(JSON.parse(payload.output_text));
  }
}
