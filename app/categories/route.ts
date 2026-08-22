import { NextResponse } from "next/server";
import { store } from "@/lib/serverStore";

export async function GET() {
  return NextResponse.json(store.categories);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ detail: "Category name is required" }, { status: 400 });
    }

    const name = body.name.trim();
    const existing = store.categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return NextResponse.json({ detail: "Category already exists" }, { status: 409 });
    }

    const newCat = {
      id: store.nextId.category++,
      name,
      description: body.description?.trim() || "",
    };

    store.categories.push(newCat);
    return NextResponse.json(newCat, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
