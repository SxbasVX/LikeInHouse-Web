import type { CatalogExtractionEnvelope } from "../schemas";

export type AIProviderName = "gemini" | "openai" | "anthropic";

export interface CatalogAnalysisInput {
  filename: string;
  pdf: Buffer;
  signal?: AbortSignal;
  reviewInstructions?: string;
}

export interface AIProvider {
  readonly name: AIProviderName;
  readonly model: string;
  analyzeCatalog(input: CatalogAnalysisInput): Promise<ProviderResult>;
}

export interface ProviderResult {
  extraction: CatalogExtractionEnvelope;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCost: number | null;
}

export interface ProviderSelection {
  primary: AIProviderName;
  fallback: AIProviderName;
  review: AIProviderName;
}
