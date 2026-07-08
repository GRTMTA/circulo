"use client";

import { createContext, useContext } from "react";

interface SidebarContextValue {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  value,
  children,
}: {
  value: SidebarContextValue;
  children: React.ReactNode;
}) {
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider.");
  }

  return context;
}

export function useOptionalSidebar() {
  return useContext(SidebarContext);
}
