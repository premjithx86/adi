import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Mic,
  Clock,
  Globe,
  Hash,
  User,
  Phone,
  Briefcase,
  Calendar,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TranscriptViewer } from "@/modules/conversations/components/TranscriptViewer";
import { ConversationRepository } from "@/services/db/ConversationRepository";
import { formatDateTime, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({ params }: Props) {
  const { id } = await params;
  const repo = new ConversationRepository();
  const conversation = await repo.findById(id);

  if (!conversation) notFound();

  const lead = conversation.lead;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/conversations"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to conversations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              conversation.type === "voice"
                ? "bg-violet-100 text-violet-600"
                : "bg-indigo-100 text-indigo-600"
            }`}
          >
            {conversation.type === "voice" ? (
              <Mic size={20} />
            ) : (
              <MessageSquare size={20} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 capitalize">
              {conversation.type} Session
            </h2>
            <p className="text-sm text-slate-500">
              {formatDateTime(conversation.createdAt)}
            </p>
          </div>
        </div>
        <Badge
          variant={
            conversation.leadStatus === "extracted"
              ? "success"
              : conversation.leadStatus === "pending"
              ? "warning"
              : "ghost"
          }
        >
          {conversation.leadStatus === "extracted"
            ? "Lead captured"
            : conversation.leadStatus === "pending"
            ? "Processing"
            : "No lead"}
        </Badge>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500">Duration</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {conversation.durationSeconds
              ? formatDuration(conversation.durationSeconds)
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500">Language</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {conversation.language ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500">Messages</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {conversation.transcript.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Hash size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500">Interaction ID</span>
          </div>
          <p className="text-xs font-mono text-slate-600 break-all">
            {conversation.interactionId ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Transcript */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <TranscriptViewer messages={conversation.transcript} />
          </Card>
        </div>

        {/* Lead info */}
        <div className="space-y-4">
          {lead ? (
            <Card>
              <CardHeader>
                <CardTitle>Captured Lead</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {lead.customerName && (
                  <div className="flex items-start gap-2.5">
                    <User size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Name</p>
                      <p className="text-sm font-medium text-slate-700">
                        {lead.customerName}
                      </p>
                    </div>
                  </div>
                )}
                {lead.phoneNumber && (
                  <div className="flex items-start gap-2.5">
                    <Phone size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="text-sm font-medium text-slate-700">
                        {lead.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}
                {lead.serviceInterest && (
                  <div className="flex items-start gap-2.5">
                    <Briefcase size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Service Interest</p>
                      <p className="text-sm font-medium text-slate-700">
                        {lead.serviceInterest}
                      </p>
                    </div>
                  </div>
                )}
                {lead.budget && (
                  <div className="flex items-start gap-2.5">
                    <FileText size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Budget</p>
                      <p className="text-sm font-medium text-slate-700">
                        {lead.budget}
                      </p>
                    </div>
                  </div>
                )}
                {lead.meetingRequested && (
                  <Badge variant="success">Meeting requested</Badge>
                )}
                {lead.quoteRequested && (
                  <Badge variant="info">Quote requested</Badge>
                )}
                {lead.summary && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">Summary</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {lead.summary}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Lead Info</CardTitle>
              </CardHeader>
              <p className="text-sm text-slate-400 text-center py-6">
                No lead was captured in this session.
              </p>
            </Card>
          )}

          {/* Summary */}
          {conversation.summary && (
            <Card>
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
              </CardHeader>
              <p className="text-sm text-slate-600 leading-relaxed">
                {conversation.summary}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
