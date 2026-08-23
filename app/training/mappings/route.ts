import { NextResponse } from "next/server";
import { store, saveStoreToDisk } from "@/lib/serverStore";

export async function GET() {
  try {
    const mappings = store.skuMappings
      .filter((m) => m.active)
      .map((m) => {
        const prod = store.products.find((p) => p.id === m.product_id);
        return {
          id: m.id,
          raw_sku: m.raw_sku,
          product_id: m.product_id,
          product_name: prod ? prod.name : "Unknown",
          category: prod?.category || "General",
          assigned_worker: m.worker_override || prod?.assigned_worker || "Sohel",
          worker_override: m.worker_override,
          match_type: m.match_type,
          times_seen: m.times_seen || 1,
          first_seen_at: m.first_seen_at,
          last_seen_at: m.last_seen_at,
        };
      });

    return NextResponse.json(mappings);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const raw_sku = searchParams.get("raw_sku");

    let target = store.skuMappings.find((m) => m.id === id);
    if (!target && raw_sku) {
      target = store.skuMappings.find((m) => m.raw_sku === raw_sku && m.active);
    }

    if (!target) {
      return NextResponse.json({ detail: "Mapping not found" }, { status: 404 });
    }

    target.active = false;

    const prod = store.products.find((p) => p.id === target.product_id);
    store.trainingHistory.unshift({
      id: store.nextId.history++,
      raw_sku: target.raw_sku,
      old_product_name: prod?.name || null,
      new_product_name: "Unmapped",
      new_worker: "None",
      action: "Removed Mapping",
      created_at: new Date().toISOString(),
    });

    saveStoreToDisk();

    return NextResponse.json({ status: "success", message: `Mapping for ${target.raw_sku} removed` });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
