"use client";

import { useUserSettings } from "@/context/settings-context";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DASHBOARD_PANES } from "@/lib/types";
import type { Theme, AccentColor } from "@/lib/types";
import { Settings, Sun, Moon, Monitor, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const ACCENT_COLORS: { value: AccentColor; label: string; swatch: string }[] = [
  { value: "indigo", label: "Indigo", swatch: "bg-indigo-500" },
  { value: "blue", label: "Blue", swatch: "bg-blue-500" },
  { value: "violet", label: "Violet", swatch: "bg-violet-500" },
  { value: "emerald", label: "Emerald", swatch: "bg-emerald-500" },
  { value: "rose", label: "Rose", swatch: "bg-rose-500" },
  { value: "amber", label: "Amber", swatch: "bg-amber-500" },
];

const TIMEOUT_OPTIONS = [
  { value: 0, label: "Disabled" },
  { value: 1, label: "1 minute" },
  { value: 2, label: "2 minutes" },
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
];

export default function SettingsPage() {
  const {
    settings,
    setTheme,
    setAccentColor,
    togglePane,
    isPaneVisible,
    setScreensaverTimeout,
    resetToDefaults,
    updateSettings,
  } = useUserSettings();

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Customize your dashboard layout and appearance"
      />

      <div className="space-y-6 p-8">
        {/* Scholar Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Google Scholar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Enter your Google Scholar profile URL to track citations (updates daily).
              <br />
              <span className="text-xs italic">Example: https://scholar.google.com/citations?user=uLty40oAAAAJ&hl=en</span>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                placeholder="https://scholar.google.com/citations?user=..."
                value={settings.googleScholarUrl || ""}
                onChange={(e) => {
                  updateSettings({ googleScholarUrl: e.target.value });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Choose how the dashboard looks.
            </p>
            <div className="flex flex-wrap gap-3">
              {THEMES.map((t) => {
                const isActive = settings.theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-750"
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Accent Color */}
        <Card>
          <CardHeader>
            <CardTitle>Accent Color</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Pick an accent color for the interface highlights.
            </p>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map((c) => {
                const isActive = settings.accentColor === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setAccentColor(c.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "border-indigo-500 bg-indigo-50 text-slate-800 dark:border-indigo-400 dark:bg-indigo-950 dark:text-slate-200"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    <span className={cn("h-4 w-4 rounded-full", c.swatch)} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Panes */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Panes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Choose which sections appear on the main dashboard.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DASHBOARD_PANES.map((pane) => {
                const checked = isPaneVisible(pane.value);
                return (
                  <label
                    key={pane.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all",
                      checked
                        ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePane(pane.value)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {pane.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {pane.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Screensaver */}
        <Card>
          <CardHeader>
            <CardTitle>Screensaver</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Auto-activate the screensaver after being idle.
            </p>
            <div className="flex flex-wrap gap-2">
              {TIMEOUT_OPTIONS.map((opt) => {
                const isActive = settings.screensaverTimeout === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setScreensaverTimeout(opt.value)}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reset */}
        <div className="flex justify-end">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
