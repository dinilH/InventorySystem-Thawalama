"use client";

import React from "react";
import { DataProvider } from "../../context/DataContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      {children}
    </DataProvider>
  );
}
