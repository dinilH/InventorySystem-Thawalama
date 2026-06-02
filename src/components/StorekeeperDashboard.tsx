"use client";

import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { PREDEFINED_ITEMS } from "../constants/predefinedItems";
import { Plus, Edit2, Check, X, Package, PackageOpen, History, BarChart3, Search, Calendar, AlertCircle, AlertTriangle } from "lucide-react";

interface StorekeeperDashboardProps {
  activeTab: string;
}

export default function StorekeeperDashboard({ activeTab }: StorekeeperDashboardProps) {
  const { inventory, requests, addInventoryItem, updateInventoryStock, issueRequest } = useData();

  // Search and modal states
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  
  // New inventory item form states
  const [newItemName, setNewItemName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newItemCat, setNewItemCat] = useState("Stationery");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  // Editing stock/price state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Confirmation state for issuing requests
  const [confirmIssueId, setConfirmIssueId] = useState<string | null>(null);

  // Track expanded requests in History tab
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

  // -------------------------------------------------------------
  // Inventory Control Logic
  // -------------------------------------------------------------
  const filteredStock = useMemo(() => {
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const filteredPredefinedItems = useMemo(() => {
    if (!newItemName) return [];
    return PREDEFINED_ITEMS.filter((item) =>
      item.toLowerCase().includes(newItemName.toLowerCase())
    ).slice(0, 5);
  }, [newItemName]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCat || !newItemStock || !newItemPrice) return;

    const success = await addInventoryItem({
      name: newItemName,
      category: newItemCat,
      stockQuantity: parseInt(newItemStock, 10) || 0,
      unitPrice: parseFloat(newItemPrice) || 0,
    });

    if (success) {
      setModalVisible(false);
      setNewItemName("");
      setNewItemCat("Stationery");
      setNewItemStock("");
      setNewItemPrice("");
    }
  };

  const startEdit = (id: string, currentStock: number, currentPrice?: number) => {
    setEditingItemId(id);
    setEditStock(currentStock.toString());
    setEditPrice((currentPrice ?? 0).toString());
  };

  const saveEdit = async (id: string) => {
    const success = await updateInventoryStock(id, parseInt(editStock, 10) || 0, parseFloat(editPrice) || 0);
    if (success) {
      setEditingItemId(null);
    }
  };

  // -------------------------------------------------------------
  // Issue Materials Logic
  // -------------------------------------------------------------
  const approvedRequests = useMemo(() => {
    return requests
      .filter((r) => r.status === "Approved")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [requests]);

  const handleConfirmIssue = async () => {
    if (!confirmIssueId) return;
    await issueRequest(confirmIssueId);
    setConfirmIssueId(null);
  };

  // -------------------------------------------------------------
  // Reports Logic
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
  if (activeTab === "inventory") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Stock Management</h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "240px", position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", color: "hsl(var(--text-muted))" }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search stock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", paddingLeft: "36px", paddingBlock: "6px" }}
              />
            </div>
            <button className="btn hover-scale" onClick={() => setModalVisible(true)} style={{ paddingBlock: "6px" }}>
              <Plus size={16} /> Add Material
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Category</th>
                <th style={{ width: "140px" }}>Stock Qty</th>
                <th style={{ width: "150px" }}>Unit Price</th>
                <th style={{ textAlign: "right", width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "hsl(var(--text-muted))", padding: "40px" }}>
                    No stock records found.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const isEditing = editingItemId === item.id;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>
                        <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-tertiary))", padding: "4px 8px", borderRadius: "6px" }}>
                          {item.category}
                        </span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            className="input-field"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            style={{ width: "80px", padding: "4px 8px", textAlign: "center" }}
                          />
                        ) : (
                          <span style={{ color: item.stockQuantity < 10 ? "hsl(var(--color-danger))" : "hsl(var(--text-primary))", fontWeight: 600 }}>
                            {item.stockQuantity}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            className="input-field"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            style={{ width: "100px", padding: "4px 8px" }}
                          />
                        ) : (
                          <span>Rs. {(item.unitPrice ?? 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => saveEdit(item.id)}
                              style={{ background: "none", border: "none", color: "hsl(var(--color-success))", cursor: "pointer" }}
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              style={{ background: "none", border: "none", color: "hsl(var(--color-danger))", cursor: "pointer" }}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item.id, item.stockQuantity, item.unitPrice)}
                            style={{ background: "none", border: "none", color: "hsl(var(--text-secondary))", cursor: "pointer", display: "inline-flex", gap: "6px", alignItems: "center" }}
                          >
                            <Edit2 size={15} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add Material Modal */}
        {modalVisible && (
          <div className="modal-overlay">
            <form onSubmit={handleAddItem} className="modal-content" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Add New Material</h3>
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  style={{ background: "none", border: "none", color: "hsl(var(--text-muted))", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="form-group" style={{ zIndex: 10 }}>
                <label className="form-label">Material Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. A4 Paper"
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  required
                  autoComplete="off"
                />
                {showSuggestions && filteredPredefinedItems.length > 0 && (
                  <div className="suggestions-box">
                    {filteredPredefinedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="suggestion-item"
                        onClick={() => {
                          setNewItemName(item);
                          setShowSuggestions(false);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Stationery"
                  value={newItemCat}
                  onChange={(e) => setNewItemCat(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Unit Price (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalVisible(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "issue") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Approved Requests Waiting for Issue</h2>

        {approvedRequests.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-secondary))", border: "1px dashed hsl(var(--border-color))", borderRadius: "12px" }}>
            <PackageOpen size={40} style={{ opacity: 0.3 }} />
            <span>No approved requests waiting to be issued.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {approvedRequests.map((req) => (
              <div key={req.id} className="content-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{req.departmentName}</h3>
                    <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <Calendar size={12} /> Approved: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="status-badge status-approved">Approved</span>
                </div>

                <div style={{ backgroundColor: "hsl(var(--bg-tertiary))", padding: "16px", borderRadius: "10px", border: "1px solid hsl(var(--border-color))" }}>
                  <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", fontWeight: 600, display: "block", marginBottom: "8px" }}>Items to Issue:</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {req.items.map((item, idx) => {
                      const details = inventory.find((inv) => inv.id === item.itemId);
                      const isLowStock = (details?.stockQuantity || 0) < item.quantity;
                      return (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                          <span>• {details?.name || "Unknown Material"}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {isLowStock && (
                              <span style={{ color: "hsl(var(--color-danger))", fontSize: "11px", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                                <AlertTriangle size={12} /> Stock is only {details?.stockQuantity || 0}
                              </span>
                            )}
                            <span style={{ fontWeight: 600 }}>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn hover-scale"
                    onClick={() => setConfirmIssueId(req.id)}
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    <PackageOpen size={16} /> Mark as Issued
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmIssueId && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "400px", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Confirm Material Issue</h3>
              <p style={{ fontSize: "14px", color: "hsl(var(--text-secondary))", lineHeight: "1.5" }}>
                This will deduct the items from the inventory stock and log the department expenditure. Do you want to proceed?
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px" }}>
                <button className="btn btn-secondary" onClick={() => setConfirmIssueId(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button className="btn" onClick={handleConfirmIssue} style={{ flex: 1 }}>
                  Yes, Issue Items
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "all-requests") {
    // Show request list, same as Accountant
    const allReqs = requests;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Request Archive</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "240px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", color: "hsl(var(--text-muted))" }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", paddingLeft: "36px", paddingBlock: "6px" }}
            />
          </div>
        </div>

        {allReqs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-secondary))", border: "1px dashed hsl(var(--border-color))", borderRadius: "12px" }}>
            <History size={40} style={{ opacity: 0.3 }} />
            <span>No requests in database.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {allReqs
              .filter((r) => r.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((req) => {
                const isExpanded = expandedRequests[req.id];
                return (
                  <div
                    key={req.id}
                    className="content-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpandedRequests({ ...expandedRequests, [req.id]: !isExpanded })}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: 600 }}>{req.departmentName}</h3>
                        <span style={{ fontSize: "12px", color: "hsl(var(--text-muted))", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <Calendar size={12} /> {new Date(req.createdAt).toLocaleDateString()}
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

  if (activeTab === "reports") {
    // Show expenditure reports, same as Accountant
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BarChart3 size={20} style={{ color: "hsl(var(--accent-blue))" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Expenditure Analysis Logs</h2>
        </div>

        {reportData.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px", color: "hsl(var(--text-muted))", backgroundColor: "hsl(var(--bg-secondary))", border: "1px dashed hsl(var(--border-color))", borderRadius: "12px" }}>
            <AlertCircle size={40} style={{ opacity: 0.3 }} />
            <span>No expenditure logs recorded.</span>
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
