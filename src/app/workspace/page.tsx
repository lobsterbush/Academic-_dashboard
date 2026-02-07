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
import { FolderBrowser } from "@/components/files/folder-browser";
import {
  FolderOpen,
  Edit,
  Trash2,
  FileText,
  ClipboardCheck,
  DollarSign,
  GraduationCap,
  Plane,
  Info,
} from "lucide-react";
import type { LinkedFolder, FolderModule, TrackedFile } from "@/lib/types";

// ============================================
// Constants
// ============================================

const MODULE_OPTIONS: { value: FolderModule; label: string }[] = [
  { value: "papers", label: "Papers" },
  { value: "reviews", label: "Peer Reviews" },
  { value: "grants", label: "Grants" },
  { value: "teaching", label: "Teaching" },
  { value: "conferences", label: "Conferences" },
];

const MODULE_ICONS: Record<FolderModule, React.ReactNode> = {
  papers: <FileText className="h-5 w-5 text-indigo-500" />,
  reviews: <ClipboardCheck className="h-5 w-5 text-rose-500" />,
  grants: <DollarSign className="h-5 w-5 text-amber-500" />,
  teaching: <GraduationCap className="h-5 w-5 text-emerald-500" />,
  conferences: <Plane className="h-5 w-5 text-purple-500" />,
};

const MODULE_BADGE_VARIANT: Record<FolderModule, "info" | "danger" | "warning" | "success" | "default"> = {
  papers: "info",
  reviews: "danger",
  grants: "warning",
  teaching: "success",
  conferences: "default",
};

// ============================================
// Form types
// ============================================

interface FolderFormData {
  name: string;
  module: FolderModule;
  path: string;
  notes: string;
}

const EMPTY_FORM: FolderFormData = {
  name: "",
  module: "reviews",
  path: "",
  notes: "",
};

// ============================================
// Component
// ============================================

export default function WorkspacePage() {
  const { linkedFolders } = useDashboard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<LinkedFolder | null>(null);
  const [form, setForm] = useState<FolderFormData>(EMPTY_FORM);
  const [scannedFiles, setScannedFiles] = useState<TrackedFile[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<LinkedFolder | null>(null);

  // ---- Handlers ----

  function openAddModal() {
    setEditingFolder(null);
    setForm(EMPTY_FORM);
    setScannedFiles([]);
    setIsModalOpen(true);
  }

  function openEditModal(folder: LinkedFolder) {
    setEditingFolder(folder);
    setForm({
      name: folder.name,
      module: folder.module,
      path: folder.path,
      notes: folder.notes,
    });
    setScannedFiles([]);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingFolder(null);
    setForm(EMPTY_FORM);
    setScannedFiles([]);
  }

  function handleFolderScanned(folderName: string, files: TrackedFile[]) {
    setForm((prev) => ({
      ...prev,
      path: folderName,
      name: prev.name || folderName,
    }));
    setScannedFiles(files);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingFolder) {
      linkedFolders.update(editingFolder.id, {
        name: form.name.trim(),
        module: form.module,
        path: form.path,
        notes: form.notes.trim(),
      });
    } else {
      linkedFolders.add({
        name: form.name.trim(),
        module: form.module,
        path: form.path,
        notes: form.notes.trim(),
      });
    }

    closeModal();
  }

  function handleDelete() {
    if (deleteTarget) {
      linkedFolders.delete(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  // ---- Group by module ----

  const foldersByModule: Partial<Record<FolderModule, LinkedFolder[]>> = {};
  for (const folder of linkedFolders.list) {
    if (!foldersByModule[folder.module]) {
      foldersByModule[folder.module] = [];
    }
    foldersByModule[folder.module]!.push(folder);
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="flex flex-col">
      <PageHeader
        icon={FolderOpen}
        title="Workspace & Folders"
        description="Link local folders to organize your PDFs, documents, and emails by module"
        actionLabel="Link Folder"
        onAction={openAddModal}
      />

      <div className="space-y-6 p-8">
        {/* Info banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">How Folder Linking Works</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-blue-700">
              <li>
                <strong>Link a folder</strong> to a module (Papers, Reviews, Grants, etc.) so you
                always know where your files live
              </li>
              <li>
                <strong>Browse folder contents</strong> directly from the dashboard using
                Chrome/Edge&apos;s File System Access (no files are uploaded)
              </li>
              <li>
                <strong>Attach individual files</strong> to specific papers or reviews from their
                edit forms
              </li>
              <li>
                Point it at your <strong>email export folder</strong> or{" "}
                <strong>Downloads folder</strong> where reviewer invitations arrive
              </li>
            </ul>
          </div>
        </div>

        {/* Linked folders */}
        {linkedFolders.list.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No folders linked yet"
            description="Link your first folder to start organizing documents. Point it at where you keep review PDFs, grant proposals, or email downloads."
            actionLabel="Link Folder"
            onAction={openAddModal}
          />
        ) : (
          <div className="space-y-8">
            {MODULE_OPTIONS.map(({ value: mod, label }) => {
              const folders = foldersByModule[mod];
              if (!folders || folders.length === 0) return null;

              return (
                <section key={mod}>
                  <div className="flex items-center gap-2 mb-3">
                    {MODULE_ICONS[mod]}
                    <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
                    <Badge variant={MODULE_BADGE_VARIANT[mod]}>{folders.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {folders.map((folder) => (
                      <Card key={folder.id}>
                        <CardContent>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
                                <h3 className="text-sm font-semibold text-slate-900 truncate">
                                  {folder.name}
                                </h3>
                              </div>

                              {folder.path && (
                                <p className="mt-1 text-xs text-slate-500 font-mono truncate">
                                  {folder.path}
                                </p>
                              )}

                              {folder.notes && (
                                <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                                  {folder.notes}
                                </p>
                              )}

                              {/* Inline folder browser */}
                              <div className="mt-3">
                                <FolderBrowser
                                  onFolderScanned={() => {}}
                                  buttonLabel="Browse Contents"
                                  currentFolderName={folder.path}
                                />
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(folder)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(folder)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Add/Edit Modal ---- */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingFolder ? "Edit Linked Folder" : "Link a Folder"}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Folder Label"
            id="folder-name"
            placeholder='e.g. "Review PDFs", "Grant Proposals", "Email Downloads"'
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <Select
            label="Associated Module"
            id="folder-module"
            options={MODULE_OPTIONS}
            value={form.module}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, module: e.target.value as FolderModule }))
            }
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Folder Location
            </label>
            <FolderBrowser
              onFolderScanned={handleFolderScanned}
              buttonLabel={form.path || "Choose folder from your computer"}
              currentFolderName={form.path}
            />
            {form.path && (
              <p className="text-xs text-slate-500">
                Selected: <span className="font-mono">{form.path}</span>
                {scannedFiles.length > 0 && ` (${scannedFiles.length} files found)`}
              </p>
            )}
          </div>

          <Textarea
            label="Notes"
            id="folder-notes"
            placeholder="e.g. Manuscripts to review are downloaded here from editorial manager"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingFolder ? "Save Changes" : "Link Folder"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---- Delete Confirmation ---- */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remove Linked Folder"
      >
        <p className="text-sm text-slate-600">
          Remove the link to{" "}
          <span className="font-semibold text-slate-900">{deleteTarget?.name}</span>? This
          won&apos;t delete any files from your computer.
        </p>
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
