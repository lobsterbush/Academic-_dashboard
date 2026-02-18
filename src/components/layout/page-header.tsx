import { Button } from "@/components/ui/button";
import { LucideIcon, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actionLabel, onAction, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] bg-white/80 backdrop-blur-lg px-8 py-5 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-lg bg-[rgba(74,155,103,0.1)] p-2 dark:bg-[rgba(103,176,132,0.15)]">
            <Icon className="h-6 w-6 text-[#4A9B67] dark:text-[#67B084]" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] dark:text-slate-100">{title}</h1>
          {description && <p className="text-sm text-[var(--text-secondary)] dark:text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {action}
        {actionLabel && onAction && (
          <Button onClick={onAction} size="md">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
