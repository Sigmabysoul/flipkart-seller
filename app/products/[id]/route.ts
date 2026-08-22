import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = store.products.find((p) => p.id === parseInt(id));
  if (!product) return NextResponse.json({ detail: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = parseInt(id);
  const product = store.products.find((p) => p.id === productId);
  if (!product) return NextResponse.json({ detail: "Product not found" }, { status: 404 });

  const body = await req.json();
  const now = new Date().toISOString();

  if (body.name !== undefined) product.name = body.name.trim();
  if (body.internal_code !== undefined) product.internal_code = body.internal_code?.trim() || null;
  if (body.category !== undefined) product.category = body.category?.trim() || null;
  if (body.assigned_worker !== undefined) product.assigned_worker = body.assigned_worker;
  if (body.sort_group !== undefined) product.sort_group = body.sort_group?.trim() || null;
  if (body.sort_order !== undefined) product.sort_order = Number(body.sort_order) || 0;
  if (body.notes !== undefined) product.notes = body.notes?.trim() || null;
  if (body.bag_family !== undefined) product.bag_family = body.bag_family;
  if (body.raw_3bag_qty !== undefined) product.raw_3bag_qty = Number(body.raw_3bag_qty);
  if (body.raw_2bag_qty !== undefined) product.raw_2bag_qty = Number(body.raw_2bag_qty);
  if (body.active !== undefined) product.active = Boolean(body.active);
  product.updated_at = now;

  // Sync packing recipe
  const recipeIndex = store.packingRecipes.findIndex((r) => r.product_id === productId);
  if (product.bag_family) {
    if (recipeIndex >= 0) {
      store.packingRecipes[recipeIndex].bag_family = product.bag_family;
      store.packingRecipes[recipeIndex].raw_3bag_qty = product.raw_3bag_qty || 0;
      store.packingRecipes[recipeIndex].raw_2bag_qty = product.raw_2bag_qty || 0;
    } else {
      store.packingRecipes.push({
        id: store.nextId.recipe++,
        product_id: productId,
        bag_family: product.bag_family,
        raw_3bag_qty: product.raw_3bag_qty || 0,
        raw_2bag_qty: product.raw_2bag_qty || 0,
      });
    }
  } else if (recipeIndex >= 0) {
    store.packingRecipes.splice(recipeIndex, 1);
  }

  return NextResponse.json(product);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = parseInt(id);
  const product = store.products.find((p) => p.id === productId);
  if (!product) return NextResponse.json({ detail: "Product not found" }, { status: 404 });

  product.active = false;
  product.updated_at = new Date().toISOString();
  return NextResponse.json({ status: "deactivated", product });
}
