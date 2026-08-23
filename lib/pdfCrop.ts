import { PDFDocument } from "pdf-lib";

export interface SourcePageReference {
  sourceDocument: number;
  pageIndex: number;
}

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const LABEL_WIDTH = 218;
const LABEL_HEIGHT = 360;
const LABEL_TOP_MARGIN = 28;

export async function cropShippingLabelPages(
  sourcePdfsBase64: string[],
  orderedPages: SourcePageReference[],
): Promise<Uint8Array> {
  const sourceDocuments = await Promise.all(
    sourcePdfsBase64.map((base64) => PDFDocument.load(Buffer.from(base64, "base64"), { ignoreEncryption: true })),
  );
  const output = await PDFDocument.create();

  for (const reference of orderedPages) {
    const source = sourceDocuments[reference.sourceDocument];
    if (!source || reference.pageIndex < 0 || reference.pageIndex >= source.getPageCount()) continue;

    const [page] = await output.copyPages(source, [reference.pageIndex]);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const scaleX = pageWidth / A4_WIDTH;
    const scaleY = pageHeight / A4_HEIGHT;
    const cropWidth = Math.min(pageWidth, LABEL_WIDTH * scaleX);
    const cropHeight = Math.min(pageHeight, LABEL_HEIGHT * scaleY);
    const cropX = (pageWidth - cropWidth) / 2;
    const cropY = Math.max(0, pageHeight - LABEL_TOP_MARGIN * scaleY - cropHeight);

    page.setMediaBox(cropX, cropY, cropWidth, cropHeight);
    page.setCropBox(cropX, cropY, cropWidth, cropHeight);
    output.addPage(page);
  }

  if (output.getPageCount() === 0) {
    throw new Error("No source PDF pages were available to crop");
  }

  return output.save();
}
