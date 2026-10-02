import { catalogExtractionEnvelopeSchema } from "../schemas";
import type { AIProviderName, ProviderResult } from "./types";

export class ProviderError extends Error {
  constructor(public readonly provider: string, public readonly status: number | null, public readonly technical: boolean) {
    super(status ? `${provider}: HTTP ${status}.` : `${provider}: respuesta inválida o tiempo agotado.`);
  }
}

export async function providerFetch(provider: string, url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(70_000)]) : AbortSignal.timeout(70_000) });
    } catch {
      throw new ProviderError(provider, null, true);
    }
    if (response.ok) return response;
    const retryable = [429, 500, 502, 503, 504].includes(response.status);
    await response.body?.cancel();
    if (!retryable || attempt === 2) throw new ProviderError(provider, response.status, true);
    await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
  }
  throw new ProviderError(provider, null, true);
}

export function providerResult(provider: AIProviderName, text: string, inputTokens?: number, outputTokens?: number): ProviderResult {
  try {
    const extraction = catalogExtractionEnvelopeSchema.parse(JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")));
    const prefix = provider.toUpperCase();
    const inputRate = Number(process.env[`${prefix}_INPUT_COST_PER_MILLION`]);
    const outputRate = Number(process.env[`${prefix}_OUTPUT_COST_PER_MILLION`]);
    const estimatedCost = inputTokens != null && outputTokens != null && Number.isFinite(inputRate) && Number.isFinite(outputRate) && inputRate >= 0 && outputRate >= 0
      ? (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000 : null;
    return { extraction, inputTokens: inputTokens ?? null, outputTokens: outputTokens ?? null, estimatedCost };
  } catch {
    throw new ProviderError(provider, null, false);
  }
}
