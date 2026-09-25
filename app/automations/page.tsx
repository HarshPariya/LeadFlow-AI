"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Boxes,
  Zap,
  Mail,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AutomationsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRuns: 0,
    successRuns: 0,
    failedRuns: 0,
    successRate: 0,
    avgDurationMs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);

  const fetchRuns = async () => {
    try {
      const res = await fetch("/api/automation-runs");
      const data = await res.json();
      if (res.ok && data?.data) {
        setRuns(data.data.runs || []);
        if (data.data.stats) setStats(data.data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  // 7 Core Platform Automations per Architecture Specification
  const automationsConfig = [
    {
      id: "lead_qualification",
      name: "Lead Qualification",
      categoryBadge: "LOCAL APP AUTOMATION",
      type: "Groq AI Engine",
      description: "Generates structured scores (0-100), deterministic priority (HIGH 80-100, MED 50-79, LOW 0-49), and executive summaries.",
    },
    {
      id: "crm_sync",
      name: "Twenty CRM Synchronization",
      categoryBadge: "TWENTY CRM WORKFLOW",
      type: "Twenty CRM Workflow",
      description: "Dispatches normalized automation event to Twenty Workflow Webhook for Person and Company upsert.",
    },
    {
      id: "high_priority_routing",
      name: "Zapier High Priority Routing",
      categoryBadge: "ZAPIER AUTOMATION",
      type: "Zapier Path A",
      description: "Executes when priority=HIGH (score 80+). Dispatches sales notification and customer confirmation via Gmail.",
    },
    {
      id: "medium_priority_routing",
      name: "Zapier Medium Priority Routing",
      categoryBadge: "ZAPIER AUTOMATION",
      type: "Zapier Path B",
      description: "Executes when priority=MEDIUM (score 50-79). Dispatches customer next-steps email via Gmail.",
    },
    {
      id: "low_priority_nurture",
      name: "Zapier Low Priority Nurture",
      categoryBadge: "ZAPIER AUTOMATION",
      type: "Zapier Path C",
      description: "Executes when priority=LOW (score 0-49). Dispatches automated product education nurture response via Gmail.",
    },
    {
      id: "customer_email",
      name: "Gmail Communication",
      categoryBadge: "GMAIL AUTOMATION",
      type: "Gmail Integration",
      description: "Sends customized customer acknowledgements and nurture sequences through connected Gmail accounts.",
    },
    {
      id: "crm_task_creation",
      name: "Twenty Task Automation",
      categoryBadge: "TWENTY CRM WORKFLOW",
      type: "Twenty CRM Task Automation",
      description: "Automatically schedules follow-up tasks (24h for HIGH, 48h for MEDIUM, 5d for LOW) in Twenty CRM.",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE7DE] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
              Automations & Pipeline Monitoring
            </h1>
            <p className="text-xs text-[#5C5850] mt-1">
              Live execution metrics for AI qualification, Twenty CRM synchronization, Zapier conditional paths, and Gmail communication
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRuns}
            className="text-xs border-[#D9D2C4]"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Runs
          </Button>
        </div>

        {/* Global Execution Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5850]">
              Total Pipeline Runs
            </span>
            <div className="text-2xl font-bold text-[#1C1B18] mt-1">{stats.totalRuns}</div>
          </div>
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5850]">
              Success Rate
            </span>
            <div className="text-2xl font-bold text-[#246E47] mt-1">
              {stats.totalRuns > 0 ? `${stats.successRate}%` : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5850]">
              Failed Workflows
            </span>
            <div className="text-2xl font-bold text-[#B91C1C] mt-1">{stats.failedRuns}</div>
          </div>
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5850]">
              Average Latency
            </span>
            <div className="text-2xl font-bold text-[#8D5B28] mt-1">
              {stats.totalRuns > 0 ? `${stats.avgDurationMs}ms` : "—"}
            </div>
          </div>
        </div>

        {/* System Automations Catalog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#5C5850]">
              Configured Platform Automations
            </h2>
            <span className="text-xs text-[#8C867B]">7 Workflows Registered</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {automationsConfig.map((auto) => (
              <div
                key={auto.id}
                className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs hover:border-[#D9D2C4] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${auto.categoryBadge === "ZAPIER AUTOMATION"
                        ? "bg-[#FFFBEB] text-[#B45309]"
                        : auto.categoryBadge === "TWENTY CRM WORKFLOW"
                          ? "bg-[#EFF6FF] text-[#1D4ED8]"
                          : auto.categoryBadge === "GMAIL AUTOMATION"
                            ? "bg-[#EEF7F2] text-[#246E47]"
                            : "bg-[#F6EDE3] text-[#8D5B28]"
                        }`}
                    >
                      {auto.categoryBadge}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#246E47]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#246E47]" />
                      Configured
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#1C1B18] mt-1">{auto.name}</h3>
                  <p className="mt-1 text-xs text-[#5C5850] leading-relaxed">
                    {auto.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-[#ECE7DE] pt-3 text-xs text-[#8C867B] flex items-center justify-between">
                  <span>Engine: <strong className="text-[#1C1B18]">{auto.type}</strong></span>
                  <span className="text-[11px] font-semibold text-[#8D5B28]">Ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Automation Execution History */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#ECE7DE] bg-[#FAF8F5]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5850]">
                Execution Audit Runs
              </h3>
              <p className="text-[11px] text-[#8C867B]">
                Click any execution run to inspect step-by-step visual timeline
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRuns}
              className="h-7 text-xs border-[#D9D2C4]"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8C867B] italic">
              No automation runs yet. Register an inbound lead to begin the automated pipeline.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#ECE7DE] bg-[#F3EFE7]/70 text-[#5C5850] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Workflow Name</th>
                    <th className="py-3 px-3">Lead Email</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Steps</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Trigger Source</th>
                    <th className="py-3 px-3">Executed At</th>
                    <th className="py-3 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7DE]">
                  {runs.map((run) => (
                    <tr
                      key={run._id}
                      onClick={() => setSelectedRun(run)}
                      className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-[#1C1B18]">
                        {run.workflowName}
                      </td>
                      <td className="py-3 px-3 text-[#5C5850]">{run.leadEmail}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded ${run.status === "SUCCESS"
                            ? "bg-[#EEF7F2] text-[#246E47]"
                            : "bg-[#FEF2F2] text-[#B91C1C]"
                            }`}
                        >
                          {run.status === "SUCCESS" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#5C5850]">
                        {run.steps?.length || 0} steps
                      </td>
                      <td className="py-3 px-3 font-mono text-[#8C867B]">
                        {run.durationMs ? `${run.durationMs}ms` : "—"}
                      </td>
                      <td className="py-3 px-3 capitalize text-[#5C5850]">
                        {run.triggerSource}
                      </td>
                      <td className="py-3 px-3 text-[#8C867B]">
                        {formatDateTime(run.createdAt)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-[#8D5B28] font-semibold hover:underline">
                          Inspect →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Step-by-Step Visual Timeline Modal */}
        <Modal
          isOpen={selectedRun !== null}
          onClose={() => setSelectedRun(null)}
          title={`Execution Timeline: ${selectedRun?.workflowName || ""}`}
          description={`Prospect: ${selectedRun?.leadName} (${selectedRun?.leadEmail})`}
          maxWidth="xl"
        >
          {selectedRun && (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-[#ECE7DE] bg-[#FAF8F5] p-3">
                <span>
                  Status: <strong>{selectedRun.status}</strong>
                </span>
                <span>
                  Total Duration: <strong>{selectedRun.durationMs}ms</strong>
                </span>
                <span>Trigger: <strong>{selectedRun.triggerSource}</strong></span>
              </div>

              {/* Visual Pipeline Steps */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[#5C5850] text-[11px]">
                  Pipeline Execution Path
                </h4>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ECE7DE]">
                  {selectedRun.steps?.map((step: any, idx: number) => {
                    const isSuccess = step.status === "SUCCESS";

                    return (
                      <div key={idx} className="relative">
                        <span
                          className={`absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px] ${isSuccess ? "bg-[#246E47]" : "bg-[#B91C1C]"
                            }`}
                        >
                          {isSuccess ? "✓" : "✕"}
                        </span>
                        <div className="rounded-lg border border-[#ECE7DE] bg-white p-3 shadow-2xs">
                          <div className="flex items-center justify-between font-semibold text-[#1C1B18]">
                            <span>{step.name}</span>
                            <span className="text-[11px] font-mono text-[#8C867B]">
                              {step.durationMs ? `${step.durationMs}ms` : ""}
                            </span>
                          </div>
                          {step.outputSummary && (
                            <p className="mt-1 text-[11px] text-[#5C5850]">
                              {step.outputSummary}
                            </p>
                          )}
                          {step.error && (
                            <p className="mt-1 text-[11px] font-medium text-[#B91C1C]">
                              Error: {step.error}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#ECE7DE]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRun(null)}
                >
                  Close Inspection
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
