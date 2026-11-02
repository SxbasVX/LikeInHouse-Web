import { NextResponse } from "next/server";
import { z } from "zod";
import { isClaudeConfigured } from "@/server/catalog-import/providers/anthropic";
import { askAboutCandidate, AssistError, enrichCandidate } from "@/server/catalog-import/assistant";
import { checkRateLimit } from "@/server/lib/rate-limit";
import { authorizeCatalogRequest } from "../authorize";

export const runtime = "nodejs";
// Claude with web search can take minutes; the tRPC route is capped at 60 s.
export const maxDuration = 300;
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enrich"), importTourId: z.string().cuid(), instructions: z.string().trim().max(2000).optional() }),
  z.object({ action: z.literal("ask"), importTourId: z.string().cuid(), question: z.string().trim().min(3).max(2000) }),
]);

export async function POST(request: Request) {
  const authorized = await authorizeCatalogRequest(request);
  if (authorized instanceof NextResponse) return authorized;
  if (!isClaudeConfigured()) return NextResponse.json({ error: "Configura ANTHROPIC_API_KEY para usar Claude." }, { status: 503 });
  if (!checkRateLimit(`catalog-assist:${authorized.userId}`, { maxRequests: 20, windowSeconds: 900 }).allowed) return NextResponse.json({ error: "Demasiadas consultas a Claude. Espera 15 minutos." }, { status: 429 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  try {
    const result = body.data.action === "enrich"
      ? await enrichCandidate(body.data.importTourId, authorized.userId, body.data.instructions)
      : await askAboutCandidate(body.data.importTourId, body.data.question);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AssistError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "No se pudo completar la consulta a Claude." }, { status: 500 });
  }
}
