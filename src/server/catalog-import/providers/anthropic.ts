import "server-only";
import type { AIProvider, CatalogAnalysisInput } from "./types";
import type { CatalogExtraction } from "../schemas";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  readonly model = "claude-sonnet-4-20250514";

  async analyzeCatalog(_input: CatalogAnalysisInput): Promise<CatalogExtraction> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY no está configurada.");
    }
    throw new Error("Anthropic queda reservado para revisión de ambigüedades.");
  }
}
