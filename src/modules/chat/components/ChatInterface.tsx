"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  RotateCcw,
  Loader2,
  BotMessageSquare,
  User,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatTime, generateUserId } from "@/lib/utils";
import {
  ConversationAgent,
  InteractionType,
  AgentState,
} from "sarvam-conv-ai-sdk/browser";
import type { ServerEventBase, ServerTextChunkMsg, ServerTextMsgType } from "sarvam-conv-ai-sdk/browser";

// String literals from ServerMsgType enum (type-only export in browser bundle)
const MSG = {
  TEXT: "server.media.text",
  TEXT_CHUNK: "server.media.text_chunk",
  INTERACTION_CONNECTED: "server.action.interaction_connected",
  VARIABLE_UPDATE: "server.event.variable_update",
} as const;

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

interface LeadInfo {
  caller_name?: string;
  phone_number?: string;
  service_interest?: string;
  budget_range?: string;
  meeting_requested?: string;
  lead_disposition?: string;
}

interface SarvamSessionConfig {
  apiKey: string;
  orgId: string;
  workspaceId: string;
  appId: string;
  agentVariables: Record<string, string>;
  userIdentifier: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({});
  const [startTime, setStartTime] = useState<Date | null>(null);

  const agentRef = useRef<ConversationAgent | null>(null);
  const sessionConfigRef = useRef<SarvamSessionConfig | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userIdRef = useRef(generateUserId());
  const botMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchSessionConfig(): Promise<SarvamSessionConfig> {
    if (sessionConfigRef.current) return sessionConfigRef.current;
    const res = await fetch("/api/sarvam/session");
    if (!res.ok) throw new Error("Failed to get session configuration");
    const data = await res.json();
    sessionConfigRef.current = data;
    return data;
  }

  async function createConversationRecord(
    interactionId?: string
  ): Promise<string> {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startedAt: new Date().toISOString(),
        type: "chat",
        interactionId,
      }),
    });
    const data = await res.json();
    return data.id;
  }

  async function saveConversation(
    convId: string,
    msgs: Message[],
    lead: LeadInfo,
    endTime: Date
  ) {
    const start = startTime ?? new Date();
    const duration = Math.round((endTime.getTime() - start.getTime()) / 1000);
    const transcript = msgs.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.getTime(),
    }));

    await fetch(`/api/conversations/${convId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endedAt: endTime.toISOString(),
        durationSeconds: duration,
        transcript,
        leadStatus: Object.keys(lead).length > 0 ? "extracted" : "none",
      }),
    });

    // Save lead if we have caller name or phone
    if (lead.caller_name || lead.phone_number) {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          customerName: lead.caller_name,
          phoneNumber: lead.phone_number,
          serviceInterest: lead.service_interest,
          budget: lead.budget_range,
          meetingRequested:
            lead.meeting_requested?.toLowerCase() === "yes" ||
            lead.lead_disposition?.toLowerCase().includes("meeting"),
          quoteRequested:
            lead.lead_disposition?.toLowerCase().includes("quote"),
          leadDisposition: lead.lead_disposition,
          agentVariables: lead,
        }),
      });
    }
  }

  const startSession = useCallback(async () => {
    setError(null);
    setLoading(true);
    setMessages([]);
    setLeadInfo({});

    try {
      const config = await fetchSessionConfig();
      const now = new Date();
      setStartTime(now);

      const convId = await createConversationRecord();
      setConversationId(convId);

      let currentBotContent = "";

      const agent = new ConversationAgent({
        apiKey: config.apiKey,
        config: {
          org_id: config.orgId,
          workspace_id: config.workspaceId,
          app_id: config.appId,
          user_identifier: userIdRef.current,
          user_identifier_type: "custom",
          interaction_type: InteractionType.CHAT,
          input_sample_rate: 16000,
          output_sample_rate: 16000,
          agent_variables: config.agentVariables,
        },
        textCallback: async (msg: ServerTextChunkMsg | ServerTextMsgType) => {
          if ("status" in msg && msg.type === MSG.TEXT_CHUNK) {
            // Streaming chunk
            currentBotContent += msg.text;
            const botId = botMessageIdRef.current ?? `bot-${Date.now()}`;
            botMessageIdRef.current = botId;

            setMessages((prev) => {
              const existing = prev.find((m) => m.id === botId);
              if (existing) {
                return prev.map((m) =>
                  m.id === botId
                    ? { ...m, content: currentBotContent, streaming: true }
                    : m
                );
              }
              return [
                ...prev,
                {
                  id: botId,
                  role: "bot",
                  content: currentBotContent,
                  timestamp: new Date(),
                  streaming: true,
                },
              ];
            });
          } else if (msg.type === MSG.TEXT) {
            // Complete message
            const botId = botMessageIdRef.current ?? `bot-${Date.now()}`;
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === botId);
              if (existing) {
                return prev.map((m) =>
                  m.id === botId
                    ? {
                        ...m,
                        content: (msg as any).text ?? currentBotContent,
                        streaming: false,
                      }
                    : m
                );
              }
              return [
                ...prev,
                {
                  id: botId,
                  role: "bot",
                  content: (msg as any).text ?? currentBotContent,
                  timestamp: new Date(),
                  streaming: false,
                },
              ];
            });
            currentBotContent = "";
            botMessageIdRef.current = null;
          }
        },
        eventCallback: async (event: ServerEventBase) => {
          if (event.type === MSG.INTERACTION_CONNECTED) {
            const e = event as any;
            if (e.interaction_id) setInteractionId(e.interaction_id);
          } else if (event.type === MSG.VARIABLE_UPDATE) {
            const e = event as any;
            setLeadInfo((prev) => ({
              ...prev,
              ...(e.variable_name && e.value
                ? { [e.variable_name]: e.value }
                : e.variables ?? {}),
            }));
          }
        },
        stateCallback: (newState: AgentState) => {
          setAgentState(newState);
        },
        startCallback: async () => {
          setSessionActive(true);
          setLoading(false);
        },
        endCallback: async () => {
          setSessionActive(false);
          setAgentState(AgentState.IDLE);
          const endTime = new Date();
          setMessages((currentMessages) => {
            setLeadInfo((currentLead) => {
              if (convId) {
                saveConversation(convId, currentMessages, currentLead, endTime);
              }
              return currentLead;
            });
            return currentMessages;
          });
        },
      });

      agentRef.current = agent;
      await agent.start();
      await agent.waitForConnect(15);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start session. Check your API key."
      );
      setLoading(false);
    }
  }, [startTime]);

  const stopSession = useCallback(async () => {
    if (agentRef.current) {
      await agentRef.current.stop();
      agentRef.current = null;
    }
    setSessionActive(false);
    setAgentState(AgentState.IDLE);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !agentRef.current || !sessionActive) return;

    setInput("");
    botMessageIdRef.current = null;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      await agentRef.current.sendText(text);
    } catch {
      setError("Failed to send message");
    }
  }, [input, sessionActive]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const hasLeadData = Object.values(leadInfo).some((v) => v && v !== "");

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Chat panel */}
      <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-700">
              Adivinar AI · Chat
            </span>
            <Badge
              variant={
                agentState === AgentState.IDLE
                  ? "ghost"
                  : agentState === AgentState.CONNECTING
                  ? "warning"
                  : "success"
              }
            >
              {agentState === AgentState.IDLE
                ? "Idle"
                : agentState === AgentState.CONNECTING
                ? "Connecting…"
                : agentState === AgentState.CONNECTED ||
                  agentState === AgentState.LISTENING
                ? "Ready"
                : agentState === AgentState.SPEAKING
                ? "Responding…"
                : agentState}
            </Badge>
          </div>
          {sessionActive && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={stopSession}
            >
              End session
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.length === 0 && !sessionActive && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
                <BotMessageSquare size={28} className="text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Ready to chat with Adivinar AI
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Click &ldquo;Start Session&rdquo; to begin. The agent supports
                English, Malayalam, and Manglish.
              </p>
              <Button onClick={startSession} loading={loading}>
                Start Session
              </Button>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs",
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
                {msg.content}
                {msg.streaming && (
                  <span className="inline-block ml-1 animate-pulse">▌</span>
                )}
                <p
                  className={cn(
                    "mt-1 text-[10px] opacity-60",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {agentState === AgentState.SPEAKING && messages.length > 0 && !botMessageIdRef.current && (
            <div className="flex gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <BotMessageSquare size={14} />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-100 p-3">
          {!sessionActive ? (
            <div className="flex justify-center">
              <Button onClick={startSession} loading={loading}>
                {loading ? "Connecting…" : "Start Session"}
              </Button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors scrollbar-thin max-h-32"
                style={{ minHeight: "42px" }}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim()}
                size="md"
                className="flex-shrink-0 h-10 w-10 p-0"
                aria-label="Send message"
              >
                <Send size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lead info panel */}
      <div className="w-64 flex-shrink-0 space-y-4">
        {/* Session info */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Session Info
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Status</span>
              <Badge
                variant={sessionActive ? "success" : "ghost"}
                dot={sessionActive}
              >
                {sessionActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Messages</span>
              <span className="text-xs font-medium text-slate-700">
                {messages.length}
              </span>
            </div>
            {interactionId && (
              <div>
                <span className="text-xs text-slate-500 block">
                  Interaction ID
                </span>
                <span className="text-[10px] font-mono text-slate-400 break-all">
                  {interactionId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lead info */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lead Info
            </p>
            {hasLeadData && (
              <CheckCircle2 size={12} className="text-emerald-500" />
            )}
          </div>

          {!hasLeadData ? (
            <div className="flex flex-col items-center py-4 text-center">
              <Info size={20} className="text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">
                Lead data appears here as the agent extracts it during the
                conversation.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leadInfo.caller_name && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Name</p>
                  <p className="text-xs font-medium text-slate-700">
                    {leadInfo.caller_name}
                  </p>
                </div>
              )}
              {leadInfo.phone_number && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Phone</p>
                  <p className="text-xs font-medium text-slate-700">
                    {leadInfo.phone_number}
                  </p>
                </div>
              )}
              {leadInfo.service_interest && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">
                    Service
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    {leadInfo.service_interest}
                  </p>
                </div>
              )}
              {leadInfo.budget_range && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Budget</p>
                  <p className="text-xs font-medium text-slate-700">
                    {leadInfo.budget_range}
                  </p>
                </div>
              )}
              {leadInfo.lead_disposition && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">
                    Disposition
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    {leadInfo.lead_disposition}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
