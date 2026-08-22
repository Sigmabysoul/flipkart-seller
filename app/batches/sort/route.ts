import { NextResponse } from "next/server";
import { LabelSortMode, sortParsedLabels, ParsedLabel } from "@/lib/serverStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sortMode = (body.sort_mode || "sku_grouped") as LabelSortMode;
    const inputLabels = (body.labels && Array.isArray(body.labels) ? body.labels : []) as ParsedLabel[];

    // Process labels through universal server-side sorting logic
    const sortedLabels = sortParsedLabels(inputLabels, sortMode);

    return NextResponse.json({
      sort_mode: sortMode,
      total_labels: sortedLabels.length,
      labels: sortedLabels,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Failed to sort labels" }, { status: 500 });
  }
}
