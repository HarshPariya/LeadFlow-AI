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
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Boxes,
  Zap,
} from "lucide-react";

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState("ALL");
  const [entityType, setEntityType] = useState("ALL");

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
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [eventType, entityType]);

  const getEventBadge = (type: string) => {
    if (type.includes("AI_")) return <Badge variant="bronze">{type.replace("_", " ")}</Badge>;
    if (type.includes("TWENTY_")) return <Badge variant="info">{type.replace("_", " ")}</Badge>;
    if (type.includes("ZAPIER_")) return <Badge variant="warning">{type.replace("_", " ")}</Badge>;
    if (type.includes("FAILED")) return <Badge variant="danger">{type.replace("_", " ")}</Badge>;
    return <Badge variant="default">{type.replace("_", " ")}</Badge>;
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE7DE] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
              Platform Audit & Activity Log
            </h1>
            <p className="text-xs text-[#5C5850] mt-1">
              Immutable ledger of lead events, AI qualification outputs, CRM synchronization runs, and webhooks
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivities}
            className="text-xs border-[#D9D2C4]"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Log
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs text-xs">
          <div className="flex items-center gap-2 text-[#5C5850] font-semibold">
            <Filter className="w-4 h-4 text-[#8D5B28]" />
            <span>Filter By:</span>
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
            <option value="ZAPIER_TRIGGERED">Zapier Triggered</option>
            <option value="ZAPIER_PATH_HIGH">Zapier Path A (HIGH)</option>
            <option value="ZAPIER_PATH_MEDIUM">Zapier Path B (MEDIUM)</option>
            <option value="ZAPIER_PATH_LOW">Zapier Path C (LOW)</option>
            <option value="ZAPIER_COMPLETED">Zapier Completed</option>
            <option value="GMAIL_SENT">Gmail Sent</option>
            <option value="EMAIL_SENT">Email Sent</option>
            <option value="TASK_CREATED">Task Created</option>
            <option value="OPPORTUNITY_CREATED">Deal Created</option>
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

        {/* Activity Table */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#8C867B] italic">
              No audit records match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#ECE7DE] bg-[#F3EFE7]/70 text-[#5C5850] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Event</th>
                    <th className="py-3 px-3">Entity</th>
                    <th className="py-3 px-3">User / Actor</th>
                    <th className="py-3 px-3">Message</th>
                    <th className="py-3 px-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7DE]">
                  {activities.map((act) => (
                    <tr key={act._id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#8C867B] whitespace-nowrap">
                        {formatDateTime(act.timestamp)}
                      </td>
                      <td className="py-3 px-3">{getEventBadge(act.eventType)}</td>
                      <td className="py-3 px-3 uppercase text-[10px] font-bold text-[#5C5850]">
                        {act.entityType}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1C1B18]">{act.user}</td>
                      <td className="py-3 px-3 text-[#1C1B18] max-w-md truncate">
                        {act.message}
                      </td>
                      <td className="py-3 px-3 capitalize text-[#8C867B]">{act.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
