import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET() {
  const mappedCount = store.skuMappings.filter((m) => m.active).length;
  const mappedSkus = new Set(store.skuMappings.filter((m) => m.active).map((m) => m.raw_sku));

  const candidateUnknowns = new Set([
    "7_TRIP-7FT+RFL-10I-BES3-2-COMBO",
    "7_SEST-NAF-R1SL-B-1",
    "9_MIB-USB-NAF-M5-1",
    "GB-PLAIN-5-ROLL-NEW",
  ]);

  for (const b of store.batches) {
    if (b.labels) {
      for (const l of b.labels) {
        for (const it of l.items) {
          if (it.mapping_status === "unknown") {
            candidateUnknowns.add(it.raw_sku);
          }
        }
      }
    }
  }

  let unknownCount = 0;
  for (const sku of candidateUnknowns) {
    if (!mappedSkus.has(sku)) {
      unknownCount++;
    }
  }

  const total = mappedCount + unknownCount;
  const rate = total > 0 ? Number(((mappedCount / total) * 100).toFixed(1)) : 100;

  return NextResponse.json({
    total_unique_skus_seen: total,
    mapped_skus: mappedCount,
    unknown_skus: unknownCount,
    recognition_percentage: rate,
  });
}
