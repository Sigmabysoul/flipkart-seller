import fs from 'fs';
import path from 'path';

export interface Worker {
  id: number;
  name: string;
  active: boolean;
  phone?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  internal_code?: string | null;
  category?: string | null;
  assigned_worker: string;
  sort_group?: string | null;
  sort_order: number;
  active: boolean;
  notes?: string | null;
  bag_family?: 'Star' | 'Averx' | 'Plain' | null;
  raw_3bag_qty?: number;
  raw_2bag_qty?: number;
  created_at: string;
  updated_at: string;
}

export interface SKUMapping {
  id: number;
  raw_sku: string;
  product_id: number;
  match_type: 'exact' | 'pattern' | 'auto';
  worker_override?: string | null;
  active: boolean;
  times_seen: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface PackingRecipe {
  id: number;
  product_id: number;
  bag_family: 'Star' | 'Averx' | 'Plain';
  raw_3bag_qty: number;
  raw_2bag_qty: number;
}

export interface PatternRule {
  id: number;
  rule_type: 'starts_with' | 'contains' | 'ends_with' | 'regex';
  value: string;
  product_id?: number | null;
  suggested_worker?: string | null;
  priority: number;
  active: boolean;
}

export interface TrainingHistoryItem {
  id: number;
  raw_sku: string;
  old_product_name?: string | null;
  new_product_name: string;
  old_worker?: string | null;
  new_worker: string;
  action: 'Created Mapping' | 'Changed Mapping' | 'Removed Mapping' | 'Worker Override';
  created_at: string;
}

export interface PrintEvent {
  id: number;
  batch_id?: number;
  awb_count: number;
  printed_by: string;
  print_type: 'full_batch' | 'selected' | 'reprint';
  created_at: string;
}

export interface LabelItem {
  id: number;
  shipment_id?: number;
  raw_sku: string;
  product_id?: number | null;
  product?: string | null;
  description?: string | null;
  quantity: number;
  assigned_worker?: string | null;
  mapping_status: 'mapped' | 'unknown' | 'override';
}

export interface Shipment {
  id: number;
  awb: string;
  order_id?: string | null;
  first_batch_id: number;
  processing_date: string;
  counted: boolean;
  print_count: number;
  first_seen_at: string;
  last_seen_at: string;
  last_printed_at?: string | null;
  source_page?: number | null;
  mismatch_status: 'none' | 'mismatch' | 'resolved';
  items: LabelItem[];
  customer_name?: string;
  customer_city?: string;
  payment_mode?: 'COD' | 'PREPAID';
}

export interface BatchItem {
  id: number;
  filename: string;
  processing_date: string;
  created_at: string;
  total_pages: number;
  unique_awbs: number;
  duplicate_awbs: number;
  total_items: number;
  unknown_skus: number;
  status: 'draft' | 'needs_review' | 'confirmed' | 'cancelled';
  raw_json?: string | null;
  labels?: ParsedLabel[];
}

export interface ParsedLabel {
  page: number;
  original_page?: number;
  sequence?: number;
  group_page?: number;
  group_total?: number;
  sku_group?: string;
  sku_group_index?: number;
  awb: string;
  order_id: string;
  duplicate: boolean;
  mismatch: boolean;
  existing_items_desc?: string;
  payment_mode?: 'COD' | 'PREPAID';
  customer_name?: string;
  customer_city?: string;
  items: {
    raw_sku: string;
    product_id: number | null;
    product: string | null;
    description: string | null;
    quantity: number;
    assigned_worker: string | null;
    mapping_status: 'mapped' | 'unknown' | 'override';
  }[];
}

export type LabelSortMode = 'sku_grouped' | 'worker_sku' | 'category_sku' | 'original_page' | 'awb_order';

// Natural sorting helper: sorts strings with embedded numbers naturally (e.g. SE-3B, SE-6B, SE-12B)
export function naturalSortCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Universal real-time server-side label sorting engine
// Groups labels by SKU and assigns sequential page numbers for each group as well as global sequence
export function sortParsedLabels(labels: ParsedLabel[], mode: LabelSortMode = 'sku_grouped'): ParsedLabel[] {
  const cloned: ParsedLabel[] = labels.map((l, idx) => ({
    ...l,
    original_page: l.original_page || l.page || idx + 1,
    items: l.items.map((it) => ({
      ...it,
      assigned_worker: it.assigned_worker || 'Sohel',
    })),
  }));

  switch (mode) {
    case 'sku_grouped': {
      // Group identical primary SKUs together consecutively (e.g. all SE-3B on 1..4, AX6 on 5..8, R1 on 9..11)
      cloned.sort((a, b) => {
        const skuA = (a.items[0]?.product || a.items[0]?.raw_sku || 'Unmapped').toUpperCase();
        const skuB = (b.items[0]?.product || b.items[0]?.raw_sku || 'Unmapped').toUpperCase();
        const skuDiff = naturalSortCompare(skuA, skuB);
        if (skuDiff !== 0) return skuDiff;

        // Same SKU: keep original relative sequence
        return (a.original_page || 0) - (b.original_page || 0);
      });
      break;
    }

    case 'worker_sku': {
      // Group by single worker (Sohel -> Kartik Da), then by SKU within worker
      const workerRank: Record<string, number> = { Sohel: 1, 'Kartik Da': 2 };
      cloned.sort((a, b) => {
        const workerA = a.items[0]?.assigned_worker || 'Sohel';
        const workerB = b.items[0]?.assigned_worker || 'Sohel';

        const rankA = workerRank[workerA] || 99;
        const rankB = workerRank[workerB] || 99;
        if (rankA !== rankB) return rankA - rankB;

        const skuA = (a.items[0]?.product || a.items[0]?.raw_sku || 'Unmapped').toUpperCase();
        const skuB = (b.items[0]?.product || b.items[0]?.raw_sku || 'Unmapped').toUpperCase();
        const skuDiff = naturalSortCompare(skuA, skuB);
        if (skuDiff !== 0) return skuDiff;

        return (a.original_page || 0) - (b.original_page || 0);
      });
      break;
    }

    case 'category_sku': {
      cloned.sort((a, b) => {
        const prodA = a.items[0]?.product_id ? global.__flipkart_store?.products.find((p) => p.id === a.items[0]?.product_id) : null;
        const prodB = b.items[0]?.product_id ? global.__flipkart_store?.products.find((p) => p.id === b.items[0]?.product_id) : null;
        const catA = (prodA?.category || 'General').toUpperCase();
        const catB = (prodB?.category || 'General').toUpperCase();
        const catDiff = naturalSortCompare(catA, catB);
        if (catDiff !== 0) return catDiff;

        const skuA = (a.items[0]?.product || a.items[0]?.raw_sku || 'Unmapped').toUpperCase();
        const skuB = (b.items[0]?.product || b.items[0]?.raw_sku || 'Unmapped').toUpperCase();
        return naturalSortCompare(skuA, skuB);
      });
      break;
    }

    case 'original_page': {
      // Raw order from the uploaded PDF
      cloned.sort((a, b) => (a.original_page || a.page || 0) - (b.original_page || b.page || 0));
      break;
    }

    case 'awb_order': {
      cloned.sort((a, b) => naturalSortCompare(a.awb, b.awb));
      break;
    }
  }

  // Calculate SKU group totals for sequential group numbering
  const groupTotals: Record<string, number> = {};
  const groupIndexes: Record<string, number> = {};
  let currentGroupOrder = 0;

  for (const item of cloned) {
    const groupKey = item.items[0]?.product || item.items[0]?.raw_sku || 'Unmapped';
    groupTotals[groupKey] = (groupTotals[groupKey] || 0) + 1;
    if (groupIndexes[groupKey] === undefined) {
      currentGroupOrder += 1;
      groupIndexes[groupKey] = currentGroupOrder;
    }
  }

  const groupCurrentCounter: Record<string, number> = {};

  // Re-assign sequence, global page, and within-group sequential page numbers
  return cloned.map((item, idx) => {
    const groupKey = item.items[0]?.product || item.items[0]?.raw_sku || 'Unmapped';
    groupCurrentCounter[groupKey] = (groupCurrentCounter[groupKey] || 0) + 1;

    return {
      ...item,
      page: mode === 'original_page' ? (item.original_page || idx + 1) : idx + 1,
      sequence: idx + 1,
      group_page: groupCurrentCounter[groupKey],
      group_total: groupTotals[groupKey] || 1,
      sku_group: groupKey,
      sku_group_index: groupIndexes[groupKey] || 1,
    };
  });
}

// PackCalc calculation logic
export function calculatePackMaterials(
  family: string,
  quantity: number,
  recipe?: { raw_3bag_qty?: number; raw_2bag_qty?: number }
): { "3-Bag": number; "2-Bag": number } {
  if (quantity <= 0) return { "3-Bag": 0, "2-Bag": 0 };

  if (recipe && (recipe.raw_3bag_qty || recipe.raw_2bag_qty)) {
    return {
      "3-Bag": (recipe.raw_3bag_qty || 0) * quantity,
      "2-Bag": (recipe.raw_2bag_qty || 0) * quantity,
    };
  }

  const fam = family.toLowerCase();
  if (fam === "averx") {
    let threeBags = Math.floor(quantity / 14);
    const remainder = quantity % 14;
    const twoBags = remainder === 1 || remainder === 2 ? 1 : 0;
    if (remainder > 2) {
      threeBags += 1;
    }
    return { "3-Bag": threeBags, "2-Bag": twoBags };
  } else if (fam === "star") {
    return { "3-Bag": quantity * 4, "2-Bag": 0 };
  } else if (fam === "plain") {
    return { "3-Bag": quantity * 2, "2-Bag": quantity };
  }

  return { "3-Bag": quantity * 3, "2-Bag": quantity };
}

// Global In-Memory Store
export interface StoreData {
  workers: Worker[];
  categories: Category[];
  products: Product[];
  skuMappings: SKUMapping[];
  packingRecipes: PackingRecipe[];
  patternRules: PatternRule[];
  trainingHistory: TrainingHistoryItem[];
  printEvents: PrintEvent[];
  batches: BatchItem[];
  shipments: Shipment[];
  nextId: {
    worker: number;
    category: number;
    product: number;
    mapping: number;
    recipe: number;
    rule: number;
    history: number;
    print: number;
    batch: number;
    shipment: number;
    item: number;
  };
}

declare global {
  var __flipkart_store: StoreData | undefined;
}

export function initStore(): StoreData {
  if (global.__flipkart_store) return global.__flipkart_store;

  const now = new Date().toISOString();
  const todayStr = now.split("T")[0];

  const workers: Worker[] = [
    { id: 1, name: "Sohel", active: true, phone: "+91 9876543210", created_at: now },
    { id: 2, name: "Kartik Da", active: true, phone: "+91 9876543211", created_at: now },
  ];

  const categories: Category[] = [
    { id: 1, name: "Selfie Stick & Tripod", description: "Camera & phone tripods and selfie sticks" },
    { id: 2, name: "Garbage Bag", description: "Garbage bags and rolls (17x19 & 19x21)" },
    { id: 3, name: "Butter Paper & Container", description: "Butter paper rolls and aluminium containers" },
    { id: 4, name: "Electronics & Audio", description: "Microphones, ring lights & wireless audio" },
    { id: 5, name: "Accessories & Wallets", description: "Clips, leather wallets & case covers" },
  ];

  const products: Product[] = [
    // --- Kartik Da's 4 Types of Products ---
    { id: 10, name: "Butter Paper", internal_code: "BP-ROLL", category: "Butter Paper & Container", assigned_worker: "Kartik Da", sort_group: "Packaging", sort_order: 10, active: true, created_at: now, updated_at: now },
    { id: 11, name: "Aluminium Container", internal_code: "ALU-CONT", category: "Butter Paper & Container", assigned_worker: "Kartik Da", sort_group: "Packaging", sort_order: 20, active: true, created_at: now, updated_at: now },
    { id: 12, name: "Garbage Bag Roll 17x19", internal_code: "GB-ROLL-17X19", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_group: "Garbage Bags", sort_order: 30, active: true, bag_family: "Star", raw_3bag_qty: 4, raw_2bag_qty: 0, created_at: now, updated_at: now },
    { id: 13, name: "Garbage Bag Roll 19x21", internal_code: "GB-ROLL-19X21", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_group: "Garbage Bags", sort_order: 40, active: true, bag_family: "Averx", raw_3bag_qty: 0, raw_2bag_qty: 8, created_at: now, updated_at: now },
    { id: 14, name: "Garbage Bag Standard Pack", internal_code: "GB-STD-PACK", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_group: "Garbage Bags", sort_order: 50, active: true, bag_family: "Plain", raw_3bag_qty: 2, raw_2bag_qty: 1, created_at: now, updated_at: now },

    // --- My Products (Sohel / User's Station) ---
    { id: 1, name: "R1", internal_code: "R1", category: "Selfie Stick & Tripod", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 100, active: true, created_at: now, updated_at: now },
    { id: 2, name: "R1S", internal_code: "R1S", category: "Selfie Stick & Tripod", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 110, active: true, created_at: now, updated_at: now },
    { id: 3, name: "R16S", internal_code: "R16S", category: "Selfie Stick & Tripod", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 120, active: true, created_at: now, updated_at: now },
    { id: 4, name: "R1L", internal_code: "R1L", category: "Selfie Stick & Tripod", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 130, active: true, created_at: now, updated_at: now },
    { id: 5, name: "SE-3B", internal_code: "SE-3B", category: "Selfie Stick & Tripod", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 140, active: true, created_at: now, updated_at: now },
    { id: 6, name: "AX6", internal_code: "AX6", category: "Electronics & Audio", assigned_worker: "Sohel", sort_group: "Audio", sort_order: 150, active: true, created_at: now, updated_at: now },
    { id: 7, name: "AX-10B", internal_code: "AX-10B", category: "Electronics & Audio", assigned_worker: "Sohel", sort_group: "Audio", sort_order: 155, active: true, created_at: now, updated_at: now },
    { id: 8, name: "Ring Flash 10-Inch", internal_code: "RFL-10I", category: "Electronics & Audio", assigned_worker: "Sohel", sort_group: "Lighting", sort_order: 160, active: true, created_at: now, updated_at: now },
    { id: 9, name: "NAFA Clip Microphone", internal_code: "MIC-3.5MM", category: "Electronics & Audio", assigned_worker: "Sohel", sort_group: "Audio", sort_order: 170, active: true, created_at: now, updated_at: now },
    { id: 15, name: "Mobile Holder Clip", internal_code: "TRIP-CLIP", category: "Accessories & Wallets", assigned_worker: "Sohel", sort_group: "Accessories", sort_order: 180, active: true, created_at: now, updated_at: now },
    { id: 16, name: "HideTheory Leather Wallet", internal_code: "HT-WALLET", category: "Accessories & Wallets", assigned_worker: "Sohel", sort_group: "Wallets", sort_order: 190, active: true, created_at: now, updated_at: now },
    { id: 17, name: "AirPods Silicone Case", internal_code: "EBCC-AAPRO", category: "Accessories & Wallets", assigned_worker: "Sohel", sort_group: "Accessories", sort_order: 200, active: true, created_at: now, updated_at: now },
  ];

  const packingRecipes: PackingRecipe[] = [
    { id: 1, product_id: 12, bag_family: "Star", raw_3bag_qty: 4, raw_2bag_qty: 0 },
    { id: 2, product_id: 13, bag_family: "Averx", raw_3bag_qty: 0, raw_2bag_qty: 8 },
    { id: 3, product_id: 14, bag_family: "Plain", raw_3bag_qty: 2, raw_2bag_qty: 1 },
  ];

  const skuMappings: SKUMapping[] = [
    // Kartik Da's mappings
    { id: 1, raw_sku: "BP-ROLL-2026", product_id: 10, match_type: "exact", active: true, times_seen: 14, first_seen_at: now, last_seen_at: now },
    { id: 2, raw_sku: "BUTTERPAPER-100S", product_id: 10, match_type: "exact", active: true, times_seen: 14, first_seen_at: now, last_seen_at: now },
    { id: 3, raw_sku: "ALU-CONT-450ML", product_id: 11, match_type: "exact", active: true, times_seen: 8, first_seen_at: now, last_seen_at: now },
    { id: 4, raw_sku: "ALU-FOIL-750ML", product_id: 11, match_type: "exact", active: true, times_seen: 8, first_seen_at: now, last_seen_at: now },
    { id: 5, raw_sku: "GB-ROLL-17X19-STAR", product_id: 12, match_type: "exact", active: true, times_seen: 12, first_seen_at: now, last_seen_at: now },
    { id: 6, raw_sku: "GB-ROLL-19X21-AVERX", product_id: 13, match_type: "exact", active: true, times_seen: 10, first_seen_at: now, last_seen_at: now },
    { id: 7, raw_sku: "GB-STD-PLAIN-30", product_id: 14, match_type: "exact", active: true, times_seen: 6, first_seen_at: now, last_seen_at: now },

    // My Products mappings (Sohel)
    { id: 8, raw_sku: "7_SEST-NAF2-R1-B-1", product_id: 1, match_type: "exact", active: true, times_seen: 19, first_seen_at: now, last_seen_at: now },
    { id: 9, raw_sku: "7_SEST-NAF4-R1-B-1", product_id: 1, match_type: "exact", active: true, times_seen: 15, first_seen_at: now, last_seen_at: now },
    { id: 10, raw_sku: "7_SEST-NAF2-R1S-B-1", product_id: 2, match_type: "exact", active: true, times_seen: 50, first_seen_at: now, last_seen_at: now },
    { id: 11, raw_sku: "7_SEST-NAF3-R1S-B-1", product_id: 2, match_type: "exact", active: true, times_seen: 12, first_seen_at: now, last_seen_at: now },
    { id: 12, raw_sku: "7_SEST-FKSB1-R16S-B-1", product_id: 3, match_type: "exact", active: true, times_seen: 35, first_seen_at: now, last_seen_at: now },
    { id: 13, raw_sku: "7_SEST-NAF-R1L-B-1", product_id: 4, match_type: "exact", active: true, times_seen: 14, first_seen_at: now, last_seen_at: now },
    { id: 14, raw_sku: "7_SEST-NAF-SE-3B-B-1", product_id: 5, match_type: "exact", active: true, times_seen: 38, first_seen_at: now, last_seen_at: now },
    { id: 15, raw_sku: "SE-3B", product_id: 5, match_type: "exact", active: true, times_seen: 24, first_seen_at: now, last_seen_at: now },
    { id: 16, raw_sku: "AX6-MIC-W-01", product_id: 6, match_type: "exact", active: true, times_seen: 31, first_seen_at: now, last_seen_at: now },
    { id: 17, raw_sku: "AX-10B", product_id: 7, match_type: "exact", active: true, times_seen: 10, first_seen_at: now, last_seen_at: now },
    { id: 18, raw_sku: "7_TRIP-7FT+RFL-10I-BES3-2", product_id: 8, match_type: "exact", active: true, times_seen: 42, first_seen_at: now, last_seen_at: now },
    { id: 19, raw_sku: "7_MIC-NAF-3.5MM-B-1", product_id: 9, match_type: "exact", active: true, times_seen: 28, first_seen_at: now, last_seen_at: now },
    { id: 20, raw_sku: "7_TRIP-CLIP001-NAF-B-1", product_id: 15, match_type: "exact", active: true, times_seen: 16, first_seen_at: now, last_seen_at: now },
    { id: 21, raw_sku: "HT-MLWBR-01", product_id: 16, match_type: "exact", active: true, times_seen: 22, first_seen_at: now, last_seen_at: now },
    { id: 22, raw_sku: "6_EBCC-NAF-AAPRO-NC042", product_id: 17, match_type: "exact", active: true, times_seen: 7, first_seen_at: now, last_seen_at: now },
  ];

  const patternRules: PatternRule[] = [
    { id: 1, rule_type: "starts_with", value: "GB-", product_id: null, suggested_worker: "Kartik Da", priority: 10, active: true },
    { id: 2, rule_type: "starts_with", value: "BP-", product_id: 10, suggested_worker: "Kartik Da", priority: 10, active: true },
    { id: 3, rule_type: "starts_with", value: "ALU-", product_id: 11, suggested_worker: "Kartik Da", priority: 10, active: true },
    { id: 4, rule_type: "contains", value: "17X19", product_id: 12, suggested_worker: "Kartik Da", priority: 15, active: true },
    { id: 5, rule_type: "contains", value: "19X21", product_id: 13, suggested_worker: "Kartik Da", priority: 15, active: true },
    { id: 6, rule_type: "contains", value: "R16S", product_id: 3, suggested_worker: "Sohel", priority: 20, active: true },
    { id: 7, rule_type: "contains", value: "R1S", product_id: 2, suggested_worker: "Sohel", priority: 20, active: true },
    { id: 8, rule_type: "contains", value: "SE-3B", product_id: 5, suggested_worker: "Sohel", priority: 20, active: true },
    { id: 9, rule_type: "contains", value: "AX-10B", product_id: 7, suggested_worker: "Sohel", priority: 20, active: true },
  ];

  const trainingHistory: TrainingHistoryItem[] = [
    { id: 1, raw_sku: "7_TRIP-7FT+RFL-10I-CHI-2", old_product_name: null, new_product_name: "Ring Flash 10-Inch", new_worker: "Sohel", action: "Created Mapping", created_at: now },
    { id: 2, raw_sku: "HT-MLWBR-01", old_product_name: null, new_product_name: "HideTheory Leather Wallet", new_worker: "Sohel", action: "Created Mapping", created_at: now },
    { id: 3, raw_sku: "7_SEST-FKSB1-R16S-B-1", old_product_name: null, new_product_name: "R16S", new_worker: "Sohel", action: "Created Mapping", created_at: now },
  ];

  const printEvents: PrintEvent[] = [
    { id: 1, batch_id: 1, awb_count: 194, printed_by: "Sohel", print_type: "full_batch", created_at: now },
  ];

  // Yesterday date for delta comparisons
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yesterdayStr = yDate.toISOString().split("T")[0];

  const shipments: Shipment[] = [
    // --- Today's Shipments (Aug 22) ---
    // Kartik Da's Shipments:
    {
      id: 1,
      awb: "FMPC6420000001",
      order_id: "OD338407993012613101",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 1,
      mismatch_status: "none",
      customer_name: "Sneha Mukherjee",
      customer_city: "Kolkata, WB",
      payment_mode: "COD",
      items: [{ id: 1, shipment_id: 1, raw_sku: "BP-ROLL-2026", product_id: 10, product: "Butter Paper", description: "Butter Paper Roll (100 Sheets)", quantity: 14, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 2,
      awb: "FMPC6420000002",
      order_id: "OD338407993012613102",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 2,
      mismatch_status: "none",
      customer_name: "Rahul Verma",
      customer_city: "Howrah, WB",
      payment_mode: "PREPAID",
      items: [{ id: 2, shipment_id: 2, raw_sku: "ALU-CONT-450ML", product_id: 11, product: "Aluminium Container", description: "Aluminium Container Foil Pack 450ml", quantity: 8, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 3,
      awb: "FMPC6420000003",
      order_id: "OD338407993012613103",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 3,
      mismatch_status: "none",
      customer_name: "Pooja Banerjee",
      customer_city: "Siliguri, WB",
      payment_mode: "COD",
      items: [{ id: 3, shipment_id: 3, raw_sku: "GB-ROLL-17X19-STAR", product_id: 12, product: "Garbage Bag Roll 17x19", description: "Garbage Bag Roll 17x19 (Star)", quantity: 12, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 4,
      awb: "FMPC6420000004",
      order_id: "OD338407993012613104",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 4,
      mismatch_status: "none",
      customer_name: "Vikram Sen",
      customer_city: "Asansol, WB",
      payment_mode: "PREPAID",
      items: [{ id: 4, shipment_id: 4, raw_sku: "GB-ROLL-19X21-AVERX", product_id: 13, product: "Garbage Bag Roll 19x21", description: "Garbage Bag Roll 19x21 (Averx)", quantity: 10, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 5,
      awb: "FMPC6420000005",
      order_id: "OD338407993012613105",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 5,
      mismatch_status: "none",
      customer_name: "Amit Ghoshal",
      customer_city: "Durgapur, WB",
      payment_mode: "COD",
      items: [{ id: 5, shipment_id: 5, raw_sku: "GB-STD-PLAIN-30", product_id: 14, product: "Garbage Bag Standard Pack", description: "Plain Garbage Bag 30 Pcs Pack", quantity: 6, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },

    // Sohel's Shipments (My Station):
    {
      id: 6,
      awb: "FMPP4226450875",
      order_id: "OD438400537753508100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 6,
      mismatch_status: "none",
      customer_name: "Ambili Nair",
      customer_city: "Kozhikode, KL",
      payment_mode: "PREPAID",
      items: [{ id: 6, shipment_id: 6, raw_sku: "7_SEST-FKSB1-R16S-B-1", product_id: 3, product: "R16S", description: "Flipkart SmartBuy R16S 67-Inch Tripod Stand", quantity: 4, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 7,
      awb: "FMPP4229821661",
      order_id: "OD338407633395385100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 7,
      mismatch_status: "none",
      customer_name: "Sahil Shaikh",
      customer_city: "Nanded, MH",
      payment_mode: "PREPAID",
      items: [{ id: 7, shipment_id: 7, raw_sku: "7_MIC-NAF-3.5MM-B-1", product_id: 9, product: "NAFA Clip Microphone", description: "NAFA 3.5mm Clip For Youtube", quantity: 3, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 8,
      awb: "FMPC6421043959",
      order_id: "OD438410456113316100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 8,
      mismatch_status: "none",
      customer_name: "Sarikhada Ronak",
      customer_city: "Junagadh, GJ",
      payment_mode: "COD",
      items: [{ id: 8, shipment_id: 8, raw_sku: "HT-MLWBR-01", product_id: 16, product: "HideTheory Leather Wallet", description: "HideTheory Men Formal Tan Leather Wallet", quantity: 2, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 9,
      awb: "FMPC6422575292",
      order_id: "OD438407347637916100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 9,
      mismatch_status: "none",
      customer_name: "Ishika Singh",
      customer_city: "Maihar, MP",
      payment_mode: "COD",
      items: [
        { id: 9, shipment_id: 9, raw_sku: "7_SEST-NAF2-R1-B-1", product_id: 1, product: "R1", description: "NAFA Bluetooth Selfie Stick Tripod", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" },
        { id: 10, shipment_id: 9, raw_sku: "7_SEST-NAF2-R1S-B-1", product_id: 2, product: "R1S", description: "NAFA Selfie Stick Tripod with LED Light", quantity: 8, assigned_worker: "Sohel", mapping_status: "mapped" },
      ],
    },
    {
      id: 10,
      awb: "FMPC6423981144",
      order_id: "OD338409123891029100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 10,
      mismatch_status: "none",
      customer_name: "Ramesh Sharma",
      customer_city: "Patna, BR",
      payment_mode: "PREPAID",
      items: [{ id: 11, shipment_id: 10, raw_sku: "7_SEST-NAF-SE-3B-B-1", product_id: 5, product: "SE-3B", description: "NAFA SE-3B Bluetooth Selfie Stick", quantity: 10, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 11,
      awb: "FMPC6424567890",
      order_id: "OD338409988776655100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 11,
      mismatch_status: "none",
      customer_name: "Anjali Gupta",
      customer_city: "Kolkata, WB",
      payment_mode: "COD",
      items: [{ id: 12, shipment_id: 11, raw_sku: "AX6-MIC-W-01", product_id: 6, product: "AX6", description: "AX6 Wireless Lavalier Microphone", quantity: 4, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 12,
      awb: "FMPC6425123456",
      order_id: "OD338411223344556100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 12,
      mismatch_status: "none",
      customer_name: "Pooja Verma",
      customer_city: "Ranchi, JH",
      payment_mode: "PREPAID",
      items: [
        { id: 13, shipment_id: 12, raw_sku: "AX-10B", product_id: 7, product: "AX-10B", description: "AX-10B Professional Audio Interface", quantity: 2, assigned_worker: "Sohel", mapping_status: "mapped" },
        { id: 14, shipment_id: 12, raw_sku: "7_TRIP-7FT+RFL-10I-BES3-2", product_id: 8, product: "Ring Flash 10-Inch", description: "BESTFLY Ring_flash 10 inches", quantity: 3, assigned_worker: "Sohel", mapping_status: "mapped" },
      ],
    },
    {
      id: 13,
      awb: "FMPC6426789012",
      order_id: "OD338412345678901100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 13,
      mismatch_status: "none",
      customer_name: "Sunil Das",
      customer_city: "Guwahati, AS",
      payment_mode: "COD",
      items: [
        { id: 15, shipment_id: 13, raw_sku: "7_TRIP-CLIP001-NAF-B-1", product_id: 15, product: "Mobile Holder Clip", description: "Mobile Holder Clip For Tripod", quantity: 2, assigned_worker: "Sohel", mapping_status: "mapped" },
        { id: 16, shipment_id: 13, raw_sku: "6_EBCC-NAF-AAPRO-NC042", product_id: 17, product: "AirPods Silicone Case", description: "AirPods Pro Silicone Protective Case", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" },
      ],
    },

    // --- Yesterday's Historical Shipments (Aug 21) ---
    {
      id: 14,
      awb: "FMPC6391001122",
      order_id: "OD337401122334455100",
      first_batch_id: 2,
      processing_date: yesterdayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 1,
      mismatch_status: "none",
      customer_name: "Amit Kumar",
      customer_city: "Howrah, WB",
      payment_mode: "COD",
      items: [{ id: 17, shipment_id: 14, raw_sku: "7_SEST-FKSB1-R16S-B-1", product_id: 3, product: "R16S", description: "Flipkart SmartBuy R16S 67-Inch Tripod Stand", quantity: 5, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 15,
      awb: "FMPC6391003344",
      order_id: "OD337401122334455200",
      first_batch_id: 2,
      processing_date: yesterdayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 2,
      mismatch_status: "none",
      customer_name: "Vikram Das",
      customer_city: "Asansol, WB",
      payment_mode: "PREPAID",
      items: [{ id: 18, shipment_id: 15, raw_sku: "GB-ROLL-17X19-STAR", product_id: 12, product: "Garbage Bag Roll 17x19", description: "Garbage Bag Roll 17x19 (Star)", quantity: 8, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 16,
      awb: "FMPC6391005566",
      order_id: "OD337401122334455300",
      first_batch_id: 2,
      processing_date: yesterdayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 3,
      mismatch_status: "none",
      customer_name: "Sneha Roy",
      customer_city: "Siliguri, WB",
      payment_mode: "COD",
      items: [{ id: 19, shipment_id: 16, raw_sku: "7_TRIP-7FT+RFL-10I-BES3-2", product_id: 8, product: "Ring Flash 10-Inch", description: "BESTFLY Ring_flash 10 inches", quantity: 3, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 17,
      awb: "FMPC6391007788",
      order_id: "OD337401122334455400",
      first_batch_id: 2,
      processing_date: yesterdayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 4,
      mismatch_status: "none",
      customer_name: "Karan Singh",
      customer_city: "Durgapur, WB",
      payment_mode: "PREPAID",
      items: [{ id: 20, shipment_id: 17, raw_sku: "GB-ROLL-19X21-AVERX", product_id: 13, product: "Garbage Bag Roll 19x21", description: "Garbage Bag Roll 19x21 (Averx)", quantity: 6, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
  ];

  const batches: BatchItem[] = [
    {
      id: 1,
      filename: "flipkart_dispatch_today.pdf",
      processing_date: todayStr,
      created_at: now,
      total_pages: 13,
      unique_awbs: 13,
      duplicate_awbs: 1,
      total_items: 80,
      unknown_skus: 0,
      status: "confirmed",
    },
    {
      id: 2,
      filename: "flipkart_dispatch_yesterday.pdf",
      processing_date: yesterdayStr,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      total_pages: 4,
      unique_awbs: 4,
      duplicate_awbs: 0,
      total_items: 22,
      unknown_skus: 0,
      status: "confirmed",
    },
  ];

  const defaultStoreData = {
    workers,
    categories,
    products,
    skuMappings,
    packingRecipes,
    patternRules,
    trainingHistory,
    printEvents,
    batches,
    shipments,
    nextId: {
      worker: 3,
      category: 8,
      product: 14,
      mapping: 18,
      recipe: 4,
      rule: 5,
      history: 4,
      print: 2,
      batch: 2,
      shipment: 9,
      item: 11,
    },
  };

  // Try to load from disk if available
  const diskData = loadStoreFromDisk();
  if (diskData) {
    global.__flipkart_store = diskData;
  } else {
    global.__flipkart_store = defaultStoreData;
  }

  return global.__flipkart_store!;
}

export const store: StoreData = initStore();

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SKU_RULES_FILE = path.join(DATA_DIR, 'sku-rules.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

export function saveStoreToDisk(currentStore: StoreData = store): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Save master DB file
    fs.writeFileSync(DB_FILE, JSON.stringify(currentStore, null, 2), 'utf-8');

    // Also sync human-readable sku-rules.json for easy VS Code editing
    const humanSkuRules = {
      _comment: "Direct SKU Training & Mapping Rules for Flipkart Label Manager. You can edit this file directly in VS Code!",
      description: "Edit or add SKU mappings and pattern rules below. Save this file and click 'Sync with VS Code Disk Files' or make an API request.",
      sku_mappings: currentStore.skuMappings.map((m) => {
        const prod = currentStore.products.find((p) => p.id === m.product_id);
        return {
          raw_sku: m.raw_sku,
          product_name: prod ? prod.name : `Product #${m.product_id}`,
          assigned_worker: m.worker_override || (prod ? prod.assigned_worker : 'Sohel'),
          match_type: m.match_type || 'exact',
        };
      }),
      pattern_rules: currentStore.patternRules.map((r) => {
        const prod = r.product_id ? currentStore.products.find((p) => p.id === r.product_id) : null;
        return {
          rule_type: r.rule_type,
          value: r.value,
          product_name: prod ? prod.name : null,
          suggested_worker: r.suggested_worker || null,
          priority: r.priority || 10,
        };
      }),
    };
    fs.writeFileSync(SKU_RULES_FILE, JSON.stringify(humanSkuRules, null, 2), 'utf-8');

    // Also sync products.json for easy product catalog and recipe editing
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(currentStore.products, null, 2), 'utf-8');

    return true;
  } catch (err) {
    console.error('[ServerStore] Failed to save store to disk:', err);
    return false;
  }
}

export function loadStoreFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.skuMappings)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[ServerStore] Error loading db.json from disk:', err);
  }
  return null;
}

// Clears all test batches, label shipments, and print history while KEEPING all training data, SKU mappings, pattern rules, products, categories, and workers
export function clearLabelAndBatchData() {
  const currentStore = store;
  const deletedBatchesCount = currentStore.batches.length;
  const deletedShipmentsCount = currentStore.shipments.length;
  const deletedPrintsCount = currentStore.printEvents.length;

  currentStore.batches = [];
  currentStore.shipments = [];
  currentStore.printEvents = [];
  currentStore.nextId.batch = 1;
  currentStore.nextId.shipment = 1;
  currentStore.nextId.item = 1;
  currentStore.nextId.print = 1;

  saveStoreToDisk(currentStore);

  return {
    success: true,
    deleted_batches: deletedBatchesCount,
    deleted_shipments: deletedShipmentsCount,
    deleted_prints: deletedPrintsCount,
    preserved_products: currentStore.products.length,
    preserved_sku_mappings: currentStore.skuMappings.length,
    preserved_pattern_rules: currentStore.patternRules.length,
    preserved_workers: currentStore.workers.length,
    preserved_categories: currentStore.categories.length,
  };
}

// Resets store back to initial seed data
export function resetStoreToDefault() {
  global.__flipkart_store = undefined;
  if (fs.existsSync(DB_FILE)) {
    try {
      fs.unlinkSync(DB_FILE);
    } catch {}
  }
  const fresh = initStore();
  saveStoreToDisk(fresh);
  return {
    success: true,
    message: "Store reset to initial factory seed data.",
  };
}

// Syncs store when human edits sku-rules.json or products.json in VS Code
export function syncStoreFromDiskFiles() {
  const currentStore = store;
  let skuUpdated = false;
  let productsUpdated = false;

  // 1. Check products.json
  if (fs.existsSync(PRODUCTS_FILE)) {
    try {
      const rawProducts = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsedProducts = JSON.parse(rawProducts);
      if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
        currentStore.products = parsedProducts;
        productsUpdated = true;
      }
    } catch (e) {
      console.error('[ServerStore] Failed to parse products.json:', e);
    }
  }

  // 2. Check sku-rules.json
  if (fs.existsSync(SKU_RULES_FILE)) {
    try {
      const rawSku = fs.readFileSync(SKU_RULES_FILE, 'utf-8');
      const parsedSku = JSON.parse(rawSku);
      const now = new Date().toISOString();

      if (parsedSku && Array.isArray(parsedSku.sku_mappings)) {
        const newMappings: SKUMapping[] = [];
        let mappingId = 1;

        for (const item of parsedSku.sku_mappings) {
          if (!item.raw_sku) continue;
          
          // Match product by name or ID
          let prod = currentStore.products.find(
            (p) => p.name.toLowerCase() === (item.product_name || '').toLowerCase()
          );
          if (!prod && item.product_id) {
            prod = currentStore.products.find((p) => p.id === item.product_id);
          }
          if (!prod && currentStore.products.length > 0) {
            prod = currentStore.products[0];
          }

          if (prod) {
            newMappings.push({
              id: mappingId++,
              raw_sku: item.raw_sku,
              product_id: prod.id,
              match_type: item.match_type || 'exact',
              worker_override: item.assigned_worker && item.assigned_worker !== prod.assigned_worker ? item.assigned_worker : null,
              active: true,
              times_seen: 1,
              first_seen_at: now,
              last_seen_at: now,
            });
          }
        }

        if (newMappings.length > 0) {
          currentStore.skuMappings = newMappings;
          currentStore.nextId.mapping = mappingId;
          skuUpdated = true;
        }
      }

      // Sync pattern rules if present
      if (parsedSku && Array.isArray(parsedSku.pattern_rules)) {
        const newRules: PatternRule[] = [];
        let ruleId = 1;

        for (const r of parsedSku.pattern_rules) {
          if (!r.value) continue;
          const prod = r.product_name
            ? currentStore.products.find((p) => p.name.toLowerCase() === r.product_name.toLowerCase())
            : null;

          newRules.push({
            id: ruleId++,
            rule_type: r.rule_type || 'contains',
            value: r.value,
            product_id: prod ? prod.id : null,
            suggested_worker: r.suggested_worker || null,
            priority: r.priority || 10,
            active: true,
          });
        }

        if (newRules.length > 0) {
          currentStore.patternRules = newRules;
          currentStore.nextId.rule = ruleId;
        }
      }
    } catch (e) {
      console.error('[ServerStore] Failed to parse sku-rules.json:', e);
    }
  }

  saveStoreToDisk(currentStore);

  return {
    success: true,
    skuUpdated,
    productsUpdated,
    totalProducts: currentStore.products.length,
    totalSkuMappings: currentStore.skuMappings.length,
    totalPatternRules: currentStore.patternRules.length,
  };
}

