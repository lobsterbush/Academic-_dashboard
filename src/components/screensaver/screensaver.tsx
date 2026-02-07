"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDashboard } from "@/context/store-context";
import {
  FileText,
  GraduationCap,
  DollarSign,
  ClipboardCheck,
  Users,
  Plane,
  Calendar,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { format, parseISO, isValid, differenceInDays } from "date-fns";

// ============================================
// Panel types
// ============================================

interface Panel {
  id: string;
  render: () => React.ReactNode;
}

// ============================================
// Helpers
// ============================================

function safeDate(s: string): Date | null {
  if (!s) return null;
  try {
    const d = parseISO(s);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

const CYCLE_MS = 8000; // 8 seconds per panel

// ============================================
// Main Component
// ============================================

interface ScreensaverProps {
  onDismiss: () => void;
}

export function Screensaver({ onDismiss }: ScreensaverProps) {
  const { papers, courses, grants, peerReviews, students, conferences } = useDashboard();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Build panels from live data
  const panels = useMemo<Panel[]>(() => {
    const result: Panel[] = [];

    // --- Clock + Greeting ---
    result.push({
      id: "clock",
      render: () => <ClockPanel />,
    });

    // --- Paper Pipeline ---
    const pipelinePapers = papers.list.filter((p) => p.stage !== "published");
    if (pipelinePapers.length > 0 || papers.list.length > 0) {
      result.push({
        id: "papers",
        render: () => {
          const published = papers.list.filter((p) => p.stage === "published").length;
          const drafting = papers.list.filter(
            (p) => p.stage === "drafting" || p.stage === "idea"
          ).length;
          const underReview = papers.list.filter(
            (p) =>
              p.stage === "submitted" ||
              p.stage === "under-review" ||
              p.stage === "revise-resubmit"
          ).length;
          return (
            <StatPanel
              icon={<FileText className="h-10 w-10" />}
              iconColor="text-indigo-400"
              title="Research Pipeline"
              stats={[
                { label: "In Progress", value: drafting },
                { label: "Under Review", value: underReview },
                { label: "Published", value: published },
                { label: "Total", value: papers.list.length },
              ]}
            />
          );
        },
      });
    }

    // --- Active Papers Detail ---
    const activePapers = papers.list.filter(
      (p) => p.stage !== "published" && p.stage !== "idea"
    );
    if (activePapers.length > 0) {
      result.push({
        id: "papers-detail",
        render: () => (
          <ListPanel
            icon={<FileText className="h-8 w-8 text-indigo-400" />}
            title="Active Manuscripts"
            items={activePapers.slice(0, 5).map((p) => ({
              primary: p.title,
              secondary: p.targetJournal || "No target journal",
              badge: stageLabel(p.stage),
              badgeColor: stageBadgeColor(p.stage),
            }))}
          />
        ),
      });
    }

    // --- Teaching ---
    const activeCourses = courses.list.filter((c) => c.isActive);
    if (activeCourses.length > 0) {
      result.push({
        id: "teaching",
        render: () => (
          <ListPanel
            icon={<GraduationCap className="h-8 w-8 text-emerald-400" />}
            title="Current Courses"
            items={activeCourses.map((c) => ({
              primary: `${c.code} — ${c.name}`,
              secondary: `${c.schedule || "No schedule"} · ${c.location || ""}`,
              badge: `${c.enrollment} students`,
              badgeColor: "bg-emerald-500/20 text-emerald-300",
            }))}
          />
        ),
      });
    }

    // --- Grants ---
    const fundedGrants = grants.list.filter((g) => g.status === "funded");
    const activeGrants = grants.list.filter(
      (g) => g.status === "drafting" || g.status === "submitted" || g.status === "under-review"
    );
    if (grants.list.length > 0) {
      const totalFunded = fundedGrants.reduce((s, g) => s + g.amount, 0);
      result.push({
        id: "grants",
        render: () => (
          <StatPanel
            icon={<DollarSign className="h-10 w-10" />}
            iconColor="text-amber-400"
            title="Funding"
            stats={[
              {
                label: "Active Awards",
                value: fundedGrants.length,
              },
              {
                label: "Total Funded",
                value: totalFunded > 0 ? `$${(totalFunded / 1000).toFixed(0)}K` : "$0",
              },
              { label: "Pending", value: activeGrants.length },
            ]}
          />
        ),
      });
    }

    // --- Reviews ---
    const pendingReviews = peerReviews.list.filter(
      (r) => r.status === "in-progress" || r.status === "accepted"
    );
    const completedReviews = peerReviews.list.filter((r) => r.status === "completed");
    if (peerReviews.list.length > 0) {
      result.push({
        id: "reviews",
        render: () => (
          <StatPanel
            icon={<ClipboardCheck className="h-10 w-10" />}
            iconColor="text-rose-400"
            title="Peer Reviews"
            stats={[
              { label: "In Progress", value: pendingReviews.length },
              { label: "Completed", value: completedReviews.length },
              { label: "Total", value: peerReviews.list.length },
            ]}
          />
        ),
      });
    }

    // --- Students ---
    const activeStudents = students.list.filter((s) => s.status === "active");
    if (activeStudents.length > 0) {
      result.push({
        id: "students",
        render: () => (
          <ListPanel
            icon={<Users className="h-8 w-8 text-blue-400" />}
            title="Active Advisees"
            items={activeStudents.slice(0, 5).map((s) => ({
              primary: s.name,
              secondary: s.dissertationTitle || s.program || "",
              badge: s.level.toUpperCase(),
              badgeColor: "bg-blue-500/20 text-blue-300",
            }))}
          />
        ),
      });
    }

    // --- Conferences ---
    const upcomingConfs = conferences.list
      .filter((c) => c.status !== "attended")
      .sort((a, b) => (a.startDate > b.startDate ? 1 : -1));
    if (upcomingConfs.length > 0) {
      result.push({
        id: "conferences",
        render: () => (
          <ListPanel
            icon={<Plane className="h-8 w-8 text-purple-400" />}
            title="Upcoming Conferences"
            items={upcomingConfs.slice(0, 4).map((c) => {
              const d = safeDate(c.startDate);
              return {
                primary: c.name,
                secondary: c.location || "",
                badge: d ? format(d, "MMM d") : "",
                badgeColor: "bg-purple-500/20 text-purple-300",
              };
            })}
          />
        ),
      });
    }

    // --- Upcoming Deadlines ---
    const deadlines: { label: string; date: Date; module: string }[] = [];
    peerReviews.list.forEach((r) => {
      if ((r.status === "accepted" || r.status === "in-progress") && r.dueDate) {
        const d = safeDate(r.dueDate);
        if (d) deadlines.push({ label: r.manuscriptTitle || r.journal, date: d, module: "Review" });
      }
    });
    grants.list.forEach((g) => {
      if ((g.status === "planning" || g.status === "drafting") && g.submissionDeadline) {
        const d = safeDate(g.submissionDeadline);
        if (d) deadlines.push({ label: g.title, date: d, module: "Grant" });
      }
    });
    conferences.list.forEach((c) => {
      if (c.status !== "attended" && c.submissionDeadline) {
        const d = safeDate(c.submissionDeadline);
        if (d) deadlines.push({ label: c.name, date: d, module: "Conference" });
      }
    });
    deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());

    if (deadlines.length > 0) {
      result.push({
        id: "deadlines",
        render: () => (
          <ListPanel
            icon={<Calendar className="h-8 w-8 text-amber-400" />}
            title="Upcoming Deadlines"
            items={deadlines.slice(0, 5).map((dl) => {
              const days = differenceInDays(dl.date, new Date());
              const urgency =
                days < 0
                  ? "OVERDUE"
                  : days === 0
                  ? "TODAY"
                  : days <= 7
                  ? `${days}d`
                  : format(dl.date, "MMM d");
              const color =
                days < 0
                  ? "bg-red-500/20 text-red-300"
                  : days <= 7
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-slate-500/20 text-slate-300";
              return {
                primary: dl.label,
                secondary: dl.module,
                badge: urgency,
                badgeColor: color,
              };
            })}
          />
        ),
      });
    }

    // If no data at all, just show the clock
    if (result.length === 1) {
      result.push({
        id: "empty",
        render: () => (
          <div className="flex flex-col items-center justify-center text-center">
            <BookOpen className="h-16 w-16 text-white/30 mb-4" />
            <p className="text-2xl font-light text-white/60">
              Add papers, courses, and grants to see them here
            </p>
          </div>
        ),
      });
    }

    return result;
  }, [papers.list, courses.list, grants.list, peerReviews.list, students.list, conferences.list]);

  // Auto-cycle panels
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % panels.length);
        setFade(true);
      }, 500);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, [panels.length]);

  // Dismiss on any interaction
  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart"];
    // Small delay so the triggering click doesn't immediately dismiss
    const timer = setTimeout(() => {
      events.forEach((e) => document.addEventListener(e, handleDismiss, { once: true }));
    }, 500);
    return () => {
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, handleDismiss));
    };
  }, [handleDismiss]);

  const activePanel = panels[activeIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center cursor-pointer select-none">
      {/* Subtle animated background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-purple-600/5 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-blue-600/5 blur-3xl animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 w-full max-w-2xl px-8 transition-all duration-500 ${
          fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {activePanel?.render()}
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {panels.map((panel, i) => (
          <div
            key={panel.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-6 bg-white/60" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Dismiss hint */}
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/20">
        Click or press any key to dismiss
      </p>
    </div>
  );
}

// ============================================
// Sub-panels
// ============================================

function ClockPanel() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = time.getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-xl font-light text-white/50 mb-2">{greeting}</p>
      <p className="text-7xl font-extralight text-white tracking-tight tabular-nums">
        {format(time, "h:mm")}
        <span className="text-3xl text-white/40 ml-2">{format(time, "a")}</span>
      </p>
      <p className="mt-3 text-lg font-light text-white/40">
        {format(time, "EEEE, MMMM d, yyyy")}
      </p>
    </div>
  );
}

interface StatPanelProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  stats: { label: string; value: string | number }[];
}

function StatPanel({ icon, iconColor, title, stats }: StatPanelProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={iconColor}>{icon}</div>
      <h2 className="mt-3 text-2xl font-light text-white/80">{title}</h2>
      <div className="mt-8 flex gap-10">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center">
            <span className="text-4xl font-extralight text-white tabular-nums">{s.value}</span>
            <span className="mt-1 text-sm text-white/40">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ListItem {
  primary: string;
  secondary: string;
  badge: string;
  badgeColor: string;
}

interface ListPanelProps {
  icon: React.ReactNode;
  title: string;
  items: ListItem[];
}

function ListPanel({ icon, title, items }: ListPanelProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h2 className="text-2xl font-light text-white/80">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg bg-white/5 backdrop-blur-sm px-5 py-3"
          >
            <ArrowRight className="h-4 w-4 text-white/20 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{item.primary}</p>
              {item.secondary && (
                <p className="text-xs text-white/40 truncate">{item.secondary}</p>
              )}
            </div>
            {item.badge && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${item.badgeColor}`}
              >
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Stage helpers
// ============================================

function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    drafting: "Drafting",
    "internal-review": "Internal Review",
    submitted: "Submitted",
    "under-review": "Under Review",
    "revise-resubmit": "R&R",
    accepted: "Accepted",
  };
  return map[stage] ?? stage;
}

function stageBadgeColor(stage: string): string {
  const map: Record<string, string> = {
    drafting: "bg-blue-500/20 text-blue-300",
    "internal-review": "bg-purple-500/20 text-purple-300",
    submitted: "bg-amber-500/20 text-amber-300",
    "under-review": "bg-amber-500/20 text-amber-300",
    "revise-resubmit": "bg-orange-500/20 text-orange-300",
    accepted: "bg-emerald-500/20 text-emerald-300",
  };
  return map[stage] ?? "bg-slate-500/20 text-slate-300";
}
