"use client";

import { useMemo, useState, useRef, KeyboardEvent } from "react";
import { useDashboard } from "@/context/store-context";
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
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import type { Paper, PaperStage, Conference, Student, Todo } from "@/lib/types";

// ============================================
// Helpers
// ============================================

const STAGE_LABELS: Record<PaperStage, string> = {
  idea: "Idea",
  drafting: "Drafting",
  "internal-review": "Internal Review",
  submitted: "Submitted",
  "under-review": "Under Review",
  "revise-resubmit": "Revise & Resubmit",
  accepted: "Accepted",
  published: "Published",
};

const STAGE_BADGE_VARIANT: Record<
  PaperStage,
  "default" | "success" | "warning" | "danger" | "info" | "outline"
> = {
  idea: "outline",
  drafting: "default",
  "internal-review": "info",
  submitted: "warning",
  "under-review": "warning",
  "revise-resubmit": "danger",
  accepted: "success",
  published: "success",
};

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
      "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
    headerText: "text-indigo-700 dark:text-indigo-300",
    countBg:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },
  {
    key: "review" as const,
    title: "Out for Review",
    description: "Submitted & awaiting decisions",
    icon: Send,
    stages: ["submitted", "under-review"] as PaperStage[],
    headerBg:
      "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    headerText: "text-amber-700 dark:text-amber-300",
    countBg:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  {
    key: "rr" as const,
    title: "R&Rs",
    description: "Revise & resubmit decisions",
    icon: RotateCcw,
    stages: ["revise-resubmit"] as PaperStage[],
    headerBg:
      "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    headerText: "text-rose-700 dark:text-rose-300",
    countBg:
      "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  },
];

// Bottom row column definitions
const BOTTOM_COLUMNS = [
  {
    key: "conferences" as const,
    title: "Upcoming Conferences",
    description: "Events on your calendar",
    icon: Plane,
    headerBg:
      "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800",
    headerText: "text-sky-700 dark:text-sky-300",
    countBg: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  },
  {
    key: "students" as const,
    title: "Student Feedback",
    description: "Active advisees needing attention",
    icon: Users,
    headerBg:
      "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    headerText: "text-emerald-700 dark:text-emerald-300",
    countBg:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
  {
    key: "todos" as const,
    title: "Other To-Dos",
    description: "Miscellaneous tasks",
    icon: ListTodo,
    headerBg:
      "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
    headerText: "text-violet-700 dark:text-violet-300",
    countBg:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
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
    <div className="rounded-lg border border-slate-150 bg-white px-4 py-3 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[paper.priority]}`}
          title={`${paper.priority} priority`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">
            {paper.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant={STAGE_BADGE_VARIANT[paper.stage]}
              className="text-[10px]"
            >
              {STAGE_LABELS[paper.stage]}
            </Badge>
            {paper.targetJournal && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {paper.targetJournal}
              </span>
            )}
          </div>
          {paper.coAuthors.length > 0 && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              w/ {paper.coAuthors.slice(0, 3).join(", ")}
              {paper.coAuthors.length > 3 &&
                ` +${paper.coAuthors.length - 3}`}
            </p>
          )}
        </div>
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
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          todo.completed
            ? "border-emerald-400 bg-emerald-100 text-emerald-600 dark:border-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
            : "border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500"
        }`}
      >
        {todo.completed && <Check className="h-3 w-3" />}
      </button>
      <span
        className={`flex-1 text-sm ${
          todo.completed
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
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/50 px-3 py-2 dark:border-slate-600 dark:bg-slate-800/50">
      <Plus className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a to-do..."
        className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
      />
      {value.trim() && (
        <button
          onClick={handleSubmit}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
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
  const { isHydrated, papers, conferences, students, todos } = useDashboard();

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
      />

      <div className="space-y-6 p-8">
        {/* Summary bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {totalActive}
            </span>{" "}
            active paper{totalActive !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          {PAPER_COLUMNS.map((col) => (
            <span key={col.key}>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {paperColumnData[col.key].length}
              </span>{" "}
              {col.title.toLowerCase()}
            </span>
          ))}
        </div>

        {/* ============== TOP ROW: Paper Stages ============== */}
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

        {/* ============== BOTTOM ROW: Conferences, Students, Todos ============== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upcoming Conferences */}
          <ColumnShell
            title={BOTTOM_COLUMNS[0].title}
            description={BOTTOM_COLUMNS[0].description}
            icon={BOTTOM_COLUMNS[0].icon}
            count={upcomingConferences.length}
            headerBg={BOTTOM_COLUMNS[0].headerBg}
            headerText={BOTTOM_COLUMNS[0].headerText}
            countBg={BOTTOM_COLUMNS[0].countBg}
            emptyIcon={Plane}
            emptyText="No upcoming conferences"
          >
            {upcomingConferences.length > 0 &&
              upcomingConferences.map((conf) => (
                <ConferenceCard key={conf.id} conf={conf} />
              ))}
          </ColumnShell>

          {/* Student Feedback */}
          <ColumnShell
            title={BOTTOM_COLUMNS[1].title}
            description={BOTTOM_COLUMNS[1].description}
            icon={BOTTOM_COLUMNS[1].icon}
            count={activeStudents.length}
            headerBg={BOTTOM_COLUMNS[1].headerBg}
            headerText={BOTTOM_COLUMNS[1].headerText}
            countBg={BOTTOM_COLUMNS[1].countBg}
            emptyIcon={Users}
            emptyText="No active advisees"
          >
            {activeStudents.length > 0 &&
              activeStudents.map((s) => (
                <StudentCard key={s.id} student={s} />
              ))}
          </ColumnShell>

          {/* Other To-Dos */}
          <ColumnShell
            title={BOTTOM_COLUMNS[2].title}
            description={BOTTOM_COLUMNS[2].description}
            icon={BOTTOM_COLUMNS[2].icon}
            count={incompleteTodos.length}
            headerBg={BOTTOM_COLUMNS[2].headerBg}
            headerText={BOTTOM_COLUMNS[2].headerText}
            countBg={BOTTOM_COLUMNS[2].countBg}
            emptyIcon={ListTodo}
            emptyText="All clear!"
          >
            {/* Always render the todo list + add input */}
            <>
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
            </>
          </ColumnShell>
        </div>
      </div>
    </div>
  );
}
