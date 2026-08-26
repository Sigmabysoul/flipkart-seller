import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";
import { parseMarketplacePages, ParserDiagnostic } from "./marketplaceParser";
import {
  BatchItem, LabelSortMode, Marketplace, ParsedLabel, saveStoreToDisk, sortParsedLabels, store,
} from "./serverStore";

export type IncomingPdf = { name: string; buffer: Buffer };
export type IntakeSource = "manual" | "scheduled" | "webhook";

function indiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function resolveLabels(labels: ParsedLabel[], marketplace: Marketplace, sortMode: LabelSortMode) {
  const seen = new Set<string>();
  for (const label of labels) {
    const existing = store.shipments.find(
      (shipment) => (shipment.marketplace || "flipkart") === marketplace && shipment.awb === label.awb,
    );
    if (existing || seen.has(label.awb)) {
      label.duplicate = true;
      if (existing) {
        const prior = existing.items.map((item) => `${item.product || item.raw_sku} x ${item.quantity}`).join(", ");
        const current = label.items.map((item) => `${item.product || item.raw_sku} x ${item.quantity}`).join(", ");
        if (prior !== current) {
          label.mismatch = true;
          label.existing_items_desc = prior;
        }
      }
    }
    seen.add(label.awb);

    for (const item of label.items) {
      const exact = store.skuMappings.find((mapping) => mapping.active && mapping.raw_sku === item.raw_sku);
      if (exact) {
        const product = store.products.find((candidate) => candidate.id === exact.product_id);
        if (product) {
          item.product_id = product.id;
          item.product = product.name;
          item.assigned_worker = exact.worker_override || product.assigned_worker;
          item.mapping_status = exact.worker_override ? "override" : "mapped";
          continue;
        }
      }

      const rule = [...store.patternRules].sort((a, b) => b.priority - a.priority).find((candidate) => {
        if (!candidate.active) return false;
        if (candidate.rule_type === "starts_with") return item.raw_sku.startsWith(candidate.value);
        if (candidate.rule_type === "ends_with") return item.raw_sku.endsWith(candidate.value);
        if (candidate.rule_type === "contains") return item.raw_sku.includes(candidate.value);
        if (candidate.rule_type === "regex") {
          try { return new RegExp(candidate.value, "i").test(item.raw_sku); } catch { return false; }
        }
        return false;
      });
      const product = rule?.product_id ? store.products.find((candidate) => candidate.id === rule.product_id) : null;
      if (product) {
        item.product_id = product.id;
        item.product = product.name;
        item.assigned_worker = rule?.suggested_worker || product.assigned_worker;
        item.mapping_status = "mapped";
      } else {
        item.assigned_worker = rule?.suggested_worker ||
          (item.raw_sku.startsWith("GB-") || item.raw_sku.startsWith("BP-") ? "Kartik Da" : "Sohel");
        item.mapping_status = "unknown";
      }
    }
  }
  return sortParsedLabels(labels, sortMode);
}

export async function processMarketplacePdfs(input: {
  marketplace: Marketplace;
  files: IncomingPdf[];
  sortMode?: LabelSortMode;
  source?: IntakeSource;
}): Promise<{ batch: BatchItem; diagnostics: ParserDiagnostic[] }> {
  const sortMode = input.sortMode || "sku_grouped";
  const diagnostics: ParserDiagnostic[] = [];
  const labels: ParsedLabel[] = [];
  const sourcePdfsBase64: string[] = [];
  let totalPages = 0;

  for (const [index, file] of input.files.entries()) {
    const pdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
    totalPages += pdf.getPageCount();
    sourcePdfsBase64.push(file.buffer.toString("base64"));
    const parser = new PDFParse({ data: file.buffer });
    try {
      const text = await parser.getText();
      const result = parseMarketplacePages(input.marketplace, text.pages, index);
      diagnostics.push(result.diagnostic);
      labels.push(...result.labels);
    } finally {
      await parser.destroy();
    }
  }

  if (!labels.length) {
    const error = new Error(`No ${input.marketplace} shipping labels were recognized. Verify the marketplace and PDF format.`);
    Object.assign(error, { status: 422, diagnostics });
    throw error;
  }

  const resolved = resolveLabels(labels, input.marketplace, sortMode);
  const uniqueAwbs = resolved.filter((label) => !label.duplicate).length;
  const duplicateAwbs = resolved.filter((label) => label.duplicate).length;
  const totalItems = resolved.reduce((sum, label) => sum + label.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const unknownSkus = resolved.flatMap((label) => label.items).filter((item) => item.mapping_status === "unknown").length;
  const now = new Date().toISOString();
  const batch: BatchItem = {
    id: store.nextId.batch++, marketplace: input.marketplace,
    filename: input.files.map((file) => file.name).join(", "),
    processing_date: indiaDate(), created_at: now, total_pages: totalPages,
    unique_awbs: uniqueAwbs, duplicate_awbs: duplicateAwbs, total_items: totalItems,
    unknown_skus: unknownSkus, status: unknownSkus > 0 || duplicateAwbs > 0 ? "needs_review" : "draft",
    raw_json: JSON.stringify(resolved), labels: resolved, source_pdfs_base64: sourcePdfsBase64,
    parser_diagnostics: diagnostics, intake_source: input.source || "manual",
  };
  store.batches.unshift(batch);
  saveStoreToDisk(store);
  return { batch, diagnostics };
}

export function batchResponse(batch: BatchItem, diagnostics: ParserDiagnostic[], sortMode: LabelSortMode) {
  return {
    batch_id: batch.id, marketplace: batch.marketplace || "flipkart", status: batch.status,
    filename: batch.filename, processing_date: batch.processing_date, pages_scanned: batch.total_pages,
    unique_awbs: batch.unique_awbs, duplicate_awbs: batch.duplicate_awbs, total_items: batch.total_items,
    unknown_skus: batch.unknown_skus, sort_mode: sortMode, labels: batch.labels || [],
    parser_diagnostics: diagnostics, intake_source: batch.intake_source,
    cropped_labels_url: `/batches/${batch.id}/pdf?sort=${sortMode}`,
  };
}
