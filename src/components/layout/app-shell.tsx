"use client";

import { StoreProvider } from "@/context/store-context";
import { SettingsProvider, useUserSettings } from "@/context/settings-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Screensaver } from "@/components/screensaver/screensaver";
import { useIdleDetection } from "@/hooks/use-idle-detection";

function AppContent({ children }: { children: React.ReactNode }) {
  const { settings } = useUserSettings();
  const timeoutMs = settings.screensaverTimeout > 0
    ? settings.screensaverTimeout * 60 * 1000
    : 0;
  const { isIdle, forceIdle, wake } = useIdleDetection(timeoutMs);

  return (
    <>
      <Sidebar onScreensaver={forceIdle} />
      <main className="ml-64 min-h-screen bg-[var(--background)] dark:bg-[var(--background)]">
        {children}
      </main>
      {isIdle && <Screensaver onDismiss={wake} />}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <SettingsProvider>
        <AppContent>{children}</AppContent>
      </SettingsProvider>
    </StoreProvider>
  );
}
