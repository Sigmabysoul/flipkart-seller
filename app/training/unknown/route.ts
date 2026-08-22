import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

function getSuggestion(sku: string, description: string, products: typeof store.products) {
  const combinedText = `${sku} ${description}`.toLowerCase();
  const tokens = (combinedText.match(/[a-z0-9]+/gi) || [])
    .map((x) => x.toLowerCase())
    .filter((x) => x.length > 1);

  let best: { product_id: number; product: string; confidence: number; matched_terms: string[]; worker: string; category: string } | null = null;

  for (const product of products) {
    const pTerms = [
      product.name.toLowerCase(),
      product.internal_code?.toLowerCase() || "",
      product.category?.toLowerCase() || "",
    ].filter(Boolean);

    const matched: string[] = [];

    // Check specific high-signal keywords
    if (combinedText.includes("tripod") && product.name.toLowerCase().includes("tripod")) matched.push("tripod");
    if (combinedText.includes("r16s") && product.name.toLowerCase().includes("r16s")) matched.push("r16s");
    if (combinedText.includes("r1s") && product.name.toLowerCase().includes("r1s")) matched.push("r1s");
    if (combinedText.includes("r1") && !combinedText.includes("r1s") && !combinedText.includes("r16s") && product.name.toLowerCase() === "r1") matched.push("r1");
    if (combinedText.includes("r1l") && product.name.toLowerCase().includes("r1l")) matched.push("r1l");
    if (combinedText.includes("ring_flash") || combinedText.includes("ring flash") || combinedText.includes("10 inch") || combinedText.includes("10-inch")) {
      if (product.name.toLowerCase().includes("ring flash")) matched.push("ring flash");
    }
    if (combinedText.includes("clip") && (combinedText.includes("mic") || combinedText.includes("microphone") || combinedText.includes("youtube"))) {
      if (product.name.toLowerCase().includes("mic")) matched.push("microphone");
    }
    if (combinedText.includes("holder") || combinedText.includes("clip") || combinedText.includes("clamp")) {
      if (product.name.toLowerCase().includes("holder") || product.name.toLowerCase().includes("clip")) matched.push("holder clip");
    }
    if (combinedText.includes("leather") || combinedText.includes("wallet") || combinedText.includes("hidetheory")) {
      if (product.name.toLowerCase().includes("wallet")) matched.push("wallet");
    }
    if (combinedText.includes("airpods") || combinedText.includes("case") || combinedText.includes("silicone")) {
      if (product.name.toLowerCase().includes("airpods") || product.name.toLowerCase().includes("case")) matched.push("airpods case");
    }
    if (combinedText.includes("garbage") || combinedText.includes("bag") || combinedText.includes("star")) {
      if (product.name.toLowerCase().includes("garbage") && product.name.toLowerCase().includes("star")) matched.push("star garbage bag");
    }
    if (combinedText.includes("averx")) {
      if (product.name.toLowerCase().includes("averx")) matched.push("averx");
    }
    if (combinedText.includes("butter paper") || combinedText.includes("paper")) {
      if (product.name.toLowerCase().includes("butter paper")) matched.push("butter paper");
    }

    if (matched.length > 0) {
      const confidence = Math.min(0.95, 0.65 + matched.length * 0.15);
      if (!best || confidence > best.confidence) {
        best = {
          product_id: product.id,
          product: product.name,
          confidence: Number(confidence.toFixed(2)),
          matched_terms: matched,
          worker: product.assigned_worker,
          category: product.category || "General",
        };
      }
    }
  }

  return best;
}

export async function GET() {
  const activeProducts = store.products.filter((p) => p.active);
  const mappedSkus = new Set(store.skuMappings.filter((m) => m.active).map((m) => m.raw_sku));

  // Default known unmapped sample SKUs if not yet mapped
  const candidateUnknowns: { raw_sku: string; description: string; seen: number }[] = [
    { raw_sku: "7_TRIP-7FT+RFL-10I-BES3-2-COMBO", description: "BESTFLY 10-Inch Ring Light with 7ft Extendable Tripod", seen: 14 },
    { raw_sku: "7_SEST-NAF-R1SL-B-1", description: "NAFA SnapX Max Glow 170cm Selfie Stick with LED Light", seen: 8 },
    { raw_sku: "9_MIB-USB-NAF-M5-1", description: "NAFA Power Sharing USB Charger Cable 0.15m", seen: 6 },
    { raw_sku: "GB-PLAIN-5-ROLL-NEW", description: "Plain Eco Clean Garbage Bag Roll 5 Gallon", seen: 12 },
  ];

  // Also collect any unknown items from recent batches
  for (const b of store.batches) {
    if (b.labels) {
      for (const l of b.labels) {
        for (const it of l.items) {
          if (it.mapping_status === "unknown" && !mappedSkus.has(it.raw_sku)) {
            const existing = candidateUnknowns.find((c) => c.raw_sku === it.raw_sku);
            if (existing) {
              existing.seen += it.quantity;
            } else {
              candidateUnknowns.push({
                raw_sku: it.raw_sku,
                description: it.description || it.raw_sku,
                seen: it.quantity,
              });
            }
          }
        }
      }
    }
  }

  const unmapped = candidateUnknowns.filter((c) => !mappedSkus.has(c.raw_sku));

  const result = unmapped.map((u) => ({
    raw_sku: u.raw_sku,
    description: u.description,
    seen: u.seen,
    suggestion: getSuggestion(u.raw_sku, u.description, activeProducts),
  }));

  return NextResponse.json(result);
}
