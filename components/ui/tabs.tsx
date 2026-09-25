"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-[#ECE7DE] overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer focus-ring",
              isActive
                ? "border-[#8D5B28] text-[#8D5B28] bg-[#F6EDE3]/40"
                : "border-transparent text-[#5C5850] hover:text-[#1C1B18] hover:border-[#D9D2C4]"
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  isActive
                    ? "bg-[#8D5B28] text-white"
                    : "bg-[#F3EFE7] text-[#5C5850]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
