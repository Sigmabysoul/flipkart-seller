import { NextResponse } from "next/server";
import { store, LabelSortMode, sortParsedLabels } from "@/lib/serverStore";
import { cropShippingLabelPages, SourcePageReference } from "@/lib/pdfCrop";
import { PDFDocument } from "pdf-lib";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const batchId = Number.parseInt(id, 10);
    const batch = store.batches.find((candidate) => candidate.id === batchId);
    if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
    if (!batch.source_pdfs_base64?.length) {
      return NextResponse.json(
        { detail: "This older batch has no original PDF attached. Upload it again to create a genuine cropped label PDF." },
        { status: 409 },
      );
    }

    const { searchParams } = new URL(req.url);
    const sortMode = (searchParams.get("sort") as LabelSortMode) || "sku_grouped";
    const sortedLabels = sortParsedLabels(batch.labels || [], sortMode);
    const sourceDocuments = await Promise.all(
      batch.source_pdfs_base64.map((base64) => PDFDocument.load(Buffer.from(base64, "base64"), { ignoreEncryption: true })),
    );
    const allPages: SourcePageReference[] = sourceDocuments.flatMap((document, sourceDocument) =>
      Array.from({ length: document.getPageCount() }, (_, pageIndex) => ({ sourceDocument, pageIndex })),
    );

    const requestedPages: SourcePageReference[] = [];
    const usedPages = new Set<string>();
    for (const label of sortedLabels) {
      const reference = {
        sourceDocument: label.source_document || 0,
        pageIndex: (label.original_page || label.page) - 1,
      };
      const key = `${reference.sourceDocument}:${reference.pageIndex}`;
      if (!usedPages.has(key)) {
        requestedPages.push(reference);
        usedPages.add(key);
      }
    }

    // Preserve pages that text extraction could not identify instead of silently dropping labels.
    for (const reference of allPages) {
      const key = `${reference.sourceDocument}:${reference.pageIndex}`;
      if (!usedPages.has(key)) requestedPages.push(reference);
    }

    const pdfBytes = await cropShippingLabelPages(batch.source_pdfs_base64, requestedPages);
    const safeFilename = (batch.filename || "labels").replace(/[^a-zA-Z0-9._-]+/g, "_");

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="cropped_${safeFilename}_${sortMode}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to crop shipping labels";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
