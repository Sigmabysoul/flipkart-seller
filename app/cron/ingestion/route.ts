import { NextResponse } from "next/server";
import { runDueIngestion } from "@/lib/ingestionRunner";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ detail: "CRON_SECRET is not configured" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ detail: "Unauthorized scheduler" }, { status: 401 });
  }
  try {
    return NextResponse.json(await runDueIngestion({ force: false, trigger: "scheduled" }));
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Scheduled ingestion failed" }, { status: 500 });
  }
}
