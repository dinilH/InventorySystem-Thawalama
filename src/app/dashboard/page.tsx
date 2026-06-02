"use client";

import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { ThemeToggle } from "../../components/ThemeToggle";
import DepartmentDashboard from "../../components/DepartmentDashboard";
import AccountantDashboard from "../../components/AccountantDashboard";
import StorekeeperDashboard from "../../components/StorekeeperDashboard";
import { LogOut, ClipboardList, History, Package, BarChart3, PackageOpen, ShoppingCart, User, Bell } from "lucide-react";

export default function DashboardPage() {
  const { currentUser, loading, logout, requests } = useData();
  const [activeTab, setActiveTab] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Set default active tab based on user role when loaded
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "Department") {
        setActiveTab("request");
      } else if (currentUser.role === "Accountant") {
        setActiveTab("approvals");
      } else if (currentUser.role === "Storekeeper") {
        setActiveTab("inventory");
      }
    }
  }, [currentUser]);

  // Loading spinner
  if (loading || !currentUser || !activeTab) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "16px",
        color: "hsl(var(--text-muted))"
      }}>
        <div className="spinner" style={{
          width: "40px",
          height: "40px",
          border: "3px solid hsl(var(--border-color))",
          borderTopColor: "hsl(var(--accent-blue))",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <span>Syncing Database...</span>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Define navigation configuration based on role
  const getNavItems = () => {
    switch (currentUser.role) {
      case "Department":
        return [
          { id: "request", label: "New Request", icon: <ShoppingCart size={18} /> },
          { id: "history", label: "Request History", icon: <History size={18} /> },
          { id: "reports", label: "Expenditure Report", icon: <BarChart3 size={18} /> },
        ];
      case "Accountant":
        return [
          { id: "approvals", label: "Pending Approvals", icon: <ClipboardList size={18} /> },
          { id: "all-requests", label: "All Requests", icon: <History size={18} /> },
          { id: "inventory", label: "Stock Viewer", icon: <Package size={18} /> },
          { id: "reports", label: "Expenditure Report", icon: <BarChart3 size={18} /> },
        ];
      case "Storekeeper":
        return [
          { id: "inventory", label: "Inventory Control", icon: <Package size={18} /> },
          { id: "issue", label: "Issue Materials", icon: <PackageOpen size={18} /> },
          { id: "all-requests", label: "All Requests", icon: <History size={18} /> },
          { id: "reports", label: "Expenditure Report", icon: <BarChart3 size={18} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const activeNavItem = navItems.find(item => item.id === activeTab);

  return (
    <div className="dashboard-container">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Inventory Portal</h1>
          <span className="sidebar-subtitle">Thawalama DS</span>
        </div>

        {/* User Card */}
        <div className="user-profile-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "hsl(var(--bg-primary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid hsl(var(--border-color))",
              color: "hsl(var(--accent-blue))"
            }}>
              <User size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.name}
              </div>
              <span className={`user-role-badge role-${currentUser.role.toLowerCase()}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
          {currentUser.departmentName && (
            <div className="user-dept-name">
              Dept: {currentUser.departmentName}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}

          {/* Logout button at bottom */}
          <div className="nav-item logout-btn" onClick={logout}>
            <LogOut size={18} />
            Sign Out
          </div>
        </nav>
      </aside>

      {/* Main Panel Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <h2 className="top-bar-title">{activeNavItem ? activeNavItem.label : "Dashboard"}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "hsl(var(--text-muted))" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "hsl(var(--color-success))", display: "inline-block" }} />
              Connected to Live Database
            </div>

            {/* Notification Badge */}
            {(currentUser.role === "Accountant" || currentUser.role === "Storekeeper") && (
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border-color))",
                    backgroundColor: "hsl(var(--bg-tertiary))",
                    color: "hsl(var(--text-primary))",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  title={currentUser.role === "Accountant" ? "Pending Approvals" : "Pending Issues"}
                >
                  <Bell size={20} />
                  {(() => {
                    const pendingCount =
                      currentUser.role === "Accountant"
                        ? requests.filter((r) => r.status === "Pending").length
                        : requests.filter((r) => r.status === "Approved").length;

                    if (pendingCount > 0) {
                      return (
                        <span
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            backgroundColor: "hsl(var(--color-danger))",
                            color: "white",
                            fontSize: "10px",
                            fontWeight: "bold",
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid hsl(var(--bg-secondary))",
                          }}
                        >
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50px",
                      right: 0,
                      width: "320px",
                      backgroundColor: "hsl(var(--bg-secondary))",
                      border: "1px solid hsl(var(--border-color))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                      zIndex: 50,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div style={{ padding: "16px", borderBottom: "1px solid hsl(var(--border-color))", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "hsl(var(--bg-tertiary))" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Notifications</h3>
                      <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", color: "hsl(var(--text-muted))", cursor: "pointer" }}>
                        ✖
                      </button>
                    </div>
                    <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                      {(() => {
                        const targetStatus = currentUser.role === "Accountant" ? "Pending" : "Approved";
                        const pendingReqs = requests
                          .filter((r) => r.status === targetStatus)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                        if (pendingReqs.length === 0) {
                          return (
                            <div style={{ padding: "32px 16px", textAlign: "center", color: "hsl(var(--text-muted))", fontSize: "13px" }}>
                              No new notifications.
                            </div>
                          );
                        }

                        return pendingReqs.map(req => (
                          <div
                            key={req.id}
                            onClick={() => {
                              setShowNotifications(false);
                              setActiveTab(currentUser.role === "Accountant" ? "approvals" : "issue");
                            }}
                            style={{
                              padding: "16px",
                              borderBottom: "1px solid hsl(var(--border-color))",
                              cursor: "pointer",
                              transition: "background 0.2s",
                            }}
                            className="hover-bg-tertiary"
                          >
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--text-primary))", marginBottom: "4px" }}>
                              {currentUser.role === "Accountant" ? "New Approval Request" : "New Material to Issue"}
                            </div>
                            <div style={{ fontSize: "12px", color: "hsl(var(--text-secondary))", marginBottom: "6px" }}>
                              From: {req.departmentName}
                            </div>
                            <div style={{ fontSize: "11px", color: "hsl(var(--text-muted))" }}>
                              {new Date(req.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    <div
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab(currentUser.role === "Accountant" ? "approvals" : "issue");
                      }}
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "hsl(var(--accent-blue))",
                        backgroundColor: "hsl(var(--bg-tertiary))",
                        cursor: "pointer",
                        borderTop: "1px solid hsl(var(--border-color))"
                      }}
                      className="hover-text-blue-light"
                    >
                      View All
                    </div>
                  </div>
                )}
              </div>
            )}

            <ThemeToggle />
          </div>
        </header>

        <section className="content-body">
          {currentUser.role === "Department" && (
            <DepartmentDashboard activeTab={activeTab} />
          )}
          {currentUser.role === "Accountant" && (
            <AccountantDashboard activeTab={activeTab} />
          )}
          {currentUser.role === "Storekeeper" && (
            <StorekeeperDashboard activeTab={activeTab} />
          )}
        </section>
      </main>
    </div>
  );
}
