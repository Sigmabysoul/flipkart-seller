import { NextResponse } from "next/server";
import { MARKETPLACES, Marketplace, saveStoreToDisk, store } from "@/lib/serverStore";

const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET() {
  const schedules = store.ingestionSchedules.map((schedule) => ({
    ...schedule,
    connection_status: process.env[`${schedule.marketplace.toUpperCase()}_LABEL_FEED_URL`] ? "configured" : "not_configured",
  }));
  return NextResponse.json({
    schedules,
    runs: store.ingestionRuns.slice(0, 25),
    scheduler: { configured: Boolean(process.env.CRON_SECRET), interval_minutes: 5, endpoint: "/cron/ingestion" },
  });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const marketplace = String(body.marketplace || "").toLowerCase() as Marketplace;
    if (!MARKETPLACES.includes(marketplace)) {
      return NextResponse.json({ detail: "Unsupported marketplace" }, { status: 400 });
    }
    if (body.time !== undefined && !validTime.test(String(body.time))) {
      return NextResponse.json({ detail: "Time must use HH:mm format" }, { status: 400 });
    }

    const schedule = store.ingestionSchedules.find((item) => item.marketplace === marketplace);
    if (!schedule) return NextResponse.json({ detail: "Schedule not found" }, { status: 404 });

    if (body.enabled !== undefined) schedule.enabled = Boolean(body.enabled);
    if (body.time !== undefined) schedule.time = String(body.time);
    if (body.days !== undefined) {
      if (!Array.isArray(body.days) || body.days.some((day: unknown) => !Number.isInteger(day) || Number(day) < 0 || Number(day) > 6)) {
        return NextResponse.json({ detail: "Days must contain weekday numbers from 0 to 6" }, { status: 400 });
      }
      schedule.days = [...new Set<number>((body.days as unknown[]).map((day) => Number(day)))].sort((a, b) => a - b);
    }
    schedule.updated_at = new Date().toISOString();
    saveStoreToDisk(store);
    return NextResponse.json(schedule);
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Unable to update schedule" }, { status: 500 });
  }
}
