import { NextResponse } from "next/server";
import { store, saveStoreToDisk } from "@/lib/serverStore";

export async function GET() {
  saveStoreToDisk(store);
  return NextResponse.json(store);
}

export async function POST(req: Request) {
  try {
    const newStoreData = await req.json();
    if (!newStoreData || !Array.isArray(newStoreData.products) || !Array.isArray(newStoreData.skuMappings)) {
      return NextResponse.json(
        { error: "Invalid database structure. Must contain products and skuMappings arrays." },
        { status: 400 }
      );
    }

    Object.assign(store, newStoreData);
    saveStoreToDisk(store);

    return NextResponse.json({
      status: "ok",
      message: "Database imported and saved successfully.",
      stats: {
        products: store.products.length,
        skuMappings: store.skuMappings.length,
        batches: store.batches.length,
        shipments: store.shipments.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to import database", detail: err?.message },
      { status: 500 }
    );
  }
}
