"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/score-badge";
import {
  LeadStatusBadge,
  PriorityBadge,
  AutomationStatusBadge,
} from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Boxes,
  Briefcase,
  CheckSquare,
  History,
  Building2,
  Mail,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [lead, setLead] = useState<any>(null);
  const [related, setRelated] = useState<any>({
    tasks: [],
    opportunities: [],
    activities: [],
    automationRuns: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ai");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchLeadData = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setLead(data.data.lead);
        setRelated(data.data.related || {});
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [id]);

  const handleRetryAction = async (target: "all" | "zapier" | "twenty" | "ai") => {
    setActionLoading(target);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/leads/${id}/retry?target=${target}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Retry for ${target.toUpperCase()} succeeded`);
        await fetchLeadData();
      } else {
        setActionMessage(`Retry failed: ${data?.error?.message || "Error"}`);
      }
    } catch (err) {
      setActionMessage(`Retry failed: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!lead) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <h2 className="text-base font-bold text-[#1C1B18]">Lead Not Found</h2>
          <Link href="/leads" className="text-xs text-[#8D5B28] underline mt-2 inline-block">
            Return to Leads List
          </Link>
        </div>
      </AppShell>
    );
  }

  // Derive which milestones actually took place from real activities
  const activityTypes = new Set(related.activities?.map((a: any) => a.eventType) || []);
  const hasLeadCreated = true;
  const hasAiQualified = Boolean(lead.aiQualifiedAt) || activityTypes.has("AI_QUALIFICATION_COMPLETED");
  const hasZapierTriggered = activityTypes.has("ZAPIER_TRIGGERED") || Boolean(lead.lastZapierStatus);
  const hasGmailSent =
    activityTypes.has("GMAIL_SENT") ||
    activityTypes.has("ZAPIER_PATH_HIGH") ||
    activityTypes.has("ZAPIER_PATH_MEDIUM") ||
    activityTypes.has("ZAPIER_PATH_LOW");
  const hasTwentySync = Boolean(lead.twentyPersonId) || activityTypes.has("TWENTY_SYNC_COMPLETED");
  const hasOpportunityCreated = related.opportunities?.length > 0 || activityTypes.has("OPPORTUNITY_CREATED");
  const hasTaskCreated = related.tasks?.length > 0 || activityTypes.has("TASK_CREATED");

  const timelineMilestones = [
    {
      title: "Lead Created",
      description: `Prospect registered from ${lead.source || "website"}`,
      done: hasLeadCreated,
      time: lead.createdAt,
    },
    {
      title: "AI Qualified",
      description: hasAiQualified
        ? `Score: ${lead.aiScore}/100 · Priority: ${lead.priority} via ${lead.aiModel || "Groq"}`
        : "Pending AI scoring",
      done: hasAiQualified,
      time: lead.aiQualifiedAt,
    },
    {
      title: "Zapier Triggered",
      description: hasZapierTriggered
        ? `Catch Hook dispatched (${lead.lastZapierStatus || "Dispatched"})`
        : "Pending Zapier Catch Hook dispatch",
      done: hasZapierTriggered,
      time: lead.updatedAt,
    },
    {
      title: "Gmail Automation",
      description: hasGmailSent
        ? `Conditional outreach queued for ${lead.priority} priority`
        : "Pending Zapier Gmail execution",
      done: hasGmailSent,
      time: undefined,
    },
    {
      title: "Twenty CRM Sync",
      description: hasTwentySync
        ? `Person (${lead.twentyPersonId || "Mapped"}) · Company (${lead.twentyCompanyId || "Mapped"})`
        : "Pending Twenty CRM synchronization",
      done: hasTwentySync,
      time: lead.lastSyncedAt,
    },
    {
      title: "Opportunity Created",
      description: hasOpportunityCreated
        ? `Commercial opportunity active (${related.opportunities[0]?.stage || "DISCOVERY"})`
        : lead.priority === "LOW"
        ? "Skipped (Low priority lead kept in nurture)"
        : "Pending opportunity generation",
      done: hasOpportunityCreated,
      time: undefined,
    },
    {
      title: "Task Created",
      description: hasTaskCreated
        ? `Sales follow-up task scheduled (${related.tasks[0]?.title || "Assigned"})`
        : "Pending task creation",
      done: hasTaskCreated,
      time: undefined,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Top Navigation & Action Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C5850] hover:text-[#1C1B18] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Prospects
          </Link>

          {/* 4 Dedicated Retry Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRetryAction("ai")}
              isLoading={actionLoading === "ai"}
              className="text-xs border-[#D9D2C4]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8D5B28] mr-1" />
              Retry AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRetryAction("zapier")}
              isLoading={actionLoading === "zapier"}
              className="text-xs border-[#D9D2C4]"
            >
              <Zap className="w-3.5 h-3.5 text-[#D97706] mr-1" />
              Retry Zapier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRetryAction("twenty")}
              isLoading={actionLoading === "twenty"}
              className="text-xs border-[#D9D2C4]"
            >
              <Boxes className="w-3.5 h-3.5 text-[#1D4ED8] mr-1" />
              Retry Twenty
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRetryAction("all")}
              isLoading={actionLoading === "all"}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Retry Full Automation
            </Button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3 text-xs rounded-lg border border-[#D9D2C4] bg-white text-[#1C1B18] font-medium flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-[#8C867B] font-bold">✕</button>
          </div>
        )}

        {/* Lead Identity Banner */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
                  {lead.firstName} {lead.lastName}
                </h1>
                <LeadStatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
              <p className="text-xs text-[#5C5850] mt-1 flex flex-wrap items-center gap-4">
                <span>{lead.jobTitle ? `${lead.jobTitle} at ` : ""}{lead.company || "Independent"}</span>
                <span>•</span>
                <span>{lead.email}</span>
                {lead.phone && (
                  <>
                    <span>•</span>
                    <span>{lead.phone}</span>
                  </>
                )}
                <span>•</span>
                <span>Registered {formatDate(lead.createdAt)}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#ECE7DE] pt-3 md:pt-0 md:pl-6">
              <ScoreBadge score={lead.aiScore} size="lg" />
            </div>
          </div>
        </div>

        {/* 2-Column Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): Tabbed Sections */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-[#ECE7DE] bg-white shadow-2xs overflow-hidden">
              <Tabs
                tabs={[
                  { id: "ai", label: "AI Qualification", icon: <Sparkles className="w-3.5 h-3.5 text-[#8D5B28]" /> },
                  { id: "timeline", label: "Architecture Timeline", icon: <History className="w-3.5 h-3.5" /> },
                  { id: "requirement", label: "Lead Details" },
                  { id: "opportunities", label: "Deals", count: related.opportunities?.length },
                  { id: "tasks", label: "Tasks", count: related.tasks?.length },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />

              <div className="p-6">
                {/* TAB 1: AI Qualification Insights */}
                {activeTab === "ai" && (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-[#E5C9A8] bg-[#F6EDE3]/40 p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#8D5B28]">
                          {lead.aiCategory || "Enterprise Qualification"}
                        </span>
                        <span className="text-[11px] text-[#8C867B]">
                          Model: {lead.aiModel || "Groq Llama 3.3"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1C1B18] mb-1.5">Executive Summary</h3>
                      <p className="text-xs text-[#2E2B25] leading-relaxed">
                        {lead.aiSummary || "AI qualification generated for this inbound prospect."}
                      </p>
                    </div>

                    {/* Reasoning */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C5850] mb-2">
                        Evaluation Reasoning
                      </h4>
                      <div className="rounded-lg border border-[#ECE7DE] bg-[#FAF8F5] p-4 text-xs text-[#1C1B18] leading-relaxed">
                        {lead.aiReasoning || "Evaluated commercial urgency, budget fit, and requirement clarity."}
                      </div>
                    </div>

                    {/* Signals */}
                    {lead.aiSignals && lead.aiSignals.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C5850] mb-2">
                          Key Evaluation Signals
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {lead.aiSignals.map((sig: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded-lg border border-[#ECE7DE] bg-white p-2.5 text-xs text-[#1C1B18]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#246E47] shrink-0" />
                              <span>{sig}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Action */}
                    <div className="rounded-xl border border-[#C6E7D2] bg-[#EEF7F2]/60 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#246E47] mb-1">
                        Recommended Sales Action
                      </div>
                      <p className="text-xs font-semibold text-[#1C1B18]">
                        {lead.aiRecommendedAction || "Schedule a discovery conversation."}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: Architecture Timeline */}
                {activeTab === "timeline" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                          End-to-End Pipeline Execution Timeline
                        </h4>
                        <p className="text-[11px] text-[#8C867B] mt-0.5">
                          Lead Created → AI Qualified → Zapier Triggered → Gmail Automation → Twenty CRM Sync → Opportunity → Task
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step Architecture Pipeline */}
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ECE7DE]">
                      {timelineMilestones.map((milestone, idx) => (
                        <div key={idx} className="relative">
                          <span
                            className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px] ${
                              milestone.done ? "bg-[#246E47]" : "bg-[#D9D2C4]"
                            }`}
                          >
                            {milestone.done ? "✓" : "○"}
                          </span>
                          <div className={`rounded-lg border p-3 ${milestone.done ? "border-[#ECE7DE] bg-white shadow-2xs" : "border-[#ECE7DE]/50 bg-[#FAF8F5]/50 opacity-70"}`}>
                            <div className="flex items-center justify-between font-semibold text-[#1C1B18]">
                              <span>{milestone.title}</span>
                              {milestone.time && (
                                <span className="text-[10px] text-[#8C867B] font-mono">
                                  {formatDateTime(milestone.time)}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-[#5C5850]">{milestone.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Raw Activity Stream */}
                    <div className="pt-4 border-t border-[#ECE7DE]">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#5C5850] mb-3">
                        Audit Activity Stream
                      </h5>
                      <div className="space-y-2.5">
                        {related.activities?.map((act: any) => (
                          <div key={act._id} className="flex items-start gap-2.5 text-xs">
                            <span className="h-2 w-2 rounded-full bg-[#8D5B28] mt-1.5 shrink-0" />
                            <div>
                              <div className="font-medium text-[#1C1B18]">{act.message}</div>
                              <div className="text-[10px] text-[#8C867B]">
                                {formatDateTime(act.timestamp)} · Source: {act.source}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Requirement & Notes */}
                {activeTab === "requirement" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C5850] mb-2">
                        Stated Commercial Need
                      </h4>
                      <div className="rounded-lg border border-[#ECE7DE] bg-[#FAF8F5] p-4 text-xs text-[#1C1B18] leading-relaxed whitespace-pre-wrap">
                        {lead.requirement}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="rounded-lg border border-[#ECE7DE] p-3">
                        <div className="text-[#8C867B] text-[11px]">Budget</div>
                        <div className="font-bold text-[#1C1B18] text-sm mt-0.5">
                          {formatCurrency(lead.budget)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#ECE7DE] p-3">
                        <div className="text-[#8C867B] text-[11px]">Timeline</div>
                        <div className="font-bold text-[#1C1B18] text-sm mt-0.5">
                          {lead.timeline || "Not specified"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#ECE7DE] p-3">
                        <div className="text-[#8C867B] text-[11px]">Industry</div>
                        <div className="font-bold text-[#1C1B18] text-sm mt-0.5">
                          {lead.industry || "General"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-[#ECE7DE] p-3">
                        <div className="text-[#8C867B] text-[11px]">Country</div>
                        <div className="font-bold text-[#1C1B18] text-sm mt-0.5">
                          {lead.country || "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Opportunities */}
                {activeTab === "opportunities" && (
                  <div className="space-y-4">
                    {related.opportunities?.length === 0 ? (
                      <p className="text-xs text-[#8C867B] italic">
                        No commercial deals associated yet. High and Medium priority leads automatically synchronize deals.
                      </p>
                    ) : (
                      related.opportunities.map((opp: any) => (
                        <div
                          key={opp._id}
                          className="flex items-center justify-between rounded-xl border border-[#ECE7DE] p-4 hover:border-[#D9D2C4] transition-colors"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#1C1B18]">{opp.name}</div>
                            <div className="text-[11px] text-[#8C867B] mt-0.5">
                              Stage: <strong>{opp.stage}</strong> · Win Probability: {opp.probability}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#8D5B28]">
                              {formatCurrency(opp.value)}
                            </div>
                            <span className="text-[10px] text-[#8C867B]">
                              Close Date: {formatDate(opp.expectedCloseDate)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 5: Tasks */}
                {activeTab === "tasks" && (
                  <div className="space-y-3">
                    {related.tasks?.length === 0 ? (
                      <p className="text-xs text-[#8C867B] italic">No active follow-up tasks scheduled.</p>
                    ) : (
                      related.tasks.map((task: any) => (
                        <div
                          key={task._id}
                          className="flex items-center justify-between rounded-lg border border-[#ECE7DE] p-3.5 bg-white text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                task.status === "COMPLETED" ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            <div>
                              <div className="font-semibold text-[#1C1B18]">{task.title}</div>
                              {task.description && (
                                <p className="text-[11px] text-[#5C5850]">{task.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <PriorityBadge priority={task.priority} />
                            <div className="text-[10px] text-[#8C867B] mt-1">
                              Due: {formatDate(task.dueDate)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Twenty CRM & Zapier IDs & Status Cards */}
          <div className="space-y-5">
            {/* Twenty CRM Card */}
            <div className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3 border-b border-[#ECE7DE] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                  Twenty CRM Sync
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    lead.twentyPersonId
                      ? "bg-[#EEF7F2] text-[#246E47]"
                      : "bg-[#FFFBEB] text-[#B45309]"
                  }`}
                >
                  {lead.twentyPersonId ? "Synchronized" : "Pending Sync"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Person ID:</span>
                  <span className="font-mono text-[#1C1B18] text-[11px]">
                    {lead.twentyPersonId || "Not mapped"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Company ID:</span>
                  <span className="font-mono text-[#1C1B18] text-[11px]">
                    {lead.twentyCompanyId || "Not mapped"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Opportunity ID:</span>
                  <span className="font-mono text-[#1C1B18] text-[11px]">
                    {lead.twentyOpportunityId || (lead.priority === "LOW" ? "None (Low)" : "Pending")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Task ID:</span>
                  <span className="font-mono text-[#1C1B18] text-[11px]">
                    {lead.twentyTaskId || "Pending callback"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Last Synced:</span>
                  <span className="text-[#1C1B18]">{formatDate(lead.lastSyncedAt)}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRetryAction("twenty")}
                isLoading={actionLoading === "twenty"}
                className="w-full mt-4 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry Twenty CRM
              </Button>
            </div>

            {/* Zapier Automation Card */}
            <div className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3 border-b border-[#ECE7DE] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                  Zapier Automation
                </span>
                <AutomationStatusBadge status={lead.automationStatus} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Event Dispatched:</span>
                  <span className="font-medium text-[#1C1B18]">
                    {lead.lastZapierEvent || "lead.qualified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Zapier Status:</span>
                  <span className="font-medium text-[#1C1B18]">
                    {lead.lastZapierStatus || "DISPATCHED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Target Path:</span>
                  <span className="font-bold text-[#8D5B28]">
                    Path {lead.priority === "HIGH" ? "A (HIGH)" : lead.priority === "MEDIUM" ? "B (MEDIUM)" : "C (LOW)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C867B]">Execution Retries:</span>
                  <span className="text-[#1C1B18]">{lead.retryCount || 0}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRetryAction("zapier")}
                isLoading={actionLoading === "zapier"}
                className="w-full mt-4 text-xs"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 text-[#D97706]" />
                Retry Zapier Catch Hook
              </Button>
            </div>

            {/* Ownership & Source */}
            <div className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs text-xs space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#5C5850] border-b border-[#ECE7DE] pb-2">
                Routing & Assignment
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C867B]">Assigned Owner:</span>
                <span className="font-semibold text-[#1C1B18]">{lead.owner || "Unassigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C867B]">Inbound Source:</span>
                <span className="capitalize text-[#1C1B18]">{lead.source?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C867B]">Lifecycle Status:</span>
                <span className="font-medium text-[#1C1B18]">{lead.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
