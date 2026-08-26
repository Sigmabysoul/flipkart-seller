import { NextResponse } from "next/server";
import { MARKETPLACES, saveStoreToDisk, store } from "@/lib/serverStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const storageWritable = saveStoreToDisk(store);
  const marketplaces = Object.fromEntries(MARKETPLACES.map((marketplace) => {
    const prefix = marketplace.toUpperCase();
    const feed = Boolean(process.env[`${prefix}_LABEL_FEED_URL`]);
    const token = Boolean(process.env[`${prefix}_LABEL_FEED_TOKEN`]);
    const schedule = store.ingestionSchedules.find((item) => item.marketplace === marketplace);
    const completedRun = store.ingestionRuns.find((run) => run.marketplace === marketplace && run.status === "completed");
    return [marketplace, {
      feed_configured: feed,
      token_configured: token,
      schedule_configured: Boolean(schedule),
      schedule_enabled: Boolean(schedule?.enabled),
      scheduled_time: schedule?.time || null,
      last_completed_at: completedRun?.finished_at || null,
      ready: feed && Boolean(schedule?.enabled) && Boolean(completedRun),
    }];
  }));
  const checks = {
    persistent_storage: { ready: storageWritable, detail: storageWritable ? "Database file is writable." : "Database directory is not writable." },
    scheduler: { ready: Boolean(process.env.CRON_SECRET), detail: process.env.CRON_SECRET ? "Protected five-minute cron is configured." : "Set CRON_SECRET." },
    ingestion_webhook: { ready: Boolean(process.env.INGESTION_WEBHOOK_SECRET), detail: process.env.INGESTION_WEBHOOK_SECRET ? "Authenticated webhook intake is configured." : "Set INGESTION_WEBHOOK_SECRET." },
    printer_agent: { ready: Boolean(process.env.PRINT_AGENT_TOKEN), detail: process.env.PRINT_AGENT_TOKEN ? "Printer-agent authentication is configured." : "Set PRINT_AGENT_TOKEN for unattended printing; browser printing remains available." },
  };
  const marketplaceReady = Object.values(marketplaces).every((value: any) => value.ready);
  const infrastructureReady = Object.values(checks).every((value) => value.ready);
  const blockers = [
    ...Object.entries(checks).filter(([, value]) => !value.ready).map(([key, value]) => ({ key, detail: value.detail })),
    ...Object.entries(marketplaces).filter(([, value]: any) => !value.ready).map(([key, value]: any) => ({
      key: `${key}_feed`,
      detail: !value.feed_configured ? `Configure the ${key} label feed.` : `Run and verify one successful ${key} scheduled intake.`,
    })),
  ];
  return NextResponse.json({
    status: infrastructureReady && marketplaceReady ? "ready" : "action_required",
    checked_at: new Date().toISOString(), checks, marketplaces, blockers,
    workflow: {
      parsers: MARKETPLACES, crop_and_sort: true, product_calculation: true,
      marketplace_sections: true, inventory_ledger: true, print_queue: true, daily_dashboard: true,
    },
  });
}
