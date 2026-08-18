import { BotMessageSquare, User } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import type { TranscriptMessage } from "@/types/conversation";

interface Props {
  messages: TranscriptMessage[];
}

export function TranscriptViewer({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic text-center py-8">
        No transcript available for this conversation.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2.5",
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
              msg.role === "user"
                ? "bg-indigo-600 text-white"
                : "bg-slate-200 text-slate-600"
            )}
          >
            {msg.role === "user" ? (
              <User size={14} />
            ) : (
              <BotMessageSquare size={14} />
            )}
          </div>

          <div
            className={cn(
              "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-tr-sm"
                : "bg-slate-100 text-slate-800 rounded-tl-sm"
            )}
          >
            <p>{msg.content}</p>
            <p
              className={cn(
                "mt-1 text-[10px] opacity-60",
                msg.role === "user" ? "text-right" : "text-left"
              )}
            >
              {formatTime(new Date(msg.timestamp))}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
