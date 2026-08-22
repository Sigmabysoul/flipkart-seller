import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET() {
  return NextResponse.json(store.trainingHistory);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, history_id } = body;

    if (action === "undo" && history_id) {
      const histItem = store.trainingHistory.find((h) => h.id === Number(history_id));
      if (!histItem) return NextResponse.json({ detail: "History record not found" }, { status: 404 });

      // Deactivate or revert mapping
      const mapping = store.skuMappings.find((m) => m.raw_sku === histItem.raw_sku && m.active);
      if (mapping) {
        mapping.active = false;
      }

      store.trainingHistory.unshift({
        id: store.nextId.history++,
        raw_sku: histItem.raw_sku,
        old_product_name: histItem.new_product_name,
        new_product_name: "Unmapped",
        new_worker: "None",
        action: "Removed Mapping",
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({ status: "undone", raw_sku: histItem.raw_sku });
    }

    return NextResponse.json({ detail: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
