import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  let filtered = [...store.batches];
  if (startDate) {
    filtered = filtered.filter((b) => b.processing_date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((b) => b.processing_date <= endDate);
  }

  const result = filtered.map((b) => ({
    id: b.id,
    filename: b.filename,
    processing_date: b.processing_date,
    status: b.status,
    unique_awbs: b.unique_awbs,
    duplicate_awbs: b.duplicate_awbs,
    total_items: b.total_items,
    unknown_skus: b.unknown_skus,
  }));

  return NextResponse.json(result);
}
