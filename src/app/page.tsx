"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const cachedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (cachedUser) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      backgroundColor: "hsl(var(--bg-primary))",
      color: "hsl(var(--text-secondary))",
      fontSize: "14px",
      fontWeight: 500
    }}>
      Loading System...
    </div>
  );
}
