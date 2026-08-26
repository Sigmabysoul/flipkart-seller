import { NextResponse } from "next/server";
import { InventoryMovement, saveStoreToDisk, store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = Number(searchParams.get("product_id")) || null;
  const movements = productId
    ? store.inventoryMovements.filter((movement) => movement.product_id === productId)
    : store.inventoryMovements;
  return NextResponse.json({
    products: store.products.map((product) => ({
      id: product.id, name: product.name, internal_code: product.internal_code,
      current_stock: Number(product.current_stock) || 0,
      reorder_level: Number(product.reorder_level) || 0,
      stock_status: (Number(product.current_stock) || 0) <= (Number(product.reorder_level) || 0) ? "low" : "healthy",
    })),
    movements: movements.slice(0, 250),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = store.products.find((item) => item.id === Number(body.product_id));
    if (!product) return NextResponse.json({ detail: "Product not found" }, { status: 404 });
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity === 0) {
      return NextResponse.json({ detail: "Quantity must be a non-zero number" }, { status: 400 });
    }
    const type = body.type === "adjustment" ? "adjustment" : "restock";
    if (type === "restock" && quantity < 0) {
      return NextResponse.json({ detail: "Restock quantity must be positive" }, { status: 400 });
    }
    const now = new Date().toISOString();
    product.current_stock = (Number(product.current_stock) || 0) + quantity;
    product.updated_at = now;
    const movement: InventoryMovement = {
      id: store.nextId.inventoryMovement++, product_id: product.id, type, quantity,
      balance_after: product.current_stock, batch_id: null,
      note: String(body.note || (type === "restock" ? "Manual restock" : "Manual correction")),
      created_by: String(body.created_by || "Operator"), created_at: now,
    };
    store.inventoryMovements.unshift(movement);
    saveStoreToDisk(store);
    return NextResponse.json({ product, movement });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Inventory update failed" }, { status: 500 });
  }
}
