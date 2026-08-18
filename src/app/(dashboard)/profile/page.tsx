import type { Metadata } from "next";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BotMessageSquare, User, Shield, Globe } from "lucide-react";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white text-2xl font-bold shadow-lg shadow-indigo-600/20">
            {session.username?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {session.username}
            </p>
            <p className="text-sm text-slate-500">{session.email}</p>
            <Badge variant="info" className="mt-1.5">
              Administrator
            </Badge>
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-3">
            <User size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Full Name</p>
              <p className="text-sm font-medium text-slate-700">
                {session.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Role</p>
              <p className="text-sm font-medium text-slate-700">
                Business Owner · Administrator
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Agent info */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Configuration</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <BotMessageSquare size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Agent</p>
              <p className="text-sm font-medium text-slate-700">
                Adivinar AI Agent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Provider</p>
              <p className="text-sm font-medium text-slate-700">
                Sarvam Voice Agents (Samvaad)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Languages</p>
              <p className="text-sm font-medium text-slate-700">
                English · Malayalam · Manglish
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs text-slate-500">
            AI agent configuration, prompts, knowledge base, and conversation
            flow are managed in{" "}
            <span className="font-medium text-slate-700">
              Sarvam Samvaad
            </span>
            . This platform provides the testing and monitoring interface only.
          </p>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Session Security
              </p>
              <p className="text-xs text-slate-400">
                Encrypted cookie session, 7-day expiry
              </p>
            </div>
            <Badge variant="success" dot>
              Active
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">API Keys</p>
              <p className="text-xs text-slate-400">
                Stored server-side only, never exposed to browser bundle
              </p>
            </div>
            <Badge variant="success" dot>
              Secure
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
