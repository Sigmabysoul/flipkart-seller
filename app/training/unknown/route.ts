import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

function getSuggestion(description: string, products: typeof store.products) {
  const tokens = (description.match(/[a-z0-9]+/gi) || [])
    .map((x) => x.toLowerCase())
    .filter((x) => x.length > 2);

  let best: { product_id: number; product: string; confidence: number; matched_terms: string[] } | null = null;

  for (const product of products) {
    const haystack = `${product.name} ${product.internal_code || ""}`.toLowerCase();
    const matched = Array.from(new Set(tokens.filter((t) => haystack.includes(t)))).sort();
    const score = matched.length / Math.max(tokens.length, 1);
    if (matched.length > 0 && (!best || score > best.confidence)) {
      best = {
        product_id: product.id,
        product: product.name,
        confidence: Number(Math.min(score, 0.99).toFixed(2)),
        matched_terms: matched,
      };
    }
  }
  return best;
}

export async function GET() {
  const sampleUnknown = [
    { raw_sku: "7_SEST-NAF2-R1S-NEW-B-7", description: "NAFA 70cm Selfie Stick Tripod", seen: 18 },
    { raw_sku: "GB-STAR-12-NEW-X", description: "Star Garbage Bag 12 Piece", seen: 11 },
    { raw_sku: "BP-ROLL-2026-A", description: "Butter paper packaging roll", seen: 7 },
  ];

  const activeProducts = store.products.filter((p) => p.active);

  const result = sampleUnknown.map((r) => ({
    raw_sku: r.raw_sku,
    description: r.description,
    seen: r.seen,
    suggestion: getSuggestion(r.description, activeProducts),
  }));

  return NextResponse.json(result);
}
