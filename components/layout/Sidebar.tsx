"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CheckSquare,
  Cpu,
  History,
  Boxes,
  Settings,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/leads", icon: Users },
    { label: "Companies", href: "/companies", icon: Building2 },
    { label: "Opportunities", href: "/opportunities", icon: Briefcase },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Automations", href: "/automations", icon: Cpu },
    { label: "History", href: "/history", icon: History },
    { label: "Integrations", href: "/integrations", icon: Boxes },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const content = (
    <div className="flex h-full flex-col justify-between bg-[#FFFFFF] border-r border-[#ECE7DE] w-64 select-none">
      {/* Brand Header */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#ECE7DE]">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 cursor-pointer group"
            aria-label="LeadFlow AI Dashboard"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8D5B28] text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#1C1B18] group-hover:text-[#8D5B28] transition-colors">
                LeadFlow AI
              </span>
              <p className="text-[11px] text-[#8C867B]">CRM &amp; Automation</p>
            </div>
          </Link>
          {/* Close button for mobile drawer */}
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-[#5C5850] hover:bg-[#F3EFE7] transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-0.5">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8C867B]">
            Platform
          </div>
          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors focus-ring",
                  isActive
                    ? "bg-[#F6EDE3] text-[#8D5B28]"
                    : "text-[#5C5850] hover:bg-[#F3EFE7] hover:text-[#1C1B18]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-[#8D5B28]" : "text-[#8C867B]"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-[#ECE7DE] shrink-0">
        <div className="rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] p-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#8D5B28] font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Qualification</span>
          </div>
          <p className="text-[11px] text-[#5C5850] leading-snug">
            Groq Llama 3.3 scoring engine active with Zapier sync.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:flex h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-[#1C1B18]/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] animate-fade-in">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
