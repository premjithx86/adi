import Link from "next/link";
import { Users, Phone, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative, truncate } from "@/lib/utils";
import type { Lead } from "@/types/lead";

interface Props {
  leads: Lead[];
}

const statusVariant: Record<string, "success" | "info" | "warning" | "ghost"> =
  {
    new: "info",
    contacted: "warning",
    qualified: "success",
    closed: "ghost",
  };

export function RecentLeads({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<Users size={40} />}
        title="No leads captured yet"
        description="Lead information is automatically extracted from conversations."
      />
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {leads.map((lead) => (
        <Link
          key={lead.id}
          href={`/leads`}
          className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded-lg transition-colors group"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm font-semibold">
            {lead.customerName
              ? lead.customerName.charAt(0).toUpperCase()
              : "?"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                {lead.customerName ?? "Unknown"}
              </span>
              <Badge variant={statusVariant[lead.status] ?? "ghost"}>
                {lead.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {lead.phoneNumber && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Phone size={11} />
                  {lead.phoneNumber}
                </span>
              )}
              {lead.serviceInterest && (
                <span className="text-xs text-slate-400">
                  · {truncate(lead.serviceInterest, 30)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatRelative(lead.createdAt)}
            </p>
          </div>

          <ArrowRight
            size={14}
            className="flex-shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors"
          />
        </Link>
      ))}
    </div>
  );
}
