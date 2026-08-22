import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  if (!q) {
    return NextResponse.json(store.shipments.slice(0, 50));
  }

  const results = store.shipments.filter((s) => {
    if (s.awb.toLowerCase().includes(q)) return true;
    if (s.order_id?.toLowerCase().includes(q)) return true;
    if (s.customer_name?.toLowerCase().includes(q)) return true;
    if (s.customer_city?.toLowerCase().includes(q)) return true;
    for (const item of s.items) {
      if (item.raw_sku.toLowerCase().includes(q)) return true;
      if (item.product?.toLowerCase().includes(q)) return true;
      if (item.assigned_worker?.toLowerCase().includes(q)) return true;
      if (item.description?.toLowerCase().includes(q)) return true;
    }
    return false;
  });

  return NextResponse.json(results);
}
