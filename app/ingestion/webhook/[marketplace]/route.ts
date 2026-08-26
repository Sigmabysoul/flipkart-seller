import { NextResponse } from "next/server";
import { batchResponse, processMarketplacePdfs } from "@/lib/batchProcessor";
import { MARKETPLACES, Marketplace } from "@/lib/serverStore";

export async function POST(req: Request, { params }: { params: Promise<{ marketplace: string }> }) {
  try {
    const { marketplace: rawMarketplace } = await params;
    const marketplace = rawMarketplace.toLowerCase() as Marketplace;
    if (!MARKETPLACES.includes(marketplace)) {
      return NextResponse.json({ detail: "Unsupported marketplace" }, { status: 400 });
    }
    const secret = process.env.INGESTION_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ detail: "Webhook secret is not configured" }, { status: 503 });
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    const files: { name: string; buffer: Buffer }[] = [];
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const file of form.getAll("files") as File[]) {
        files.push({ name: file.name, buffer: Buffer.from(await file.arrayBuffer()) });
      }
    } else if (contentType.includes("application/pdf")) {
      files.push({
        name: req.headers.get("x-filename") || `${marketplace}-${Date.now()}.pdf`,
        buffer: Buffer.from(await req.arrayBuffer()),
      });
    } else {
      const body = await req.json();
      for (const file of body.files || []) {
        files.push({ name: String(file.name || `${marketplace}.pdf`), buffer: Buffer.from(String(file.base64), "base64") });
      }
    }
    if (!files.length) return NextResponse.json({ detail: "At least one PDF is required" }, { status: 400 });
    if (files.some((file) => file.buffer.length > 50 * 1024 * 1024)) {
      return NextResponse.json({ detail: "Each PDF must be 50 MB or smaller" }, { status: 413 });
    }

    const result = await processMarketplacePdfs({ marketplace, files, source: "webhook" });
    return NextResponse.json(batchResponse(result.batch, result.diagnostics, "sku_grouped"), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Webhook ingestion failed", parser_diagnostics: error?.diagnostics }, {
      status: Number(error?.status) || 500,
    });
  }
}
