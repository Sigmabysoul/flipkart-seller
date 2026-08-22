import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("include_inactive") === "true";
  const category = searchParams.get("category");
  const worker = searchParams.get("worker");

  let list = includeInactive ? store.products : store.products.filter((p) => p.active);

  if (category && category !== "all") {
    list = list.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }

  if (worker && worker !== "all") {
    list = list.filter((p) => p.assigned_worker?.toLowerCase() === worker.toLowerCase());
  }

  list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ detail: "Product name is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newProduct = {
      id: store.nextId.product++,
      name: body.name.trim(),
      internal_code: body.internal_code?.trim() || null,
      category: body.category?.trim() || "General",
      assigned_worker: body.assigned_worker || "Sohel",
      sort_group: body.sort_group?.trim() || null,
      sort_order: Number(body.sort_order) || 50,
      active: true,
      notes: body.notes?.trim() || null,
      bag_family: body.bag_family || null,
      raw_3bag_qty: body.raw_3bag_qty !== undefined ? Number(body.raw_3bag_qty) : undefined,
      raw_2bag_qty: body.raw_2bag_qty !== undefined ? Number(body.raw_2bag_qty) : undefined,
      created_at: now,
      updated_at: now,
    };

    store.products.push(newProduct);

    if (newProduct.bag_family) {
      store.packingRecipes.push({
        id: store.nextId.recipe++,
        product_id: newProduct.id,
        bag_family: newProduct.bag_family,
        raw_3bag_qty: newProduct.raw_3bag_qty || 0,
        raw_2bag_qty: newProduct.raw_2bag_qty || 0,
      });
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
