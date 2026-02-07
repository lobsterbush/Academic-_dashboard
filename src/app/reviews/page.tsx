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
import { ClipboardCheck, Edit, Trash2, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { PeerReview, ReviewStatus, EditorialRole } from "@/lib/types";

// ============================================
// Constants
// ============================================

type ActiveTab = "reviews" | "editorial";

const REVIEW_STATUS_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const STATUS_BADGE_VARIANT: Record<
  ReviewStatus,
  "default" | "success" | "warning" | "danger" | "info" | "outline"
> = {
  pending: "warning",
  accepted: "info",
  declined: "danger",
  "in-progress": "info",
  completed: "success",
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  "in-progress": "In Progress",
  completed: "Completed",
};

// ============================================
// Helpers
// ============================================

function safeDateFormat(dateStr: string, fmt: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return format(d, fmt);
  } catch {
    return "";
  }
}

function isCurrentYear(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    return d.getFullYear() === new Date().getFullYear();
  } catch {
    return false;
  }
}

// ============================================
// Empty Review / Editorial Role form values
// ============================================

interface ReviewFormData {
  journal: string;
  manuscriptTitle: string;
  status: ReviewStatus;
  dueDate: string;
  receivedDate: string;
  completedDate: string;
  notes: string;
}

const EMPTY_REVIEW_FORM: ReviewFormData = {
  journal: "",
  manuscriptTitle: "",
  status: "pending",
  dueDate: "",
  receivedDate: "",
  completedDate: "",
  notes: "",
};

interface EditorialFormData {
  journal: string;
  role: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const EMPTY_EDITORIAL_FORM: EditorialFormData = {
  journal: "",
  role: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

// ============================================
// Page Component
// ============================================

export default function ReviewsPage() {
  const { peerReviews, editorialRoles } = useDashboard();

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("reviews");

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PeerReview | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>(EMPTY_REVIEW_FORM);

  // Editorial modal state
  const [isEditorialModalOpen, setIsEditorialModalOpen] = useState(false);
  const [editingEditorial, setEditingEditorial] = useState<EditorialRole | null>(null);
  const [editorialForm, setEditorialForm] = useState<EditorialFormData>(EMPTY_EDITORIAL_FORM);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "review" | "editorial";
    id: string;
  } | null>(null);

  // ---- Derived data ----

  const reviewsThisYear = peerReviews.list.filter(
    (r) => isCurrentYear(r.receivedDate) || isCurrentYear(r.createdAt)
  );
  const completedThisYear = reviewsThisYear.filter((r) => r.status === "completed");
  const activeReviews = peerReviews.list.filter(
    (r) => r.status === "pending" || r.status === "in-progress" || r.status === "accepted"
  );

  // ---- Review modal handlers ----

  function openAddReview() {
    setEditingReview(null);
    setReviewForm(EMPTY_REVIEW_FORM);
    setIsReviewModalOpen(true);
  }

  function openEditReview(review: PeerReview) {
    setEditingReview(review);
    setReviewForm({
      journal: review.journal,
      manuscriptTitle: review.manuscriptTitle,
      status: review.status,
      dueDate: review.dueDate,
      receivedDate: review.receivedDate,
      completedDate: review.completedDate,
      notes: review.notes,
    });
    setIsReviewModalOpen(true);
  }

  function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewForm.journal.trim() || !reviewForm.manuscriptTitle.trim()) return;

    if (editingReview) {
      peerReviews.update(editingReview.id, {
        journal: reviewForm.journal.trim(),
        manuscriptTitle: reviewForm.manuscriptTitle.trim(),
        status: reviewForm.status,
        dueDate: reviewForm.dueDate,
        receivedDate: reviewForm.receivedDate,
        completedDate: reviewForm.completedDate,
        notes: reviewForm.notes.trim(),
      });
    } else {
      peerReviews.add({
        journal: reviewForm.journal.trim(),
        manuscriptTitle: reviewForm.manuscriptTitle.trim(),
        status: reviewForm.status,
        dueDate: reviewForm.dueDate,
        receivedDate: reviewForm.receivedDate,
        completedDate: reviewForm.completedDate,
        notes: reviewForm.notes.trim(),
      });
    }

    setIsReviewModalOpen(false);
    setEditingReview(null);
    setReviewForm(EMPTY_REVIEW_FORM);
  }

  // ---- Editorial modal handlers ----

  function openAddEditorial() {
    setEditingEditorial(null);
    setEditorialForm(EMPTY_EDITORIAL_FORM);
    setIsEditorialModalOpen(true);
  }

  function openEditEditorial(role: EditorialRole) {
    setEditingEditorial(role);
    setEditorialForm({
      journal: role.journal,
      role: role.role,
      startDate: role.startDate,
      endDate: role.endDate,
      isActive: role.isActive,
    });
    setIsEditorialModalOpen(true);
  }

  function handleEditorialSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editorialForm.journal.trim() || !editorialForm.role.trim()) return;

    if (editingEditorial) {
      editorialRoles.update(editingEditorial.id, {
        journal: editorialForm.journal.trim(),
        role: editorialForm.role.trim(),
        startDate: editorialForm.startDate,
        endDate: editorialForm.endDate,
        isActive: editorialForm.isActive,
      });
    } else {
      editorialRoles.add({
        journal: editorialForm.journal.trim(),
        role: editorialForm.role.trim(),
        startDate: editorialForm.startDate,
        endDate: editorialForm.endDate,
        isActive: editorialForm.isActive,
      });
    }

    setIsEditorialModalOpen(false);
    setEditingEditorial(null);
    setEditorialForm(EMPTY_EDITORIAL_FORM);
  }

  // ---- Delete handlers ----

  function confirmDelete(type: "review" | "editorial", id: string) {
    setDeleteConfirm({ type, id });
  }

  function executeDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "review") {
      peerReviews.delete(deleteConfirm.id);
    } else {
      editorialRoles.delete(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={ClipboardCheck}
        title="Peer Reviews & Editorial"
        description="Track review assignments and editorial responsibilities"
      />

      <div className="space-y-6 p-8">
        {/* Tab Toggle */}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "reviews"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Peer Reviews
            </span>
          </button>
          <button
            onClick={() => setActiveTab("editorial")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "editorial"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Editorial Roles
            </span>
          </button>
        </div>

        {/* ========== Peer Reviews Tab ========== */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2">
                      <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Reviews This Year</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {reviewsThisYear.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-50 p-2">
                      <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Completed</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {completedThisYear.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-50 p-2">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Pending / In Progress</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {activeReviews.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add Review Button */}
            <div className="flex justify-end">
              <Button onClick={openAddReview} size="md">
                + Add Review
              </Button>
            </div>

            {/* Reviews List */}
            {peerReviews.list.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No peer reviews yet"
                description="Start tracking your peer review assignments by adding your first review."
                actionLabel="Add Review"
                onAction={openAddReview}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {peerReviews.list.map((review) => (
                  <Card key={review.id}>
                    <CardContent>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {review.manuscriptTitle || "Untitled Manuscript"}
                          </h3>
                          <p className="mt-0.5 text-sm text-slate-500">{review.journal}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant={STATUS_BADGE_VARIANT[review.status]}>
                              {STATUS_LABEL[review.status]}
                            </Badge>

                            {review.dueDate && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Calendar className="h-3 w-3" />
                                Due: {safeDateFormat(review.dueDate, "MMM d, yyyy")}
                              </span>
                            )}
                          </div>

                          {review.receivedDate && (
                            <p className="mt-2 text-xs text-slate-400">
                              Received: {safeDateFormat(review.receivedDate, "MMM d, yyyy")}
                            </p>
                          )}

                          {review.completedDate && (
                            <p className="text-xs text-slate-400">
                              Completed: {safeDateFormat(review.completedDate, "MMM d, yyyy")}
                            </p>
                          )}

                          {review.notes && (
                            <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                              {review.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditReview(review)}
                            title="Edit review"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete("review", review.id)}
                            title="Delete review"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== Editorial Roles Tab ========== */}
        {activeTab === "editorial" && (
          <div className="space-y-6">
            {/* Add Editorial Role Button */}
            <div className="flex justify-end">
              <Button onClick={openAddEditorial} size="md">
                + Add Editorial Role
              </Button>
            </div>

            {/* Editorial Roles List */}
            {editorialRoles.list.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No editorial roles yet"
                description="Track your editorial board memberships and reviewer roles."
                actionLabel="Add Editorial Role"
                onAction={openAddEditorial}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {editorialRoles.list.map((role) => (
                  <Card key={role.id}>
                    <CardContent>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {role.role}
                            </h3>
                            <Badge variant={role.isActive ? "success" : "outline"}>
                              {role.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500">{role.journal}</p>

                          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {safeDateFormat(role.startDate, "MMM yyyy")}
                              {role.endDate
                                ? ` - ${safeDateFormat(role.endDate, "MMM yyyy")}`
                                : " - Present"}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditEditorial(role)}
                            title="Edit role"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete("editorial", role.id)}
                            title="Delete role"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== Review Add/Edit Modal ========== */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setEditingReview(null);
          setReviewForm(EMPTY_REVIEW_FORM);
        }}
        title={editingReview ? "Edit Peer Review" : "Add Peer Review"}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <Input
            label="Journal"
            id="review-journal"
            placeholder="e.g. Nature Communications"
            value={reviewForm.journal}
            onChange={(e) =>
              setReviewForm((prev) => ({ ...prev, journal: e.target.value }))
            }
            required
          />

          <Input
            label="Manuscript Title"
            id="review-manuscript"
            placeholder="Title of the manuscript"
            value={reviewForm.manuscriptTitle}
            onChange={(e) =>
              setReviewForm((prev) => ({ ...prev, manuscriptTitle: e.target.value }))
            }
            required
          />

          <Select
            label="Status"
            id="review-status"
            options={REVIEW_STATUS_OPTIONS}
            value={reviewForm.status}
            onChange={(e) =>
              setReviewForm((prev) => ({
                ...prev,
                status: e.target.value as ReviewStatus,
              }))
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Received Date"
              id="review-received"
              type="date"
              value={reviewForm.receivedDate}
              onChange={(e) =>
                setReviewForm((prev) => ({ ...prev, receivedDate: e.target.value }))
              }
            />

            <Input
              label="Due Date"
              id="review-due"
              type="date"
              value={reviewForm.dueDate}
              onChange={(e) =>
                setReviewForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </div>

          <Input
            label="Completed Date"
            id="review-completed"
            type="date"
            value={reviewForm.completedDate}
            onChange={(e) =>
              setReviewForm((prev) => ({ ...prev, completedDate: e.target.value }))
            }
          />

          <Textarea
            label="Notes"
            id="review-notes"
            placeholder="Any notes about this review..."
            value={reviewForm.notes}
            onChange={(e) =>
              setReviewForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsReviewModalOpen(false);
                setEditingReview(null);
                setReviewForm(EMPTY_REVIEW_FORM);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingReview ? "Save Changes" : "Add Review"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== Editorial Role Add/Edit Modal ========== */}
      <Modal
        isOpen={isEditorialModalOpen}
        onClose={() => {
          setIsEditorialModalOpen(false);
          setEditingEditorial(null);
          setEditorialForm(EMPTY_EDITORIAL_FORM);
        }}
        title={editingEditorial ? "Edit Editorial Role" : "Add Editorial Role"}
      >
        <form onSubmit={handleEditorialSubmit} className="space-y-4">
          <Input
            label="Journal"
            id="editorial-journal"
            placeholder="e.g. Journal of Machine Learning Research"
            value={editorialForm.journal}
            onChange={(e) =>
              setEditorialForm((prev) => ({ ...prev, journal: e.target.value }))
            }
            required
          />

          <Input
            label="Role"
            id="editorial-role"
            placeholder="e.g. Associate Editor, Editorial Board"
            value={editorialForm.role}
            onChange={(e) =>
              setEditorialForm((prev) => ({ ...prev, role: e.target.value }))
            }
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              id="editorial-start"
              type="date"
              value={editorialForm.startDate}
              onChange={(e) =>
                setEditorialForm((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />

            <Input
              label="End Date"
              id="editorial-end"
              type="date"
              value={editorialForm.endDate}
              onChange={(e) =>
                setEditorialForm((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editorial-active"
              checked={editorialForm.isActive}
              onChange={(e) =>
                setEditorialForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="editorial-active" className="text-sm font-medium text-slate-700">
              Currently Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditorialModalOpen(false);
                setEditingEditorial(null);
                setEditorialForm(EMPTY_EDITORIAL_FORM);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingEditorial ? "Save Changes" : "Add Role"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== Delete Confirmation Modal ========== */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this{" "}
            {deleteConfirm?.type === "review" ? "peer review" : "editorial role"}? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={executeDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
