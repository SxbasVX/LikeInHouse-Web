export class ProviderError extends Error {
  constructor(public readonly provider: string, public readonly status: number | null, public readonly technical: boolean, detail?: string) {
    super(detail ? `${provider}: ${detail}` : status ? `${provider}: HTTP ${status}.` : `${provider}: respuesta inválida o tiempo agotado.`);
  }
}

// Models sometimes wrap JSON in a Markdown fence, or narrate web searches before it, even when told not to.
export function parseJsonReply(provider: string, text: string): unknown {
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{"), end = unfenced.lastIndexOf("}");
    try {
      if (start >= 0 && end > start) return JSON.parse(unfenced.slice(start, end + 1));
    } catch { /* reported below */ }
    throw new ProviderError(provider, null, false, "la respuesta no es JSON válido.");
  }
}

// Web search is billed per search on top of tokens ($10 per 1,000 searches); the batch discount covers tokens only.
export function estimateCost(inputTokens: number, outputTokens: number, webSearches: number, tokenPriceFactor = 1): number | null {
  const inputRate = Number(process.env.ANTHROPIC_INPUT_COST_PER_MILLION);
  const outputRate = Number(process.env.ANTHROPIC_OUTPUT_COST_PER_MILLION);
  if (!process.env.ANTHROPIC_INPUT_COST_PER_MILLION || !process.env.ANTHROPIC_OUTPUT_COST_PER_MILLION) return null;
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate) || inputRate < 0 || outputRate < 0) return null;
  return (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000 * tokenPriceFactor + webSearches * 0.01;
}
