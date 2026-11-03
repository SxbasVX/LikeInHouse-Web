import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { catalogEditorialPrompt } from "../prompt";
import { catalogExtractionEnvelopeSchema } from "../schemas";
import { estimateCost, parseJsonReply, ProviderError } from "./result";
import type { AIProvider, CatalogAnalysisInput, ProviderResult } from "./types";

type Effort = "low" | "medium" | "high";
type ContentBlock = Anthropic.Beta.Messages.BetaContentBlock;
type RequestParams = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const MAX_PAUSE_RESUMES = 4;
const BATCH_PRICE_FACTOR = 0.5;

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | undefined;
function claude(): Anthropic {
  // The SDK retries 408/409/429/5xx and connection errors itself.
  // An organization-level key (not created inside a workspace) must name the workspace that pays for each request.
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return (client ??= new Anthropic({ maxRetries: 2, defaultHeaders: workspace ? { "anthropic-workspace-id": workspace } : undefined }));
}

export interface ClaudeCall {
  system: string;
  content: Anthropic.Beta.Messages.BetaContentBlockParam[];
  effort: Effort;
  maxTokens: number;
  web?: { searches: number; fetches: number };
  /** The same long system prompt for many requests (a batch): cache it so each request pays it at the cached rate. */
  cacheSystem?: boolean;
  signal?: AbortSignal;
}

export interface ClaudeReply {
  text: string;
  sources: Array<{ url: string; title: string | null }>;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number | null;
}

function requestParams(call: ClaudeCall): RequestParams {
  return {
    model: CLAUDE_MODEL, max_tokens: call.maxTokens, messages: [{ role: "user", content: call.content }],
    system: call.cacheSystem ? [{ type: "text", text: call.system, cache_control: { type: "ephemeral" } }] : call.system,
    thinking: { type: "adaptive" }, output_config: { effort: call.effort },
    tools: call.web ? [
      { type: "web_search_20260209", name: "web_search", max_uses: call.web.searches },
      { type: "web_fetch_20260209", name: "web_fetch", max_uses: call.web.fetches },
    ] : undefined,
  };
}

// Keep Anthropic's own explanation (e.g. "invalid PDF", "model not found"): a bare status code can't be acted on.
function apiFailure(error: unknown): ProviderError {
  if (!(error instanceof Anthropic.APIError)) return new ProviderError("anthropic", null, true);
  const body = error.error as { error?: { message?: string } } | undefined;
  const reason = body?.error?.message ?? error.message;
  return new ProviderError("anthropic", error.status ?? null, true, `HTTP ${error.status ?? "?"} (${error.type ?? "error"}): ${reason}`.slice(0, 500));
}

function assertUsable(message: Anthropic.Beta.Messages.BetaMessage): void {
  if (message.stop_reason === "refusal") {
    throw new ProviderError("anthropic", null, false, `Claude rechazó la solicitud${message.stop_details?.category ? ` (${message.stop_details.category})` : ""}.`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new ProviderError("anthropic", null, false, "la respuesta superó el límite de salida. Divide el catálogo en PDFs más pequeños.");
  }
}

class UsageTotal {
  inputTokens = 0; outputTokens = 0; webSearches = 0;
  add(usage: Anthropic.Beta.Messages.BetaUsage) {
    this.inputTokens += usage.input_tokens + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
    this.outputTokens += usage.output_tokens;
    this.webSearches += usage.server_tool_use?.web_search_requests ?? 0;
  }
}

function toReply(blocks: ContentBlock[], model: string, usage: UsageTotal, tokenPriceFactor: number): ClaudeReply {
  const text = blocks.flatMap((b) => b.type === "text" ? [b.text] : []).join("");
  return { text, sources: citedSources(blocks), model, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens,
    estimatedCost: estimateCost(usage.inputTokens, usage.outputTokens, usage.webSearches, tokenPriceFactor) };
}

function assertText(reply: ClaudeReply): ClaudeReply {
  if (!reply.text.trim()) throw new ProviderError("anthropic", null, false, "respuesta vacía.");
  return reply;
}

export async function callClaude(call: ClaudeCall): Promise<ClaudeReply> {
  if (!isClaudeConfigured()) throw new ProviderError("anthropic", null, true, "falta ANTHROPIC_API_KEY.");
  const params = requestParams(call);
  const blocks: ContentBlock[] = [];
  const usage = new UsageTotal();
  let model = CLAUDE_MODEL;
  for (let resume = 0; ; resume++) {
    let message: Anthropic.Beta.Messages.BetaMessage;
    try {
      message = await claude().beta.messages.stream({
        ...params,
        // On a policy decline the API re-runs the request on a recommended model.
        betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      }, { signal: call.signal }).finalMessage();
    } catch (error) {
      throw apiFailure(error);
    }
    model = message.model;
    usage.add(message.usage);
    blocks.push(...message.content);
    assertUsable(message);
    if (message.stop_reason !== "pause_turn") break;
    // A long server-side search loop pauses; sending the turn back lets the server continue it.
    if (resume >= MAX_PAUSE_RESUMES) throw new ProviderError("anthropic", null, false, "la búsqueda web no terminó a tiempo.");
    params.messages = [params.messages[0], { role: "assistant", content: resumableContent(blocks) }];
  }
  return assertText(toReply(blocks, model, usage, 1));
}

// Batch status and results calls must fit in a short poll; the history page retries later.
const BATCH_POLL_OPTIONS = { timeout: 15_000, maxRetries: 1 };

// Batches run without a request time limit at half price. Fallbacks are not accepted there.
export async function submitClaudeBatch(requests: Array<{ customId: string; call: ClaudeCall }>): Promise<string> {
  if (!isClaudeConfigured()) throw new ProviderError("anthropic", null, true, "falta ANTHROPIC_API_KEY.");
  try {
    const batch = await claude().beta.messages.batches.create({
      requests: requests.map((r) => ({ custom_id: r.customId, params: requestParams(r.call) })),
    });
    return batch.id;
  } catch (error) {
    throw apiFailure(error);
  }
}

// A missing batch (expired results, rotated key) can never finish, so callers fail the job instead of retrying.
export function isPermanentBatchError(error: unknown): boolean {
  return error instanceof Anthropic.NotFoundError || error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError;
}

export async function isClaudeBatchDone(batchId: string): Promise<boolean> {
  return (await claude().beta.messages.batches.retrieve(batchId, null, BATCH_POLL_OPTIONS)).processing_status === "ended";
}

// `reply` carries usage whenever Claude produced a message, even an unusable one, because it is billed either way.
export interface BatchOutcome { customId: string; reply?: ClaudeReply; error?: string }

export async function* claudeBatchResults(batchId: string): AsyncGenerator<BatchOutcome> {
  for await (const item of await claude().beta.messages.batches.results(batchId, undefined, BATCH_POLL_OPTIONS)) {
    const result = item.result;
    if (result.type !== "succeeded") {
      yield { customId: item.custom_id, error: result.type === "errored" ? `anthropic: error en el lote (${result.error.error.type}).` : `anthropic: solicitud ${result.type === "expired" ? "vencida" : "cancelada"} en el lote.` };
      continue;
    }
    const usage = new UsageTotal(); usage.add(result.message.usage);
    const reply = toReply(result.message.content, result.message.model, usage, BATCH_PRICE_FACTOR);
    try {
      assertUsable(result.message);
      if (result.message.stop_reason === "pause_turn") throw new ProviderError("anthropic", null, false, "la búsqueda web no terminó; usa el botón de Claude en este tour.");
      yield { customId: item.custom_id, reply: assertText(reply) };
    } catch (error) {
      yield { customId: item.custom_id, reply, error: error instanceof ProviderError ? error.message : "anthropic: respuesta inválida." };
    }
  }
}

// After a mid-output fallback, blocks before the last switch point that the new model cannot continue are dropped:
// model-internal blocks, and server tool calls whose result never arrived.
function resumableContent(blocks: ContentBlock[]): Anthropic.Beta.Messages.BetaContentBlockParam[] {
  const boundary = blocks.findLastIndex((b) => b.type === "fallback");
  const answered = new Set(blocks.flatMap((b) => b.type.endsWith("_tool_result") && "tool_use_id" in b ? [b.tool_use_id] : []));
  const echoable = new Set(["text", "server_tool_use", "web_search_tool_result", "web_fetch_tool_result"]);
  return blocks.filter((b, i) => i > boundary || (echoable.has(b.type) && (b.type !== "server_tool_use" || answered.has(b.id)))) as Anthropic.Beta.Messages.BetaContentBlockParam[];
}

function citedSources(blocks: ContentBlock[]): ClaudeReply["sources"] {
  const sources = new Map<string, string | null>();
  for (const block of blocks) {
    if (block.type !== "text") continue;
    for (const citation of block.citations ?? []) {
      if (citation.type === "web_search_result_location") sources.set(citation.url, citation.title ?? null);
    }
  }
  return [...sources].map(([url, title]) => ({ url, title }));
}

export function extractionCall(filename: string, pdf: Buffer, reviewInstructions?: string): ClaudeCall {
  return {
    system: catalogEditorialPrompt(filename), effort: "medium", maxTokens: 128_000,
    content: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf.toString("base64") } },
      { type: "text", text: reviewInstructions || "Prepara los candidatos en JSON." },
    ],
  };
}

export function parseExtraction(text: string) {
  const extraction = catalogExtractionEnvelopeSchema.safeParse(parseJsonReply("anthropic", text));
  if (!extraction.success) throw new ProviderError("anthropic", null, false, "el JSON no tiene la forma {sourceDocument, tours}.");
  return extraction.data;
}

// Synchronous extraction, used by the read-only QA script.
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  readonly model = CLAUDE_MODEL;
  async analyzeCatalog(input: CatalogAnalysisInput): Promise<ProviderResult> {
    const reply = await callClaude({ ...extractionCall(input.filename, input.pdf, input.reviewInstructions), signal: input.signal });
    return { extraction: parseExtraction(reply.text), inputTokens: reply.inputTokens, outputTokens: reply.outputTokens, estimatedCost: reply.estimatedCost };
  }
}
