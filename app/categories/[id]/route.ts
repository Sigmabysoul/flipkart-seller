import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catId = parseInt(id);
  const index = store.categories.findIndex((c) => c.id === catId);
  if (index === -1) return NextResponse.json({ detail: "Category not found" }, { status: 404 });

  store.categories.splice(index, 1);
  return NextResponse.json({ status: "deleted" });
}
