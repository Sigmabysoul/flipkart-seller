import { NextResponse } from "next/server";
import { store, saveStoreToDisk } from "@/lib/serverStore";

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
        const existingShipment = store.shipments.find(
          (s) => (s.marketplace || "flipkart") === (batch.marketplace || "flipkart") && s.awb === lbl.awb,
        );

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
            marketplace: batch.marketplace || "flipkart",
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

          for (const item of items) {
            if (!item.product_id) continue;
            const product = store.products.find((candidate) => candidate.id === item.product_id);
            if (!product) continue;
            const current = Number(product.current_stock) || 0;
            product.current_stock = current - item.quantity;
            product.updated_at = now;
            store.inventoryMovements.unshift({
              id: store.nextId.inventoryMovement++, product_id: product.id, type: "stock_out",
              quantity: -item.quantity, balance_after: product.current_stock, batch_id: batch.id,
              note: `${batch.marketplace || "flipkart"} batch #${batch.id} · ${lbl.awb}`,
              created_by: "Batch confirmation", created_at: now,
            });
          }
        }
      }
    }

    batch.status = "confirmed";
    saveStoreToDisk(store);
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
