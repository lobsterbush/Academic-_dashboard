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
import { Users, Edit, Trash2, Mail, GraduationCap, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Student, StudentLevel, StudentStatus } from "@/lib/types";

// ============================================
// Constants
// ============================================

const LEVEL_OPTIONS: { value: StudentLevel; label: string }[] = [
  { value: "phd", label: "PhD" },
  { value: "masters", label: "Masters" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postdoc", label: "Postdoc" },
];

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "graduated", label: "Graduated" },
  { value: "on-leave", label: "On Leave" },
  { value: "withdrawn", label: "Withdrawn" },
];

const COMMITTEE_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "chair", label: "Chair" },
  { value: "member", label: "Member" },
  { value: "reader", label: "Reader" },
];

const LEVEL_BADGE_VARIANT: Record<StudentLevel, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  phd: "info",
  masters: "default",
  undergraduate: "outline",
  postdoc: "success",
};

const LEVEL_LABELS: Record<StudentLevel, string> = {
  phd: "PhD",
  masters: "Masters",
  undergraduate: "Undergraduate",
  postdoc: "Postdoc",
};

const STATUS_BADGE_VARIANT: Record<StudentStatus, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  active: "success",
  graduated: "info",
  "on-leave": "warning",
  withdrawn: "danger",
};

const STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Active",
  graduated: "Graduated",
  "on-leave": "On Leave",
  withdrawn: "Withdrawn",
};

const COMMITTEE_ROLE_LABELS: Record<string, string> = {
  chair: "Chair",
  member: "Member",
  reader: "Reader",
};

type StatusFilter = "all" | StudentStatus;

// ============================================
// Form State
// ============================================

interface StudentFormData {
  name: string;
  email: string;
  level: StudentLevel;
  status: StudentStatus;
  program: string;
  dissertationTitle: string;
  startDate: string;
  expectedGraduation: string;
  committeeRole: string;
  notes: string;
}

const EMPTY_FORM: StudentFormData = {
  name: "",
  email: "",
  level: "phd",
  status: "active",
  program: "",
  dissertationTitle: "",
  startDate: "",
  expectedGraduation: "",
  committeeRole: "chair",
  notes: "",
};

// ============================================
// Helpers
// ============================================

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return "";
  }
}

// ============================================
// Students Page
// ============================================

export default function StudentsPage() {
  const { students } = useDashboard();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_FORM);

  // --- Filtering ---

  const filteredStudents =
    statusFilter === "all"
      ? students.list
      : students.list.filter((s) => s.status === statusFilter);

  // --- Modal handlers ---

  function openAddModal() {
    setEditingStudent(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      level: student.level,
      status: student.status,
      program: student.program,
      dissertationTitle: student.dissertationTitle,
      startDate: student.startDate,
      expectedGraduation: student.expectedGraduation,
      committeeRole: student.committeeRole,
      notes: student.notes,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStudent) {
      students.update(editingStudent.id, { ...formData });
    } else {
      students.add({ ...formData });
    }

    closeModal();
  }

  function handleDelete(id: string) {
    students.delete(id);
  }

  // --- Render ---

  const filterButtons: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Graduated", value: "graduated" },
    { label: "On Leave", value: "on-leave" },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={Users}
        title="Students & Advising"
        description="Track advisees and committee memberships"
        actionLabel="Add Student"
        onAction={openAddModal}
      />

      <div className="space-y-6 p-8">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={statusFilter === btn.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => setStatusFilter(btn.value)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Student Cards Grid */}
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description={
              statusFilter === "all"
                ? "Add your first student to start tracking advisees and committee memberships."
                : `No students with "${STATUS_LABELS[statusFilter as StudentStatus]}" status.`
            }
            actionLabel={statusFilter === "all" ? "Add Student" : undefined}
            onAction={statusFilter === "all" ? openAddModal : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardContent>
                  <div className="space-y-3">
                    {/* Header: Name + Action Buttons */}
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        {student.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(student)}
                          aria-label={`Edit ${student.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(student.id)}
                          aria-label={`Delete ${student.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Email */}
                    {student.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}

                    {/* Badges: Level + Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={LEVEL_BADGE_VARIANT[student.level]}>
                        <GraduationCap className="mr-1 h-3 w-3" />
                        {LEVEL_LABELS[student.level]}
                      </Badge>
                      <Badge variant={STATUS_BADGE_VARIANT[student.status]}>
                        {STATUS_LABELS[student.status]}
                      </Badge>
                    </div>

                    {/* Program */}
                    {student.program && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Program:</span>{" "}
                        {student.program}
                      </p>
                    )}

                    {/* Dissertation / Thesis Title */}
                    {student.dissertationTitle && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">
                          {student.level === "phd" ? "Dissertation:" : "Thesis:"}
                        </span>{" "}
                        {student.dissertationTitle}
                      </p>
                    )}

                    {/* Committee Role */}
                    {student.committeeRole && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Committee Role:</span>{" "}
                        {COMMITTEE_ROLE_LABELS[student.committeeRole] || student.committeeRole}
                      </p>
                    )}

                    {/* Expected Graduation */}
                    {student.expectedGraduation && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>Expected: {formatDate(student.expectedGraduation)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingStudent ? "Edit Student" : "Add Student"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="student-name"
            label="Name"
            placeholder="Student name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            id="student-email"
            label="Email"
            type="email"
            placeholder="student@university.edu"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="student-level"
              label="Level"
              options={LEVEL_OPTIONS}
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value as StudentLevel })
              }
            />

            <Select
              id="student-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as StudentStatus })
              }
            />
          </div>

          <Input
            id="student-program"
            label="Program"
            placeholder="e.g. Computer Science"
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
          />

          <Input
            id="student-dissertation"
            label="Dissertation / Thesis Title"
            placeholder="Title of dissertation or thesis"
            value={formData.dissertationTitle}
            onChange={(e) =>
              setFormData({ ...formData, dissertationTitle: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="student-start-date"
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />

            <Input
              id="student-expected-graduation"
              label="Expected Graduation"
              type="date"
              value={formData.expectedGraduation}
              onChange={(e) =>
                setFormData({ ...formData, expectedGraduation: e.target.value })
              }
            />
          </div>

          <Select
            id="student-committee-role"
            label="Committee Role"
            options={COMMITTEE_ROLE_OPTIONS}
            value={formData.committeeRole}
            onChange={(e) =>
              setFormData({ ...formData, committeeRole: e.target.value })
            }
          />

          <Textarea
            id="student-notes"
            label="Notes"
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingStudent ? "Save Changes" : "Add Student"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
