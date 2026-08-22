import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batchId = parseInt(id);
  const batch = store.batches.find((b) => b.id === batchId);
  if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });

  return NextResponse.json(batch);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batchId = parseInt(id);
  const index = store.batches.findIndex((b) => b.id === batchId);
  if (index === -1) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });

  const [removed] = store.batches.splice(index, 1);
  return NextResponse.json({ status: "deleted", batch: removed });
}
