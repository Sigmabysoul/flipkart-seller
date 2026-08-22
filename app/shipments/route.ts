import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const worker = searchParams.get("worker");
  const limit = parseInt(searchParams.get("limit") || "100");
  const page = parseInt(searchParams.get("page") || "1");

  let list = [...store.shipments];

  if (date) {
    list = list.filter((s) => s.processing_date === date);
  }

  if (worker && worker !== "all") {
    list = list.filter((s) => s.items.some((i) => i.assigned_worker?.toLowerCase() === worker.toLowerCase()));
  }

  const total = list.length;
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    total,
    page,
    limit,
    shipments: paginated,
  });
}
