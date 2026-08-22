import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET() {
  const total = store.skuMappings.length + 12; // 12 unknown
  const mapped = store.skuMappings.filter((m) => m.active).length;
  const unknown = 12;

  return NextResponse.json({
    total_unique_skus_seen: total,
    mapped_skus: mapped,
    unknown_skus: unknown,
    recognition_percentage: total ? Number(((mapped / total) * 100).toFixed(1)) : 0,
  });
}
