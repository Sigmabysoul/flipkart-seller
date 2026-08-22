import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batchId = parseInt(id);
  const batch = store.batches.find((b) => b.id === batchId);
  if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });

  if (batch.status === "confirmed") {
    return NextResponse.json({ status: "confirmed", batch_id: batch.id, idempotent: true });
  }
  if (batch.status === "cancelled") {
    return NextResponse.json({ detail: "Batch is cancelled" }, { status: 409 });
  }

  batch.status = "confirmed";
  return NextResponse.json({ status: "confirmed", batch_id: batch.id });
}
