import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET() {
  const activeProducts = store.products
    .filter((p) => p.active)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  return NextResponse.json(activeProducts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newProduct = {
    id: store.nextId.product++,
    name: body.name,
    internal_code: body.internal_code || null,
    category: body.category || null,
    assigned_worker: body.assigned_worker || "Sohel",
    sort_group: body.sort_group || null,
    sort_order: body.sort_order ?? 0,
    active: true,
    notes: body.notes || null,
  };
  store.products.push(newProduct);
  return NextResponse.json(newProduct, { status: 201 });
}
