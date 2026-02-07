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
import type { Conference, ConferenceStatus } from "@/lib/types";
import {
  Plane,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Presentation,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: ConferenceStatus; label: string }[] = [
  { value: "considering", label: "Considering" },
  { value: "abstract-submitted", label: "Abstract Submitted" },
  { value: "accepted", label: "Accepted" },
  { value: "registered", label: "Registered" },
  { value: "attended", label: "Attended" },
];

const STATUS_BADGE_VARIANT: Record<
  ConferenceStatus,
  "default" | "info" | "success" | "warning" | "outline"
> = {
  considering: "default",
  "abstract-submitted": "info",
  accepted: "success",
  registered: "warning",
  attended: "outline",
};

const STATUS_LABELS: Record<ConferenceStatus, string> = {
  considering: "Considering",
  "abstract-submitted": "Abstract Submitted",
  accepted: "Accepted",
  registered: "Registered",
  attended: "Attended",
};

const PRESENTATION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "None" },
  { value: "paper", label: "Paper" },
  { value: "poster", label: "Poster" },
  { value: "panel", label: "Panel" },
  { value: "invited", label: "Invited Talk" },
];

const EMPTY_FORM: ConferenceFormData = {
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "considering",
  presentationTitle: "",
  presentationType: "",
  submissionDeadline: "",
  registrationDeadline: "",
  travelBooked: false,
  notes: "",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConferenceFormData {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: ConferenceStatus;
  presentationTitle: string;
  presentationType: string;
  submissionDeadline: string;
  registrationDeadline: string;
  travelBooked: boolean;
  notes: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function conferenceToFormData(conf: Conference): ConferenceFormData {
  return {
    name: conf.name,
    location: conf.location,
    startDate: conf.startDate,
    endDate: conf.endDate,
    status: conf.status,
    presentationTitle: conf.presentationTitle,
    presentationType: conf.presentationType,
    submissionDeadline: conf.submissionDeadline,
    registrationDeadline: conf.registrationDeadline,
    travelBooked: conf.travelBooked,
    notes: conf.notes,
  };
}

function formDataToPayload(form: ConferenceFormData): Omit<Conference, "id" | "createdAt"> {
  return {
    name: form.name.trim(),
    location: form.location.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.status,
    presentationTitle: form.presentationTitle.trim(),
    presentationType: form.presentationType,
    submissionDeadline: form.submissionDeadline,
    registrationDeadline: form.registrationDeadline,
    travelBooked: form.travelBooked,
    notes: form.notes,
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr + "T00:00:00"), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConferencesPage() {
  const { conferences } = useDashboard();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConference, setEditingConference] = useState<Conference | null>(null);
  const [form, setForm] = useState<ConferenceFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Conference | null>(null);

  // ------ Sorted conferences: upcoming first (by startDate ascending) ------

  const sortedConferences = [...conferences.list].sort((a, b) => {
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return a.startDate.localeCompare(b.startDate);
  });

  // ------ Modal handlers ------

  function openAddModal() {
    setEditingConference(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(conf: Conference) {
    setEditingConference(conf);
    setForm(conferenceToFormData(conf));
    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingConference(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setFormError("Conference name is required.");
      return;
    }

    const payload = formDataToPayload(form);

    if (editingConference) {
      conferences.update(editingConference.id, payload);
    } else {
      conferences.add(payload);
    }

    closeModal();
  }

  // ------ Delete handlers ------

  function confirmDelete(conf: Conference) {
    setDeleteTarget(conf);
  }

  function handleDelete() {
    if (deleteTarget) {
      conferences.delete(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  // ------ Form field updater ------

  function updateField<K extends keyof ConferenceFormData>(
    key: K,
    value: ConferenceFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "name" && formError) {
      setFormError("");
    }
  }

  // ------ Render ------

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon={Plane}
        title="Conferences & Travel"
        description="Track conference submissions, presentations, and travel"
        actionLabel="Add Conference"
        onAction={openAddModal}
      />

      {conferences.list.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Plane}
            title="No conferences yet"
            description="Start tracking your conferences by adding your first conference submission or travel plan."
            actionLabel="Add Conference"
            onAction={openAddModal}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {sortedConferences.map((conf) => (
              <Card key={conf.id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    {/* Left content */}
                    <div className="flex-1 min-w-0">
                      {/* Name and status */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">
                          {conf.name}
                        </h3>
                        <Badge variant={STATUS_BADGE_VARIANT[conf.status]}>
                          {STATUS_LABELS[conf.status]}
                        </Badge>
                      </div>

                      {/* Location */}
                      {conf.location && (
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                          <span>{conf.location}</span>
                        </div>
                      )}

                      {/* Date range */}
                      {(conf.startDate || conf.endDate) && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-slate-400" />
                          <span>{formatDateRange(conf.startDate, conf.endDate)}</span>
                        </div>
                      )}

                      {/* Presentation info */}
                      {(conf.presentationTitle || conf.presentationType) && (
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-700">
                          <Presentation className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                          <span>
                            {conf.presentationTitle && (
                              <span className="font-medium">{conf.presentationTitle}</span>
                            )}
                            {conf.presentationTitle && conf.presentationType && (
                              <span className="text-slate-400"> &middot; </span>
                            )}
                            {conf.presentationType && (
                              <span className="capitalize text-slate-500">
                                {conf.presentationType === "invited"
                                  ? "Invited Talk"
                                  : conf.presentationType}
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Deadlines and travel row */}
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        {conf.submissionDeadline && (
                          <div className="text-xs text-slate-500">
                            <span className="font-medium text-slate-600">Submission:</span>{" "}
                            {formatDate(conf.submissionDeadline)}
                          </div>
                        )}
                        {conf.registrationDeadline && (
                          <div className="text-xs text-slate-500">
                            <span className="font-medium text-slate-600">Registration:</span>{" "}
                            {formatDate(conf.registrationDeadline)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs">
                          {conf.travelBooked ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-600 font-medium">Travel Booked</span>
                            </>
                          ) : (
                            <>
                              <Plane className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-amber-600 font-medium">Travel Not Booked</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(conf)}
                        aria-label={`Edit ${conf.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(conf)}
                        aria-label={`Delete ${conf.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ---- Add / Edit Modal ---- */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingConference ? "Edit Conference" : "Add Conference"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Conference Name"
            id="conf-name"
            placeholder="e.g. ACM CHI 2026"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <Input
            label="Location"
            id="conf-location"
            placeholder="e.g. New Orleans, LA"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              id="conf-start-date"
              type="date"
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
            />
            <Input
              label="End Date"
              id="conf-end-date"
              type="date"
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
            />
          </div>

          <Select
            label="Status"
            id="conf-status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) =>
              updateField("status", e.target.value as ConferenceStatus)
            }
          />

          <Input
            label="Presentation Title"
            id="conf-presentation-title"
            placeholder="Title of your presentation (if any)"
            value={form.presentationTitle}
            onChange={(e) => updateField("presentationTitle", e.target.value)}
          />

          <Select
            label="Presentation Type"
            id="conf-presentation-type"
            options={PRESENTATION_TYPE_OPTIONS}
            value={form.presentationType}
            onChange={(e) => updateField("presentationType", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Submission Deadline"
              id="conf-submission-deadline"
              type="date"
              value={form.submissionDeadline}
              onChange={(e) => updateField("submissionDeadline", e.target.value)}
            />
            <Input
              label="Registration Deadline"
              id="conf-registration-deadline"
              type="date"
              value={form.registrationDeadline}
              onChange={(e) =>
                updateField("registrationDeadline", e.target.value)
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="conf-travel-booked"
              checked={form.travelBooked}
              onChange={(e) => updateField("travelBooked", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="conf-travel-booked"
              className="text-sm font-medium text-slate-700"
            >
              Travel Booked
            </label>
          </div>

          <Textarea
            label="Notes"
            id="conf-notes"
            placeholder="Any additional notes about the conference"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingConference ? "Save Changes" : "Add Conference"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---- Delete Confirmation Modal ---- */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Conference"
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.name}
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
