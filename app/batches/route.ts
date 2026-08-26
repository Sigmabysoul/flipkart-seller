import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const marketplace = searchParams.get("marketplace");

  let list = [...store.batches];

  if (date) {
    list = list.filter((b) => b.processing_date === date);
  }

  if (status && status !== "all") {
    list = list.filter((b) => b.status === status);
  }
  if (marketplace && marketplace !== "all") {
    list = list.filter((batch) => (batch.marketplace || "flipkart") === marketplace);
  }

  return NextResponse.json({
    total: list.length,
    batches: list.map((batch) => {
      const latestPrintJob = store.printJobs.find((job) => job.batch_id === batch.id);
      const { source_pdfs_base64: _pdf, raw_json: _raw, ...safeBatch } = batch;
      return {
        ...safeBatch,
        marketplace: batch.marketplace || "flipkart",
        intake_source: batch.intake_source || "manual",
        print_status: latestPrintJob?.status || "not_queued",
        print_job_id: latestPrintJob?.id || null,
      };
    }),
  });
}
