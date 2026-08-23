import { NextResponse } from "next/server";
import { clearLabelAndBatchData } from "@/lib/serverStore";

export async function POST() {
  try {
    const result = clearLabelAndBatchData();
    return NextResponse.json({
      status: "ok",
      message: "Old label and batch data successfully deleted. All SKU training, rules, and product catalog remain completely intact.",
      result,
    });
  } catch (error: any) {
    console.error("[Database Clear Labels Error]:", error);
    return NextResponse.json(
      { error: "Failed to clear label data", detail: error?.message },
      { status: 500 }
    );
  }
}
