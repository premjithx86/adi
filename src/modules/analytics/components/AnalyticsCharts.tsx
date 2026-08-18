"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

const COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

interface VolumeData {
  date: string;
  chat: number;
  voice: number;
}

interface LanguageData {
  name: string;
  value: number;
}

interface Props {
  volumeData: VolumeData[];
  languageData: LanguageData[];
}

export function AnalyticsCharts({ volumeData, languageData }: Props) {
  const hasVolumeData = volumeData.some((d) => d.chat > 0 || d.voice > 0);
  const hasLangData = languageData.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Volume chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Volume (last 14 days)</CardTitle>
        </CardHeader>
        {!hasVolumeData ? (
          <div className="flex items-center justify-center h-48 text-sm text-slate-400">
            No conversation data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={volumeData}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Bar
                dataKey="chat"
                name="Chat"
                fill="#4f46e5"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="voice"
                name="Voice"
                fill="#7c3aed"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Language distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
        </CardHeader>
        {!hasLangData ? (
          <div className="flex items-center justify-center h-48 text-sm text-slate-400">
            No language data yet
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {languageData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-2">
              {languageData.map((item, index) => {
                const total = languageData.reduce(
                  (sum, d) => sum + d.value,
                  0
                );
                const pct =
                  total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                    <span className="text-xs text-slate-600 flex-1 truncate">
                      {item.name}
                    </span>
                    <span className="text-xs font-medium text-slate-700">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
