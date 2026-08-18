import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { ConversationRepository } from "@/services/db/ConversationRepository";

const repo = new ConversationRepository();

async function requireAuth() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  return session.isLoggedIn ? session : null;
}

export async function GET(request: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const type = searchParams.get("type") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const result = await repo.findAll({ limit, offset, type, startDate, endDate });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const conversation = await repo.create({
    startedAt: body.startedAt ?? new Date().toISOString(),
    type: body.type,
    interactionId: body.interactionId,
  });

  return NextResponse.json(conversation, { status: 201 });
}
