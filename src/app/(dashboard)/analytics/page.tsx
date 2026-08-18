import type { Metadata } from "next";
import {
  Activity,
  MessageSquare,
  Mic,
  Users,
  Calendar,
  FileText,
  Clock,
  Globe,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/modules/dashboard/components/StatsCard";
import { ConversationRepository } from "@/services/db/ConversationRepository";
import { LeadRepository } from "@/services/db/LeadRepository";
import { AnalyticsCharts } from "@/modules/analytics/components/AnalyticsCharts";
import { prisma } from "@/lib/db";
import { formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

async function getAnalyticsData() {
  const convRepo = new ConversationRepository();
  const leadRepo = new LeadRepository();

  const [convStats, leadStats] = await Promise.all([
    convRepo.getStats(),
    leadRepo.getStats(),
  ]);

  // Average duration
  const durationResult = await prisma.conversation.aggregate({
    _avg: { durationSeconds: true },
    where: { durationSeconds: { not: null } },
  });

  // Language distribution from local DB
  const conversations = await prisma.conversation.findMany({
    select: { language: true, type: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const languageDist: Record<string, number> = {};
  for (const c of conversations) {
    const lang = c.language ?? "Unknown";
    languageDist[lang] = (languageDist[lang] ?? 0) + 1;
  }

  // Daily volume for past 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentConvs = await prisma.conversation.findMany({
    where: { createdAt: { gte: fourteenDaysAgo } },
    select: { createdAt: true, type: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyVolume: Record<string, { chat: number; voice: number }> = {};
  for (const c of recentConvs) {
    const day = c.createdAt.toISOString().slice(0, 10);
    if (!dailyVolume[day]) dailyVolume[day] = { chat: 0, voice: 0 };
    dailyVolume[day][c.type as "chat" | "voice"]++;
  }

  return {
    convStats,
    leadStats,
    avgDuration: Math.round(durationResult._avg.durationSeconds ?? 0),
    languageDist,
    dailyVolume,
  };
}

export default async function AnalyticsPage() {
  const { convStats, leadStats, avgDuration, languageDist, dailyVolume } =
    await getAnalyticsData();

  const langData = Object.entries(languageDist).map(([lang, count]) => ({
    name: lang,
    value: count,
  }));

  const volumeData = Object.entries(dailyVolume).map(([date, counts]) => ({
    date: date.slice(5), // MM-DD
    chat: counts.chat,
    voice: counts.voice,
  }));

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Conversations"
          value={convStats.total}
          icon={Activity}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <StatsCard
          title="Chat Sessions"
          value={convStats.chat}
          icon={MessageSquare}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <StatsCard
          title="Voice Sessions"
          value={convStats.voice}
          icon={Mic}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <StatsCard
          title="Avg Duration"
          value={avgDuration > 0 ? formatDuration(avgDuration) : "—"}
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Leads"
          value={leadStats.total}
          icon={Users}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Meeting Requests"
          value={leadStats.meetingRequested}
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Quote Requests"
          value={leadStats.quoteRequested}
          icon={FileText}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
        />
        <StatsCard
          title="Lead Capture Rate"
          value={
            convStats.total > 0
              ? `${Math.round(
                  (convStats.leadsExtracted / convStats.total) * 100
                )}%`
              : "—"
          }
          icon={Activity}
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
        />
      </div>

      {/* Charts */}
      <AnalyticsCharts volumeData={volumeData} languageData={langData} />
    </div>
  );
}
