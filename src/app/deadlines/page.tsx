"use client"

import { useMemo } from "react"
import { useDashboard } from "@/context/store-context"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Calendar,
  FileText,
  DollarSign,
  ClipboardCheck,
  Plane,
  AlertTriangle,
} from "lucide-react"
import { format, isPast, isWithinInterval, addDays, parseISO, isValid } from "date-fns"
import type { LucideIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeadlineModule = "paper" | "grant" | "review" | "conference"

interface AggregatedDeadline {
  id: string
  title: string
  module: DeadlineModule
  moduleLabel: string
  date: Date
  icon: LucideIcon
}

type UrgencyGroup = "overdue" | "thisWeek" | "thisMonth" | "later"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseDate(value: string | undefined | null): Date | null {
  if (!value) return null
  try {
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

function getUrgencyGroup(date: Date, now: Date): UrgencyGroup {
  if (isPast(date) && date.toDateString() !== now.toDateString()) {
    return "overdue"
  }

  const sevenDaysOut = addDays(now, 7)
  if (
    isWithinInterval(date, { start: now, end: sevenDaysOut }) ||
    date.toDateString() === now.toDateString()
  ) {
    return "thisWeek"
  }

  const thirtyDaysOut = addDays(now, 30)
  if (isWithinInterval(date, { start: sevenDaysOut, end: thirtyDaysOut })) {
    return "thisMonth"
  }

  return "later"
}

function urgencyBadge(group: UrgencyGroup) {
  switch (group) {
    case "overdue":
      return { label: "OVERDUE", variant: "danger" as const }
    case "thisWeek":
      return { label: "THIS WEEK", variant: "warning" as const }
    case "thisMonth":
      return { label: "THIS MONTH", variant: "info" as const }
    case "later":
      return { label: "UPCOMING", variant: "default" as const }
  }
}

function daysDescription(date: Date, now: Date): string {
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const abs = Math.abs(diffDays)
    return `${abs} ${abs === 1 ? "day" : "days"} overdue`
  }
  if (diffDays === 0) {
    return "Due today"
  }
  return `${diffDays} ${diffDays === 1 ? "day" : "days"} remaining`
}

const GROUP_META: Record<UrgencyGroup, { heading: string; icon?: LucideIcon }> = {
  overdue: { heading: "Overdue", icon: AlertTriangle },
  thisWeek: { heading: "This Week" },
  thisMonth: { heading: "This Month" },
  later: { heading: "Later" },
}

const MODULE_BADGE_VARIANT: Record<DeadlineModule, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  paper: "outline",
  grant: "success",
  review: "warning",
  conference: "info",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeadlinesPage() {
  const { isHydrated, papers, grants, peerReviews, conferences } = useDashboard()

  const now = useMemo(() => new Date(), [])

  // Aggregate every relevant deadline into one flat, sorted list.
  const deadlines = useMemo<AggregatedDeadline[]>(() => {
    const items: AggregatedDeadline[] = []

    // Papers -- submission dates for papers still being drafted / reviewed
    for (const paper of papers.list) {
      if (paper.stage !== "drafting" && paper.stage !== "internal-review") continue
      const date = safeParseDate(paper.submissionDate)
      if (!date) continue
      items.push({
        id: `paper-${paper.id}`,
        title: paper.title,
        module: "paper",
        moduleLabel: "Paper",
        date,
        icon: FileText,
      })
    }

    // Grants -- submission deadlines for grants still in planning / drafting
    for (const grant of grants.list) {
      if (grant.status !== "planning" && grant.status !== "drafting") continue
      const date = safeParseDate(grant.submissionDeadline)
      if (!date) continue
      items.push({
        id: `grant-${grant.id}`,
        title: grant.title,
        module: "grant",
        moduleLabel: "Grant",
        date,
        icon: DollarSign,
      })
    }

    // Peer Reviews -- due dates for accepted / in-progress reviews
    for (const review of peerReviews.list) {
      if (review.status !== "accepted" && review.status !== "in-progress") continue
      const date = safeParseDate(review.dueDate)
      if (!date) continue
      items.push({
        id: `review-${review.id}`,
        title: review.manuscriptTitle || `Review for ${review.journal}`,
        module: "review",
        moduleLabel: "Peer Review",
        date,
        icon: ClipboardCheck,
      })
    }

    // Conferences -- submission & registration deadlines for non-attended
    for (const conf of conferences.list) {
      if (conf.status === "attended") continue

      const subDate = safeParseDate(conf.submissionDeadline)
      if (subDate) {
        items.push({
          id: `conf-sub-${conf.id}`,
          title: `${conf.name} (Submission)`,
          module: "conference",
          moduleLabel: "Conference",
          date: subDate,
          icon: Plane,
        })
      }

      const regDate = safeParseDate(conf.registrationDeadline)
      if (regDate) {
        items.push({
          id: `conf-reg-${conf.id}`,
          title: `${conf.name} (Registration)`,
          module: "conference",
          moduleLabel: "Conference",
          date: regDate,
          icon: Plane,
        })
      }
    }

    // Sort ascending by date so the most urgent items come first.
    items.sort((a, b) => a.date.getTime() - b.date.getTime())

    return items
  }, [papers.list, grants.list, peerReviews.list, conferences.list])

  // Group deadlines by urgency bucket.
  const grouped = useMemo(() => {
    const groups: Record<UrgencyGroup, AggregatedDeadline[]> = {
      overdue: [],
      thisWeek: [],
      thisMonth: [],
      later: [],
    }

    for (const d of deadlines) {
      groups[getUrgencyGroup(d.date, now)].push(d)
    }

    return groups
  }, [deadlines, now])

  // Ordered keys for rendering sections.
  const orderedGroups: UrgencyGroup[] = ["overdue", "thisWeek", "thisMonth", "later"]
  const nonEmptyGroups = orderedGroups.filter((g) => grouped[g].length > 0)

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  function renderDeadlineItem(deadline: AggregatedDeadline) {
    const group = getUrgencyGroup(deadline.date, now)
    const badge = urgencyBadge(group)
    const Icon = deadline.icon

    return (
      <Card key={deadline.id}>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Module icon */}
            <div
              className={
                "flex-shrink-0 rounded-lg p-2 " +
                (group === "overdue"
                  ? "bg-red-50"
                  : group === "thisWeek"
                    ? "bg-amber-50"
                    : group === "thisMonth"
                      ? "bg-blue-50"
                      : "bg-slate-50")
              }
            >
              <Icon
                className={
                  "h-5 w-5 " +
                  (group === "overdue"
                    ? "text-red-600"
                    : group === "thisWeek"
                      ? "text-amber-600"
                      : group === "thisMonth"
                        ? "text-blue-600"
                        : "text-slate-500")
                }
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-900 truncate">
                  {deadline.title}
                </span>
                <Badge variant={MODULE_BADGE_VARIANT[deadline.module]}>
                  {deadline.moduleLabel}
                </Badge>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>

              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                <span>{format(deadline.date, "MMM d, yyyy")}</span>
                <span className="text-slate-300">|</span>
                <span
                  className={
                    group === "overdue"
                      ? "text-red-600 font-medium"
                      : ""
                  }
                >
                  {daysDescription(deadline.date, now)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  if (!isHydrated) {
    return (
      <div className="space-y-8">
        <PageHeader
          icon={Calendar}
          title="Deadlines"
          description="All upcoming deadlines across your academic responsibilities"
        />
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Calendar}
        title="Deadlines"
        description="All upcoming deadlines across your academic responsibilities"
      />

      {deadlines.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming deadlines"
          description="Deadlines from your papers, grants, peer reviews, and conferences will appear here once you add items with due dates."
        />
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap gap-3 px-1">
            {grouped.overdue.length > 0 && (
              <Badge variant="danger">
                {grouped.overdue.length} overdue
              </Badge>
            )}
            {grouped.thisWeek.length > 0 && (
              <Badge variant="warning">
                {grouped.thisWeek.length} this week
              </Badge>
            )}
            {grouped.thisMonth.length > 0 && (
              <Badge variant="info">
                {grouped.thisMonth.length} this month
              </Badge>
            )}
            {grouped.later.length > 0 && (
              <Badge variant="default">
                {grouped.later.length} later
              </Badge>
            )}
          </div>

          {/* Grouped sections */}
          {nonEmptyGroups.map((groupKey) => {
            const meta = GROUP_META[groupKey]
            const GroupIcon = meta.icon

            return (
              <section key={groupKey}>
                <div className="flex items-center gap-2 mb-4">
                  {GroupIcon && (
                    <GroupIcon
                      className={
                        "h-5 w-5 " +
                        (groupKey === "overdue" ? "text-red-500" : "text-slate-400")
                      }
                    />
                  )}
                  <h2 className="text-lg font-semibold text-slate-900">
                    {meta.heading}
                  </h2>
                  <span className="text-sm text-slate-400">
                    ({grouped[groupKey].length})
                  </span>
                </div>

                <div className="space-y-3">
                  {grouped[groupKey].map((d) => renderDeadlineItem(d))}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
