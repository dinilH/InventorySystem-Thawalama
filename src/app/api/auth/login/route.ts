import { NextRequest, NextResponse } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const uid = userCredential.user.uid;

    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const user = {
        id: uid,
        name: userData.name || "",
        role: userData.role || "Department",
        departmentName: userData.departmentName,
      };
      return NextResponse.json({ success: true, user });
    } else {
      return NextResponse.json(
        { error: "User profile not found in database" },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    console.error("Login error:", error);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
