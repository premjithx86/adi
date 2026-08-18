"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  BotMessageSquare,
  User,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatTime, generateUserId } from "@/lib/utils";
import {
  ConversationAgent,
  BrowserAudioInterface,
  InteractionType,
  AgentState,
} from "sarvam-conv-ai-sdk/browser";
import type { ServerEventBase, ServerTranscriptMsg } from "sarvam-conv-ai-sdk/browser";

const MSG = {
  INTERACTION_CONNECTED: "server.action.interaction_connected",
  VARIABLE_UPDATE: "server.event.variable_update",
  TRANSCRIPTION: "server.event.transcription",
} as const;

interface TranscriptEntry {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface LeadInfo {
  caller_name?: string;
  phone_number?: string;
  service_interest?: string;
  budget_range?: string;
  lead_disposition?: string;
}

export function VoiceInterface() {
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [sessionActive, setSessionActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({});
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const agentRef = useRef<ConversationAgent | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef(generateUserId());

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  async function createConversationRecord(): Promise<string> {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startedAt: new Date().toISOString(),
        type: "voice",
      }),
    });
    const data = await res.json();
    return data.id;
  }

  async function saveConversation(
    convId: string,
    entries: TranscriptEntry[],
    lead: LeadInfo,
    endTime: Date
  ) {
    const start = startTime ?? new Date();
    const duration = Math.round((endTime.getTime() - start.getTime()) / 1000);
    const transcriptData = entries.map((e) => ({
      role: e.role,
      content: e.content,
      timestamp: e.timestamp.getTime(),
    }));

    await fetch(`/api/conversations/${convId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endedAt: endTime.toISOString(),
        durationSeconds: duration,
        transcript: transcriptData,
        leadStatus: Object.keys(lead).length > 0 ? "extracted" : "none",
      }),
    });

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
          leadDisposition: lead.lead_disposition,
          meetingRequested:
            lead.lead_disposition?.toLowerCase().includes("meeting") ?? false,
          quoteRequested:
            lead.lead_disposition?.toLowerCase().includes("quote") ?? false,
          agentVariables: lead,
        }),
      });
    }
  }

  const startSession = useCallback(async () => {
    setError(null);
    setLoading(true);
    setTranscript([]);
    setLeadInfo({});

    try {
      const res = await fetch("/api/sarvam/session");
      if (!res.ok) throw new Error("Failed to get session configuration");
      const config = await res.json();

      const now = new Date();
      setStartTime(now);

      const convId = await createConversationRecord();
      setConversationId(convId);

      const agent = new ConversationAgent({
        apiKey: config.apiKey,
        config: {
          org_id: config.orgId,
          workspace_id: config.workspaceId,
          app_id: config.appId,
          user_identifier: userIdRef.current,
          user_identifier_type: "custom",
          interaction_type: InteractionType.CALL,
          input_sample_rate: 16000,
          output_sample_rate: 16000,
          agent_variables: config.agentVariables,
        },
        audioInterface: new BrowserAudioInterface(),
        transcriptCallback: async (msg: ServerTranscriptMsg) => {
          setTranscript((prev) => [
            ...prev,
            {
              id: `transcript-${Date.now()}-${Math.random()}`,
              role: msg.role === "user" ? "user" : "bot",
              content: msg.content,
              timestamp: new Date(),
            },
          ]);
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
          setTranscript((currentTranscript) => {
            setLeadInfo((currentLead) => {
              if (convId) {
                saveConversation(convId, currentTranscript, currentLead, endTime);
              }
              return currentLead;
            });
            return currentTranscript;
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
          : "Failed to start session. Ensure microphone access is granted."
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

  const toggleMute = useCallback(() => {
    if (!agentRef.current) return;
    if (muted) {
      agentRef.current.unmute();
      setMuted(false);
    } else {
      agentRef.current.mute();
      setMuted(true);
    }
  }, [muted]);

  const hasLeadData = Object.values(leadInfo).some((v) => v && v !== "");

  const stateLabel: Record<AgentState, string> = {
    [AgentState.IDLE]: "Idle",
    [AgentState.CONNECTING]: "Connecting…",
    [AgentState.CONNECTED]: "Connected",
    [AgentState.LISTENING]: "Listening…",
    [AgentState.SPEAKING]: "AI Speaking…",
    [AgentState.ERROR]: "Error",
  };

  const stateColor: Record<AgentState, string> = {
    [AgentState.IDLE]: "text-slate-400",
    [AgentState.CONNECTING]: "text-amber-500",
    [AgentState.CONNECTED]: "text-emerald-500",
    [AgentState.LISTENING]: "text-blue-500",
    [AgentState.SPEAKING]: "text-violet-500",
    [AgentState.ERROR]: "text-red-500",
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Voice panel */}
      <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                sessionActive && agentState === AgentState.LISTENING
                  ? "bg-blue-500 animate-pulse"
                  : sessionActive && agentState === AgentState.SPEAKING
                  ? "bg-violet-500 animate-pulse"
                  : sessionActive
                  ? "bg-emerald-500"
                  : "bg-slate-300"
              )}
            />
            <span className="text-sm font-semibold text-slate-700">
              Adivinar AI · Voice
            </span>
          </div>
          <span
            className={cn("text-xs font-medium", stateColor[agentState])}
          >
            {stateLabel[agentState]}
          </span>
        </div>

        {/* Main voice area */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          {/* Animated ring + mic button */}
          <div className="relative">
            {/* Outer pulse rings */}
            {sessionActive && agentState === AgentState.LISTENING && (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping scale-150" />
                <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-ping scale-125 [animation-delay:300ms]" />
              </>
            )}
            {sessionActive && agentState === AgentState.SPEAKING && (
              <>
                <div className="absolute inset-0 rounded-full bg-violet-400/20 animate-ping scale-150" />
                <div className="absolute inset-0 rounded-full bg-violet-400/10 animate-ping scale-125 [animation-delay:300ms]" />
              </>
            )}

            {/* Main button */}
            {!sessionActive ? (
              <button
                onClick={startSession}
                disabled={loading}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                aria-label="Start voice session"
              >
                {loading ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                ) : (
                  <Mic size={36} />
                )}
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={toggleMute}
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 shadow-lg",
                    muted
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                  onClick={stopSession}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-600/30"
                  aria-label="End call"
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            )}
          </div>

          {/* Status text */}
          <div className="text-center">
            {!sessionActive ? (
              <>
                <p className="text-base font-semibold text-slate-700">
                  {loading ? "Connecting to AI agent…" : "Start Voice Session"}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Click the microphone to begin. Ensure mic access is granted.
                </p>
              </>
            ) : (
              <>
                <p
                  className={cn(
                    "text-base font-semibold",
                    stateColor[agentState]
                  )}
                >
                  {stateLabel[agentState]}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {agentState === AgentState.LISTENING
                    ? "Speak now…"
                    : agentState === AgentState.SPEAKING
                    ? "AI is responding…"
                    : muted
                    ? "Microphone muted"
                    : "Session active"}
                </p>
              </>
            )}
          </div>

          {/* AI speaking indicator */}
          {agentState === AgentState.SPEAKING && (
            <div className="flex items-center gap-1.5">
              <Volume2 size={14} className="text-violet-500" />
              <div className="flex gap-0.5 items-end">
                {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-violet-500 rounded-full animate-bounce"
                    style={{
                      height: `${h * 4}px`,
                      animationDelay: `${i * 80}ms`,
                      animationDuration: "600ms",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 max-w-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Live transcript */}
        {transcript.length > 0 && (
          <div className="border-t border-slate-100">
            <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Live Transcript
            </p>
            <div className="max-h-48 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin">
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex gap-2 items-start",
                    entry.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white",
                      entry.role === "user" ? "bg-indigo-500" : "bg-slate-400"
                    )}
                  >
                    {entry.role === "user" ? (
                      <User size={11} />
                    ) : (
                      <BotMessageSquare size={11} />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-3 py-1.5 text-xs",
                      entry.role === "user"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {entry.content}
                    <span className="block text-[10px] opacity-50 mt-0.5">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Info sidebar */}
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
              <span className="text-xs text-slate-500">Mic</span>
              <Badge variant={muted ? "danger" : sessionActive ? "success" : "ghost"}>
                {muted ? "Muted" : sessionActive ? "Active" : "Off"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Utterances</span>
              <span className="text-xs font-medium text-slate-700">
                {transcript.length}
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
                Lead details appear here as the AI extracts them during the
                call.
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

        {/* Tips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tips
          </p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li>• Speak clearly and at a normal pace</li>
            <li>• Supports English, Malayalam & Manglish</li>
            <li>• Lead info auto-extracts during call</li>
            <li>• Session saves automatically on end</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
