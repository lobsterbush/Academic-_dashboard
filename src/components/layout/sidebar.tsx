"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  DollarSign,
  ClipboardCheck,
  Users,
  Plane,
  Briefcase,
  Calendar,
  FolderOpen,
  BookOpen,
  Monitor,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Papers", href: "/papers", icon: FileText },
  { name: "Teaching", href: "/teaching", icon: GraduationCap },
  { name: "Grants", href: "/grants", icon: DollarSign },
  { name: "Reviews", href: "/reviews", icon: ClipboardCheck },
  { name: "Students", href: "/students", icon: Users },
  { name: "Conferences", href: "/conferences", icon: Plane },
  { name: "Service", href: "/service", icon: Briefcase },
  { name: "Deadlines", href: "/deadlines", icon: Calendar },
  { name: "Workspace", href: "/workspace", icon: FolderOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  onScreensaver?: () => void;
}

export function Sidebar({ onScreensaver }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border)] bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
      {/* Logo / Title */}
      <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-6 dark:border-slate-700">
        <BookOpen className="h-7 w-7 text-[#4A9B67] dark:text-[#67B084]" />
        <div>
          <h1 className="font-mono text-base font-bold text-[#0066cc] dark:text-[#67B084]">Academic Hub</h1>
          <p className="text-[10px] text-[var(--text-muted)] leading-none dark:text-slate-400">Research & Teaching Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#4A9B67] text-white shadow-sm dark:bg-[#4A9B67]"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(74,155,103,0.1)] hover:text-[#4A9B67] dark:text-slate-400 dark:hover:bg-[rgba(74,155,103,0.15)] dark:hover:text-[#67B084]"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-[var(--text-muted)] dark:text-slate-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] px-3 py-3 space-y-2 dark:border-slate-700">
        {onScreensaver && (
          <button
            onClick={onScreensaver}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[rgba(74,155,103,0.1)] hover:text-[#4A9B67] transition-all duration-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-[#67B084]"
          >
            <Monitor className="h-4 w-4" />
            Screensaver
          </button>
        )}
        <p className="px-3 text-xs font-mono text-[var(--text-muted)] dark:text-slate-500">Data stored locally on your machine</p>
      </div>
    </aside>
  );
}
