import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET() {
  return NextResponse.json(store.workers);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ detail: "Worker name is required" }, { status: 400 });
    }

    const newWorker = {
      id: store.nextId.worker++,
      name: body.name.trim(),
      active: true,
      phone: body.phone?.trim() || "",
      created_at: new Date().toISOString(),
    };

    store.workers.push(newWorker);
    return NextResponse.json(newWorker, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
