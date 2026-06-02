import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

// GET /api/requests — list all material requests, sorted newest first
export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "requests"));
    const requests: Record<string, unknown>[] = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    requests.sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime()
    );
    return NextResponse.json(requests);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch requests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/requests — create a new material request
export async function POST(req: NextRequest) {
  const { departmentId, departmentName, items } = await req.json();

  if (
    !departmentId ||
    !departmentName ||
    !items ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return NextResponse.json(
      { error: "Invalid or missing request fields" },
      { status: 400 }
    );
  }

  try {
    const newRequest = {
      departmentId,
      departmentName,
      items,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "requests"), newRequest);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
