import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

// PUT /api/requests/[id]/status — approve or reject a request
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  if (!status || (status !== "Approved" && status !== "Rejected")) {
    return NextResponse.json(
      { error: "Status must be Approved or Rejected" },
      { status: 400 }
    );
  }

  try {
    await updateDoc(doc(db, "requests", id), { status });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update request status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
