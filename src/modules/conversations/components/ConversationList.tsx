"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Mic,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelative, formatDuration, formatDateTime } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const limit = 15;

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        ...(typeFilter !== "all" && { type: typeFilter }),
      });
      const res = await fetch(`/api/conversations?${params}`);
      const data = await res.json();
      setConversations(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [offset, typeFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filtered = conversations.filter(
    (c) =>
      !search ||
      c.id.includes(search) ||
      c.language?.toLowerCase().includes(search.toLowerCase()) ||
      c.interactionId?.includes(search)
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
            placeholder="Search by ID, language…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setOffset(0);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="all">All types</option>
          <option value="chat">Chat only</option>
          <option value="voice">Voice only</option>
        </select>

        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={fetchConversations}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_6rem_6rem_6rem_8rem_2rem] gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div />
          <span className="text-xs font-semibold text-slate-500">
            Conversation
          </span>
          <span className="text-xs font-semibold text-slate-500">Type</span>
          <span className="text-xs font-semibold text-slate-500">Duration</span>
          <span className="text-xs font-semibold text-slate-500">Language</span>
          <span className="text-xs font-semibold text-slate-500">Lead</span>
          <div />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={40} />}
            title="No conversations found"
            description="Start a chat or voice session to populate this list."
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((conv) => (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className="grid grid-cols-[2rem_1fr_6rem_6rem_6rem_8rem_2rem] gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors group items-center"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    conv.type === "voice"
                      ? "bg-violet-100 text-violet-600"
                      : "bg-indigo-100 text-indigo-600"
                  )}
                >
                  {conv.type === "voice" ? (
                    <Mic size={14} />
                  ) : (
                    <MessageSquare size={14} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    {formatDateTime(conv.createdAt)}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {formatRelative(conv.createdAt)}
                  </p>
                </div>

                <span className="text-xs font-medium text-slate-600 capitalize">
                  {conv.type}
                </span>

                <span className="text-xs text-slate-600">
                  {conv.durationSeconds
                    ? formatDuration(conv.durationSeconds)
                    : "—"}
                </span>

                <span className="text-xs text-slate-600">
                  {conv.language ?? "—"}
                </span>

                <Badge
                  variant={
                    conv.leadStatus === "extracted"
                      ? "success"
                      : conv.leadStatus === "pending"
                      ? "warning"
                      : "ghost"
                  }
                >
                  {conv.leadStatus === "extracted"
                    ? "Lead found"
                    : conv.leadStatus === "pending"
                    ? "Pending"
                    : "None"}
                </Badge>

                <ChevronRight
                  size={14}
                  className="text-slate-300 group-hover:text-slate-500 transition-colors"
                />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {offset + 1}–{Math.min(offset + limit, total)} of {total}
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
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
