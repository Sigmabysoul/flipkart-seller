import { NextResponse } from "next/server";
import { store, calculatePackMaterials } from "@/lib/serverStore";

function getSnapshot(targetDate: string) {
  const shipments = store.shipments.filter(
    (s) => s.processing_date === targetDate && s.counted
  );
  const items = shipments.flatMap((s) => s.items);
  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const marketplaceTotals = Object.fromEntries(
    ["flipkart", "meesho", "myntra", "amazon", "snapdeal"].map((marketplace) => [marketplace, 0])
  ) as Record<string, number>;
  const marketplaceStockOut = Object.fromEntries(
    ["flipkart", "meesho", "myntra", "amazon", "snapdeal"].map((marketplace) => [marketplace, 0])
  ) as Record<string, number>;
  for (const shipment of shipments) {
    const marketplace = shipment.marketplace || "flipkart";
    marketplaceTotals[marketplace] = (marketplaceTotals[marketplace] || 0) + 1;
    marketplaceStockOut[marketplace] = (marketplaceStockOut[marketplace] || 0) +
      shipment.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  const marketplaceReceived = Object.fromEntries(
    ["flipkart", "meesho", "myntra", "amazon", "snapdeal"].map((marketplace) => [marketplace, 0])
  ) as Record<string, number>;
  const marketplaceBatches = Object.fromEntries(
    ["flipkart", "meesho", "myntra", "amazon", "snapdeal"].map((marketplace) => [marketplace, 0])
  ) as Record<string, number>;
  for (const batch of store.batches.filter((item) => item.processing_date === targetDate && item.status !== "cancelled")) {
    const marketplace = batch.marketplace || "flipkart";
    marketplaceReceived[marketplace] += batch.labels?.length || batch.total_pages;
    marketplaceBatches[marketplace] += 1;
  }

  // Worker breakdowns (single worker per label)
  const workerMap: Record<string, { unique_labels: number; items: number; products: Record<string, number> }> = {};
  for (const w of store.workers) {
    workerMap[w.name] = { unique_labels: 0, items: 0, products: {} };
  }

  // Calculate per shipment
  for (const s of shipments) {
    const primaryWorker = s.items[0]?.assigned_worker || "Sohel";
    if (!workerMap[primaryWorker]) {
      workerMap[primaryWorker] = { unique_labels: 0, items: 0, products: {} };
    }
    workerMap[primaryWorker].unique_labels += 1;

    for (const item of s.items) {
      const worker = item.assigned_worker || primaryWorker;
      if (!workerMap[worker]) {
        workerMap[worker] = { unique_labels: 0, items: 0, products: {} };
      }
      workerMap[worker].items += item.quantity;
      const prodName = item.product || item.raw_sku;
      workerMap[worker].products[prodName] = (workerMap[worker].products[prodName] || 0) + item.quantity;
    }
  }

  // Generate structured worker_progress array without arbitrary quotas
  const workerProgress = store.workers.map((w) => {
    const stats = workerMap[w.name] || { unique_labels: 0, items: 0, products: {} };
    const shareOfTotal = totalItemsCount > 0 ? Number(((stats.items / totalItemsCount) * 100).toFixed(1)) : 0;
    const itemsPerLabel = stats.unique_labels > 0 ? Number((stats.items / stats.unique_labels).toFixed(2)) : 0;
    const topProducts = Object.entries(stats.products)
      .map(([name, qty]) => ({ name, quantity: qty }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4);

    return {
      id: w.id,
      name: w.name,
      active: w.active,
      status: w.active ? "On shift" : "Offline",
      unique_labels: stats.unique_labels,
      items: stats.items,
      share_of_total: shareOfTotal,
      items_per_label: itemsPerLabel,
      top_products: topProducts,
    };
  });

  // Product Category progress calculations
  const categoryMap: Record<string, {
    id: number;
    name: string;
    quantity: number;
    unique_labels: Set<string>;
    unique_products: Set<string>;
    workers: Record<string, number>;
  }> = {};

  for (const cat of store.categories) {
    categoryMap[cat.name] = {
      id: cat.id,
      name: cat.name,
      quantity: 0,
      unique_labels: new Set(),
      unique_products: new Set(),
      workers: {},
    };
  }

  for (const s of shipments) {
    for (const item of s.items) {
      let catName = "Uncategorized";
      if (item.product_id) {
        const prod = store.products.find((p) => p.id === item.product_id);
        if (prod?.category) catName = prod.category;
      }
      if (!categoryMap[catName]) {
        categoryMap[catName] = {
          id: 900 + Object.keys(categoryMap).length,
          name: catName,
          quantity: 0,
          unique_labels: new Set(),
          unique_products: new Set(),
          workers: {},
        };
      }
      categoryMap[catName].quantity += item.quantity;
      categoryMap[catName].unique_labels.add(s.awb);
      categoryMap[catName].unique_products.add(item.product || item.raw_sku);
      const worker = item.assigned_worker || "Sohel";
      categoryMap[catName].workers[worker] = (categoryMap[catName].workers[worker] || 0) + item.quantity;
    }
  }

  const categoryProgress = Object.values(categoryMap).map((c) => {
    const shareOfTotal = totalItemsCount > 0 ? Number(((c.quantity / totalItemsCount) * 100).toFixed(1)) : 0;
    const catTarget = 20; // target volume per category
    const progressPercent = Math.min(100, Math.round((c.quantity / catTarget) * 100));
    return {
      id: c.id,
      name: c.name,
      quantity: c.quantity,
      unique_labels: c.unique_labels.size,
      unique_products: c.unique_products.size,
      percentage_of_total: shareOfTotal,
      target_quota: catTarget,
      progress_percent: progressPercent,
      yesterday_quantity: 0,
      change: 0,
      growth_percent: 0,
      workers: c.workers,
    };
  }).sort((a, b) => b.quantity - a.quantity);

  // Product stock-out aggregation
  const productTotals: Record<number, { name: string; quantity: number; category: string; worker: string }> = {};
  for (const item of items) {
    if (item.product_id) {
      const prod = store.products.find((p) => p.id === item.product_id);
      if (prod) {
        if (!productTotals[prod.id]) {
          productTotals[prod.id] = {
            name: prod.name,
            quantity: 0,
            category: prod.category || "General",
            worker: item.assigned_worker || prod.assigned_worker,
          };
        }
        productTotals[prod.id].quantity += item.quantity;
      }
    } else {
      // Unmapped raw SKU
      const key = -999;
      if (!productTotals[key]) {
        productTotals[key] = {
          name: item.raw_sku,
          quantity: 0,
          category: "Unmapped",
          worker: item.assigned_worker || "Unassigned",
        };
      }
      productTotals[key].quantity += item.quantity;
    }
  }

  // Raw Materials (PackCalc)
  const raw: Record<string, { "3-Bag": number; "2-Bag": number }> = {
    Averx: { "3-Bag": 0, "2-Bag": 0 },
    Star: { "3-Bag": 0, "2-Bag": 0 },
    Plain: { "3-Bag": 0, "2-Bag": 0 },
  };

  let totalGarbageBagLabels = 0;
  let totalGarbageBagUnits = 0;

  for (const s of shipments) {
    let hasGarbageBag = false;
    for (const item of s.items) {
      if (item.product_id) {
        const prod = store.products.find((p) => p.id === item.product_id);
        const recipe = store.packingRecipes.find((r) => r.product_id === item.product_id);
        const family = prod?.bag_family || recipe?.bag_family;

        if (family && raw[family]) {
          hasGarbageBag = true;
          totalGarbageBagUnits += item.quantity;
          const recipeConfig = recipe || { raw_3bag_qty: prod?.raw_3bag_qty, raw_2bag_qty: prod?.raw_2bag_qty };
          const allocation = calculatePackMaterials(family, item.quantity, recipeConfig);
          raw[family]["3-Bag"] += allocation["3-Bag"];
          raw[family]["2-Bag"] += allocation["2-Bag"];
        }
      }
    }
    if (hasGarbageBag) {
      totalGarbageBagLabels += 1;
    }
  }

  // Segmented Station Data: Kartik Da's Station vs My Station (Sohel)
  // Kartik Da has strictly 4 types of products:
  // 1. Garbage Bag Standard Packs
  // 2. Garbage Bag Rolls (17x19 and 19x21)
  // 3. Butter Paper
  // 4. Aluminium Container
  const kartikShipments = shipments.filter((s) =>
    s.items.some((it) => (it.assigned_worker === "Kartik Da" || (!it.assigned_worker && s.items[0]?.assigned_worker === "Kartik Da")))
  );

  const kartikProductsMap: Record<string, { name: string; internal_code: string; labels: number; items: number; category: string }> = {};
  for (const s of kartikShipments) {
    for (const it of s.items) {
      const isKartik = it.assigned_worker === "Kartik Da" || (!it.assigned_worker && s.items[0]?.assigned_worker === "Kartik Da");
      if (isKartik) {
        const prodName = it.product || it.raw_sku;
        const prod = store.products.find((p) => p.id === it.product_id || p.name === prodName);
        const code = prod?.internal_code || it.raw_sku;
        if (!kartikProductsMap[prodName]) {
          kartikProductsMap[prodName] = {
            name: prodName,
            internal_code: code,
            labels: 0,
            items: 0,
            category: prod?.category || "Kartik Station",
          };
        }
        kartikProductsMap[prodName].labels += 1;
        kartikProductsMap[prodName].items += it.quantity;
      }
    }
  }

  // 6 Boxes for PackCalc (PalCalc) on Kartik Da's page
  const packcalcBoxes = [
    {
      id: "averx-2bag",
      brand: "Averx",
      bag_type: "2-Bag",
      label: "Averx 2-Bag",
      count: raw.Averx["2-Bag"],
      color: "amber",
      unit: "Bags",
      description: "Remainder roll cycles (<3 packs)",
    },
    {
      id: "averx-3bag",
      brand: "Averx",
      bag_type: "3-Bag",
      label: "Averx 3-Bag",
      count: raw.Averx["3-Bag"],
      color: "amber",
      unit: "Bags",
      description: "Full 14-roll cycle packs",
    },
    {
      id: "star-2bag",
      brand: "Star",
      bag_type: "2-Bag",
      label: "Star 2-Bag",
      count: raw.Star["2-Bag"],
      color: "blue",
      unit: "Bags",
      description: "Star 2-bag allowance",
    },
    {
      id: "star-3bag",
      brand: "Star",
      bag_type: "3-Bag",
      label: "Star 3-Bag",
      count: raw.Star["3-Bag"],
      color: "blue",
      unit: "Bags",
      description: "4 bags per roll allocation",
    },
    {
      id: "plain-2bag",
      brand: "Plain",
      bag_type: "2-Bag",
      label: "Plain 2-Bag",
      count: raw.Plain["2-Bag"],
      color: "slate",
      unit: "Bags",
      description: "1 bag per standard unit",
    },
    {
      id: "plain-3bag",
      brand: "Plain",
      bag_type: "3-Bag",
      label: "Plain 3-Bag",
      count: raw.Plain["3-Bag"],
      color: "slate",
      unit: "Bags",
      description: "2 bags per standard unit",
    },
  ];

  // My Station (Sohel): All other products (R1, R1S, R16S, R1L, SE-3B, AX6, AX-10B, Ring Flash, Mic, Clip, Wallet, Case, etc.)
  const myShipments = shipments.filter((s) =>
    s.items.some((it) => (it.assigned_worker === "Sohel" || (!it.assigned_worker && s.items[0]?.assigned_worker !== "Kartik Da")))
  );

  const myProductsMap: Record<string, { name: string; internal_code: string; labels: number; items: number; category: string }> = {};
  for (const s of myShipments) {
    for (const it of s.items) {
      const isMyItem = it.assigned_worker === "Sohel" || (!it.assigned_worker && s.items[0]?.assigned_worker !== "Kartik Da");
      if (isMyItem) {
        const prodName = it.product || it.raw_sku;
        const prod = store.products.find((p) => p.id === it.product_id || p.name === prodName);
        const code = prod?.internal_code || it.raw_sku;
        if (!myProductsMap[prodName]) {
          myProductsMap[prodName] = {
            name: prodName,
            internal_code: code,
            labels: 0,
            items: 0,
            category: prod?.category || "My Station",
          };
        }
        myProductsMap[prodName].labels += 1;
        myProductsMap[prodName].items += it.quantity;
      }
    }
  }

  // Total duplicates seen in batches for this date
  const batchList = store.batches.filter((b) => b.processing_date === targetDate);
  const totalDuplicates = batchList.reduce((sum, b) => sum + b.duplicate_awbs, 0);
  const totalUnknown = items.filter((i) => i.mapping_status === "unknown").length;

  const totalCapacityLabels = 50;
  const totalCapacityItems = 80;

  return {
    marketplace_totals: marketplaceTotals,
    marketplace_received: marketplaceReceived,
    marketplace_stock_out: marketplaceStockOut,
    marketplace_batches: marketplaceBatches,
    unique_labels: shipments.length,
    total_items: totalItemsCount,
    duplicate_labels: totalDuplicates,
    unknown_skus: totalUnknown,
    worker_totals: workerMap,
    worker_progress: workerProgress,
    category_progress: categoryProgress,
    product_stock_out: Object.values(productTotals).sort((a, b) => b.quantity - a.quantity),
    raw_material_requirements: raw,
    garbage_bag_total_labels: totalGarbageBagLabels,
    garbage_bag_total_units: totalGarbageBagUnits,
    kartik_station: {
      total_labels: kartikShipments.length,
      total_items: Object.values(kartikProductsMap).reduce((s, p) => s + p.items, 0),
      products: Object.values(kartikProductsMap).sort((a, b) => b.labels - a.labels),
      packcalc_boxes: packcalcBoxes,
      garbage_bag_total_labels: totalGarbageBagLabels,
      garbage_bag_total_units: totalGarbageBagUnits,
      shipments: kartikShipments.map((s) => ({
        awb_number: s.awb,
        order_id: s.order_id,
        product_name: s.items[0]?.product || s.items[0]?.raw_sku || 'Garbage Bag Roll',
        quantity: s.items.reduce((sum, i) => sum + i.quantity, 0),
        destination_city: s.customer_city || 'Regional Hub',
        payment_mode: s.payment_mode || 'PREPAID',
        print_status: 'printed',
      })),
    },
    my_station: {
      total_labels: myShipments.length,
      total_items: Object.values(myProductsMap).reduce((s, p) => s + p.items, 0),
      orders: Object.values(myProductsMap).sort((a, b) => b.labels - a.labels),
      shipments: myShipments.map((s) => {
        const firstItem = s.items[0];
        const prod = store.products.find((p) => p.name === firstItem?.product || p.id === firstItem?.product_id);
        return {
          awb_number: s.awb,
          order_id: s.order_id,
          product_name: firstItem?.product || firstItem?.raw_sku || 'Standard Product',
          code: prod?.internal_code || firstItem?.raw_sku || 'PROD',
          quantity: s.items.reduce((sum, i) => sum + i.quantity, 0),
          destination_city: s.customer_city || 'Regional Hub',
          payment_mode: s.payment_mode || 'PREPAID',
          print_status: 'printed',
        };
      }),
    },
    shift_overview: {
      target_labels: totalCapacityLabels,
      target_items: totalCapacityItems,
      label_progress_percent: Math.min(100, Math.round((shipments.length / totalCapacityLabels) * 100)),
      item_progress_percent: Math.min(100, Math.round((totalItemsCount / totalCapacityItems) * 100)),
      mapping_accuracy_rate: totalItemsCount > 0 ? Number((((totalItemsCount - totalUnknown) / totalItemsCount) * 100).toFixed(1)) : 100,
      clean_shipment_rate: (shipments.length + totalDuplicates) > 0 ? Number(((shipments.length / (shipments.length + totalDuplicates)) * 100).toFixed(1)) : 100,
    },
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const todayStr = new Date().toISOString().split("T")[0];
  const dateParam = searchParams.get("date") || todayStr;

  const today = getSnapshot(dateParam);

  // Compute yesterday's date
  const d = new Date(dateParam);
  d.setDate(d.getDate() - 1);
  const yesterdayStr = d.toISOString().split("T")[0];
  const yesterday = getSnapshot(yesterdayStr);

  const delta = (curr: number, prev: number) => {
    const change = curr - prev;
    const percent = prev ? Number(((change / prev) * 100).toFixed(1)) : (curr ? 100.0 : 0.0);
    return { current: curr, previous: prev, change, percent };
  };

  // Enhance category progress with yesterday comparison
  const enhancedCategoryProgress = today.category_progress.map((cat) => {
    const yCat = yesterday.category_progress.find((y) => y.name === cat.name);
    const yQty = yCat ? yCat.quantity : 0;
    const change = cat.quantity - yQty;
    const growth = yQty ? Number(((change / yQty) * 100).toFixed(1)) : (cat.quantity ? 100.0 : 0.0);
    return {
      ...cat,
      yesterday_quantity: yQty,
      change,
      growth_percent: growth,
    };
  });

  return NextResponse.json({
    date: dateParam,
    ...today,
    category_progress: enhancedCategoryProgress,
    increments: {
      unique_labels: delta(today.unique_labels, yesterday.unique_labels),
      total_items: delta(today.total_items, yesterday.total_items),
      duplicate_labels: delta(today.duplicate_labels, yesterday.duplicate_labels),
      unknown_skus: delta(today.unknown_skus, yesterday.unknown_skus),
    },
    recent_batches: store.batches.slice(0, 10).map((b) => ({
      id: b.id,
      marketplace: b.marketplace || "flipkart",
      filename: b.filename,
      processing_date: b.processing_date,
      status: b.status,
      unique_awbs: b.unique_awbs,
      duplicate_awbs: b.duplicate_awbs,
      total_items: b.total_items,
      unknown_skus: b.unknown_skus,
      created_at: b.created_at,
    })),
  });
}
