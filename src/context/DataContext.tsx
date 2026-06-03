"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Role = "Department" | "Accountant" | "Storekeeper";

export interface User {
  id: string;
  name: string;
  role: Role;
  departmentName?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unitPrice: number;
}

export interface RequestItem {
  itemId: string;
  quantity: number;
}

export interface MaterialRequest {
  id: string;
  departmentId: string;
  departmentName: string;
  items: RequestItem[];
  status: "Pending" | "Approved" | "Rejected" | "Issued";
  createdAt: string;
  totalCost?: number;
}

interface DataContextType {
  currentUser: User | null;
  inventory: InventoryItem[];
  requests: MaterialRequest[];
  loading: boolean;
  logout: () => void;
  createRequest: (items: RequestItem[]) => Promise<boolean>;
  updateRequestStatus: (
    requestId: string,
    status: "Approved" | "Rejected"
  ) => Promise<boolean>;
  issueRequest: (requestId: string) => Promise<boolean>;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => Promise<boolean>;
  updateInventoryStock: (
    itemId: string,
    stockQuantity: number,
    unitPrice?: number
  ) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load session from localStorage/sessionStorage on startup ──────────────
  useEffect(() => {
    const cachedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (cachedUser) {
      setCurrentUser(JSON.parse(cachedUser));
    } else {
      router.replace("/login");
    }
  }, [router]);

  // ── Real-time Firestore listeners (replace Socket.IO) ─────────────────────
  useEffect(() => {
    if (!currentUser) return;

    let inventoryReady = false;
    let requestsReady = false;

    const checkReady = () => {
      if (inventoryReady && requestsReady) setLoading(false);
    };

    // Subscribe to inventory collection
    const unsubInventory = onSnapshot(
      collection(db, "inventory"),
      (snapshot) => {
        const items: InventoryItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as InventoryItem);
        });
        setInventory(items);
        inventoryReady = true;
        checkReady();
      },
      (error) => {
        console.error("Inventory listener error:", error);
        inventoryReady = true;
        checkReady();
      }
    );

    // Subscribe to requests collection, sorted by createdAt descending
    const unsubRequests = onSnapshot(
      query(collection(db, "requests"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const reqs: MaterialRequest[] = [];
        snapshot.forEach((doc) => {
          reqs.push({ id: doc.id, ...doc.data() } as MaterialRequest);
        });
        setRequests(reqs);
        requestsReady = true;
        checkReady();
      },
      (error) => {
        console.error("Requests listener error:", error);
        requestsReady = true;
        checkReady();
      }
    );

    return () => {
      unsubInventory();
      unsubRequests();
    };
  }, [currentUser]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setCurrentUser(null);
    setInventory([]);
    setRequests([]);
    router.replace("/login");
  };

  // ── API calls (all relative — work locally and on Cloudflare) ────────────
  const createRequest = async (items: RequestItem[]) => {
    if (!currentUser) return false;
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: currentUser.id,
          departmentName: currentUser.departmentName || currentUser.name,
          items,
        }),
      });
      return response.ok;
    } catch (e) {
      console.error("Error creating request:", e);
      return false;
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: "Approved" | "Rejected"
  ) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return response.ok;
    } catch (e) {
      console.error("Error updating request status:", e);
      return false;
    }
  };

  const issueRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return response.ok;
    } catch (e) {
      console.error("Error issuing request:", e);
      return false;
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, "id">) => {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      return response.ok;
    } catch (e) {
      console.error("Error adding inventory item:", e);
      return false;
    }
  };

  const updateInventoryStock = async (
    itemId: string,
    stockQuantity: number,
    unitPrice?: number
  ) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity, unitPrice }),
      });
      return response.ok;
    } catch (e) {
      console.error("Error updating inventory stock:", e);
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        currentUser,
        inventory,
        requests,
        loading,
        logout,
        createRequest,
        updateRequestStatus,
        issueRequest,
        addInventoryItem,
        updateInventoryStock,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
