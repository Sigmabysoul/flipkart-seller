import { NextResponse } from "next/server";
import { store, LabelSortMode, sortParsedLabels } from "@/lib/serverStore";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const batchId = parseInt(id);
    const batch = store.batches.find((b) => b.id === batchId);
    if (!batch) return NextResponse.json({ detail: "Batch not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const sortMode = (searchParams.get("sort") as LabelSortMode) || "sku_grouped";

    const rawLabels = batch.labels || [];
    const labels = sortParsedLabels(rawLabels, sortMode);

    // Calculate grouping metadata for SKU sequence clusters (e.g. SE-3B is 1 of 4)
    const skuCounts: Record<string, number> = {};
    const skuIndices: Record<string, number> = {};
    for (const l of labels) {
      const skuKey = (l.items[0]?.product || l.items[0]?.raw_sku || "Mixed").toUpperCase();
      skuCounts[skuKey] = (skuCounts[skuKey] || 0) + 1;
    }

    // Create a PDF document with standard 4x6 inches (288 x 432 pt) cropped label pages
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

    for (let index = 0; index < labels.length; index++) {
      const label = labels[index];
      const seqNum = label.sequence || (index + 1);
      const skuName = label.sku_group || label.items[0]?.product || label.items[0]?.raw_sku || "Item";
      const skuSeq = label.group_page || 1;
      const skuTotal = label.group_total || 1;

      // 4 x 6 inches in PDF points (72 pt per inch -> 288 x 432 pt)
      const page = pdfDoc.addPage([288, 432]);
      const width = page.getWidth();
      const height = page.getHeight();

      // Outer border
      page.drawRectangle({
        x: 8,
        y: 8,
        width: width - 16,
        height: height - 16,
        borderColor: rgb(0.1, 0.1, 0.1),
        borderWidth: 1.5,
      });

      // Top Realtime Sequence & SKU Header Strip
      page.drawRectangle({
        x: 8,
        y: height - 26,
        width: width - 16,
        height: 18,
        color: rgb(0.15, 0.23, 0.36),
      });

      page.drawText(`SEQ #${seqNum}/${labels.length}  |  SKU: ${skuName} (Page ${skuSeq}/${skuTotal})`, {
        x: 12,
        y: height - 20,
        size: 8,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(`Orig Pg: ${label.original_page || label.page}`, {
        x: width - 75,
        y: height - 20,
        size: 7.5,
        font,
        color: rgb(0.85, 0.9, 1),
      });

      // Top Header box (E-Kart Logistics & Mode)
      page.drawRectangle({
        x: 8,
        y: height - 58,
        width: width - 16,
        height: 32,
        borderColor: rgb(0.2, 0.2, 0.2),
        borderWidth: 1,
        color: rgb(0.96, 0.97, 0.98),
      });

      page.drawText("STD", { x: 14, y: height - 42, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText("E-Kart Logistics", { x: 50, y: height - 38, size: 9.5, font: fontBold });
      page.drawText(`Order: ${label.order_id}`, { x: 50, y: height - 50, size: 7.5, font });

      page.drawText(label.payment_mode || "COD", {
        x: width - 58,
        y: height - 42,
        size: 10.5,
        font: fontBold,
        color: label.payment_mode === "COD" ? rgb(0.8, 0.2, 0.2) : rgb(0.1, 0.5, 0.2),
      });

      // AWB and Barcode Section
      page.drawText(`AWB: ${label.awb}`, { x: 14, y: height - 74, size: 8.5, font: fontBold });
      page.drawRectangle({
        x: 14,
        y: height - 104,
        width: 110,
        height: 24,
        color: rgb(0.9, 0.93, 0.97),
      });
      page.drawText(`|||||||||||||||||||||||||||||||||`, { x: 18, y: height - 92, size: 8, font: fontMono, color: rgb(0.1, 0.2, 0.4) });
      page.drawText(label.awb, { x: 22, y: height - 102, size: 7, font });

      // QR Code Box Placeholder
      page.drawRectangle({
        x: 155,
        y: height - 128,
        width: 60,
        height: 60,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 1,
      });
      page.drawText("QR CODE", { x: 163, y: height - 98, size: 7.5, font: fontBold, color: rgb(0.4, 0.4, 0.4) });

      // Customer Address Box
      page.drawText("Shipping / Customer Address:", { x: 14, y: height - 140, size: 8, font: fontBold });
      page.drawText(`Name: ${label.customer_name || "Customer"}`, { x: 14, y: height - 152, size: 8, font });
      page.drawText(`City: ${label.customer_city || "India"}`, { x: 14, y: height - 164, size: 8, font });

      // Horizontal separator line
      page.drawLine({
        start: { x: 8, y: height - 174 },
        end: { x: width - 8, y: height - 174 },
        thickness: 1,
        color: rgb(0.3, 0.3, 0.3),
      });

      // SKU Table Header
      page.drawRectangle({
        x: 8,
        y: height - 196,
        width: width - 16,
        height: 22,
        color: rgb(0.92, 0.94, 0.96),
      });
      page.drawText("#", { x: 12, y: height - 187, size: 7.5, font: fontBold });
      page.drawText("SKU ID", { x: 28, y: height - 187, size: 7.5, font: fontBold });
      page.drawText("Product / Description", { x: 110, y: height - 187, size: 7.5, font: fontBold });
      page.drawText("QTY", { x: width - 32, y: height - 187, size: 7.5, font: fontBold });

      // SKU Table Rows
      let rowY = height - 212;
      label.items.forEach((item, idx) => {
        page.drawText(`${idx + 1}`, { x: 12, y: rowY, size: 7.5, font });
        const shortSku = item.raw_sku.length > 18 ? item.raw_sku.substring(0, 18) + ".." : item.raw_sku;
        page.drawText(shortSku, { x: 28, y: rowY, size: 7, font: fontBold });
        const desc = item.product || item.description || "Product";
        const shortDesc = desc.length > 26 ? desc.substring(0, 26) + ".." : desc;
        page.drawText(shortDesc, { x: 110, y: rowY, size: 7, font });
        page.drawText(`${item.quantity}`, { x: width - 26, y: rowY, size: 8, font: fontBold });
        rowY -= 16;
      });

      // Bottom Barcode & Dispatch Box
      page.drawRectangle({
        x: 14,
        y: 35,
        width: width - 28,
        height: 45,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 1,
      });

      page.drawText(`||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||`, {
        x: 20,
        y: 56,
        size: 9,
        font: fontMono,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(label.awb, { x: 20, y: 44, size: 8, font: fontBold });
      page.drawText("B6", { x: width - 42, y: 46, size: 14, font: fontBold });

      // Footer
      page.drawText("Not for resale. (Cropped Flipkart Shipping Label)", {
        x: 14,
        y: 16,
        size: 6.5,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      page.drawText(`Worker: ${label.items[0]?.assigned_worker || "Sohel"}`, {
        x: width - 85,
        y: 16,
        size: 6.5,
        font: fontBold,
        color: rgb(0.2, 0.4, 0.8),
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="cropped_${batch.filename || "labels"}_${sortMode}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

