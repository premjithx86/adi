import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { ConversationRepository } from "@/services/db/ConversationRepository";
import { LeadRepository } from "@/services/db/LeadRepository";

async function requireAuth() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  return session.isLoggedIn;
}

export async function GET(_request: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convRepo = new ConversationRepository();
  const leadRepo = new LeadRepository();

  const [convStats, leadStats] = await Promise.all([
    convRepo.getStats(),
    leadRepo.getStats(),
  ]);

  return NextResponse.json({
    conversations: convStats,
    leads: leadStats,
  });
}
