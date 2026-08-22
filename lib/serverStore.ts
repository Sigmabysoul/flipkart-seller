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

// Natural sorting helper: sorts strings with embedded numbers naturally (e.g. SE-3B, SE-6B, SE-12B)
export function naturalSortCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
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
declare global {
  var __flipkart_store: {
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
  } | undefined;
}

function initStore() {
  if (global.__flipkart_store) return global.__flipkart_store;

  const now = new Date().toISOString();
  const todayStr = now.split("T")[0];

  const workers: Worker[] = [
    { id: 1, name: "Sohel", active: true, phone: "+91 9876543210", created_at: now },
    { id: 2, name: "Kartik Da", active: true, phone: "+91 9876543211", created_at: now },
  ];

  const categories: Category[] = [
    { id: 1, name: "Tripod", description: "Camera & phone tripods and stands" },
    { id: 2, name: "Selfie Stick", description: "Bluetooth & extending selfie sticks" },
    { id: 3, name: "Garbage Bag", description: "Rolls & packaging garbage bags" },
    { id: 4, name: "Packaging", description: "Butter paper, containers & bubble wrap" },
    { id: 5, name: "Electronics", description: "Microphones, cables & chargers" },
    { id: 6, name: "Accessories", description: "Clips, cases & holders" },
    { id: 7, name: "Wallets", description: "Leather wallets & card holders" },
  ];

  const products: Product[] = [
    { id: 1, name: "R1", internal_code: "R1", category: "Selfie Stick", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 10, active: true, created_at: now, updated_at: now },
    { id: 2, name: "R1S", internal_code: "R1S", category: "Selfie Stick", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 20, active: true, created_at: now, updated_at: now },
    { id: 3, name: "R16S", internal_code: "R16S", category: "Tripod", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 30, active: true, created_at: now, updated_at: now },
    { id: 4, name: "R1L", internal_code: "R1L", category: "Selfie Stick", assigned_worker: "Sohel", sort_group: "Tripods", sort_order: 35, active: true, created_at: now, updated_at: now },
    { id: 5, name: "Ring Flash 10-Inch", internal_code: "RFL-10I", category: "Electronics", assigned_worker: "Sohel", sort_group: "Lighting", sort_order: 40, active: true, created_at: now, updated_at: now },
    { id: 6, name: "NAFA Clip Microphone", internal_code: "MIC-3.5MM", category: "Electronics", assigned_worker: "Sohel", sort_group: "Audio", sort_order: 45, active: true, created_at: now, updated_at: now },
    { id: 7, name: "Mobile Holder Clip", internal_code: "TRIP-CLIP", category: "Accessories", assigned_worker: "Sohel", sort_group: "Accessories", sort_order: 50, active: true, created_at: now, updated_at: now },
    { id: 8, name: "HideTheory Leather Wallet", internal_code: "HT-WALLET", category: "Wallets", assigned_worker: "Sohel", sort_group: "Wallets", sort_order: 55, active: true, created_at: now, updated_at: now },
    { id: 9, name: "AirPods Silicone Case", internal_code: "EBCC-AAPRO", category: "Accessories", assigned_worker: "Sohel", sort_group: "Accessories", sort_order: 60, active: true, created_at: now, updated_at: now },
    { id: 10, name: "Butter Paper", internal_code: "BP", category: "Packaging", assigned_worker: "Kartik Da", sort_group: "Packaging", sort_order: 70, active: true, created_at: now, updated_at: now },
    { id: 11, name: "Star Garbage Bag 12", internal_code: "GB-STAR-12", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_group: "Garbage Bags", sort_order: 80, active: true, bag_family: "Star", raw_3bag_qty: 4, raw_2bag_qty: 0, created_at: now, updated_at: now },
    { id: 12, name: "Averx Garbage Bag 16", internal_code: "GB-AVERX-16", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_group: "Garbage Bags", sort_order: 90, active: true, bag_family: "Averx", raw_3bag_qty: 0, raw_2bag_qty: 8, created_at: now, updated_at: now },
    { id: 13, name: "Plain Garbage Bag 5", internal_code: "GB-PLAIN-5", category: "Garbage Bag", assigned_worker: "Kartik Da", sort_group: "Garbage Bags", sort_order: 100, active: true, bag_family: "Plain", raw_3bag_qty: 2, raw_2bag_qty: 1, created_at: now, updated_at: now },
  ];

  const packingRecipes: PackingRecipe[] = [
    { id: 1, product_id: 11, bag_family: "Star", raw_3bag_qty: 4, raw_2bag_qty: 0 },
    { id: 2, product_id: 12, bag_family: "Averx", raw_3bag_qty: 0, raw_2bag_qty: 8 },
    { id: 3, product_id: 13, bag_family: "Plain", raw_3bag_qty: 2, raw_2bag_qty: 1 },
  ];

  const skuMappings: SKUMapping[] = [
    { id: 1, raw_sku: "7_TRIP-7FT+RFL-10I-BES3-2", product_id: 5, match_type: "exact", active: true, times_seen: 42, first_seen_at: now, last_seen_at: now },
    { id: 2, raw_sku: "7_TRIP-7FT+RFL-10I-CHI-2", product_id: 5, match_type: "exact", active: true, times_seen: 18, first_seen_at: now, last_seen_at: now },
    { id: 3, raw_sku: "7_TRIP-7FT+RFL-10I-DEE1-2", product_id: 5, match_type: "exact", active: true, times_seen: 9, first_seen_at: now, last_seen_at: now },
    { id: 4, raw_sku: "7_SEST-FKSB1-R16S-B-1", product_id: 3, match_type: "exact", active: true, times_seen: 35, first_seen_at: now, last_seen_at: now },
    { id: 5, raw_sku: "7_MIC-NAF-3.5MM-B-1", product_id: 6, match_type: "exact", active: true, times_seen: 28, first_seen_at: now, last_seen_at: now },
    { id: 6, raw_sku: "7_SEST-NAF-R1L-B-1", product_id: 4, match_type: "exact", active: true, times_seen: 14, first_seen_at: now, last_seen_at: now },
    { id: 7, raw_sku: "HT-MLWBR-01", product_id: 8, match_type: "exact", active: true, times_seen: 22, first_seen_at: now, last_seen_at: now },
    { id: 8, raw_sku: "7_SEST-NAF2-R1S-B-1", product_id: 2, match_type: "exact", active: true, times_seen: 50, first_seen_at: now, last_seen_at: now },
    { id: 9, raw_sku: "7_SEST-NAF2-R1-B-1", product_id: 1, match_type: "exact", active: true, times_seen: 19, first_seen_at: now, last_seen_at: now },
    { id: 10, raw_sku: "7_SEST-NAF4-R1-B-1", product_id: 1, match_type: "exact", active: true, times_seen: 15, first_seen_at: now, last_seen_at: now },
    { id: 11, raw_sku: "7_SEST-NAF3-R1S-B-1", product_id: 2, match_type: "exact", active: true, times_seen: 12, first_seen_at: now, last_seen_at: now },
    { id: 12, raw_sku: "7_SEST-NAF5-R1-B-1", product_id: 1, match_type: "exact", active: true, times_seen: 8, first_seen_at: now, last_seen_at: now },
    { id: 13, raw_sku: "7_TRIP-CLIP001-NAF-B-1", product_id: 7, match_type: "exact", active: true, times_seen: 16, first_seen_at: now, last_seen_at: now },
    { id: 14, raw_sku: "6_EBCC-NAF-AAPRO-NC042", product_id: 9, match_type: "exact", active: true, times_seen: 7, first_seen_at: now, last_seen_at: now },
    { id: 15, raw_sku: "GB-STAR-12-ROLL", product_id: 11, match_type: "exact", active: true, times_seen: 30, first_seen_at: now, last_seen_at: now },
    { id: 16, raw_sku: "GB-AVERX-16-ROLL", product_id: 12, match_type: "exact", active: true, times_seen: 26, first_seen_at: now, last_seen_at: now },
    { id: 17, raw_sku: "BP-ROLL-2026", product_id: 10, match_type: "exact", active: true, times_seen: 15, first_seen_at: now, last_seen_at: now },
  ];

  const patternRules: PatternRule[] = [
    { id: 1, rule_type: "starts_with", value: "GB-", product_id: null, suggested_worker: "Kartik Da", priority: 10, active: true },
    { id: 2, rule_type: "starts_with", value: "BP-", product_id: 10, suggested_worker: "Kartik Da", priority: 10, active: true },
    { id: 3, rule_type: "contains", value: "R16S", product_id: 3, suggested_worker: "Sohel", priority: 20, active: true },
    { id: 4, rule_type: "contains", value: "R1S", product_id: 2, suggested_worker: "Sohel", priority: 20, active: true },
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
    // Today's shipments
    {
      id: 1,
      awb: "FMPC6419809470",
      order_id: "OD338407993012613100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 1,
      mismatch_status: "none",
      customer_name: "Sushil Raj",
      customer_city: "Tirhut Division, BR",
      payment_mode: "COD",
      items: [{ id: 1, shipment_id: 1, raw_sku: "7_TRIP-7FT+RFL-10I-BES3-2", product_id: 5, product: "Ring Flash 10-Inch", description: "BESTFLY Ring_flash 10 inches", quantity: 2, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 2,
      awb: "FMPC6422177697",
      order_id: "OD438412016270778100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 2,
      mismatch_status: "none",
      customer_name: "Dharma Kharia",
      customer_city: "Dibrugarh, AS",
      payment_mode: "COD",
      items: [{ id: 2, shipment_id: 2, raw_sku: "7_TRIP-7FT+RFL-10I-CHI-2", product_id: 5, product: "Ring Flash 10-Inch", description: "BESTFLY Ring_flash 10 inches", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 3,
      awb: "FMPP4226450875",
      order_id: "OD438400537753508100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      last_printed_at: now,
      source_page: 3,
      mismatch_status: "none",
      customer_name: "Ambili",
      customer_city: "Kozhikode, KL",
      payment_mode: "PREPAID",
      items: [{ id: 3, shipment_id: 3, raw_sku: "7_SEST-FKSB1-R16S-B-1", product_id: 3, product: "R16S", description: "Flipkart SmartBuy R16S 67-Inch Tripod Stand", quantity: 4, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 4,
      awb: "FMPP4229821661",
      order_id: "OD338407633395385100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 4,
      mismatch_status: "none",
      customer_name: "Sahil",
      customer_city: "Nanded Waghala, MH",
      payment_mode: "PREPAID",
      items: [{ id: 4, shipment_id: 4, raw_sku: "7_MIC-NAF-3.5MM-B-1", product_id: 6, product: "NAFA Clip Microphone", description: "NAFA 3.5mm Clip For Youtube", quantity: 3, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 5,
      awb: "FMPC6421043959",
      order_id: "OD438410456113316100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 5,
      mismatch_status: "none",
      customer_name: "Sarikhada Ronak",
      customer_city: "Junagadh, GJ",
      payment_mode: "COD",
      items: [{ id: 5, shipment_id: 5, raw_sku: "HT-MLWBR-01", product_id: 8, product: "HideTheory Leather Wallet", description: "HideTheory Men Formal Tan Genuine Leather Wallet", quantity: 2, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 6,
      awb: "FMPC6422575292",
      order_id: "OD438407347637916100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 6,
      mismatch_status: "none",
      customer_name: "Ishika",
      customer_city: "Maihar, MP",
      payment_mode: "COD",
      items: [
        { id: 6, shipment_id: 6, raw_sku: "7_SEST-NAF2-R1-B-1", product_id: 1, product: "R1", description: "NAFA Professional 70cm Bluetooth Selfie Stick Tripod", quantity: 2, assigned_worker: "Sohel", mapping_status: "mapped" },
        { id: 7, shipment_id: 6, raw_sku: "7_SEST-NAF2-R1S-B-1", product_id: 2, product: "R1S", description: "NAFA 70cm Selfie Stick Tripod with LED", quantity: 3, assigned_worker: "Sohel", mapping_status: "mapped" },
        { id: 8, shipment_id: 6, raw_sku: "7_SEST-NAF4-R1-B-1", product_id: 1, product: "R1", description: "NAFA 27-Inch Selfie Stick Tripod", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" },
      ],
    },
    {
      id: 7,
      awb: "FMPP4230193064",
      order_id: "OD338413570712885100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 7,
      mismatch_status: "none",
      customer_name: "Bhoye Devidasbhai",
      customer_city: "The Dangs, GJ",
      payment_mode: "PREPAID",
      items: [{ id: 9, shipment_id: 7, raw_sku: "GB-STAR-12-ROLL", product_id: 11, product: "Star Garbage Bag 12", description: "Star Garbage Bag 12 Pack", quantity: 6, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 8,
      awb: "FMPC6421872371",
      order_id: "OD338408668862925100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 8,
      mismatch_status: "none",
      customer_name: "Mahamadaali",
      customer_city: "Dharwad, KA",
      payment_mode: "COD",
      items: [{ id: 10, shipment_id: 8, raw_sku: "GB-AVERX-16-ROLL", product_id: 12, product: "Averx Garbage Bag 16", description: "Averx Garbage Bag 16 Pack", quantity: 8, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 9,
      awb: "FMPC6423981144",
      order_id: "OD338409123891029100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 9,
      mismatch_status: "none",
      customer_name: "Ramesh Sharma",
      customer_city: "Patna, BR",
      payment_mode: "PREPAID",
      items: [{ id: 11, shipment_id: 9, raw_sku: "GB-PLAIN-5", product_id: 13, product: "Plain Garbage Bag 5", description: "Plain Garbage Bag 5 Pack", quantity: 5, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 10,
      awb: "FMPC6424567890",
      order_id: "OD338409988776655100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 10,
      mismatch_status: "none",
      customer_name: "Anjali Gupta",
      customer_city: "Kolkata, WB",
      payment_mode: "COD",
      items: [{ id: 12, shipment_id: 10, raw_sku: "BP-ROLL-2026", product_id: 10, product: "Butter Paper", description: "Butter Paper Roll Pack", quantity: 4, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 11,
      awb: "FMPC6425123456",
      order_id: "OD338411223344556100",
      first_batch_id: 1,
      processing_date: todayStr,
      counted: true,
      print_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      source_page: 11,
      mismatch_status: "none",
      customer_name: "Pooja Verma",
      customer_city: "Ranchi, JH",
      payment_mode: "PREPAID",
      items: [
        { id: 13, shipment_id: 11, raw_sku: "7_TRIP-CLIP001-NAF-B-1", product_id: 7, product: "Mobile Holder Clip", description: "Mobile Holder Clip For Tripod", quantity: 2, assigned_worker: "Sohel", mapping_status: "mapped" },
        { id: 14, shipment_id: 11, raw_sku: "GB-STAR-12-ROLL", product_id: 11, product: "Star Garbage Bag 12", description: "Star Garbage Bag 12 Pack", quantity: 2, assigned_worker: "Kartik Da", mapping_status: "mapped" },
      ],
    },
    // Yesterday's historical shipments
    {
      id: 12,
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
      items: [{ id: 15, shipment_id: 12, raw_sku: "7_SEST-FKSB1-R16S-B-1", product_id: 3, product: "R16S", description: "Flipkart SmartBuy R16S 67-Inch Tripod Stand", quantity: 5, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 13,
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
      items: [{ id: 16, shipment_id: 13, raw_sku: "GB-STAR-12-ROLL", product_id: 11, product: "Star Garbage Bag 12", description: "Star Garbage Bag 12 Pack", quantity: 8, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
    {
      id: 14,
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
      items: [{ id: 17, shipment_id: 14, raw_sku: "7_TRIP-7FT+RFL-10I-BES3-2", product_id: 5, product: "Ring Flash 10-Inch", description: "BESTFLY Ring_flash 10 inches", quantity: 3, assigned_worker: "Sohel", mapping_status: "mapped" }],
    },
    {
      id: 15,
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
      items: [{ id: 18, shipment_id: 15, raw_sku: "GB-AVERX-16-ROLL", product_id: 12, product: "Averx Garbage Bag 16", description: "Averx Garbage Bag 16 Pack", quantity: 6, assigned_worker: "Kartik Da", mapping_status: "mapped" }],
    },
  ];

  const batches: BatchItem[] = [
    {
      id: 1,
      filename: "flipkart_dispatch_today.pdf",
      processing_date: todayStr,
      created_at: now,
      total_pages: 12,
      unique_awbs: 11,
      duplicate_awbs: 1,
      total_items: 43,
      unknown_skus: 0,
      status: "confirmed",
    },
    {
      id: 2,
      filename: "flipkart_dispatch_yesterday.pdf",
      processing_date: yesterdayStr,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      total_pages: 5,
      unique_awbs: 4,
      duplicate_awbs: 0,
      total_items: 22,
      unknown_skus: 0,
      status: "confirmed",
    },
  ];

  global.__flipkart_store = {
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

  return global.__flipkart_store;
}

export const store = initStore();
