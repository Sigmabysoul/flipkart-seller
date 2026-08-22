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
}

export interface Worker {
  id: number;
  name: string;
  active: boolean;
}

export interface SKUMapping {
  id: number;
  raw_sku: string;
  product_id: number;
  match_type: string;
  worker_override?: string | null;
  active: boolean;
  times_seen: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface PackingRecipe {
  id: number;
  product_id: number;
  bag_family: string;
  raw_3bag_qty: number;
  raw_2bag_qty: number;
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
  status: string;
  raw_json?: string | null;
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
  mismatch_status: string;
  items: LabelItem[];
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
  mapping_status: string;
}

export function calculatePackMaterials(family: string, quantity: number): { "3-Bag": number; "2-Bag": number } {
  if (quantity <= 0) {
    return { "3-Bag": 0, "2-Bag": 0 };
  }
  if (family.toLowerCase() === "averx") {
    let threeBags = Math.floor(quantity / 14);
    const remainder = quantity % 14;
    const twoBags = remainder === 1 || remainder === 2 ? 1 : 0;
    if (remainder > 2) {
      threeBags += 1;
    }
    return { "3-Bag": threeBags, "2-Bag": twoBags };
  }
  return { "3-Bag": quantity * 4, "2-Bag": quantity };
}

// Global In-Memory Store (persisted across dev reloads)
declare global {
  var __flipkart_store: {
    products: Product[];
    workers: Worker[];
    skuMappings: SKUMapping[];
    packingRecipes: PackingRecipe[];
    batches: BatchItem[];
    shipments: Shipment[];
    nextId: {
      product: number;
      mapping: number;
      batch: number;
      shipment: number;
      item: number;
    };
  } | undefined;
}

function initStore() {
  if (global.__flipkart_store) return global.__flipkart_store;

  const products: Product[] = [
    { id: 1, name: "R1", internal_code: "R1", category: "Tripod", assigned_worker: "Sohel", sort_order: 10, active: true },
    { id: 2, name: "R1S", internal_code: "R1S", category: "Tripod", assigned_worker: "Sohel", sort_order: 20, active: true },
    { id: 3, name: "R16S", internal_code: "R16S", category: "Tripod", assigned_worker: "Sohel", sort_order: 30, active: true },
    { id: 4, name: "Butter Paper", internal_code: "BP", category: "Packaging", assigned_worker: "Kartik Da", sort_order: 40, active: true },
    { id: 5, name: "Star Garbage Bag 12", internal_code: "GB-STAR-12", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_order: 50, active: true },
    { id: 6, name: "Averx Garbage Bag 16", internal_code: "GB-AVERX-16", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_order: 60, active: true },
    { id: 7, name: "Plain Garbage Bag 5", internal_code: "GB-PLAIN-5", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_order: 70, active: true },
  ];

  const workers: Worker[] = [
    { id: 1, name: "Sohel", active: true },
    { id: 2, name: "Kartik Da", active: true },
  ];

  const packingRecipes: PackingRecipe[] = [
    { id: 1, product_id: 5, bag_family: "Star", raw_3bag_qty: 4, raw_2bag_qty: 0 },
    { id: 2, product_id: 6, bag_family: "Averx", raw_3bag_qty: 0, raw_2bag_qty: 8 },
    { id: 3, product_id: 7, bag_family: "Plain", raw_3bag_qty: 2, raw_2bag_qty: 0 },
  ];

  const skuMappings: SKUMapping[] = [
    { id: 1, raw_sku: "7_SEST-NAF2-R1S-NEW-B-7", product_id: 2, match_type: "exact", active: true, times_seen: 18, first_seen_at: new Date().toISOString(), last_seen_at: new Date().toISOString() },
    { id: 2, raw_sku: "GB-STAR-12-NEW-X", product_id: 5, match_type: "exact", active: true, times_seen: 11, first_seen_at: new Date().toISOString(), last_seen_at: new Date().toISOString() },
    { id: 3, raw_sku: "BP-ROLL-2026-A", product_id: 4, match_type: "exact", active: true, times_seen: 7, first_seen_at: new Date().toISOString(), last_seen_at: new Date().toISOString() },
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  const shipments: Shipment[] = [
    {
      id: 1,
      awb: "FMPC6419809470",
      order_id: "OD338407993012613100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      source_page: 1,
      mismatch_status: "none",
      items: [{ id: 1, shipment_id: 1, raw_sku: "R1S", product_id: 2, product: "R1S", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 2,
      awb: "FMPC6419809521",
      order_id: "OD338407993012613101",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      source_page: 2,
      mismatch_status: "none",
      items: [{ id: 2, shipment_id: 2, raw_sku: "GB-STAR-12", product_id: 5, product: "Star Garbage Bag 12", quantity: 2, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 3,
      awb: "FMPC6419809802",
      order_id: "OD338407993012613132",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      source_page: 44,
      mismatch_status: "none",
      items: [{ id: 3, shipment_id: 3, raw_sku: "R16S", product_id: 3, product: "R16S", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
  ];

  const batches: BatchItem[] = [
    {
      id: 1,
      filename: "flipkart_labels_04.pdf",
      processing_date: todayStr,
      created_at: new Date().toISOString(),
      total_pages: 206,
      unique_awbs: 194,
      duplicate_awbs: 12,
      total_items: 221,
      unknown_skus: 2,
      status: "confirmed",
    },
    {
      id: 2,
      filename: "morning_dispatch.pdf",
      processing_date: todayStr,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      total_pages: 84,
      unique_awbs: 81,
      duplicate_awbs: 3,
      total_items: 93,
      unknown_skus: 0,
      status: "confirmed",
    },
  ];

  global.__flipkart_store = {
    products,
    workers,
    skuMappings,
    packingRecipes,
    batches,
    shipments,
    nextId: {
      product: 8,
      mapping: 4,
      batch: 3,
      shipment: 4,
      item: 4,
    },
  };

  return global.__flipkart_store;
}

export const store = initStore();
