"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import {
  History,
  RefreshCw,
  Filter,
  Search,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function HistoryPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState("ALL");
  const [entityType, setEntityType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        eventType,
        entityType,
        limit: "100",
      });
      const res = await fetch(`/api/activity?${q.toString()}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setActivities(data.data.activities || []);
      }
    } catch {
      // Non-blocking fetch error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [eventType, entityType]);

  const filteredActivities = activities.filter((act) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      act.message?.toLowerCase().includes(term) ||
      act.actor?.toLowerCase().includes(term) ||
      act.user?.toLowerCase().includes(term) ||
      act.eventType?.toLowerCase().includes(term) ||
      act.entityType?.toLowerCase().includes(term) ||
      act._id?.toLowerCase().includes(term)
    );
  });

  const getEventBadge = (type: string) => {
    if (type.includes("LEAD_")) return <Badge variant="bronze">{type.replace("_", " ")}</Badge>;
    if (type.includes("AI_")) return <Badge variant="info">AI SCORED</Badge>;
    if (type.includes("TWENTY_")) return <Badge variant="success">TWENTY CRM</Badge>;
    if (type.includes("ZAPIER_")) return <Badge variant="warning">ZAPIER AUTOMATION</Badge>;
    if (type.includes("TASK_")) return <Badge variant="default">TASK</Badge>;
    if (type.includes("COMPANY_")) return <Badge variant="info">COMPANY</Badge>;
    if (type.includes("OPPORTUNITY_")) return <Badge variant="bronze">DEAL</Badge>;
    if (type.includes("FAILED")) return <Badge variant="danger">FAILED</Badge>;
    return <Badge variant="default">{type.replace("_", " ")}</Badge>;
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE7DE] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
                Developer Audit & Action History
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EE] text-[#1E7E34] border border-[#C3E6CB]">
                <Database className="w-3 h-3" />
                Saved on MongoDB Database
              </span>
            </div>
            <p className="text-xs text-[#5C5850] mt-1">
              Comprehensive timeline of all developer and system operations securely logged in MongoDB.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              className="text-xs border-[#D9D2C4]"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* MongoDB Sync Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#ECE7DE] bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5C5850]">MongoDB Persistence</span>
              <span className="flex h-2 w-2 rounded-full bg-[#1E7E34]" />
            </div>
            <div className="text-xl font-bold text-[#1C1B18] mt-2">Active &amp; Scoped</div>
            <p className="text-[11px] text-[#8C867B] mt-0.5">Every developer action is recorded with workspace ID</p>
          </div>

          <div className="p-4 rounded-xl border border-[#ECE7DE] bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5C5850]">Total Logged Actions</span>
              <Layers className="w-4 h-4 text-[#8D5B28]" />
            </div>
            <div className="text-xl font-bold text-[#8D5B28] mt-2">{activities.length} Records</div>
            <p className="text-[11px] text-[#8C867B] mt-0.5">Indexed by timestamp and actor</p>
          </div>

          <div className="p-4 rounded-xl border border-[#ECE7DE] bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5C5850]">Automation Pipelines</span>
              <Zap className="w-4 h-4 text-[#1E7E34]" />
            </div>
            <div className="text-xl font-bold text-[#1E7E34] mt-2">Twenty + Zapier</div>
            <p className="text-[11px] text-[#8C867B] mt-0.5">Automations automatically synced on lead creation</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[#5C5850] font-semibold">
              <Filter className="w-4 h-4 text-[#8D5B28]" />
              <span>Filters:</span>
            </div>

            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="h-9 rounded-lg border border-[#D9D2C4] bg-white px-3 text-xs text-[#1C1B18] focus-ring"
            >
              <option value="ALL">All Event Types</option>
              <option value="LEAD_CREATED">Lead Created</option>
              <option value="LEAD_UPDATED">Lead Updated</option>
              <option value="AI_QUALIFICATION_COMPLETED">AI Qualification</option>
              <option value="TWENTY_SYNC_COMPLETED">Twenty CRM Sync</option>
              <option value="ZAPIER_COMPLETED">Zapier Automation</option>
              <option value="TASK_CREATED">Task Created</option>
              <option value="OPPORTUNITY_CREATED">Deal Created</option>
              <option value="COMPANY_CREATED">Company Created</option>
            </select>

            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="h-9 rounded-lg border border-[#D9D2C4] bg-white px-3 text-xs text-[#1C1B18] focus-ring"
            >
              <option value="ALL">All Entities</option>
              <option value="lead">Prospects (Leads)</option>
              <option value="company">Companies</option>
              <option value="opportunity">Opportunities</option>
              <option value="task">Tasks</option>
              <option value="automation">Automations</option>
            </select>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#8C867B]" />
            <input
              type="text"
              placeholder="Search actions, messages, IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#D9D2C4] bg-white pl-8 pr-3 text-xs text-[#1C1B18] focus-ring"
            />
          </div>
        </div>

        {/* Action History Table */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8C867B] italic">
              No developer actions recorded yet matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#ECE7DE] bg-[#F3EFE7]/70 text-[#5C5850] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-3">Event Type</th>
                    <th className="py-3 px-3">Target Entity</th>
                    <th className="py-3 px-3">Developer / Actor</th>
                    <th className="py-3 px-3">Action Description</th>
                    <th className="py-3 px-3">MongoDB Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7DE]">
                  {filteredActivities.map((act) => {
                    const isExpanded = expandedId === act._id;
                    return (
                      <React.Fragment key={act._id}>
                        <tr className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#8C867B] whitespace-nowrap">
                            {formatDateTime(act.timestamp)}
                          </td>
                          <td className="py-3 px-3">{getEventBadge(act.eventType)}</td>
                          <td className="py-3 px-3 uppercase text-[10px] font-bold text-[#5C5850]">
                            {act.entityType}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#1C1B18]">
                            {act.actor || act.user || "Developer"}
                          </td>
                          <td className="py-3 px-3 text-[#1C1B18] max-w-md">
                            {act.message}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : act._id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8D5B28] hover:underline cursor-pointer"
                            >
                              <span>{isExpanded ? "Hide" : "Payload"}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-[#FAF8F5]/80">
                            <td colSpan={6} className="px-6 py-3 border-t border-b border-[#ECE7DE]">
                              <div className="space-y-1.5 font-mono text-[11px] text-[#5C5850]">
                                <div><strong className="text-[#1C1B18]">MongoDB Record ID:</strong> {act._id}</div>
                                {act.workspaceId && <div><strong className="text-[#1C1B18]">Workspace ID:</strong> {act.workspaceId}</div>}
                                {act.entityId && <div><strong className="text-[#1C1B18]">Entity ID:</strong> {act.entityId}</div>}
                                {act.metadata && (
                                  <div>
                                    <strong className="text-[#1C1B18]">Metadata:</strong>
                                    <pre className="mt-1 p-2 bg-white rounded border border-[#D9D2C4] text-[10px] overflow-x-auto text-[#1C1B18]">
                                      {JSON.stringify(act.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
