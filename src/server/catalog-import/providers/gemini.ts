import "server-only";
import { catalogExtractionSchema, type CatalogExtraction } from "../schemas";
import type { AIProvider, CatalogAnalysisInput } from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

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

    const request = {
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
    };
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
        request,
      );
      if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status) || attempt === 2) break;
      await wait(1500 * (attempt + 1));
    }

    if (!response || !response.ok) {
      const detail = response ? await response.text() : "Sin respuesta del servicio.";
      throw new Error(
        `Gemini respondió ${response?.status ?? "sin estado"} después de reintentar: ${detail.slice(0, 500)}`,
      );
    }

    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!text) throw new Error("Gemini no devolvió contenido estructurado.");
    return parseModelJson(text);
  }
}
