import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const range = searchParams.get("range"); // "today" | "yesterday" | "7days" | "month" | "all"

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  let minDate = startDate;
  let maxDate = endDate || todayStr;

  if (range === "today") {
    minDate = todayStr;
    maxDate = todayStr;
  } else if (range === "yesterday") {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    minDate = y.toISOString().split("T")[0];
    maxDate = minDate;
  } else if (range === "7days") {
    const s = new Date();
    s.setDate(s.getDate() - 7);
    minDate = s.toISOString().split("T")[0];
  } else if (range === "month") {
    const s = new Date();
    s.setDate(s.getDate() - 30);
    minDate = s.toISOString().split("T")[0];
  }

  let filteredBatches = [...store.batches];
  if (minDate) {
    filteredBatches = filteredBatches.filter((b) => b.processing_date >= minDate);
  }
  if (maxDate) {
    filteredBatches = filteredBatches.filter((b) => b.processing_date <= maxDate);
  }

  let filteredShipments = [...store.shipments];
  if (minDate) {
    filteredShipments = filteredShipments.filter((s) => s.processing_date >= minDate);
  }
  if (maxDate) {
    filteredShipments = filteredShipments.filter((s) => s.processing_date <= maxDate);
  }

  const uniqueAwbs = filteredShipments.length;
  const totalItems = filteredShipments.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0), 0);
  const duplicates = filteredBatches.reduce((sum, b) => sum + b.duplicate_awbs, 0);

  return NextResponse.json({
    summary: {
      total_batches: filteredBatches.length,
      unique_awbs: uniqueAwbs,
      total_items: totalItems,
      duplicate_awbs: duplicates,
    },
    batches: filteredBatches,
    shipments: filteredShipments.slice(0, 100),
    print_events: store.printEvents,
  });
}
