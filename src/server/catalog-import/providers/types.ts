import type { CatalogExtraction } from "../schemas";

export type AIProviderName = "gemini" | "openai" | "anthropic";

export interface CatalogAnalysisInput {
  filename: string;
  pdf: Buffer;
}

export interface AIProvider {
  readonly name: AIProviderName;
  readonly model: string;
  analyzeCatalog(input: CatalogAnalysisInput): Promise<CatalogExtraction>;
}

export interface ProviderSelection {
  primary: AIProviderName;
  fallback: AIProviderName;
  review: AIProviderName;
}
