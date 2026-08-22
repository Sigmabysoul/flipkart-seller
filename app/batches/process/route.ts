import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ detail: "Upload at least one PDF" }, { status: 400 });
    }

    const filenames = files.map((f) => f.name);
    const todayStr = new Date().toISOString().split("T")[0];

    // Build batch preview
    const sampleLabels = [
      { page: 1, awb: "FMPC6419809470", order_id: "OD338407993012613100", duplicate: false, mismatch: false, items: [{ raw_sku: "R1S", product_id: 2, product: "R1S", description: "R1S Tripod", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" }] },
      { page: 2, awb: "FMPC6419809521", order_id: "OD338407993012613101", duplicate: false, mismatch: false, items: [{ raw_sku: "GB-STAR-12", product_id: 5, product: "Star Garbage Bag 12", description: "Garbage bag pack", quantity: 2, assigned_worker: "Kartik Da", mapping_status: "mapped" }] },
      { page: 17, awb: "FMPC6419809470", order_id: "OD338407993012613100", duplicate: true, mismatch: false, items: [{ raw_sku: "R1S", product_id: 2, product: "R1S", description: "R1S Tripod", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" }] },
      { page: 31, awb: "FMPC6419809678", order_id: "OD338407993012613118", duplicate: false, mismatch: false, items: [{ raw_sku: "7_SEST-NAF2-R1S-NEW-B-7", product_id: null, product: null, description: "NAFA 70cm Selfie Stick", quantity: 1, assigned_worker: "Sohel", mapping_status: "unknown" }] },
      { page: 44, awb: "FMPC6419809802", order_id: "OD338407993012613132", duplicate: false, mismatch: false, items: [{ raw_sku: "R16S", product_id: 3, product: "R16S", description: "R16S Tripod", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" }] },
      { page: 68, awb: "FMPC6419809934", order_id: "OD338407993012613156", duplicate: false, mismatch: false, items: [
        { raw_sku: "R1S", product_id: 2, product: "R1S", description: "R1S Tripod", quantity: 1, assigned_worker: "Sohel", mapping_status: "mapped" },
        { raw_sku: "GB-STAR-12", product_id: 5, product: "Star Garbage Bag 12", description: "Garbage bag pack", quantity: 1, assigned_worker: "Kartik Da", mapping_status: "mapped" },
      ] },
    ];

    const uniqueCount = 194;
    const dupesCount = 12;
    const totalCount = 221;
    const unknownCount = 2;
    const totalPages = 206;

    const newBatch = {
      id: store.nextId.batch++,
      filename: filenames.join(", "),
      processing_date: todayStr,
      created_at: new Date().toISOString(),
      total_pages: totalPages,
      unique_awbs: uniqueCount,
      duplicate_awbs: dupesCount,
      total_items: totalCount,
      unknown_skus: unknownCount,
      status: "draft",
      raw_json: JSON.stringify(sampleLabels),
    };

    store.batches.unshift(newBatch);

    return NextResponse.json({
      batch_id: newBatch.id,
      status: newBatch.status,
      pages_scanned: totalPages,
      unique_awbs: uniqueCount,
      duplicate_awbs: dupesCount,
      total_items: totalCount,
      unknown_skus: unknownCount,
      labels: sampleLabels,
      cropped_labels_url: `/batches/${newBatch.id}/shipping-labels.pdf`,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || "Failed to process files" }, { status: 500 });
  }
}
