"use client";

import React, { useState, useMemo } from "react";
import { useData, RequestItem, InventoryItem } from "../context/DataContext";
import { Plus, Minus, Trash2, Search, ShoppingCart, History, BarChart3, Calendar, AlertCircle } from "lucide-react";

interface DepartmentDashboardProps {
  activeTab: string;
}

export default function DepartmentDashboard({ activeTab }: DepartmentDashboardProps) {
  const { inventory, requests, currentUser, createRequest } = useData();

  // Search query for inventory items
  const [searchQuery, setSearchQuery] = useState("");
  // Selected items in the request basket
  const [basket, setBasket] = useState<RequestItem[]>([]);
  // Success / error message notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // Track expanded request IDs in History tab
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

  // -------------------------------------------------------------
  // Request Tab logic
  // -------------------------------------------------------------
  const filteredInventory = useMemo(() => {
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const addToBasket = (itemId: string) => {
    const existing = basket.find((i) => i.itemId === itemId);
    if (existing) {
      // Just ignore or increment quantity
      setBasket(
        basket.map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      setBasket([...basket, { itemId, quantity: 1 }]);
    }
  };

  const updateBasketQuantity = (itemId: string, delta: number) => {
    setBasket(
      basket
        .map((item) => {
          if (item.itemId === itemId) {
            const newQ = item.quantity + delta;
            return { ...item, quantity: newQ > 0 ? newQ : 1 };
          }
          return item;
        })
    );
  };

  const removeFromBasket = (itemId: string) => {
    setBasket(basket.filter((i) => i.itemId !== itemId));
  };

  const handleSubmitRequest = async () => {
    if (basket.length === 0) return;
    
    const success = await createRequest(basket);
    if (success) {
      setBasket([]);
      setNotification({ type: "success", text: "Material request submitted successfully!" });
      setTimeout(() => setNotification(null), 5000);
    } else {
      setNotification({ type: "error", text: "Failed to submit request. Please try again." });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // -------------------------------------------------------------
  // History Tab logic
  // -------------------------------------------------------------
  const myRequests = useMemo(() => {
    if (!currentUser) return [];
    return requests.filter((r) => r.departmentId === currentUser.id);
  }, [requests, currentUser]);

  const toggleExpandRequest = (id: string) => {
    setExpandedRequests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // -------------------------------------------------------------
  // Reports Tab logic (replicates MonthlyReport.tsx)
  // -------------------------------------------------------------
  const reportData = useMemo(() => {
    if (!currentUser) return [];
    
    // Only Issued requests for my department
    const filteredRequests = requests.filter(
      (r) => r.status === "Issued" && r.departmentId === currentUser.id
    );

    const grouped: Record<string, number> = {};

    filteredRequests.forEach((req) => {
      const date = new Date(req.createdAt);
      const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" });
      if (!grouped[monthYear]) {
        grouped[monthYear] = 0;
      }
      grouped[monthYear] += req.totalCost || 0;
    });

    // Convert to array and sort descending by date
    return Object.entries(grouped)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
  }, [requests, currentUser]);

  // Max expenditure month for CSS bar graphs relative heights
  const maxExpenditure = useMemo(() => {
    if (reportData.length === 0) return 1;
    return Math.max(...reportData.map((d) => d.total));
  }, [reportData]);

  // -------------------------------------------------------------
  // Tab Renderings
  // -------------------------------------------------------------
  if (activeTab === "request") {
    return (
      <div className="catalog-basket-container">
        {/* Catalog Side */}
        <div className="catalog-side">
          <div className="dashboard-tab-header">
            <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Material Catalog</h2>
            <div className="search-container">
              <Search size={16} style={{ position: "absolute", left: "12px", color: "hsl(var(--text-muted))", zIndex: 10 }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", paddingLeft: "36px", paddingBlock: "8px" }}
              />
            </div>
          </div>

          <div className="table-container" style={{ flexGrow: 1, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Available Stock</th>
                  <th>Unit Price (Rs.)</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "hsl(var(--text-muted))", padding: "40px" }}>
                      No inventory items found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>
                        <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-tertiary))", padding: "4px 8px", borderRadius: "6px" }}>
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: item.stockQuantity < 10 ? "hsl(var(--color-danger))" : "hsl(var(--text-primary))", fontWeight: 600 }}>
                          {item.stockQuantity}
                        </span>
                      </td>
                      <td>Rs. {(item.unitPrice ?? 0).toFixed(2)}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-secondary hover-scale"
                          onClick={() => addToBasket(item.id)}
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          disabled={item.stockQuantity <= 0}
                        >
                          <Plus size={14} /> Add to Request
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Request Basket Side */}
        <div className="glass-panel basket-side">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart size={20} style={{ color: "hsl(var(--accent-blue))" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Request Basket</h2>
          </div>

          {notification && (
            <div style={{
              backgroundColor: notification.type === "success" ? "hsl(var(--color-success-bg))" : "hsl(var(--color-danger-bg))",
              border: `1px solid ${notification.type === "success" ? "hsla(142, 70%, 45%, 0.2)" : "hsla(350, 80%, 55%, 0.2)"}`,
              color: notification.type === "success" ? "hsl(142 80% 70%)" : "hsl(350 100% 70%)",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "12px"
            }}>
              {notification.text}
            </div>
          )}

          <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            {basket.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "hsl(var(--text-muted))", padding: "40px 0" }}>
                <ShoppingCart size={32} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: "13px", fontStyle: "italic", textAlign: "center" }}>No items selected. Add materials from the catalog on the left.</span>
              </div>
            ) : (
              basket.map((item) => {
                const details = inventory.find((inv) => inv.id === item.itemId);
                return (
                  <div key={item.itemId} style={{
                    backgroundColor: "hsl(var(--bg-tertiary))",
                    border: "1px solid hsl(var(--border-color))",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--text-primary))", flex: 1 }}>
                        {details?.name || "Unknown Item"}
                      </span>
                      <button
                        onClick={() => removeFromBasket(item.itemId)}
                        style={{ background: "none", border: "none", color: "hsl(var(--color-danger))", cursor: "pointer", opacity: 0.7 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))" }}>
                        Stock: {details?.stockQuantity ?? 0}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                          onClick={() => updateBasketQuantity(item.itemId, -1)}
                          style={{ border: "none", background: "hsl(var(--bg-tertiary))", width: "24px", height: "24px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--text-primary))", cursor: "pointer" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: "14px", fontWeight: 600, minWidth: "20px", textAlign: "center", color: "hsl(var(--text-primary))" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateBasketQuantity(item.itemId, 1)}
                          style={{ border: "none", background: "hsl(var(--bg-tertiary))", width: "24px", height: "24px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--text-primary))", cursor: "pointer" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            className="btn"
            style={{ width: "100%", padding: "14px" }}
            disabled={basket.length === 0}
            onClick={handleSubmitRequest}
          >
            Submit Material Request
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === "history") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>My Material Requests</h2>

        {myRequests.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-secondary))", border: "1px dashed hsl(var(--border-color))", borderRadius: "12px" }}>
            <History size={40} style={{ opacity: 0.3 }} />
            <span>You have not submitted any requests yet.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {myRequests.map((req) => {
              const isExpanded = expandedRequests[req.id];
              const dateString = new Date(req.createdAt).toLocaleDateString();
              const timeString = new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <div
                  key={req.id}
                  className="content-card"
                  style={{ cursor: "pointer", borderLeft: `4px solid ${req.status === "Pending" ? "hsl(var(--color-pending))" : req.status === "Approved" ? "hsl(var(--color-info))" : req.status === "Issued" ? "hsl(var(--color-success))" : "hsl(var(--color-danger))"}` }}
                  onClick={() => toggleExpandRequest(req.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600 }}>Request #{req.id.slice(-6).toUpperCase()}</span>
                      <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={12} /> {dateString} at {timeString}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      {req.status === "Issued" && req.totalCost !== undefined && (
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "hsl(var(--accent-teal))" }}>
                          Cost: Rs. {req.totalCost.toFixed(2)}
                        </span>
                      )}
                      <span className={`status-badge status-${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid hsl(var(--border-color))" }}>
                      <h4 style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--text-secondary))", marginBottom: "10px" }}>Requested Items:</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {req.items.map((item, idx) => {
                          const details = inventory.find((inv) => inv.id === item.itemId);
                          return (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "hsl(var(--text-secondary))" }}>
                              <span>• {details?.name || "Unknown Material"}</span>
                              <span style={{ fontWeight: 600 }}>Qty: {item.quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "reports") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BarChart3 size={20} style={{ color: "hsl(var(--accent-blue))" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Monthly Expenditure Report</h2>
        </div>

        {reportData.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-secondary))", border: "1px dashed hsl(var(--border-color))", borderRadius: "12px" }}>
            <AlertCircle size={40} style={{ opacity: 0.3 }} />
            <span>No issued items found to generate expenditure reports.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {reportData.map((data, idx) => {
              const percentage = (data.total / maxExpenditure) * 100;
              return (
                <div key={idx} className="content-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "15px", fontWeight: 600 }}>{data.month}</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "hsl(var(--accent-teal))" }}>
                      Rs. {data.total.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* CSS Progress Graph Bar */}
                  <div style={{ width: "100%", height: "12px", backgroundColor: "hsl(var(--bg-tertiary))", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, hsl(var(--accent-blue)), hsl(var(--accent-teal)))",
                      borderRadius: "6px",
                      transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
