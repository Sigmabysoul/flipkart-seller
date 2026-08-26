import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const jobs = status && status !== "all" ? store.printJobs.filter((job) => job.status === status) : store.printJobs;
  return NextResponse.json({
    total: jobs.length,
    jobs: jobs.slice(0, 250).map((job) => ({ ...job, pdf_url: `/batches/${job.batch_id}/pdf?sort=${job.sort_mode}` })),
  });
}
