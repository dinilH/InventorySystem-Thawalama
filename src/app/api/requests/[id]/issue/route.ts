import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

interface RequestItem {
  itemId: string;
  quantity: number;
}

interface MaterialRequest {
  departmentId: string;
  departmentName: string;
  items: RequestItem[];
  status: string;
  createdAt: string;
  totalCost?: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unitPrice: number;
}

// POST /api/requests/[id]/issue — issue an approved request, deduct stock, calculate cost
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Fetch the request
    const requestDoc = await getDoc(doc(db, "requests", id));
    if (!requestDoc.exists()) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const requestData = requestDoc.data() as MaterialRequest;
    if (requestData.status !== "Approved") {
      return NextResponse.json(
        { error: "Only approved requests can be issued" },
        { status: 400 }
      );
    }

    // 2. Fetch full inventory snapshot to get prices and current stock
    const inventorySnapshot = await getDocs(collection(db, "inventory"));
    const inventoryMap = new Map<string, InventoryItem>();
    inventorySnapshot.forEach((doc) => {
      inventoryMap.set(doc.id, { id: doc.id, ...doc.data() } as InventoryItem);
    });

    const batch = writeBatch(db);
    let totalCost = 0;

    // 3. Deduct stock and calculate total cost
    for (const reqItem of requestData.items) {
      const invItem = inventoryMap.get(reqItem.itemId);
      if (invItem) {
        const newStock = Math.max(0, invItem.stockQuantity - reqItem.quantity);
        batch.update(doc(db, "inventory", reqItem.itemId), {
          stockQuantity: newStock,
        });
        totalCost += (invItem.unitPrice || 0) * reqItem.quantity;
      }
    }

    // 4. Mark request as Issued with totalCost
    batch.update(doc(db, "requests", id), { status: "Issued", totalCost });

    // 5. Commit the batch transaction atomically
    await batch.commit();

    return NextResponse.json({ success: true, totalCost });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to issue request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
