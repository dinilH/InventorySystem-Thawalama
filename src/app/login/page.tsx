"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If user already logged in, redirect straight to dashboard
    if (localStorage.getItem("user")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Redirect
      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative"
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "420px",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: "24px",
            fontWeight: 700,
            background: "linear-gradient(135deg, hsl(var(--accent-blue)), hsl(var(--accent-teal)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "6px"
          }}>
            Inventory System
          </h1>
          <p style={{
            fontSize: "12px",
            color: "hsl(var(--text-muted))",
            textTransform: "uppercase",
            letterSpacing: "1.5px"
          }}>
            Thawalama Divisional Secretariat
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && (
            <div style={{
              backgroundColor: "hsl(var(--color-danger-bg))",
              border: "1px solid hsla(350, 80%, 55%, 0.2)",
              color: "hsl(350 100% 70%)",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              lineHeight: "1.4"
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="name@thawalama.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ width: "100%", marginTop: "8px", padding: "14px" }}
          >
            {loading ? (
              <span className="spinner" style={{
                display: "inline-block",
                width: "18px",
                height: "18px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "currentColor",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }} />
            ) : "Log In"}
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
