import { NextResponse } from "next/server";
import { saveStoreToDisk, store } from "@/lib/serverStore";

function authorized(req: Request) {
  const token = process.env.PRINT_AGENT_TOKEN;
  return !token || req.headers.get("authorization") === `Bearer ${token}`;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ detail: "Unauthorized printer agent" }, { status: 401 });
  try {
    const { id } = await params;
    const job = store.printJobs.find((candidate) => candidate.id === Number(id));
    if (!job) return NextResponse.json({ detail: "Print job not found" }, { status: 404 });
    const body = await req.json();
    const action = String(body.action || "");
    const now = new Date().toISOString();

    if (action === "claim") {
      if (job.status !== "queued" && job.status !== "failed") return NextResponse.json({ detail: `Cannot claim from ${job.status}` }, { status: 409 });
      job.status = "claimed"; job.agent_id = String(body.agent_id || "warehouse-printer");
      job.printer_name = body.printer_name || job.printer_name || null; job.claimed_at = now;
      job.attempts += 1; job.error_message = null;
    } else if (action === "complete") {
      if (job.status === "printed") return NextResponse.json({ status: "printed", job, message: "Already completed" });
      if (!["claimed", "opened"].includes(job.status)) return NextResponse.json({ detail: `Cannot complete from ${job.status}` }, { status: 409 });
      const batch = store.batches.find((candidate) => candidate.id === job.batch_id);
      if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
      let count = 0;
      for (const label of batch.labels || []) {
        const shipment = store.shipments.find((candidate) => (candidate.marketplace || "flipkart") === job.marketplace && candidate.awb === label.awb);
        if (shipment) { shipment.print_count = (shipment.print_count || 0) + 1; shipment.last_printed_at = now; count += 1; }
      }
      store.printEvents.unshift({
        id: store.nextId.print++, batch_id: batch.id, awb_count: count || job.label_count,
        printed_by: job.agent_id || job.requested_by, print_type: job.print_type, created_at: now,
      });
      job.status = "printed"; job.completed_at = now;
    } else if (action === "fail") {
      if (["printed", "cancelled"].includes(job.status)) return NextResponse.json({ detail: `Cannot fail from ${job.status}` }, { status: 409 });
      job.status = "failed"; job.error_message = String(body.error_message || "Printer agent reported a failure"); job.completed_at = now;
    } else if (action === "cancel") {
      if (job.status === "printed") return NextResponse.json({ detail: "Printed jobs cannot be cancelled" }, { status: 409 });
      job.status = "cancelled"; job.completed_at = now;
    } else return NextResponse.json({ detail: "Action must be claim, complete, fail, or cancel" }, { status: 400 });

    saveStoreToDisk(store);
    return NextResponse.json({ status: job.status, job, pdf_url: `/batches/${job.batch_id}/pdf?sort=${job.sort_mode}` });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Print job update failed" }, { status: 500 });
  }
}
