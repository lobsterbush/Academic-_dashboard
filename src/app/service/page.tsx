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
import { Briefcase, Edit, Trash2, Building, Clock } from "lucide-react"
import { format } from "date-fns"

type ServiceType = "department" | "university" | "professional" | "community"

interface ServiceRole {
  id: string
  title: string
  organization: string
  type: ServiceType
  startDate: string
  endDate: string
  isActive: boolean
  hoursPerMonth: number
  notes: string
  createdAt: string
}

type ServiceRoleFormData = Omit<ServiceRole, "id" | "createdAt">

const defaultFormData: ServiceRoleFormData = {
  title: "",
  organization: "",
  type: "department",
  startDate: "",
  endDate: "",
  isActive: true,
  hoursPerMonth: 0,
  notes: "",
}

const typeOptions = [
  { value: "department", label: "Department" },
  { value: "university", label: "University" },
  { value: "professional", label: "Professional" },
  { value: "community", label: "Community" },
]

const typeLabels: Record<ServiceType, string> = {
  department: "Department",
  university: "University",
  professional: "Professional",
  community: "Community",
}

function typeBadgeVariant(
  type: ServiceType
): "default" | "success" | "warning" | "danger" | "info" | "outline" {
  switch (type) {
    case "department":
      return "info"
    case "university":
      return "success"
    case "professional":
      return "warning"
    case "community":
      return "default"
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  try {
    return format(new Date(dateStr), "MMM d, yyyy")
  } catch {
    return dateStr
  }
}

export default function ServicePage() {
  const { serviceRoles } = useDashboard()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ServiceRoleFormData>(defaultFormData)

  const activeRoles = serviceRoles.list.filter((r: ServiceRole) => r.isActive)
  const totalHoursPerMonth = activeRoles.reduce(
    (sum: number, r: ServiceRole) => sum + r.hoursPerMonth,
    0
  )

  const groupOrder: ServiceType[] = ["department", "university", "professional", "community"]
  const groupedRoles: Record<ServiceType, ServiceRole[]> = {
    department: [],
    university: [],
    professional: [],
    community: [],
  }
  for (const role of serviceRoles.list as ServiceRole[]) {
    groupedRoles[role.type].push(role)
  }

  function openAddModal() {
    setEditingRoleId(null)
    setFormData(defaultFormData)
    setIsModalOpen(true)
  }

  function openEditModal(role: ServiceRole) {
    setEditingRoleId(role.id)
    setFormData({
      title: role.title,
      organization: role.organization,
      type: role.type,
      startDate: role.startDate,
      endDate: role.endDate,
      isActive: role.isActive,
      hoursPerMonth: role.hoursPerMonth,
      notes: role.notes,
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingRoleId(null)
    setFormData(defaultFormData)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim()) return

    if (editingRoleId) {
      serviceRoles.update(editingRoleId, formData)
    } else {
      serviceRoles.add(formData)
    }

    closeModal()
  }

  function handleDelete(id: string) {
    if (window.confirm("Are you sure you want to delete this service role?")) {
      serviceRoles.delete(id)
    }
  }

  function updateField<K extends keyof ServiceRoleFormData>(
    key: K,
    value: ServiceRoleFormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function renderRoleCard(role: ServiceRole) {
    return (
      <Card key={role.id}>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">{role.title}</h3>
                <Badge variant={typeBadgeVariant(role.type)}>
                  {typeLabels[role.type]}
                </Badge>
                <Badge variant={role.isActive ? "success" : "outline"}>
                  {role.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {role.organization && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{role.organization}</span>
                  </div>
                )}

                {(role.startDate || role.endDate) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>
                      {formatDate(role.startDate)}
                      {role.startDate && role.endDate ? " \u2013 " : ""}
                      {formatDate(role.endDate)}
                      {role.startDate && !role.endDate ? " \u2013 Present" : ""}
                    </span>
                  </div>
                )}

                {role.hoursPerMonth > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>
                      {role.hoursPerMonth} {role.hoursPerMonth === 1 ? "hour" : "hours"}/month
                    </span>
                  </div>
                )}
              </div>

              {role.notes && (
                <p className="mt-2 text-sm text-gray-500 italic">{role.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openEditModal(role)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(role.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasAnyRoles = serviceRoles.list.length > 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="Service & Committees"
        description="Track departmental, university, and professional service"
        icon={Briefcase}
        actionLabel="Add Role"
        onAction={openAddModal}
      />

      {/* Summary */}
      {hasAnyRoles && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-8">
          <Card>
            <CardContent>
              <div className="text-sm font-medium text-gray-500">Active Roles</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {activeRoles.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-sm font-medium text-gray-500">
                Total Hours/Month Committed
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {totalHoursPerMonth}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grouped Roles */}
      {!hasAnyRoles ? (
        <div className="px-8">
          <EmptyState
            icon={Briefcase}
            title="No service roles"
            description="Add a service role to start tracking your departmental, university, and professional service commitments."
            actionLabel="Add Role"
            onAction={openAddModal}
          />
        </div>
      ) : (
        groupOrder.map((type) => {
          const roles = groupedRoles[type]
          if (roles.length === 0) return null
          return (
            <section key={type} className="px-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {typeLabels[type]} Service
              </h2>
              <div className="space-y-4">
                {roles.map((role: ServiceRole) => renderRoleCard(role))}
              </div>
            </section>
          )
        })
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRoleId ? "Edit Service Role" : "Add Service Role"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="e.g. Graduate Admissions Committee Chair"
            required
          />

          <Input
            label="Organization"
            value={formData.organization}
            onChange={(e) => updateField("organization", e.target.value)}
            placeholder="e.g. Department of Computer Science"
          />

          <Select
            label="Type"
            options={typeOptions}
            value={formData.type}
            onChange={(e) =>
              updateField("type", e.target.value as ServiceType)
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
            />

            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
            />
          </div>

          <Input
            label="Hours per Month"
            type="number"
            value={formData.hoursPerMonth}
            onChange={(e) =>
              updateField("hoursPerMonth", parseInt(e.target.value, 10) || 0)
            }
            min={0}
          />

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Additional notes about this role..."
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
              Active role
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" size="md" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              {editingRoleId ? "Save Changes" : "Add Role"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
