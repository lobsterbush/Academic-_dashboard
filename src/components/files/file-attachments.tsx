"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Paperclip, X, File } from "lucide-react";
import type { TrackedFile } from "@/lib/types";

interface FileAttachmentsProps {
  files: TrackedFile[];
  onChange: (files: TrackedFile[]) => void;
  label?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type === "application/pdf" || type.endsWith(".pdf")) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4 text-slate-400" />;
}

export function FileAttachments({ files, onChange, label = "Attached Files" }: FileAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: TrackedFile[] = Array.from(selectedFiles).map((f) => ({
      name: f.name,
      size: f.size,
      lastModified: f.lastModified,
      type: f.type || guessTypeFromName(f.name),
    }));

    // Merge, avoiding duplicates by name
    const existingNames = new Set(files.map((f) => f.name));
    const unique = newFiles.filter((f) => !existingNames.has(f.name));
    onChange([...files, ...unique]);

    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(name: string) {
    onChange(files.filter((f) => f.name !== name));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="h-3.5 w-3.5" />
          Add Files
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.tex,.bib,.csv,.xlsx,.pptx,.png,.jpg"
        className="hidden"
        onChange={handleFileSelect}
      />

      {files.length === 0 ? (
        <div
          className="rounded-md border-2 border-dashed border-slate-200 px-4 py-3 text-center cursor-pointer hover:border-slate-300 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="mx-auto h-5 w-5 text-slate-300 mb-1" />
          <p className="text-xs text-slate-400">Click to attach PDFs and documents</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 group"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.name)}
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-slate-400 hover:text-red-500 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function guessTypeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    tex: "application/x-tex",
    txt: "text/plain",
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  return map[ext] ?? "application/octet-stream";
}
