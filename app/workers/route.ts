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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ detail: "Worker ID is required" }, { status: 400 });
    }

    const worker = store.workers.find((w) => w.id === Number(body.id));
    if (!worker) {
      return NextResponse.json({ detail: "Worker not found" }, { status: 404 });
    }

    if (body.name !== undefined) worker.name = body.name.trim();
    if (body.phone !== undefined) worker.phone = body.phone.trim();
    if (body.active !== undefined) worker.active = Boolean(body.active);

    return NextResponse.json(worker);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ detail: "Worker ID is required" }, { status: 400 });

    const idx = store.workers.findIndex((w) => w.id === parseInt(id));
    if (idx === -1) return NextResponse.json({ detail: "Worker not found" }, { status: 404 });

    store.workers.splice(idx, 1);
    return NextResponse.json({ status: "deleted" });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
