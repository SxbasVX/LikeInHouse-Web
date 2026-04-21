import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9-]+$/;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) {
        return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const doc = await db.document.findUnique({
        where: { slug, isPublished: true },
        select: { pdfUrl: true, titleEs: true, type: true },
    });
    if (!doc || doc.type !== "PDF" || !doc.pdfUrl) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let upstream: URL;
    try {
        upstream = new URL(doc.pdfUrl);
    } catch {
        return NextResponse.json({ error: "Invalid source" }, { status: 502 });
    }
    if (upstream.protocol !== "https:" || !upstream.hostname.endsWith(".cloudinary.com")) {
        return NextResponse.json({ error: "Untrusted source" }, { status: 502 });
    }

    const upstreamRes = await fetch(upstream.toString(), { cache: "no-store" });
    if (!upstreamRes.ok || !upstreamRes.body) {
        return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }

    const download = req.nextUrl.searchParams.get("download") === "1";
    const safeName = doc.titleEs.replace(/[^\w\s.-]/g, "_").slice(0, 80) || "documento";
    const disposition = `${download ? "attachment" : "inline"}; filename="${safeName}.pdf"`;

    return new NextResponse(upstreamRes.body, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": disposition,
            "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
