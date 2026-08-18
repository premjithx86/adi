import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { Lead, CreateLeadInput, UpdateLeadInput } from "@/types/lead";

function mapRow(row: any): Lead {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    customerName: row.customerName,
    phoneNumber: row.phoneNumber,
    serviceInterest: row.serviceInterest,
    budget: row.budget,
    gender: row.gender,
    meetingRequested: row.meetingRequested,
    quoteRequested: row.quoteRequested,
    leadDisposition: row.leadDisposition,
    summary: row.summary,
    status: row.status as Lead["status"],
    agentVariables: parseJson<Record<string, string>>(row.agentVariables, {}),
    conversationId: row.conversationId,
  };
}

export class LeadRepository {
  async create(input: CreateLeadInput): Promise<Lead> {
    const row = await prisma.lead.create({
      data: {
        conversationId: input.conversationId,
        customerName: input.customerName,
        phoneNumber: input.phoneNumber,
        serviceInterest: input.serviceInterest,
        budget: input.budget,
        gender: input.gender,
        meetingRequested: input.meetingRequested ?? false,
        quoteRequested: input.quoteRequested ?? false,
        leadDisposition: input.leadDisposition,
        summary: input.summary,
        agentVariables: input.agentVariables
          ? JSON.stringify(input.agentVariables)
          : null,
      },
    });
    return mapRow(row);
  }

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    const row = await prisma.lead.update({
      where: { id },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.customerName !== undefined && {
          customerName: input.customerName,
        }),
        ...(input.phoneNumber !== undefined && {
          phoneNumber: input.phoneNumber,
        }),
        ...(input.serviceInterest !== undefined && {
          serviceInterest: input.serviceInterest,
        }),
        ...(input.budget !== undefined && { budget: input.budget }),
        ...(input.summary !== undefined && { summary: input.summary }),
      },
    });
    return mapRow(row);
  }

  async findById(id: string): Promise<Lead | null> {
    const row = await prisma.lead.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<{ items: Lead[]; total: number }> {
    const where: any = {};
    if (options?.status) where.status = options.status;

    const [rows, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 20,
        skip: options?.offset ?? 0,
      }),
      prisma.lead.count({ where }),
    ]);

    return { items: rows.map(mapRow), total };
  }

  async getStats(): Promise<{
    total: number;
    new: number;
    meetingRequested: number;
    quoteRequested: number;
  }> {
    const [total, newCount, meetingCount, quoteCount] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.lead.count({ where: { meetingRequested: true } }),
      prisma.lead.count({ where: { quoteRequested: true } }),
    ]);
    return {
      total,
      new: newCount,
      meetingRequested: meetingCount,
      quoteRequested: quoteCount,
    };
  }
}
