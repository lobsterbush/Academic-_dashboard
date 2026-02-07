"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  RefreshCw,
  FileText,
  File,
  Image,
  Table2,
  Presentation,
} from "lucide-react";
import type { TrackedFile } from "@/lib/types";

interface FolderBrowserProps {
  /** Called when user picks a folder — receives the folder name and its scanned files */
  onFolderScanned: (folderName: string, files: TrackedFile[]) => void;
  /** Optional label for the button */
  buttonLabel?: string;
  /** If set, show current folder name and a rescan button */
  currentFolderName?: string;
}

// File System Access API types (not available in all TS libs)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DirectoryHandle = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileEntry = any;

function getFileIcon(type: string) {
  if (type === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (type.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
  if (type.includes("spreadsheet") || type.includes("csv"))
    return <Table2 className="h-4 w-4 text-emerald-500" />;
  if (type.includes("presentation"))
    return <Presentation className="h-4 w-4 text-amber-500" />;
  if (type.includes("word") || type.includes("document"))
    return <FileText className="h-4 w-4 text-blue-600" />;
  return <File className="h-4 w-4 text-slate-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FolderBrowser({
  onFolderScanned,
  buttonLabel = "Choose Folder",
  currentFolderName,
}: FolderBrowserProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState<TrackedFile[]>([]);
  const [folderName, setFolderName] = useState(currentFolderName ?? "");
  const [error, setError] = useState("");
  const [dirHandle, setDirHandle] = useState<DirectoryHandle | null>(null);

  const scanDirectory = useCallback(
    async (handle: DirectoryHandle) => {
      setScanning(true);
      setError("");
      const files: TrackedFile[] = [];

      try {
        for await (const entry of handle.values()) {
          if (entry.kind === "file") {
            try {
              const file = await (entry as FileEntry).getFile();
              files.push({
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
                type: file.type || guessType(file.name),
              });
            } catch {
              // Skip files we can't read
            }
          }
        }

        // Sort by last modified descending (most recent first)
        files.sort((a, b) => b.lastModified - a.lastModified);

        setScannedFiles(files);
        setFolderName(handle.name);
        onFolderScanned(handle.name, files);
      } catch (err) {
        setError("Failed to scan folder. Please try again.");
        console.error(err);
      } finally {
        setScanning(false);
      }
    },
    [onFolderScanned]
  );

  async function handlePickFolder() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w.showDirectoryPicker) {
      setError(
        "Your browser doesn't support folder access. Use Chrome, Edge, or Opera for this feature."
      );
      return;
    }

    try {
      const handle = await w.showDirectoryPicker({ mode: "read" });
      setDirHandle(handle);
      await scanDirectory(handle);
    } catch (err) {
      // User cancelled the picker — not an error
      if ((err as Error).name !== "AbortError") {
        setError("Could not access the folder. Please check permissions.");
      }
    }
  }

  async function handleRescan() {
    if (dirHandle) {
      await scanDirectory(dirHandle);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isSupported = typeof window !== "undefined" && !!(window as any).showDirectoryPicker;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handlePickFolder}
          disabled={scanning}
        >
          <FolderOpen className="h-4 w-4" />
          {folderName || buttonLabel}
        </Button>

        {dirHandle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRescan}
            disabled={scanning}
          >
            <RefreshCw className={`h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
            Rescan
          </Button>
        )}

        {folderName && (
          <Badge variant="outline" className="text-xs">
            {scannedFiles.length} file{scannedFiles.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!isSupported && (
        <p className="text-xs text-amber-600">
          Folder access requires Chrome, Edge, or Opera. You can still manually attach files to
          individual items.
        </p>
      )}

      {scannedFiles.length > 0 && (
        <div className="rounded-md border border-slate-200 overflow-hidden">
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {scannedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
              >
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{file.name}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatDate(file.lastModified)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function guessType(name: string): string {
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
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  };
  return map[ext] ?? "application/octet-stream";
}
