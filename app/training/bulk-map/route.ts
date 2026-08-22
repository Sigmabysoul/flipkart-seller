import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { raw_skus, product_id, optional_worker_override } = body;

    if (!Array.isArray(raw_skus) || raw_skus.length === 0 || !product_id) {
      return NextResponse.json({ detail: "raw_skus array and product_id are required" }, { status: 400 });
    }

    const product = store.products.find((p) => p.id === Number(product_id));
    if (!product) {
      return NextResponse.json({ detail: "Product not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const raw_sku of raw_skus) {
      const existing = store.skuMappings.find((m) => m.raw_sku === raw_sku && m.active);
      if (existing) {
        existing.product_id = product.id;
        existing.worker_override = optional_worker_override || null;
        existing.last_seen_at = now;
      } else {
        store.skuMappings.push({
          id: store.nextId.mapping++,
          raw_sku,
          product_id: product.id,
          match_type: "exact",
          worker_override: optional_worker_override || null,
          active: true,
          times_seen: 1,
          first_seen_at: now,
          last_seen_at: now,
        });
      }

      store.trainingHistory.unshift({
        id: store.nextId.history++,
        raw_sku,
        old_product_name: null,
        new_product_name: product.name,
        new_worker: optional_worker_override || product.assigned_worker,
        action: "Created Mapping",
        created_at: now,
      });

      updatedCount++;
    }

    return NextResponse.json({
      status: "bulk_mapped",
      count: updatedCount,
      product_name: product.name,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
