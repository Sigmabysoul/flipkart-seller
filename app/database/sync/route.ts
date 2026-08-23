import { NextResponse } from "next/server";
import { syncStoreFromDiskFiles, saveStoreToDisk, store } from "@/lib/serverStore";

export async function POST() {
  try {
    const result = syncStoreFromDiskFiles();
    return NextResponse.json({
      status: "ok",
      message: "Synced with VS Code data files (sku-rules.json, products.json, db.json).",
      result,
    });
  } catch (error: any) {
    console.error("[Database Sync Error]:", error);
    return NextResponse.json(
      { error: "Failed to sync disk files", detail: error?.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    saveStoreToDisk(store);
    return NextResponse.json({
      status: "ok",
      products_count: store.products.length,
      sku_mappings_count: store.skuMappings.length,
      pattern_rules_count: store.patternRules.length,
      batches_count: store.batches.length,
      shipments_count: store.shipments.length,
      workers_count: store.workers.length,
      categories_count: store.categories.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get database stats", detail: error?.message },
      { status: 500 }
    );
  }
}
