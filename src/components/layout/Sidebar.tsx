"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  History,
  Users,
  BarChart3,
  User,
  LogOut,
  BotMessageSquare,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Testing", href: "/chat", icon: BotMessageSquare },
  { name: "Voice Session", href: "/voice", icon: Mic },
  { name: "Conversations", href: "/conversations", icon: History },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <BotMessageSquare className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Adivinar</p>
          <p className="text-xs text-slate-400 mt-0.5">AI Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto scrollbar-thin">
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Platform
        </p>
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <item.icon
                size={17}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <ChevronRight size={14} className="text-indigo-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-3 py-3 space-y-0.5">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
            pathname === "/profile"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          )}
        >
          <User size={17} className="flex-shrink-0" />
          Profile
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all duration-150"
          >
            <LogOut size={17} className="flex-shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
