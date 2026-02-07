import { Button } from "@/components/ui/button";
import { LucideIcon, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageHeader({ title, description, icon: Icon, actionLabel, onAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-lg bg-indigo-50 p-2">
            <Icon className="h-6 w-6 text-indigo-600" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
