import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipmentId = parseInt(id);
  const shipment = store.shipments.find((s) => s.id === shipmentId || s.awb === id);
  if (!shipment) return NextResponse.json({ detail: "Shipment not found" }, { status: 404 });

  return NextResponse.json(shipment);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipmentId = parseInt(id);
  const shipment = store.shipments.find((s) => s.id === shipmentId || s.awb === id);
  if (!shipment) return NextResponse.json({ detail: "Shipment not found" }, { status: 404 });

  const body = await req.json();
  if (body.assigned_worker) {
    for (const item of shipment.items) {
      item.assigned_worker = body.assigned_worker;
    }
  }
  if (body.mismatch_status) {
    shipment.mismatch_status = body.mismatch_status;
  }

  shipment.last_seen_at = new Date().toISOString();
  return NextResponse.json(shipment);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipmentId = parseInt(id);
  const index = store.shipments.findIndex((s) => s.id === shipmentId || s.awb === id);
  if (index === -1) return NextResponse.json({ detail: "Shipment not found" }, { status: 404 });

  const [removed] = store.shipments.splice(index, 1);
  return NextResponse.json({ status: "deleted", shipment: removed });
}
