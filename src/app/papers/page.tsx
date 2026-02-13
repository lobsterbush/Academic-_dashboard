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
import { PAPER_STAGES } from "@/lib/types";
import type { Paper, PaperStage, Priority, TrackedFile } from "@/lib/types";
import { FileText, Edit, Trash2, ChevronRight } from "lucide-react";
import { FileAttachments } from "@/components/files/file-attachments";
import { FileBadgeList } from "@/components/files/file-badge-list";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const PRIORITY_BADGE_VARIANT: Record<
  Priority,
  "danger" | "warning" | "info" | "default"
> = {
  urgent: "danger",
  high: "warning",
  medium: "info",
  low: "default",
};

const EMPTY_FORM: PaperFormData = {
  title: "",
  abstract: "",
  coAuthors: "",
  stage: "idea",
  targetJournal: "",
  submissionDate: "",
  decisionDate: "",
  priority: "medium",
  notes: "",
  linkedFiles: [],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaperFormData {
  title: string;
  abstract: string;
  coAuthors: string;
  stage: PaperStage;
  targetJournal: string;
  submissionDate: string;
  decisionDate: string;
  priority: Priority;
  notes: string;
  linkedFiles: TrackedFile[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paperToFormData(paper: Paper): PaperFormData {
  return {
    title: paper.title,
    abstract: paper.abstract,
    coAuthors: (paper.coAuthors ?? []).join(", "),
    stage: paper.stage,
    targetJournal: paper.targetJournal ?? "",
    submissionDate: paper.submissionDate ?? "",
    decisionDate: paper.decisionDate ?? "",
    priority: paper.priority ?? "medium",
    notes: paper.notes ?? "",
    linkedFiles: paper.linkedFiles ?? [],
  };
}

function formDataToPayload(form: PaperFormData) {
  return {
    title: form.title.trim(),
    abstract: form.abstract,
    coAuthors: form.coAuthors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    stage: form.stage,
    targetJournal: form.targetJournal,
    submissionDate: form.submissionDate,
    decisionDate: form.decisionDate,
    priority: form.priority,
    notes: form.notes,
    linkedFiles: form.linkedFiles,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PapersPage() {
  const { papers } = useDashboard();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [form, setForm] = useState<PaperFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Paper | null>(null);

  // ------ Modal handlers ------

  function openAddModal() {
    setEditingPaper(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(paper: Paper) {
    setEditingPaper(paper);
    setForm(paperToFormData(paper));
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingPaper(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    const payload = formDataToPayload(form);

    if (editingPaper) {
      papers.update(editingPaper.id, payload);
    } else {
      papers.add(payload);
    }

    closeModal();
  }

  // ------ Delete handlers ------

  function confirmDelete(paper: Paper) {
    setDeleteTarget(paper);
  }

  function handleDelete() {
    if (deleteTarget) {
      papers.delete(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  // ------ Form field updater ------

  function updateField<K extends keyof PaperFormData>(
    key: K,
    value: PaperFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "title" && formError) {
      setFormError("");
    }
  }

  // ------ Kanban helpers ------

  const papersByStage = PAPER_STAGES.map((stage) => ({
    ...stage,
    papers: papers.list.filter((p) => p.stage === stage.value),
  }));

  // ------ Render ------

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon={FileText}
        title="Papers Pipeline"
        description="Track manuscripts from idea to publication"
        actionLabel="Add Paper"
        onAction={openAddModal}
      />

      {papers.list.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={FileText}
            title="No papers yet"
            description="Start tracking your manuscripts by adding your first paper to the pipeline."
            actionLabel="Add Paper"
            onAction={openAddModal}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="inline-flex gap-4 min-w-full pb-4">
            {papersByStage.map((stage) => (
              <div
                key={stage.value}
                className="flex-shrink-0 w-72 flex flex-col"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {stage.label}
                    </h3>
                    <Badge variant="outline">{stage.papers.length}</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>

                {/* Paper cards */}
                <div className="flex flex-col gap-3 min-h-[120px]">
                  {stage.papers.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center py-8">
                      <p className="text-xs text-slate-400">No papers</p>
                    </div>
                  ) : (
                    stage.papers.map((paper) => (
                      <Card key={paper.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <p className="font-semibold text-sm text-slate-900 line-clamp-2">
                            {paper.title}
                          </p>

                          {paper.targetJournal && (
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {paper.targetJournal}
                            </p>
                          )}

                          {(paper.coAuthors ?? []).length > 0 && (
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {(paper.coAuthors ?? []).join(", ")}
                            </p>
                          )}

                          <FileBadgeList files={paper.linkedFiles ?? []} max={2} />

                          <div className="flex items-center justify-between mt-3">
                            <Badge variant={PRIORITY_BADGE_VARIANT[paper.priority ?? "medium"]}>
                              {(paper.priority ?? "medium").charAt(0).toUpperCase() +
                                (paper.priority ?? "medium").slice(1)}
                            </Badge>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(paper)}
                                aria-label={`Edit ${paper.title}`}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(paper)}
                                aria-label={`Delete ${paper.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Add / Edit Modal ---- */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingPaper ? "Edit Paper" : "Add Paper"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            id="paper-title"
            placeholder="Paper title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <Textarea
            label="Abstract"
            id="paper-abstract"
            placeholder="Brief abstract or summary"
            value={form.abstract}
            onChange={(e) => updateField("abstract", e.target.value)}
          />

          <Input
            label="Co-Authors (comma-separated)"
            id="paper-coauthors"
            placeholder="Jane Doe, John Smith"
            value={form.coAuthors}
            onChange={(e) => updateField("coAuthors", e.target.value)}
          />

          <Select
            label="Stage"
            id="paper-stage"
            options={PAPER_STAGES}
            value={form.stage}
            onChange={(e) => updateField("stage", e.target.value as PaperStage)}
          />

          <Input
            label="Target Journal"
            id="paper-journal"
            placeholder="e.g. Nature, Science"
            value={form.targetJournal}
            onChange={(e) => updateField("targetJournal", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Submission Date"
              id="paper-submission-date"
              type="date"
              value={form.submissionDate}
              onChange={(e) => updateField("submissionDate", e.target.value)}
            />
            <Input
              label="Decision Date"
              id="paper-decision-date"
              type="date"
              value={form.decisionDate}
              onChange={(e) => updateField("decisionDate", e.target.value)}
            />
          </div>

          <Select
            label="Priority"
            id="paper-priority"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(e) => updateField("priority", e.target.value as Priority)}
          />

          <Textarea
            label="Notes"
            id="paper-notes"
            placeholder="Any additional notes"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          <FileAttachments
            files={form.linkedFiles}
            onChange={(files) => updateField("linkedFiles", files)}
            label="Linked Files (PDFs, drafts, data)"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingPaper ? "Save Changes" : "Add Paper"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---- Delete Confirmation Modal ---- */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Paper"
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.title}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 pt-6">
          <Button
            variant="secondary"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
