import { NextResponse } from "next/server";
import { store, LabelSortMode, sortParsedLabels, ParsedLabel } from "@/lib/serverStore";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const batchId = parseInt(id);
    const batch = store.batches.find((b) => b.id === batchId);
    if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const sortMode = (body.sort_mode || "sku_grouped") as LabelSortMode;
    const inputLabels = (body.labels && Array.isArray(body.labels) ? body.labels : batch.labels) as ParsedLabel[];

    // Process labels through universal server-side sorting logic
    const sortedLabels = sortParsedLabels(inputLabels, sortMode);

    // Update batch in store
    batch.labels = sortedLabels;

    return NextResponse.json({
      batch_id: batch.id,
      sort_mode: sortMode,
      total_labels: sortedLabels.length,
      labels: sortedLabels,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Failed to sort labels" }, { status: 500 });
  }
}
