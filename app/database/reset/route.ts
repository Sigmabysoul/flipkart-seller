import { NextResponse } from "next/server";
import { resetStoreToDefault } from "@/lib/serverStore";

export async function POST() {
  try {
    const result = resetStoreToDefault();
    return NextResponse.json({
      status: "ok",
      message: "Database reset to initial factory demo seed.",
      result,
    });
  } catch (error: any) {
    console.error("[Database Reset Error]:", error);
    return NextResponse.json(
      { error: "Failed to reset database", detail: error?.message },
      { status: 500 }
    );
  }
}
