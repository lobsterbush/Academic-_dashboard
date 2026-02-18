"use client";

import { useMemo, useState, useRef, KeyboardEvent } from "react";
import { useDashboard } from "@/context/store-context";
import { useUserSettings } from "@/context/settings-context";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  LayoutDashboard,
  FileText,
  Pencil,
  Send,
  RotateCcw,
  Plane,
  Users,
  ListTodo,
  Plus,
  Check,
  Trash2,
  DollarSign,
  ClipboardCheck,
  BookOpen,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import type { Paper, PaperStage, Conference, Student, Todo } from "@/lib/types";
import { MagicImportModal } from "@/components/dashboard/magic-import-modal";
import { Sparkles } from "lucide-react";

// ============================================
// Helpers
// ============================================

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-slate-300 dark:bg-slate-600",
};

function safeDateFormat(dateStr: string, fmt: string): string {
  if (!dateStr) return "";
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt) : "";
  } catch {
    return "";
  }
}

// ============================================
// Paper stage column definitions (top row)
// ============================================

const PAPER_COLUMNS = [
  {
    key: "working" as const,
    title: "Working On",
    description: "Ideas, drafts & internal review",
    icon: Pencil,
    stages: ["idea", "drafting", "internal-review"] as PaperStage[],
    headerBg:
      "bg-[rgba(74,155,103,0.1)] dark:bg-[rgba(74,155,103,0.15)] border-[#4A9B67]/30 dark:border-[#67B084]/30",
    headerText: "text-[#4A9B67] dark:text-[#67B084]",
    countBg:
      "bg-[#4A9B67] text-white dark:bg-[#67B084] dark:text-slate-900",
  },
  {
    key: "review" as const,
    title: "Out for Review",
    description: "Submitted & awaiting decisions",
    icon: Send,
    stages: ["submitted", "under-review"] as PaperStage[],
    headerBg:
      "bg-[rgba(0,102,204,0.08)] dark:bg-[rgba(0,102,204,0.12)] border-[#0066cc]/30 dark:border-[#0066cc]/30",
    headerText: "text-[#0066cc] dark:text-blue-400",
    countBg:
      "bg-[#0066cc] text-white dark:bg-blue-600 dark:text-white",
  },
  {
    key: "rr" as const,
    title: "R&Rs",
    description: "Revise & resubmit decisions",
    icon: RotateCcw,
    stages: ["revise-resubmit"] as PaperStage[],
    headerBg:
      "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300/50 dark:border-amber-700/50",
    headerText: "text-amber-700 dark:text-amber-400",
    countBg:
      "bg-amber-500 text-white dark:bg-amber-600 dark:text-white",
  },
];



// ============================================
// Loading Skeleton
// ============================================

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8 p-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-56 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, row) => (
        <div key={row} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
                <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="space-y-4 px-6 py-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Reusable Column Shell
// ============================================

function ColumnShell({
  title,
  description,
  icon: Icon,
  count,
  headerBg,
  headerText,
  countBg,
  emptyIcon: EmptyIcon,
  emptyText,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  count: number;
  headerBg: string;
  headerText: string;
  countBg: string;
  emptyIcon: React.ElementType;
  emptyText: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className={`flex items-center gap-3 rounded-t-lg border px-4 py-3 ${headerBg}`}
      >
        <Icon className={`h-5 w-5 ${headerText}`} />
        <div className="flex-1">
          <h2 className={`text-sm font-semibold ${headerText}`}>{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${countBg}`}
        >
          {count}
        </span>
      </div>
      {/* Body */}
      <div className="flex min-h-[200px] flex-1 flex-col gap-3 rounded-b-lg border border-t-0 border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        {count === 0 && !children ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <EmptyIcon className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {emptyText}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ============================================
// Paper Card
// ============================================

function PaperCard({ paper }: { paper: Paper }) {
  return (
    <div className="rounded-lg border border-slate-150 bg-white px-4 py-2 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[paper.priority ?? "medium"]}`}
          title={`${paper.priority ?? "medium"} priority`}
        />
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">
          {paper.title}
        </p>
      </div>
    </div>
  );
}

// ============================================
// Conference Card
// ============================================

function ConferenceCard({ conf }: { conf: Conference }) {
  return (
    <div className="rounded-lg border border-slate-150 bg-white px-4 py-3 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {conf.name}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {conf.location && <span>{conf.location}</span>}
        {conf.startDate && (
          <>
            <span className="text-slate-300 dark:text-slate-600">&middot;</span>
            <span>{safeDateFormat(conf.startDate, "MMM d, yyyy")}</span>
          </>
        )}
      </div>
      {conf.presentationTitle && (
        <p className="mt-1 text-xs italic text-slate-400 dark:text-slate-500">
          {conf.presentationTitle}
        </p>
      )}
      <Badge variant="info" className="mt-1.5 text-[10px]">
        {conf.status}
      </Badge>
    </div>
  );
}

// ============================================
// Student Card
// ============================================

function StudentCard({ student }: { student: Student }) {
  return (
    <div className="rounded-lg border border-slate-150 bg-white px-4 py-3 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {student.name}
      </p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        {student.level.toUpperCase()} &middot; {student.program}
      </p>
      {student.dissertationTitle && (
        <p className="mt-1 truncate text-xs italic text-slate-400 dark:text-slate-500">
          {student.dissertationTitle}
        </p>
      )}
    </div>
  );
}

// ============================================
// Todo Item
// ============================================

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-lg border border-slate-150 bg-white px-3 py-2 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${todo.completed
          ? "border-emerald-400 bg-emerald-100 text-emerald-600 dark:border-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
          : "border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500"
          }`}
      >
        {todo.completed && <Check className="h-3 w-3" />}
      </button>
      <span
        className={`flex-1 text-sm ${todo.completed
          ? "text-slate-400 line-through dark:text-slate-500"
          : "text-slate-800 dark:text-slate-200"
          }`}
      >
        {todo.text}
      </span>
      <button
        onClick={onDelete}
        className="shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ============================================
// Add Todo Inline
// ============================================

function AddTodoInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#4A9B67]/40 bg-white/50 px-3 py-2 dark:border-[#67B084]/40 dark:bg-slate-800/50">
      <Plus className="h-4 w-4 shrink-0 text-[#4A9B67] dark:text-[#67B084]" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a to-do..."
        className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
      />
      {value.trim() && (
        <button
          onClick={handleSubmit}
          className="text-xs font-medium text-[#4A9B67] hover:text-[#67B084] dark:text-[#67B084] dark:hover:text-[#4A9B67]"
        >
          Add
        </button>
      )}
    </div>
  );
}

// ============================================
// Dashboard Page
// ============================================

export default function DashboardPage() {
  const { isHydrated, papers, conferences, students, todos, grants, peerReviews, courses } = useDashboard();
  const { settings, updateSettings } = useUserSettings();

  const [isMagicImportOpen, setIsMagicImportOpen] = useState(false);

  // Pending reviews
  const pendingReviews = useMemo(
    () => peerReviews.list.filter((r) => r.status !== "completed"),
    [peerReviews.list]
  );

  // Active grants
  const activeGrants = useMemo(
    () => grants.list.filter((g) => g.status === "funded"),
    [grants.list]
  );

  // Active courses
  const activeCourses = useMemo(
    () => courses.list.filter((c) => c.isActive),
    [courses.list]
  );

  // --- Scholar Stats Effect ---
  const [isLoadingScholar, setIsLoadingScholar] = useState(false);

  // We use a ref to track if we've attempted a fetch in this session to prevent loops
  const hasAttemptedFetch = useRef(false);

  // Use useMemo as a side-effect trigger or just simple conditional logic inside render is dangerous.
  // We'll use a standard pattern: check condition, trigger async action if needed.
  // Since we can't use useEffect directly inside a conditional, we use it at top level.

  const googleScholarUrl = settings.googleScholarUrl;
  const lastUpdated = settings.scholarStats?.lastUpdated;

  if (isHydrated && googleScholarUrl && !isLoadingScholar && !hasAttemptedFetch.current) {
    const oneDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    const needsUpdate = !lastUpdated || (now.getTime() - new Date(lastUpdated).getTime() > oneDay);

    if (needsUpdate) {
      hasAttemptedFetch.current = true;
      Promise.resolve().then(async () => {
        setIsLoadingScholar(true);
        try {
          // Check if running in Electron with exposed API
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const api = (window as any).electronAPI;
          if (api?.scholar?.fetchStats) {
            const data = await api.scholar.fetchStats(googleScholarUrl);
            if (data.citationCount !== undefined) {
              updateSettings({
                scholarStats: {
                  citationCount: data.citationCount,
                  hIndex: data.hIndex,
                  lastUpdated: new Date().toISOString(),
                },
              });
            }
          } else {
            console.warn("Scholar API not available (not running in Electron?)");
          }
        } catch (err) {
          console.error("Failed to update scholar stats", err);
        } finally {
          setIsLoadingScholar(false);
        }
      });
    }
  }

  // --- Top row: Paper columns ---
  const paperColumnData = useMemo(() => {
    const result: Record<string, Paper[]> = {};
    for (const col of PAPER_COLUMNS) {
      result[col.key] = papers.list.filter((p) =>
        col.stages.includes(p.stage)
      );
    }
    return result;
  }, [papers.list]);

  // --- Bottom row data ---
  const upcomingConferences = useMemo(
    () => conferences.list.filter((c) => c.status !== "attended"),
    [conferences.list]
  );

  const activeStudents = useMemo(
    () => students.list.filter((s) => s.status === "active"),
    [students.list]
  );

  const incompleteTodos = useMemo(
    () => todos.list.filter((t) => !t.completed),
    [todos.list]
  );

  // Total active papers
  const totalActive = useMemo(
    () =>
      papers.list.filter(
        (p) => p.stage !== "accepted" && p.stage !== "published"
      ).length,
    [papers.list]
  );

  if (!isHydrated) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Your academic life at a glance"
        action={
          <button
            onClick={() => setIsMagicImportOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#4A9B67] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#67B084] hover:shadow-lg hover:-translate-y-0.5 dark:bg-[#4A9B67] dark:hover:bg-[#67B084]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Magic Import</span>
          </button>
        }
      />

      <MagicImportModal
        isOpen={isMagicImportOpen}
        onClose={() => setIsMagicImportOpen(false)}
      />

      <div className="space-y-6 p-8">
        {/* Summary bar */}
        {settings.visiblePanes.includes("stats") && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {totalActive}
              </span>{" "}
              active paper{totalActive !== 1 ? "s" : ""}
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            {settings.scholarStats && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {settings.scholarStats.citationCount}
                  </span>{" "}
                  citations
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
              </>
            )}
            {PAPER_COLUMNS.map((col) => (
              <span key={col.key}>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {paperColumnData[col.key].length}
                </span>{" "}
                {col.title.toLowerCase()}
              </span>
            ))}
          </div>
        )}

        {/* ============== TOP ROW: Paper Stages ============== */}
        {settings.visiblePanes.includes("papers-pipeline") && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {PAPER_COLUMNS.map((col) => {
              const colPapers = paperColumnData[col.key];
              return (
                <ColumnShell
                  key={col.key}
                  title={col.title}
                  description={col.description}
                  icon={col.icon}
                  count={colPapers.length}
                  headerBg={col.headerBg}
                  headerText={col.headerText}
                  countBg={col.countBg}
                  emptyIcon={col.icon}
                  emptyText="No papers here yet"
                >
                  {colPapers.length > 0 &&
                    colPapers.map((paper) => (
                      <PaperCard key={paper.id} paper={paper} />
                    ))}
                </ColumnShell>
              );
            })}
          </div>
        )}

        {/* ============== BOTTOM ROW: Conferences, Students, Todos, etc. ============== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upcoming Conferences */}
          {settings.visiblePanes.includes("conferences") && (
            <ColumnShell
              title="Upcoming Conferences"
              description="Events on your calendar"
              icon={Plane}
              count={upcomingConferences.length}
              headerBg="bg-[rgba(0,102,204,0.08)] dark:bg-[rgba(0,102,204,0.12)] border-[#0066cc]/30 dark:border-[#0066cc]/30"
              headerText="text-[#0066cc] dark:text-blue-400"
              countBg="bg-[#0066cc] text-white dark:bg-blue-600 dark:text-white"
              emptyIcon={Plane}
              emptyText="No upcoming conferences"
            >
              {upcomingConferences.length > 0 &&
                upcomingConferences.map((conf) => (
                  <ConferenceCard key={conf.id} conf={conf} />
                ))}
            </ColumnShell>
          )}

          {/* Student Feedback */}
          {settings.visiblePanes.includes("students") && (
            <ColumnShell
              title="Student Feedback"
              description="Active advisees needing attention"
              icon={Users}
              count={activeStudents.length}
              headerBg="bg-[rgba(74,155,103,0.1)] dark:bg-[rgba(74,155,103,0.15)] border-[#4A9B67]/30 dark:border-[#67B084]/30"
              headerText="text-[#4A9B67] dark:text-[#67B084]"
              countBg="bg-[#4A9B67] text-white dark:bg-[#67B084] dark:text-slate-900"
              emptyIcon={Users}
              emptyText="No active advisees"
            >
              {activeStudents.length > 0 &&
                activeStudents.map((s) => (
                  <StudentCard key={s.id} student={s} />
                ))}
            </ColumnShell>
          )}

          {/* Pending Reviews */}
          {settings.visiblePanes.includes("reviews") && (
            <ColumnShell
              title="Pending Reviews"
              description="Manuscripts awaiting your report"
              icon={ClipboardCheck}
              count={pendingReviews.length}
              headerBg="bg-amber-50/80 dark:bg-amber-950/40 border-amber-300/50 dark:border-amber-700/50"
              headerText="text-amber-700 dark:text-amber-400"
              countBg="bg-amber-500 text-white dark:bg-amber-600 dark:text-white"
              emptyIcon={ClipboardCheck}
              emptyText="No pending reviews"
            >
              {pendingReviews.length > 0 &&
                pendingReviews.map((rev) => (
                  <div key={rev.id} className="rounded-lg border border-slate-150 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{rev.manuscriptTitle}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{rev.journal}</p>
                    {rev.dueDate && <p className="mt-1 text-xs font-medium text-orange-600">Due: {safeDateFormat(rev.dueDate, "MMM d")}</p>}
                  </div>
                ))}
            </ColumnShell>
          )}

          {/* Active Grants */}
          {settings.visiblePanes.includes("grants") && (
            <ColumnShell
              title="Grant Summary"
              description="Active awards & deliverables"
              icon={DollarSign}
              count={activeGrants.length}
              headerBg="bg-[rgba(0,102,204,0.08)] dark:bg-[rgba(0,102,204,0.12)] border-[#0066cc]/30 dark:border-[#0066cc]/30"
              headerText="text-[#0066cc] dark:text-blue-400"
              countBg="bg-[#0066cc] text-white dark:bg-blue-600 dark:text-white"
              emptyIcon={DollarSign}
              emptyText="No active grants"
            >
              {activeGrants.length > 0 &&
                activeGrants.map((g) => (
                  <div key={g.id} className="rounded-lg border border-slate-150 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{g.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{g.agency}</p>
                    {g.nextDeliverable && <p className="mt-1 text-xs font-medium text-orange-600">Next: {g.nextDeliverable}</p>}
                  </div>
                ))}
            </ColumnShell>
          )}

          {/* Active Teaching */}
          {settings.visiblePanes.includes("teaching") && (
            <ColumnShell
              title="Active Teaching"
              description="Currently active courses"
              icon={BookOpen}
              count={activeCourses.length}
              headerBg="bg-[rgba(74,155,103,0.1)] dark:bg-[rgba(74,155,103,0.15)] border-[#4A9B67]/30 dark:border-[#67B084]/30"
              headerText="text-[#4A9B67] dark:text-[#67B084]"
              countBg="bg-[#4A9B67] text-white dark:bg-[#67B084] dark:text-slate-900"
              emptyIcon={BookOpen}
              emptyText="No active courses"
            >
              {activeCourses.length > 0 &&
                activeCourses.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-150 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.code}: {c.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.semester} {c.year} &middot; {c.enrollment} students</p>
                  </div>
                ))}
            </ColumnShell>
          )}

          {/* Other To-Dos (Mapped to 'deadlines' pane) */}
          {settings.visiblePanes.includes("deadlines") && (
            <ColumnShell
              title="Other To-Dos"
              description="Miscellaneous tasks"
              icon={ListTodo}
              count={incompleteTodos.length}
              headerBg="bg-[rgba(0,102,204,0.08)] dark:bg-[rgba(0,102,204,0.12)] border-[#0066cc]/30 dark:border-[#0066cc]/30"
              headerText="text-[#0066cc] dark:text-blue-400"
              countBg="bg-[#0066cc] text-white dark:bg-blue-600 dark:text-white"
              emptyIcon={ListTodo}
              emptyText="All clear!"
            >
              {/* Always render the todo list + add input */}
              <div className="flex flex-col gap-2">
                {todos.list.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={() =>
                      todos.update(todo.id, { completed: !todo.completed })
                    }
                    onDelete={() => todos.delete(todo.id)}
                  />
                ))}
                <AddTodoInput
                  onAdd={(text) => todos.add({ text, completed: false })}
                />
              </div>
            </ColumnShell>
          )}
        </div>
      </div>
    </div >
  );
}
