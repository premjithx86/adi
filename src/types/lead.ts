export type LeadQualificationStatus = "new" | "contacted" | "qualified" | "closed";

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerName: string | null;
  phoneNumber: string | null;
  serviceInterest: string | null;
  budget: string | null;
  gender: string | null;
  meetingRequested: boolean;
  quoteRequested: boolean;
  leadDisposition: string | null;
  summary: string | null;
  status: LeadQualificationStatus;
  agentVariables: Record<string, string> | null;
  conversationId: string;
}

export interface CreateLeadInput {
  conversationId: string;
  customerName?: string;
  phoneNumber?: string;
  serviceInterest?: string;
  budget?: string;
  gender?: string;
  meetingRequested?: boolean;
  quoteRequested?: boolean;
  leadDisposition?: string;
  summary?: string;
  agentVariables?: Record<string, string>;
}

export interface UpdateLeadInput {
  status?: LeadQualificationStatus;
  customerName?: string;
  phoneNumber?: string;
  serviceInterest?: string;
  budget?: string;
  summary?: string;
}
