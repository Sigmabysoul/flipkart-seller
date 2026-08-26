import type { Marketplace, ParsedLabel } from "./serverStore";

type PatternSet = {
  awb: RegExp[];
  order: RegExp[];
  sku: RegExp[];
  quantity: RegExp[];
};

export type ParserDiagnostic = {
  marketplace: Marketplace;
  pages_read: number;
  labels_found: number;
  missing_awb_pages: number[];
  missing_order_pages: number[];
  missing_sku_pages: number[];
  warnings: string[];
};

const token = "([A-Z0-9][A-Z0-9_.+\\/-]{2,49})";
const patterns: Record<Marketplace, PatternSet> = {
  flipkart: {
    awb: [/(?:AWB|Tracking ID|Tracking No)\s*[:#-]?\s*((?:FMPC|FMPP|FMPL)\d{8,14})/i, /\b((?:FMPC|FMPP|FMPL)\d{8,14})\b/i],
    order: [/(?:Order ID|Order No)\s*[:#-]?\s*(OD\d{14,22})/i, /\b(OD\d{14,22})\b/i],
    sku: [new RegExp(`(?:SKU|Seller SKU|Item Code|FSN)\\s*[:#-]?\\s*${token}`, "ig")],
    quantity: [/(?:Qty|Quantity)\s*[:x-]?\s*(\d{1,4})/i],
  },
  meesho: {
    awb: [/(?:AWB|Tracking ID|Tracking No)\s*[:#-]?\s*([A-Z0-9-]{8,30})/i],
    order: [/(?:Order ID|Order No|Sub Order No)\s*[:#-]?\s*([A-Z0-9-]{6,30})/i],
    sku: [new RegExp(`(?:SKU|Supplier SKU|Catalog ID|Product ID)\\s*[:#-]?\\s*${token}`, "ig")],
    quantity: [/(?:Qty|Quantity)\s*[:x-]?\s*(\d{1,4})/i],
  },
  myntra: {
    awb: [/(?:AWB|Tracking ID|Tracking No)\s*[:#-]?\s*([A-Z0-9-]{8,30})/i],
    order: [/(?:Order ID|Order No|Packet ID)\s*[:#-]?\s*([A-Z0-9-]{6,30})/i],
    sku: [new RegExp(`(?:Seller SKU|SKU|Style ID|Article No)\\s*[:#-]?\\s*${token}`, "ig")],
    quantity: [/(?:Qty|Quantity|Pieces)\s*[:x-]?\s*(\d{1,4})/i],
  },
  amazon: {
    awb: [/(?:Tracking ID|Tracking #|AWB)\s*[:#-]?\s*([A-Z0-9-]{8,30})/i],
    order: [/(?:Order ID|Order #)\s*[:#-]?\s*(\d{3}-\d{7}-\d{7})/i, /\b(\d{3}-\d{7}-\d{7})\b/],
    sku: [new RegExp(`(?:Merchant SKU|Seller SKU|SKU|ASIN)\\s*[:#-]?\\s*${token}`, "ig")],
    quantity: [/(?:Qty|Quantity)\s*[:x-]?\s*(\d{1,4})/i],
  },
  snapdeal: {
    awb: [/(?:AWB|Tracking ID|Tracking No)\s*[:#-]?\s*([A-Z0-9-]{8,30})/i],
    order: [/(?:Order ID|Order No|Suborder ID)\s*[:#-]?\s*([A-Z0-9-]{6,30})/i],
    sku: [new RegExp(`(?:Seller SKU|SKU|SUPC|Item Code)\\s*[:#-]?\\s*${token}`, "ig")],
    quantity: [/(?:Qty|Quantity)\s*[:x-]?\s*(\d{1,4})/i],
  },
};

function firstMatch(text: string, candidates: RegExp[]) {
  for (const regex of candidates) {
    regex.lastIndex = 0;
    const match = regex.exec(text);
    if (match?.[1]) return match[1].trim().toUpperCase();
  }
  return null;
}

function allMatches(text: string, candidates: RegExp[]) {
  const values = new Set<string>();
  for (const regex of candidates) {
    const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
    const globalRegex = new RegExp(regex.source, flags);
    for (const match of text.matchAll(globalRegex)) {
      if (match[1]) values.add(match[1].trim().toUpperCase());
    }
  }
  return [...values];
}

function labeledValue(text: string, names: string[]) {
  const label = names.join("|");
  const match = new RegExp(`(?:${label})\\s*[:#-]?\\s*([^\\n\\r]{2,80})`, "i").exec(text);
  return match?.[1]?.trim() || undefined;
}

export function parseMarketplacePages(
  marketplace: Marketplace,
  pages: { num: number; text: string }[],
  sourceDocument: number,
): { labels: ParsedLabel[]; diagnostic: ParserDiagnostic } {
  const config = patterns[marketplace];
  const diagnostic: ParserDiagnostic = {
    marketplace, pages_read: pages.length, labels_found: 0,
    missing_awb_pages: [], missing_order_pages: [], missing_sku_pages: [], warnings: [],
  };
  const labels: ParsedLabel[] = [];

  for (const page of pages) {
    const text = page.text.replace(/\u0000/g, " ");
    if (!text.trim()) {
      diagnostic.missing_awb_pages.push(page.num);
      continue;
    }
    const awb = firstMatch(text, config.awb);
    if (!awb) {
      diagnostic.missing_awb_pages.push(page.num);
      continue;
    }
    const orderId = firstMatch(text, config.order);
    if (!orderId) diagnostic.missing_order_pages.push(page.num);
    const skus = allMatches(text, config.sku);
    if (!skus.length) diagnostic.missing_sku_pages.push(page.num);
    const quantity = Math.max(1, Number(firstMatch(text, config.quantity)) || 1);
    const customerName = labeledValue(text, ["Ship To", "Customer Name", "Deliver To"]);
    const customerCity = labeledValue(text, ["City", "Destination", "Ship City"]);
    const isCod = /\b(COD|Cash on Delivery|Collect Cash)\b/i.test(text);

    labels.push({
      page: page.num, original_page: page.num, source_document: sourceDocument,
      awb, order_id: orderId || `UNKNOWN-${marketplace.toUpperCase()}-${sourceDocument + 1}-${page.num}`,
      duplicate: false, mismatch: false, payment_mode: isCod ? "COD" : "PREPAID",
      customer_name: customerName, customer_city: customerCity,
      items: (skus.length ? skus : [`UNMAPPED-${marketplace.toUpperCase()}-PAGE-${page.num}`]).map((rawSku) => ({
        raw_sku: rawSku, product_id: null, product: null,
        description: `${marketplace.charAt(0).toUpperCase() + marketplace.slice(1)} order item ${rawSku}`,
        quantity, assigned_worker: null, mapping_status: "unknown",
      })),
    });
  }

  diagnostic.labels_found = labels.length;
  if (diagnostic.missing_awb_pages.length) diagnostic.warnings.push(`${diagnostic.missing_awb_pages.length} pages did not contain a recognized AWB.`);
  if (diagnostic.missing_order_pages.length) diagnostic.warnings.push(`${diagnostic.missing_order_pages.length} labels used an internal fallback order ID.`);
  if (diagnostic.missing_sku_pages.length) diagnostic.warnings.push(`${diagnostic.missing_sku_pages.length} labels require SKU training.`);
  return { labels, diagnostic };
}
