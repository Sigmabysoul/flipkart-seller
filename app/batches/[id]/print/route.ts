import { NextResponse } from "next/server";
import { LabelSortMode, saveStoreToDisk, store } from "@/lib/serverStore";

const sortModes: LabelSortMode[] = ["sku_grouped", "worker_sku", "category_sku", "original_page", "awb_order"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const batch = store.batches.find((b) => b.id === Number(id));
    if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
    if (!batch.source_pdfs_base64?.length) return NextResponse.json({ detail: "Original PDF is unavailable" }, { status: 409 });

    const body = await req.json().catch(() => ({}));
    const sortMode = sortModes.includes(body.sort_mode) ? body.sort_mode as LabelSortMode : "sku_grouped";
    const deliveryMode = body.delivery_mode === "browser" ? "browser" : "queue";
    const now = new Date().toISOString();
    const job = {
      id: store.nextId.printJob++, batch_id: batch.id, marketplace: batch.marketplace || "flipkart",
      status: (deliveryMode === "browser" ? "opened" : "queued") as "opened" | "queued",
      sort_mode: sortMode, print_type: (body.print_type || "full_batch") as "full_batch" | "selected" | "reprint",
      requested_by: String(body.printed_by || "Operator"), printer_name: body.printer_name || null,
      agent_id: null, attempts: 0, label_count: batch.unique_awbs, error_message: null,
      created_at: now, claimed_at: null, completed_at: null,
    };
    store.printJobs.unshift(job);
    saveStoreToDisk(store);
    return NextResponse.json({
      status: job.status, job, pdf_url: `/batches/${batch.id}/pdf?sort=${sortMode}`,
      message: deliveryMode === "browser" ? "Printable PDF opened; completion awaits confirmation." : "Print job added to queue.",
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
