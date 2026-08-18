import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { cookies } from "next/headers";
import { sarvamConfig, defaultAgentVariables } from "@/config/sarvam";

export async function GET(_request: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return config for the browser SDK — never expose in client env vars
  return NextResponse.json({
    apiKey: sarvamConfig.apiKey,
    orgId: sarvamConfig.orgId,
    workspaceId: sarvamConfig.workspaceId,
    appId: sarvamConfig.appId,
    agentVariables: defaultAgentVariables,
    userIdentifier: session.email,
  });
}
