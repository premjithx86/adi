import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-100",
  trend,
  trendUp,
  subtitle,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trendUp ? "text-emerald-600" : "text-slate-400"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div
          className={cn(
            "ml-4 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
