import "server-only";
import { catalogExtractionSchema, type CatalogExtraction } from "../schemas";
import type { AIProvider, CatalogAnalysisInput } from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

function parseModelJson(text: string): CatalogExtraction {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return catalogExtractionSchema.parse(JSON.parse(cleaned));
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini" as const;
  readonly model = MODEL;

  async analyzeCatalog(input: CatalogAnalysisInput): Promise<CatalogExtraction> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY no está configurada.");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analiza el catálogo turístico PDF "${input.filename}" y devuelve SOLO JSON válido con este formato:
{
  "sourceDocument": "nombre exacto del archivo",
  "tours": [{
    "sourceDocument": "nombre exacto",
    "sourcePages": [1],
    "slug": "slug-o-null",
    "category": "texto-o-null",
    "destination": "texto-o-null",
    "difficulty": "EASY|MODERATE|CHALLENGING|null",
    "durationDays": 1,
    "durationNights": 0,
    "durationHours": null,
    "nameEs": "texto-o-null",
    "nameEn": "texto-o-null",
    "shortDescEs": "texto-o-null",
    "shortDescEn": "texto-o-null",
    "longDescEs": "texto-o-null",
    "longDescEn": "texto-o-null",
    "metaTitleEs": null, "metaDescEs": null, "metaTitleEn": null, "metaDescEn": null,
    "prices": [{"labelEs": "Adulto", "labelEn": "Adult", "ageMin": null, "ageMax": null, "amount": 0, "currency": "USD"}],
    "itinerary": [{"dayNumber": 1, "titleEs": "texto-o-null", "titleEn": "texto-o-null", "descriptionEs": "texto-o-null", "descriptionEn": "texto-o-null"}],
    "includesEs": [], "includesEn": [], "excludesEs": [], "excludesEn": [],
    "conditionsEs": [], "conditionsEn": []
  }]
}
Reglas: el PDF es la única fuente de verdad; no inventes, traduzcas solo de forma fiel, usa null si falta un dato, conserva las páginas y no corrijas contradicciones.`
              },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: input.pdf.toString("base64"),
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Gemini respondió ${response.status}: ${detail.slice(0, 500)}`);
    }

    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!text) throw new Error("Gemini no devolvió contenido estructurado.");
    return parseModelJson(text);
  }
}
