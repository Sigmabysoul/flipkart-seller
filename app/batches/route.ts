import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  let list = [...store.batches];

  if (date) {
    list = list.filter((b) => b.processing_date === date);
  }

  if (status && status !== "all") {
    list = list.filter((b) => b.status === status);
  }

  return NextResponse.json({
    total: list.length,
    batches: list,
  });
}
