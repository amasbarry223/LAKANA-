"use client"

import { useState } from "react"
import {
  LayoutGrid,
  FileText,
  Filter,
  Users2,
  Lightbulb,
  User,
  Building2,
  Layers,
  Activity,
  Puzzle,
  Zap,
  Megaphone,
  Users,
  Settings,
  CreditCard,
  MoreVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    title: "",
    items: [{ label: "Overview", icon: LayoutGrid }],
  },
  {
    title: "ANALYTICS",
    items: [
      { label: "Reports", icon: FileText },
      { label: "Funnels", icon: Filter, active: true },
      { label: "Cohorts", icon: Users2 },
      { label: "Insights", icon: Lightbulb },
    ],
  },
  {
    title: "ENGAGEMENT",
    items: [
      { label: "Users", icon: User },
      { label: "Accounts", icon: Building2 },
      { label: "Segments", icon: Layers },
      { label: "Activity", icon: Activity },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Integrations", icon: Puzzle },
      { label: "Automations", icon: Zap },
      { label: "Campaigns", icon: Megaphone },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Teams", icon: Users },
      { label: "Settings", icon: Settings },
      { label: "Billings", icon: CreditCard },
    ],
  },
]

export function DashboardSidebar() {
  const [active, setActive] = useState("Funnels")

  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
            <path d="M12 2L2 8.5 12 15l10-6.5L12 2zm0 14.5L2 10v6.5L12 23l10-6.5V10l-10 6.5z" />
          </svg>
        </div>
        <div className="flex items-baseline">
          <span className="text-[17px] font-bold tracking-tight text-slate-900">
            RevenuePulse
          </span>
          <span className="ml-1 text-[17px] font-light text-slate-900">AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 sidebar-scroll">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = active === item.label
              return (
                <button
                  key={item.label}
                  onClick={() => setActive(item.label)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 cursor-pointer">
          <Avatar className="h-9 w-9 border border-slate-200">
            <AvatarImage src="https://i.pravatar.cc/80?img=47" alt="Alex Morgan" />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
              AM
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">Alex Morgan</p>
            <p className="truncate text-xs text-slate-400">Admin</p>
          </div>
          <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
