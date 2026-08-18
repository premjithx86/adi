"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const titles: Record<string, { label: string; description: string }> = {
  "/": { label: "Dashboard", description: "Overview of your AI assistant" },
  "/chat": { label: "AI Testing — Chat", description: "Test your agent via text" },
  "/voice": {
    label: "AI Testing — Voice",
    description: "Test your agent via voice call",
  },
  "/conversations": {
    label: "Conversations",
    description: "Full conversation history",
  },
  "/leads": { label: "Leads", description: "Captured lead information" },
  "/analytics": {
    label: "Analytics",
    description: "Performance metrics and insights",
  },
  "/profile": { label: "Profile", description: "Account settings" },
};

function getPageTitle(pathname: string) {
  // exact match first
  if (titles[pathname]) return titles[pathname];
  // prefix match
  const prefix = Object.keys(titles).find(
    (k) => k !== "/" && pathname.startsWith(k)
  );
  return prefix ? titles[prefix] : { label: "Adivinar AI", description: "" };
}

interface HeaderProps {
  username?: string;
}

export function Header({ username = "Admin" }: HeaderProps) {
  const pathname = usePathname();
  const page = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-slate-200 bg-white px-6 gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate">
          {page.label}
        </h1>
        {page.description && (
          <p className="text-xs text-slate-500 truncate">{page.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">
              {username}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
