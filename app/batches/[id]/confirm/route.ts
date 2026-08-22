import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const batchId = parseInt(id);
    const batch = store.batches.find((b) => b.id === batchId);
    if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });

    if (batch.status === "confirmed") {
      return NextResponse.json({ status: "confirmed", batch_id: batch.id, message: "Already confirmed (idempotent)" });
    }

    const now = new Date().toISOString();
    const todayStr = batch.processing_date || now.split("T")[0];

    if (batch.labels && Array.isArray(batch.labels)) {
      for (const lbl of batch.labels) {
        const existingShipment = store.shipments.find((s) => s.awb === lbl.awb);

        if (existingShipment) {
          // It's a duplicate occurrence: update print count and last seen, but do NOT double-count stockout
          existingShipment.last_seen_at = now;
          if (lbl.mismatch) {
            existingShipment.mismatch_status = "mismatch";
          }
        } else {
          // New unique shipment to record
          const shipmentId = store.nextId.shipment++;
          const items = lbl.items.map((i) => ({
            id: store.nextId.item++,
            shipment_id: shipmentId,
            raw_sku: i.raw_sku,
            product_id: i.product_id,
            product: i.product,
            description: i.description,
            quantity: i.quantity,
            assigned_worker: i.assigned_worker,
            mapping_status: i.mapping_status,
          }));

          store.shipments.push({
            id: shipmentId,
            awb: lbl.awb,
            order_id: lbl.order_id,
            first_batch_id: batch.id,
            processing_date: todayStr,
            counted: true,
            print_count: 1,
            first_seen_at: now,
            last_seen_at: now,
            last_printed_at: null,
            source_page: lbl.page,
            mismatch_status: lbl.mismatch ? "mismatch" : "none",
            customer_name: lbl.customer_name,
            customer_city: lbl.customer_city,
            payment_mode: lbl.payment_mode,
            items,
          });
        }
      }
    }

    batch.status = "confirmed";
    return NextResponse.json({
      status: "confirmed",
      batch_id: batch.id,
      unique_added: batch.unique_awbs,
      total_items: batch.total_items,
      message: "Batch confirmed successfully. Shipments and stock-out accounting updated.",
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
