import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const batchId = parseInt(id);
    const batch = store.batches.find((b) => b.id === batchId);
    if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const printedBy = body.printed_by || "Operator";
    const printType = body.print_type || "full_batch";
    const now = new Date().toISOString();

    // Increment print_count on shipments in this batch
    let count = 0;
    if (batch.labels) {
      for (const label of batch.labels) {
        const shipment = store.shipments.find((s) => s.awb === label.awb);
        if (shipment) {
          shipment.print_count = (shipment.print_count || 0) + 1;
          shipment.last_printed_at = now;
          count++;
        }
      }
    }

    const printEvent = {
      id: store.nextId.print++,
      batch_id: batchId,
      awb_count: count || batch.total_pages,
      printed_by: printedBy,
      print_type: printType,
      created_at: now,
    };

    store.printEvents.unshift(printEvent);

    return NextResponse.json({
      status: "logged",
      event: printEvent,
      message: `Print event recorded. Total ${printEvent.awb_count} labels sent to print.`,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
