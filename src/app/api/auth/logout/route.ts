import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(_request: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.destroy();
  return NextResponse.redirect(new URL("/login", _request.url));
}

export async function GET(request: NextRequest) {
  return POST(request);
}
