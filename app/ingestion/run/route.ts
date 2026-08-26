import { NextResponse } from "next/server";
import { MARKETPLACES, Marketplace } from "@/lib/serverStore";
import { runDueIngestion } from "@/lib/ingestionRunner";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const requested = body.marketplace ? String(body.marketplace).toLowerCase() as Marketplace : null;
    if (requested && !MARKETPLACES.includes(requested)) {
      return NextResponse.json({ detail: "Unsupported marketplace" }, { status: 400 });
    }

    return NextResponse.json(await runDueIngestion({ requested, force: Boolean(body.force), trigger: "manual" }));
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Unable to run scheduled ingestion" }, { status: 500 });
  }
}
