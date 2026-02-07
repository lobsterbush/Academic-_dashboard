"use client";

import { StoreProvider } from "@/context/store-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Screensaver } from "@/components/screensaver/screensaver";
import { useIdleDetection } from "@/hooks/use-idle-detection";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isIdle, forceIdle, wake } = useIdleDetection(IDLE_TIMEOUT);

  return (
    <StoreProvider>
      <Sidebar onScreensaver={forceIdle} />
      <main className="ml-64 min-h-screen bg-slate-50">{children}</main>
      {isIdle && <Screensaver onDismiss={wake} />}
    </StoreProvider>
  );
}
