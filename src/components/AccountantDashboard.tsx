"use client";

import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { Check, X, ClipboardList, History, Package, BarChart3, Search, Calendar, AlertCircle } from "lucide-react";

interface AccountantDashboardProps {
  activeTab: string;
}

export default function AccountantDashboard({ activeTab }: AccountantDashboardProps) {
  const { inventory, requests, updateRequestStatus } = useData();

  // State to manage search/filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "Approved" | "Rejected" } | null>(null);
  
  // Track expanded requests in History tab
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

  // -------------------------------------------------------------
  // Pending Approvals Logic
  // -------------------------------------------------------------
  const pendingRequests = useMemo(() => {
    return requests
      .filter((r) => r.status === "Pending")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [requests]);

  const handleActionConfirm = async () => {
    if (!confirmModal) return;
    const { id, action } = confirmModal;
    await updateRequestStatus(id, action);
    setConfirmModal(null);
  };

  // -------------------------------------------------------------
  // All Requests Logic
  // -------------------------------------------------------------
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch = r.departmentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const toggleExpandRequest = (id: string) => {
    setExpandedRequests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // -------------------------------------------------------------
  // Stock Viewer Logic
  // -------------------------------------------------------------
  const filteredStock = useMemo(() => {
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  // -------------------------------------------------------------
  // Reports Logic (Grouping issued requests by month, then department)
  // -------------------------------------------------------------
  const reportData = useMemo(() => {
    const issuedRequests = requests.filter((r) => r.status === "Issued");
    const grouped: Record<string, Record<string, number>> = {};

    issuedRequests.forEach((req) => {
      const date = new Date(req.createdAt);
      const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = {};
      }
      
      const dept = req.departmentName || "Unknown Department";
      if (!grouped[monthYear][dept]) {
        grouped[monthYear][dept] = 0;
      }
      grouped[monthYear][dept] += req.totalCost || 0;
    });

    return Object.entries(grouped)
      .map(([month, depts]) => ({
        month,
        departments: Object.entries(depts).map(([name, total]) => ({ name, total })),
        totalMonthCost: Object.values(depts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
  }, [requests]);

  // -------------------------------------------------------------
  // Tab Renderings
  // -------------------------------------------------------------
  if (activeTab === "approvals") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Requests Awaiting Approvals</h2>

        {pendingRequests.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-secondary))", border: "1px dashed hsl(var(--border-color))", borderRadius: "12px" }}>
            <ClipboardList size={40} style={{ opacity: 0.3 }} />
            <span>No pending requests to approve at the moment.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {pendingRequests.map((req) => (
              <div key={req.id} className="content-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{req.departmentName}</h3>
                    <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <Calendar size={12} /> {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className="status-badge status-pending">Pending</span>
                </div>

                <div style={{ backgroundColor: "hsl(var(--bg-tertiary))", padding: "16px", borderRadius: "10px", border: "1px solid hsl(var(--border-color))" }}>
                  <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", fontWeight: 600, display: "block", marginBottom: "8px" }}>Requested Items:</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {req.items.map((item, idx) => {
                      const details = inventory.find((inv) => inv.id === item.itemId);
                      return (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                          <span>• {details?.name || "Unknown Material"}</span>
                          <span style={{ fontWeight: 600 }}>Qty: {item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="content-card-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    className="btn btn-danger hover-scale"
                    onClick={() => setConfirmModal({ id: req.id, action: "Rejected" })}
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    <X size={16} /> Reject
                  </button>
                  <button
                    className="btn btn-success hover-scale"
                    onClick={() => setConfirmModal({ id: req.id, action: "Approved" })}
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "400px", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Confirm Action</h3>
              <p style={{ fontSize: "14px", color: "hsl(var(--text-secondary))", lineHeight: "1.5" }}>
                Are you sure you want to mark this request as <strong>{confirmModal.action}</strong>?
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setConfirmModal(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  className={confirmModal.action === "Approved" ? "btn btn-success" : "btn btn-danger"}
                  onClick={handleActionConfirm}
                  style={{ flex: 1 }}
                >
                  Yes, Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "all-requests") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="dashboard-tab-header">
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>All Material Requests</h2>
          <div className="filters-container">
            <div className="search-container">
              <Search size={16} style={{ position: "absolute", left: "12px", color: "hsl(var(--text-muted))", zIndex: 10 }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", paddingLeft: "36px", paddingBlock: "6px" }}
              />
            </div>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ paddingBlock: "6px", cursor: "pointer" }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Issued">Issued</option>
            </select>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-secondary))", border: "1px dashed hsl(var(--border-color))", borderRadius: "12px" }}>
            <History size={40} style={{ opacity: 0.3 }} />
            <span>No requests found matching the current filters.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredRequests.map((req) => {
              const isExpanded = expandedRequests[req.id];
              return (
                <div
                  key={req.id}
                  className="content-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleExpandRequest(req.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: 600 }}>{req.departmentName}</h3>
                      <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        <Calendar size={12} /> {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid hsl(var(--border-color))" }}>
                      <h4 style={{ fontSize: "12px", fontWeight: 600, color: "hsl(var(--text-secondary))", marginBottom: "8px" }}>Requested Items:</h4>
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

  if (activeTab === "inventory") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="dashboard-tab-header">
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Current Stock Levels</h2>
          <div className="search-container">
            <Search size={16} style={{ position: "absolute", left: "12px", color: "hsl(var(--text-muted))", zIndex: 10 }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search stock..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", paddingLeft: "36px", paddingBlock: "6px" }}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Category</th>
                <th>Stock Quantity</th>
                <th>Unit Price (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "hsl(var(--text-muted))", padding: "40px" }}>
                    No stock records found.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>
                      <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-tertiary))", padding: "4px 8px", borderRadius: "6px" }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: item.stockQuantity < 10 ? "hsl(var(--color-danger))" : "hsl(var(--text-primary))", fontWeight: 600 }}>
                        {item.stockQuantity} {item.stockQuantity < 10 && " (Low Stock)"}
                      </span>
                    </td>
                    <td>Rs. {(item.unitPrice ?? 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === "reports") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BarChart3 size={20} style={{ color: "hsl(var(--accent-blue))" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Overall Expenditure Analysis</h2>
        </div>

        {reportData.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-secondary))", border: "1px dashed hsl(var(--border-color))", borderRadius: "12px" }}>
            <AlertCircle size={40} style={{ opacity: 0.3 }} />
            <span>No issued request data available to run expenditure metrics.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {reportData.map((data, idx) => (
              <div key={idx} className="content-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid hsl(var(--border-color))" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700 }}>{data.month}</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "hsl(var(--accent-blue))" }}>
                    Total: Rs. {data.totalMonthCost.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.departments.map((dept, dIdx) => (
                    <div key={dIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                      <span style={{ color: "hsl(var(--text-secondary))" }}>{dept.name}</span>
                      <span style={{ fontWeight: 600 }}>Rs. {dept.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
