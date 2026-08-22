import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function POST(req: Request) {
  const body = await req.json();
  const { raw_sku, product_id, optional_worker_override, replace } = body;

  const product = store.products.find((p) => p.id === product_id);
  if (!product) {
    return NextResponse.json({ detail: "Product not found" }, { status: 404 });
  }

  let existing = store.skuMappings.find((m) => m.raw_sku === raw_sku);
  if (existing && existing.product_id !== product_id && !replace) {
    return NextResponse.json({
      status: "conflict",
      existing_product_id: existing.product_id,
      mapping_id: existing.id,
    });
  }

  if (existing) {
    existing.product_id = product_id;
    existing.worker_override = optional_worker_override || null;
    existing.last_seen_at = new Date().toISOString();
    return NextResponse.json({ status: "mapped", mapping_id: existing.id, product_id });
  }

  const newMapping = {
    id: store.nextId.mapping++,
    raw_sku,
    product_id,
    match_type: "exact",
    worker_override: optional_worker_override || null,
    active: true,
    times_seen: 1,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };

  store.skuMappings.push(newMapping);
  return NextResponse.json({ status: "mapped", mapping_id: newMapping.id, product_id });
}
