"use client";

import { FileText, File, Paperclip } from "lucide-react";
import type { TrackedFile } from "@/lib/types";

interface FileBadgeListProps {
  files: TrackedFile[];
  max?: number;
}

function getIcon(type: string) {
  if (type === "application/pdf" || type.endsWith(".pdf")) {
    return <FileText className="h-3 w-3 text-red-500" />;
  }
  return <File className="h-3 w-3 text-slate-400" />;
}

export function FileBadgeList({ files, max = 3 }: FileBadgeListProps) {
  if (!files || files.length === 0) return null;

  const shown = files.slice(0, max);
  const remaining = files.length - max;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      <Paperclip className="h-3 w-3 text-slate-400" />
      {shown.map((f) => (
        <span
          key={f.name}
          className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 max-w-[140px]"
        >
          {getIcon(f.type)}
          <span className="truncate">{f.name}</span>
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-slate-400">+{remaining} more</span>
      )}
    </div>
  );
}
