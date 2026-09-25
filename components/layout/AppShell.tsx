"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route changes (escape key or outside click handled inside Sidebar)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F9F8F5] text-[#1C1B18]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area — takes remaining space after sidebar */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5 lg:p-7">
          <div className="max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
