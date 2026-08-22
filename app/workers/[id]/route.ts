import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workerId = parseInt(id);
  const worker = store.workers.find((w) => w.id === workerId);
  if (!worker) return NextResponse.json({ detail: "Worker not found" }, { status: 404 });

  const body = await req.json();
  if (body.name !== undefined) worker.name = body.name.trim();
  if (body.phone !== undefined) worker.phone = body.phone.trim();
  if (body.active !== undefined) worker.active = Boolean(body.active);

  return NextResponse.json(worker);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workerId = parseInt(id);
  const worker = store.workers.find((w) => w.id === workerId);
  if (!worker) return NextResponse.json({ detail: "Worker not found" }, { status: 404 });

  worker.active = false;
  return NextResponse.json({ status: "deactivated", worker });
}
