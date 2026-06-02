import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

// GET /api/inventory — list all inventory items
export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    const items: Record<string, unknown>[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return NextResponse.json(items);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/inventory — add a new inventory item
export async function POST(req: NextRequest) {
  const { name, category, stockQuantity, unitPrice } = await req.json();

  if (
    !name ||
    !category ||
    stockQuantity === undefined ||
    unitPrice === undefined
  ) {
    return NextResponse.json(
      { error: "Missing required inventory fields" },
      { status: 400 }
    );
  }

  try {
    const newItem = {
      name,
      category,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
    };
    const docRef = await addDoc(collection(db, "inventory"), newItem);
    return NextResponse.json(
      { success: true, item: { id: docRef.id, ...newItem } },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to add inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
