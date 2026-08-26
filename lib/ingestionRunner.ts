import { processMarketplacePdfs } from "./batchProcessor";
import { IngestionRun, Marketplace, saveStoreToDisk, store } from "./serverStore";

function clockIn(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[values.weekday], time: `${values.hour}:${values.minute}` };
}

function dateIn(timeZone: string, date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

async function readFeed(marketplace: Marketplace, feedUrl: string, token?: string) {
  const response = await fetch(feedUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Marketplace feed returned HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) {
    return [{
      name: response.headers.get("x-filename") || `${marketplace}-${Date.now()}.pdf`,
      buffer: Buffer.from(await response.arrayBuffer()),
    }];
  }
  const payload = await response.json();
  return (payload.files || []).map((file: any) => ({
    name: String(file.name || `${marketplace}.pdf`),
    buffer: Buffer.from(String(file.base64), "base64"),
  }));
}

export async function runDueIngestion(options: {
  requested?: Marketplace | null;
  force?: boolean;
  now?: Date;
  trigger?: 'manual' | 'scheduled';
} = {}) {
  const nowDate = options.now || new Date();
  const force = Boolean(options.force);
  const schedules = store.ingestionSchedules.filter((schedule) =>
    schedule.enabled && (!options.requested || schedule.marketplace === options.requested)
  );
  const created: IngestionRun[] = [];

  for (const schedule of schedules) {
    const clock = clockIn(schedule.timezone, nowDate);
    const today = dateIn(schedule.timezone, nowDate);
    const priorRuns = store.ingestionRuns.filter((run) => run.schedule_id === schedule.id);
    const completedToday = priorRuns.some((run) => run.status === "completed" && dateIn(schedule.timezone, new Date(run.started_at)) === today);
    const configurationCheckedToday = priorRuns.some((run) => run.status === "requires_configuration" && dateIn(schedule.timezone, new Date(run.started_at)) === today);
    const latestAttempt = priorRuns[0];
    const cooldownPassed = !latestAttempt || nowDate.getTime() - new Date(latestAttempt.started_at).getTime() >= 15 * 60 * 1000;
    const due = schedule.days.includes(clock.day) && schedule.time <= clock.time;
    const shouldRun = force || (due && !completedToday && !configurationCheckedToday && cooldownPassed);
    const now = nowDate.toISOString();
    const run: IngestionRun = {
      id: store.nextId.ingestionRun++, schedule_id: schedule.id, marketplace: schedule.marketplace,
      trigger: options.trigger || (force ? "manual" : "scheduled"), status: "not_due",
      files_received: 0, labels_received: 0, started_at: now, finished_at: now, batch_id: null,
      message: completedToday ? "Today’s scheduled intake already completed." : `Scheduled for ${schedule.time} ${schedule.timezone}.`,
    };

    if (shouldRun) {
      const prefix = schedule.marketplace.toUpperCase();
      const feedUrl = process.env[`${prefix}_LABEL_FEED_URL`];
      const token = process.env[`${prefix}_LABEL_FEED_TOKEN`];
      if (!feedUrl) {
        run.status = "requires_configuration";
        run.message = `Set ${prefix}_LABEL_FEED_URL to activate automatic ${schedule.marketplace} intake.`;
      } else {
        run.status = "running";
        run.finished_at = null;
        try {
          const files = await readFeed(schedule.marketplace, feedUrl, token);
          if (!files.length) throw new Error("Marketplace feed returned no PDF files");
          const processed = await processMarketplacePdfs({ marketplace: schedule.marketplace, files, source: "scheduled" });
          run.status = "completed";
          run.files_received = files.length;
          run.labels_received = processed.batch.unique_awbs;
          run.batch_id = processed.batch.id;
          run.message = `Created batch #${processed.batch.id} with ${processed.batch.unique_awbs} unique labels.`;
        } catch (error: any) {
          run.status = "failed";
          run.message = error?.message || "Marketplace feed failed";
        } finally {
          run.finished_at = new Date().toISOString();
        }
      }
      schedule.last_run_at = now;
      schedule.connection_status = feedUrl ? "configured" : "not_configured";
    }
    store.ingestionRuns.unshift(run);
    created.push(run);
  }
  store.ingestionRuns = store.ingestionRuns.slice(0, 250);
  saveStoreToDisk(store);
  return { checked_at: nowDate.toISOString(), runs: created };
}
