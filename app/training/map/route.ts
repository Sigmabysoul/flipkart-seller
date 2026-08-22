import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { raw_sku, product_id, optional_worker_override, replace } = body;

    if (!raw_sku || !product_id) {
      return NextResponse.json({ detail: "raw_sku and product_id are required" }, { status: 400 });
    }

    const product = store.products.find((p) => p.id === Number(product_id));
    if (!product) {
      return NextResponse.json({ detail: "Product not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const existing = store.skuMappings.find((m) => m.raw_sku === raw_sku && m.active);

    if (existing && existing.product_id !== product.id && !replace) {
      const oldProd = store.products.find((p) => p.id === existing.product_id);
      return NextResponse.json({
        status: "conflict",
        existing_product_id: existing.product_id,
        existing_product_name: oldProd ? oldProd.name : `Product #${existing.product_id}`,
        mapping_id: existing.id,
      });
    }

    let mappingId = 0;
    if (existing) {
      const oldProd = store.products.find((p) => p.id === existing.product_id);
      existing.product_id = product.id;
      existing.worker_override = optional_worker_override || null;
      existing.last_seen_at = now;
      mappingId = existing.id;

      store.trainingHistory.unshift({
        id: store.nextId.history++,
        raw_sku,
        old_product_name: oldProd?.name || null,
        new_product_name: product.name,
        new_worker: optional_worker_override || product.assigned_worker,
        action: "Changed Mapping",
        created_at: now,
      });
    } else {
      const newMapping = {
        id: store.nextId.mapping++,
        raw_sku,
        product_id: product.id,
        match_type: "exact" as const,
        worker_override: optional_worker_override || null,
        active: true,
        times_seen: 1,
        first_seen_at: now,
        last_seen_at: now,
      };
      store.skuMappings.push(newMapping);
      mappingId = newMapping.id;

      store.trainingHistory.unshift({
        id: store.nextId.history++,
        raw_sku,
        old_product_name: null,
        new_product_name: product.name,
        new_worker: optional_worker_override || product.assigned_worker,
        action: "Created Mapping",
        created_at: now,
      });
    }

    // Update in all in-memory batches/shipments
    for (const batch of store.batches) {
      if (batch.labels) {
        for (const label of batch.labels) {
          for (const item of label.items) {
            if (item.raw_sku === raw_sku) {
              item.product_id = product.id;
              item.product = product.name;
              item.assigned_worker = optional_worker_override || product.assigned_worker;
              item.mapping_status = optional_worker_override ? "override" : "mapped";
            }
          }
        }
      }
    }

    for (const s of store.shipments) {
      for (const item of s.items) {
        if (item.raw_sku === raw_sku) {
          item.product_id = product.id;
          item.product = product.name;
          item.assigned_worker = optional_worker_override || product.assigned_worker;
          item.mapping_status = optional_worker_override ? "override" : "mapped";
        }
      }
    }

    return NextResponse.json({
      status: "mapped",
      mapping_id: mappingId,
      product_id: product.id,
      product_name: product.name,
      assigned_worker: optional_worker_override || product.assigned_worker,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
