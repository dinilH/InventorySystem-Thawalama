import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

// PUT /api/inventory/[id] — update stock quantity and/or unit price
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { stockQuantity, unitPrice } = await req.json();

  if (stockQuantity === undefined && unitPrice === undefined) {
    return NextResponse.json(
      { error: "Please provide stockQuantity or unitPrice to update" },
      { status: 400 }
    );
  }

  try {
    const updateData: Record<string, number> = {};
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = parseInt(stockQuantity, 10) || 0;
    }
    if (unitPrice !== undefined) {
      updateData.unitPrice = parseFloat(unitPrice) || 0;
    }
    await updateDoc(doc(db, "inventory", id), updateData);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
