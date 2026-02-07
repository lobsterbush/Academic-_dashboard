"use client"

import { useState } from "react"
import { useDashboard } from "@/context/store-context"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { GraduationCap, Edit, Trash2, Clock, MapPin, User } from "lucide-react"

interface Course {
  id: string
  name: string
  code: string
  semester: "Fall" | "Spring" | "Summer"
  year: number
  enrollment: number
  schedule: string
  location: string
  officeHours: string
  taName: string
  notes: string
  isActive: boolean
  createdAt: string
}

type CourseFormData = Omit<Course, "id" | "createdAt">

const defaultFormData: CourseFormData = {
  name: "",
  code: "",
  semester: "Fall",
  year: new Date().getFullYear(),
  enrollment: 0,
  schedule: "",
  location: "",
  officeHours: "",
  taName: "",
  notes: "",
  isActive: true,
}

const semesterOptions = [
  { value: "Fall", label: "Fall" },
  { value: "Spring", label: "Spring" },
  { value: "Summer", label: "Summer" },
]

function semesterBadgeVariant(semester: string): "default" | "success" | "warning" | "danger" | "info" | "outline" {
  switch (semester) {
    case "Fall":
      return "warning"
    case "Spring":
      return "success"
    case "Summer":
      return "info"
    default:
      return "default"
  }
}

export default function TeachingPage() {
  const { courses } = useDashboard()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CourseFormData>(defaultFormData)

  const currentCourses = courses.list.filter((c: Course) => c.isActive)
  const pastCourses = courses.list.filter((c: Course) => !c.isActive)

  function openAddModal() {
    setEditingCourseId(null)
    setFormData(defaultFormData)
    setIsModalOpen(true)
  }

  function openEditModal(course: Course) {
    setEditingCourseId(course.id)
    setFormData({
      name: course.name,
      code: course.code,
      semester: course.semester,
      year: course.year,
      enrollment: course.enrollment,
      schedule: course.schedule,
      location: course.location,
      officeHours: course.officeHours,
      taName: course.taName,
      notes: course.notes,
      isActive: course.isActive,
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingCourseId(null)
    setFormData(defaultFormData)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) return

    if (editingCourseId) {
      courses.update(editingCourseId, formData)
    } else {
      courses.add(formData)
    }

    closeModal()
  }

  function handleDelete(id: string) {
    if (window.confirm("Are you sure you want to delete this course?")) {
      courses.delete(id)
    }
  }

  function handleToggleActive(course: Course) {
    courses.update(course.id, { isActive: !course.isActive })
  }

  function updateField<K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function renderCourseCard(course: Course) {
    return (
      <Card key={course.id}>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">
                  {course.code} &mdash; {course.name}
                </h3>
                <Badge variant={semesterBadgeVariant(course.semester)}>
                  {course.semester} {course.year}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {course.schedule && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{course.schedule}</span>
                  </div>
                )}

                {course.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{course.location}</span>
                  </div>
                )}

                {course.taName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>TA: {course.taName}</span>
                  </div>
                )}

                {course.officeHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>Office Hours: {course.officeHours}</span>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <Badge variant="outline">
                  {course.enrollment} {course.enrollment === 1 ? "student" : "students"} enrolled
                </Badge>
              </div>

              {course.notes && (
                <p className="mt-2 text-sm text-gray-500 italic">{course.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActive(course)}
              >
                {course.isActive ? "Archive" : "Reactivate"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openEditModal(course)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(course.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Teaching"
        description="Manage courses and teaching responsibilities"
        icon={GraduationCap}
        actionLabel="Add Course"
        onAction={openAddModal}
      />

      {/* Current Courses */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Courses</h2>
        {currentCourses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No current courses"
            description="Add a course to start tracking your teaching responsibilities."
          />
        ) : (
          <div className="space-y-4">
            {currentCourses.map((course: Course) => renderCourseCard(course))}
          </div>
        )}
      </section>

      {/* Past Courses */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Courses</h2>
        {pastCourses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No past courses"
            description="Archived courses will appear here."
          />
        ) : (
          <div className="space-y-4">
            {pastCourses.map((course: Course) => renderCourseCard(course))}
          </div>
        )}
      </section>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCourseId ? "Edit Course" : "Add Course"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Course Name"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Introduction to Computer Science"
            required
          />

          <Input
            label="Course Code"
            value={formData.code}
            onChange={(e) => updateField("code", e.target.value)}
            placeholder="e.g. CS 101"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Semester"
              options={semesterOptions}
              value={formData.semester}
              onChange={(e) =>
                updateField("semester", e.target.value as "Fall" | "Spring" | "Summer")
              }
            />

            <Input
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => updateField("year", parseInt(e.target.value, 10) || 0)}
              min={2000}
              max={2100}
            />
          </div>

          <Input
            label="Enrollment"
            type="number"
            value={formData.enrollment}
            onChange={(e) => updateField("enrollment", parseInt(e.target.value, 10) || 0)}
            min={0}
          />

          <Input
            label="Schedule"
            value={formData.schedule}
            onChange={(e) => updateField("schedule", e.target.value)}
            placeholder="e.g. MWF 10:00 AM - 10:50 AM"
          />

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="e.g. Engineering Hall 201"
          />

          <Input
            label="Office Hours"
            value={formData.officeHours}
            onChange={(e) => updateField("officeHours", e.target.value)}
            placeholder="e.g. Tue/Thu 2:00 - 3:30 PM"
          />

          <Input
            label="TA Name"
            value={formData.taName}
            onChange={(e) => updateField("taName", e.target.value)}
            placeholder="e.g. Jane Smith"
          />

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Additional notes about this course..."
            rows={3}
          />

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active course
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" size="md" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingCourseId ? "Save Changes" : "Add Course"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
