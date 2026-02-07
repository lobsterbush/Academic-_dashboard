"use client";

import { useState } from "react";
import { useDashboard } from "@/context/store-context";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { GRANT_STATUSES } from "@/lib/types";
import type { Grant, GrantStatus } from "@/lib/types";
import { DollarSign, Edit, Trash2, Building2, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANT: Record<GrantStatus, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  planning: "default",
  drafting: "info",
  submitted: "warning",
  "under-review": "warning",
  funded: "success",
  declined: "danger",
  completed: "outline",
};

function statusLabel(status: GrantStatus): string {
  return GRANT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Default form values
// ---------------------------------------------------------------------------

interface GrantFormData {
  title: string;
  agency: string;
  amount: string;
  role: string;
  status: GrantStatus;
  submissionDeadline: string;
  startDate: string;
  endDate: string;
  coInvestigators: string;
  notes: string;
}

const EMPTY_FORM: GrantFormData = {
  title: "",
  agency: "",
  amount: "",
  role: "",
  status: "planning",
  submissionDeadline: "",
  startDate: "",
  endDate: "",
  coInvestigators: "",
  notes: "",
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function GrantsPage() {
  const { grants } = useDashboard();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null);
  const [form, setForm] = useState<GrantFormData>(EMPTY_FORM);

  // ---- Derived stats -------------------------------------------------------

  const totalFunded = grants.list
    .filter((g) => g.status === "funded")
    .reduce((sum, g) => sum + g.amount, 0);

  const activeApplications = grants.list.filter(
    (g) => g.status === "submitted" || g.status === "under-review"
  ).length;

  const decided = grants.list.filter(
    (g) => g.status === "funded" || g.status === "declined" || g.status === "completed"
  );
  const successCount = decided.filter(
    (g) => g.status === "funded" || g.status === "completed"
  ).length;
  const successRate = decided.length > 0 ? Math.round((successCount / decided.length) * 100) : 0;

  // ---- Modal helpers -------------------------------------------------------

  function openAddModal() {
    setEditingGrant(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(grant: Grant) {
    setEditingGrant(grant);
    setForm({
      title: grant.title,
      agency: grant.agency,
      amount: String(grant.amount),
      role: grant.role,
      status: grant.status,
      submissionDeadline: grant.submissionDeadline,
      startDate: grant.startDate,
      endDate: grant.endDate,
      coInvestigators: grant.coInvestigators.join(", "),
      notes: grant.notes,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingGrant(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: Omit<Grant, "id" | "createdAt"> = {
      title: form.title.trim(),
      agency: form.agency.trim(),
      amount: Number(form.amount) || 0,
      role: form.role.trim(),
      status: form.status,
      submissionDeadline: form.submissionDeadline,
      startDate: form.startDate,
      endDate: form.endDate,
      coInvestigators: form.coInvestigators
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notes: form.notes.trim(),
    };

    if (editingGrant) {
      grants.update(editingGrant.id, payload);
    } else {
      grants.add(payload);
    }

    closeModal();
  }

  function handleDelete(id: string) {
    grants.delete(id);
  }

  // ---- Field change helper -------------------------------------------------

  function updateField<K extends keyof GrantFormData>(key: K, value: GrantFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ---- Render --------------------------------------------------------------

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon={DollarSign}
        title="Grants"
        description="Track funding applications and active awards"
        actionLabel="Add Grant"
        onAction={openAddModal}
      />

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Funded</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatCurrency(totalFunded)}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Active Applications</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{activeApplications}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Success Rate</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {decided.length > 0 ? `${successRate}%` : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grant cards */}
        {grants.list.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No grants yet"
            description="Start tracking your funding applications and active awards."
            actionLabel="Add Grant"
            onAction={openAddModal}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {grants.list.map((grant) => (
              <Card key={grant.id}>
                <CardContent>
                  <div className="space-y-3">
                    {/* Header row: title + status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {grant.title}
                      </h3>
                      <Badge variant={STATUS_BADGE_VARIANT[grant.status]}>
                        {statusLabel(grant.status)}
                      </Badge>
                    </div>

                    {/* Agency */}
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span>{grant.agency}</span>
                    </div>

                    {/* Amount & Role */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(grant.amount)}
                      </span>
                      {grant.role && (
                        <Badge variant="outline">{grant.role}</Badge>
                      )}
                    </div>

                    {/* Dates */}
                    {(grant.status === "funded" || grant.status === "completed") &&
                      (grant.startDate || grant.endDate) && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>
                            {grant.startDate ? formatDate(grant.startDate) : "TBD"}
                            {" - "}
                            {grant.endDate ? formatDate(grant.endDate) : "TBD"}
                          </span>
                        </div>
                      )}

                    {grant.status !== "funded" &&
                      grant.status !== "completed" &&
                      grant.submissionDeadline && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>Deadline: {formatDate(grant.submissionDeadline)}</span>
                        </div>
                      )}

                    {/* Co-Investigators */}
                    {grant.coInvestigators.length > 0 && (
                      <div className="flex items-start gap-1.5 text-sm text-slate-500">
                        <Users className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                        <span>{grant.coInvestigators.join(", ")}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(grant)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(grant.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingGrant ? "Edit Grant" : "Add Grant"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="grant-title"
            label="Title"
            placeholder="Grant title"
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />

          <Input
            id="grant-agency"
            label="Agency"
            placeholder="Funding agency (e.g. NSF, NIH)"
            required
            value={form.agency}
            onChange={(e) => updateField("agency", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="grant-amount"
              label="Amount ($)"
              type="number"
              min="0"
              placeholder="0"
              required
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
            />

            <Input
              id="grant-role"
              label="Role"
              placeholder="PI, Co-PI, etc."
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
            />
          </div>

          <Select
            id="grant-status"
            label="Status"
            options={GRANT_STATUSES}
            value={form.status}
            onChange={(e) => updateField("status", e.target.value as GrantStatus)}
          />

          <Input
            id="grant-submission-deadline"
            label="Submission Deadline"
            type="date"
            value={form.submissionDeadline}
            onChange={(e) => updateField("submissionDeadline", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="grant-start-date"
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
            />

            <Input
              id="grant-end-date"
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
            />
          </div>

          <Input
            id="grant-co-investigators"
            label="Co-Investigators"
            placeholder="Comma-separated names"
            value={form.coInvestigators}
            onChange={(e) => updateField("coInvestigators", e.target.value)}
          />

          <Textarea
            id="grant-notes"
            label="Notes"
            placeholder="Additional notes..."
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingGrant ? "Save Changes" : "Add Grant"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
