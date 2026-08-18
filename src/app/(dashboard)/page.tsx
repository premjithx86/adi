import Link from "next/link";
import {
  MessageSquare,
  Mic,
  Users,
  Activity,
  Calendar,
  FileText,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatsCard } from "@/modules/dashboard/components/StatsCard";
import { RecentConversations } from "@/modules/dashboard/components/RecentConversations";
import { RecentLeads } from "@/modules/dashboard/components/RecentLeads";
import { ConversationRepository } from "@/services/db/ConversationRepository";
import { LeadRepository } from "@/services/db/LeadRepository";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const convRepo = new ConversationRepository();
  const leadRepo = new LeadRepository();

  const [convStats, leadStats, recentConvs, recentLeads] = await Promise.all([
    convRepo.getStats(),
    leadRepo.getStats(),
    convRepo.findAll({ limit: 5 }),
    leadRepo.findAll({ limit: 5 }),
  ]);

  return { convStats, leadStats, recentConvs, recentLeads };
}

export default async function DashboardPage() {
  const { convStats, leadStats, recentConvs, recentLeads } =
    await getDashboardData();

  return (
    <div className="space-y-6">
      {/* AI Status banner */}
      <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
            <Activity size={16} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">
              Adivinar AI Agent
            </p>
            <p className="text-xs text-indigo-600">
              Connected · Sarvam Voice Agents
            </p>
          </div>
        </div>
        <Badge variant="success" dot>
          Operational
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
          title="Total Leads"
          value={leadStats.total}
          icon={Users}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Meetings Booked"
          value={leadStats.meetingRequested}
          icon={Calendar}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/chat">
          <Button
            variant="primary"
            size="md"
            icon={<MessageSquare size={16} />}
          >
            Start Chat Test
          </Button>
        </Link>
        <Link href="/voice">
          <Button variant="outline" size="md" icon={<Mic size={16} />}>
            Start Voice Test
          </Button>
        </Link>
        <Link href="/conversations">
          <Button
            variant="secondary"
            size="md"
            icon={<FileText size={16} />}
          >
            View All Conversations
          </Button>
        </Link>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <Link
              href="/conversations"
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all
              <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <RecentConversations conversations={recentConvs.items} />
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <Link
              href="/leads"
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all
              <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <RecentLeads leads={recentLeads.items} />
        </Card>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {leadStats.quoteRequested}
          </p>
          <p className="text-xs text-slate-500 mt-1">Quote Requests</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {leadStats.meetingRequested}
          </p>
          <p className="text-xs text-slate-500 mt-1">Meeting Requests</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {convStats.leadsExtracted}
          </p>
          <p className="text-xs text-slate-500 mt-1">Leads Extracted</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {convStats.total > 0
              ? Math.round((convStats.leadsExtracted / convStats.total) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-slate-500 mt-1">Lead Capture Rate</p>
        </div>
      </div>
    </div>
  );
}
