import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type {
  Conversation,
  CreateConversationInput,
  UpdateConversationInput,
  TranscriptMessage,
} from "@/types/conversation";

function mapRow(row: any): Conversation {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    durationSeconds: row.durationSeconds,
    type: row.type as "chat" | "voice",
    language: row.language,
    transcript: parseJson<TranscriptMessage[]>(row.transcript, []),
    summary: row.summary,
    interactionId: row.interactionId,
    leadStatus: row.leadStatus as "none" | "pending" | "extracted",
    lead: row.lead ?? null,
  };
}

export class ConversationRepository {
  async create(input: CreateConversationInput): Promise<Conversation> {
    const row = await prisma.conversation.create({
      data: {
        startedAt: new Date(input.startedAt),
        type: input.type,
        interactionId: input.interactionId,
      },
      include: { lead: true },
    });
    return mapRow(row);
  }

  async update(id: string, input: UpdateConversationInput): Promise<Conversation> {
    const row = await prisma.conversation.update({
      where: { id },
      data: {
        ...(input.endedAt && { endedAt: new Date(input.endedAt) }),
        ...(input.durationSeconds !== undefined && {
          durationSeconds: input.durationSeconds,
        }),
        ...(input.language && { language: input.language }),
        ...(input.transcript && {
          transcript: JSON.stringify(input.transcript),
        }),
        ...(input.summary && { summary: input.summary }),
        ...(input.leadStatus && { leadStatus: input.leadStatus }),
      },
      include: { lead: true },
    });
    return mapRow(row);
  }

  async findById(id: string): Promise<Conversation | null> {
    const row = await prisma.conversation.findUnique({
      where: { id },
      include: { lead: true },
    });
    return row ? mapRow(row) : null;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: Conversation[]; total: number }> {
    const where: any = {};

    if (options?.type) where.type = options.type;
    if (options?.startDate || options?.endDate) {
      where.createdAt = {
        ...(options.startDate && { gte: new Date(options.startDate) }),
        ...(options.endDate && { lte: new Date(options.endDate) }),
      };
    }

    const [rows, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: { lead: true },
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 20,
        skip: options?.offset ?? 0,
      }),
      prisma.conversation.count({ where }),
    ]);

    return { items: rows.map(mapRow), total };
  }

  async getStats(): Promise<{
    total: number;
    chat: number;
    voice: number;
    leadsExtracted: number;
  }> {
    const [total, chat, voice, leadsExtracted] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({ where: { type: "chat" } }),
      prisma.conversation.count({ where: { type: "voice" } }),
      prisma.conversation.count({ where: { leadStatus: "extracted" } }),
    ]);
    return { total, chat, voice, leadsExtracted };
  }
}
