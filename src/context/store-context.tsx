"use client";

import React, { createContext, useContext } from "react";
import { useStore } from "@/hooks/use-store";

type StoreType = ReturnType<typeof useStore>;

const StoreContext = createContext<StoreType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useDashboard() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useDashboard must be used within a StoreProvider");
  }
  return context;
}
