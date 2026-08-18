"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Search,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelative } from "@/lib/utils";
import type { Lead } from "@/types/lead";

const STATUS_OPTIONS = ["all", "new", "contacted", "qualified", "closed"];

const statusVariant: Record<string, "info" | "warning" | "success" | "ghost"> =
  {
    new: "info",
    contacted: "warning",
    qualified: "success",
    closed: "ghost",
  };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const limit = 15;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [offset, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function updateStatus(leadId: string, status: string) {
    setUpdatingId(leadId);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchLeads();
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = leads.filter(
    (l) =>
      !search ||
      l.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      l.phoneNumber?.includes(search) ||
      l.serviceInterest?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name, phone, service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOffset(0);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={fetchLeads}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={<Users size={40} />}
            title="No leads found"
            description="Lead information is automatically extracted from conversations when customers provide their details."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                    {lead.customerName
                      ? lead.customerName.charAt(0).toUpperCase()
                      : "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">
                        {lead.customerName ?? "Unknown Customer"}
                      </span>
                      <Badge variant={statusVariant[lead.status] ?? "ghost"}>
                        {lead.status}
                      </Badge>
                      {lead.meetingRequested && (
                        <Badge variant="success">Meeting</Badge>
                      )}
                      {lead.quoteRequested && (
                        <Badge variant="info">Quote</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                      {lead.phoneNumber && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone size={11} />
                          {lead.phoneNumber}
                        </span>
                      )}
                      {lead.serviceInterest && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Briefcase size={11} />
                          {lead.serviceInterest}
                        </span>
                      )}
                      {lead.budget && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <FileText size={11} />
                          {lead.budget}
                        </span>
                      )}
                    </div>

                    {lead.leadDisposition && (
                      <p className="mt-1.5 text-xs text-slate-400 italic">
                        {lead.leadDisposition}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-slate-400">
                      {formatRelative(lead.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    disabled={updatingId === lead.id}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none disabled:opacity-50"
                  >
                    {["new", "contacted", "qualified", "closed"].map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {offset + 1}–{Math.min(offset + limit, total)} of {total} leads
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => o + limit)}
              disabled={offset + limit >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
