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
  const product = store.products.find((p) => p.id === parseInt(id));
  if (!product) return NextResponse.json({ detail: "Product not found" }, { status: 404 });

  const body = await req.json();
  Object.assign(product, body);
  return NextResponse.json(product);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = store.products.find((p) => p.id === parseInt(id));
  if (!product) return NextResponse.json({ detail: "Product not found" }, { status: 404 });

  product.active = false;
  return NextResponse.json({ status: "disabled" });
}
