import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET() {
  return NextResponse.json(store.patternRules);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.value || !body.rule_type) {
      return NextResponse.json({ detail: "rule_type and value are required" }, { status: 400 });
    }

    const newRule = {
      id: store.nextId.rule++,
      rule_type: body.rule_type,
      value: body.value.trim(),
      product_id: body.product_id ? Number(body.product_id) : null,
      suggested_worker: body.suggested_worker || null,
      priority: Number(body.priority) || 10,
      active: true,
    };

    store.patternRules.push(newRule);
    return NextResponse.json(newRule, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ detail: "Rule ID required" }, { status: 400 });

    const index = store.patternRules.findIndex((r) => r.id === parseInt(id));
    if (index === -1) return NextResponse.json({ detail: "Rule not found" }, { status: 404 });

    store.patternRules.splice(index, 1);
    return NextResponse.json({ status: "deleted" });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
