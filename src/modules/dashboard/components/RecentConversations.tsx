import Link from "next/link";
import { MessageSquare, Mic, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative, formatDuration } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";

interface Props {
  conversations: Conversation[];
}

export function RecentConversations({ conversations }: Props) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={40} />}
        title="No conversations yet"
        description="Start a chat or voice session to begin testing your AI agent."
      />
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/conversations/${conv.id}`}
          className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded-lg transition-colors group"
        >
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
              conv.type === "voice"
                ? "bg-violet-100 text-violet-600"
                : "bg-indigo-100 text-indigo-600"
            }`}
          >
            {conv.type === "voice" ? (
              <Mic size={16} />
            ) : (
              <MessageSquare size={16} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 capitalize">
                {conv.type} session
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
                  ? "Processing"
                  : "No lead"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatRelative(conv.createdAt)}
              {conv.durationSeconds && (
                <> · {formatDuration(conv.durationSeconds)}</>
              )}
              {conv.language && <> · {conv.language}</>}
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
