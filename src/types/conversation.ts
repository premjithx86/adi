export type ConversationType = "chat" | "voice";
export type LeadStatus = "none" | "pending" | "extracted";

export interface TranscriptMessage {
  role: "user" | "bot";
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  createdAt: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  type: ConversationType;
  language: string | null;
  transcript: TranscriptMessage[];
  summary: string | null;
  interactionId: string | null;
  leadStatus: LeadStatus;
  lead?: Lead | null;
}

export interface CreateConversationInput {
  startedAt: string;
  type: ConversationType;
  interactionId?: string;
}

export interface UpdateConversationInput {
  endedAt?: string;
  durationSeconds?: number;
  language?: string;
  transcript?: TranscriptMessage[];
  summary?: string;
  leadStatus?: LeadStatus;
}

import type { Lead } from "./lead";
