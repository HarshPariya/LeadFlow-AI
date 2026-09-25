"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/score-badge";
import { LeadStatusBadge, PriorityBadge, AutomationStatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  Flame,
  CheckCircle2,
  Briefcase,
  Trophy,
  CheckSquare,
  Cpu,
  ArrowRight,
  Plus,
  Sparkles,
  Activity,
  Layers,
  Zap,
  Mail,
  ShieldAlert,
} from "lucide-react";

interface DashboardData {
  leads: any[];
  opportunities: any[];
  tasks: any[];
  automationRuns: any[];
  activities: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [leadsRes, oppsRes, tasksRes, runsRes, actRes] = await Promise.all([
        fetch("/api/leads?limit=100").then((r) => r.json()),
        fetch("/api/opportunities").then((r) => r.json()),
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/automation-runs?limit=10").then((r) => r.json()),
        fetch("/api/activity?limit=10").then((r) => r.json()),
      ]);

      setData({
        leads: leadsRes?.data?.leads || [],
        opportunities: oppsRes?.data?.opportunities || [],
        tasks: tasksRes?.data?.tasks || [],
        automationRuns: runsRes?.data?.runs || [],
        activities: actRes?.data?.activities || [],
      });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-[#ECE7DE] rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const leads = data?.leads || [];
  const opportunities = data?.opportunities || [];
  const tasks = data?.tasks || [];
  const automationRuns = data?.automationRuns || [];
  const activities = data?.activities || [];

  // Compute 10 Core Required KPIs from isolated workspace data
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const qualifiedLeads = leads.filter((l) => l.status === "QUALIFIED").length;
  const highPriority = leads.filter((l) => l.priority === "HIGH").length;
  const mediumPriority = leads.filter((l) => l.priority === "MEDIUM").length;
  const lowPriority = leads.filter((l) => l.priority === "LOW").length;
  const openOpportunities = opportunities.filter((o) => o.stage !== "WON" && o.stage !== "LOST").length;
  const pendingTasks = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS").length;
  const totalRuns = automationRuns.length;
  const successRuns = automationRuns.filter((r) => r.status === "SUCCESS").length;
  const automationSuccessRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;

  // Pipeline total value
  const totalPipelineValue = opportunities
    .filter((o) => o.stage !== "LOST")
    .reduce((sum, o) => sum + (o.value || 0), 0);

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE7DE] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
              Sales Automation Control Center
            </h1>
            <p className="text-xs text-[#5C5850] mt-1">
              Live operational metrics, AI scoring distributions, Zapier routing, and Twenty CRM sync
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/leads">
              <Button variant="primary" size="sm" className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Register Inbound Lead
              </Button>
            </Link>
          </div>
        </div>

        {/* 10 Core Specification KPIs Grid - Always shows accurate workspace numbers (0 for empty) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard
            title="Total Leads"
            value={totalLeads}
            icon={Users}
            description="All captured prospects"
          />
          <StatCard
            title="New Leads"
            value={newLeads}
            icon={Activity}
            description="Pending initial contact"
          />
          <StatCard
            title="Qualified Leads"
            value={qualifiedLeads}
            icon={CheckCircle2}
            description="Passed AI qualification"
          />
          <StatCard
            title="High Priority"
            value={highPriority}
            icon={Flame}
            description="Score 80-100 (Path A)"
          />
          <StatCard
            title="Medium Priority"
            value={mediumPriority}
            icon={Activity}
            description="Score 50-79 (Path B)"
          />
          <StatCard
            title="Low Priority"
            value={lowPriority}
            icon={ShieldAlert}
            description="Score 0-49 (Path C)"
          />
          <StatCard
            title="Open Opportunities"
            value={openOpportunities}
            icon={Briefcase}
            description={formatCurrency(totalPipelineValue)}
          />
          <StatCard
            title="Pending Tasks"
            value={pendingTasks}
            icon={CheckSquare}
            description="Actionable sales items"
          />
          <StatCard
            title="Automation Runs"
            value={totalRuns}
            icon={Zap}
            description="Zapier & Twenty triggers"
          />
          <StatCard
            title="Automation Success Rate"
            value={totalRuns > 0 ? `${automationSuccessRate}%` : "0%"}
            icon={Cpu}
            description={totalRuns > 0 ? "Full execution pipeline" : "No executions yet"}
          />
        </div>

        {/* Empty State when no leads exist in this workspace */}
        {totalLeads === 0 ? (
          <EmptyState
            title="No lead activity yet"
            description="Create your first lead to begin your AI qualification and CRM automation pipeline."
            actionLabel="Register Inbound Lead"
            onAction={() => (window.location.href = "/leads")}
          />
        ) : (
          <>
            {/* Analytical Breakdown Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Pipeline Value by Stage */}
              <div className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4 border-b border-[#ECE7DE] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                    Pipeline Value by Stage
                  </h3>
                  <span className="text-xs font-bold text-[#8D5B28]">
                    {formatCurrency(totalPipelineValue)}
                  </span>
                </div>

                <div className="space-y-3">
                  {["NEW", "QUALIFIED", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON"].map((stage) => {
                    const stageOpps = opportunities.filter((o) => o.stage === stage);
                    const val = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);
                    const pct = totalPipelineValue > 0 ? Math.round((val / totalPipelineValue) * 100) : 0;

                    return (
                      <div key={stage} className="text-xs">
                        <div className="flex justify-between font-medium text-[#1C1B18] mb-1">
                          <span>{stage} ({stageOpps.length})</span>
                          <span>{formatCurrency(val)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#F3EFE7] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#8D5B28] transition-all duration-500"
                            style={{ width: `${Math.max(pct, val > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lead Priority Distribution */}
              <div className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4 border-b border-[#ECE7DE] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                    AI Priority Distribution
                  </h3>
                  <span className="text-xs font-medium text-[#8C867B]">
                    {totalLeads} Total Prospects
                  </span>
                </div>

                <div className="flex items-center justify-around py-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#DC2626]">{highPriority}</div>
                    <div className="text-[11px] font-semibold text-[#5C5850] uppercase mt-0.5">High (80+)</div>
                    <div className="text-[10px] text-[#8C867B]">{Math.round((highPriority / (totalLeads || 1)) * 100)}%</div>
                  </div>
                  <div className="h-10 w-[1px] bg-[#ECE7DE]" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#D97706]">{mediumPriority}</div>
                    <div className="text-[11px] font-semibold text-[#5C5850] uppercase mt-0.5">Med (50-79)</div>
                    <div className="text-[10px] text-[#8C867B]">{Math.round((mediumPriority / (totalLeads || 1)) * 100)}%</div>
                  </div>
                  <div className="h-10 w-[1px] bg-[#ECE7DE]" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#4B5563]">{lowPriority}</div>
                    <div className="text-[11px] font-semibold text-[#5C5850] uppercase mt-0.5">Low (&lt;50)</div>
                    <div className="text-[10px] text-[#8C867B]">{Math.round((lowPriority / (totalLeads || 1)) * 100)}%</div>
                  </div>
                </div>

                {/* Progress bar breakdown */}
                <div className="mt-4 flex h-3 w-full rounded-full bg-[#F3EFE7] overflow-hidden">
                  <div style={{ width: `${(highPriority / (totalLeads || 1)) * 100}%` }} className="bg-[#DC2626]" />
                  <div style={{ width: `${(mediumPriority / (totalLeads || 1)) * 100}%` }} className="bg-[#D97706]" />
                  <div style={{ width: `${(lowPriority / (totalLeads || 1)) * 100}%` }} className="bg-[#9CA3AF]" />
                </div>
                <div className="mt-3 text-[11px] text-[#5C5850] leading-snug">
                  High priority leads automatically trigger Gmail notifications, Twenty CRM synchronization, and discovery opportunities.
                </div>
              </div>

              {/* Lead Sources Breakdown */}
              <div className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4 border-b border-[#ECE7DE] pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                    Inbound Lead Sources
                  </h3>
                  <span className="text-xs text-[#8C867B]">Channels</span>
                </div>

                <div className="space-y-3">
                  {["website", "referral", "google_ad", "linkedin"].map((source) => {
                    const count = leads.filter((l) => (l.source || "").toLowerCase().includes(source)).length;
                    const pct = Math.round((count / (totalLeads || 1)) * 100);

                    return (
                      <div key={source} className="text-xs">
                        <div className="flex justify-between font-medium text-[#1C1B18] mb-1">
                          <span className="capitalize">{source.replace("_", " ")}</span>
                          <span className="text-[#5C5850]">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#F3EFE7] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#73471D]"
                            style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Inbound Leads & Activity Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Recent Leads Table (2 cols) */}
              <div className="lg:col-span-2 rounded-xl border border-[#ECE7DE] bg-white shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#ECE7DE] bg-[#FAF8F5]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                      Recent Inbound Prospects
                    </h3>
                    <p className="text-[11px] text-[#8C867B]">Real-time database records</p>
                  </div>
                  <Link href="/leads" className="text-xs font-semibold text-[#8D5B28] hover:underline flex items-center gap-1">
                    View All Leads
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto -mx-0">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#ECE7DE] bg-[#F3EFE7]/60 text-[#5C5850] font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4">Lead</th>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Score</th>
                        <th className="py-2.5 px-3">Automation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE7DE]">
                      {leads.slice(0, 5).map((lead) => (
                        <tr key={lead._id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#1C1B18]">
                            <Link href={`/leads/${lead._id}`} className="hover:text-[#8D5B28] hover:underline">
                              {lead.firstName} {lead.lastName}
                            </Link>
                            <div className="text-[11px] text-[#8C867B] font-normal">{lead.email}</div>
                          </td>
                          <td className="py-3 px-3 text-[#5C5850]">{lead.company || "—"}</td>
                          <td className="py-3 px-3">
                            <LeadStatusBadge status={lead.status} />
                          </td>
                          <td className="py-3 px-3">
                            <PriorityBadge priority={lead.priority} />
                          </td>
                          <td className="py-3 px-3">
                            <ScoreBadge score={lead.aiScore} size="sm" />
                          </td>
                          <td className="py-3 px-3">
                            <AutomationStatusBadge status={lead.automationStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time Activity Stream (1 col) */}
              <div className="rounded-xl border border-[#ECE7DE] bg-white shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#ECE7DE] bg-[#FAF8F5]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                      System Audit Log
                    </h3>
                    <p className="text-[11px] text-[#8C867B]">Pipeline event stream</p>
                  </div>
                  <Link href="/activity" className="text-xs font-semibold text-[#8D5B28] hover:underline flex items-center gap-1">
                    Audit Log
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-4 space-y-3.5 max-h-[360px] overflow-y-auto">
                  {activities.slice(0, 6).map((act) => (
                    <div key={act._id} className="flex items-start gap-2.5 text-xs">
                      <span className="h-2 w-2 rounded-full bg-[#8D5B28] shrink-0 mt-1.5" />
                      <div className="min-w-0">
                        <p className="text-[#1C1B18] font-medium leading-snug line-clamp-2">
                          {act.message}
                        </p>
                        <span className="text-[10px] text-[#8C867B]">
                          {formatDate(act.timestamp)} · Source: {act.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
