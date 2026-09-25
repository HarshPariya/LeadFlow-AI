import React from "react";
import { Badge } from "./badge";
import { LeadStatus, LeadPriority, AutomationStatus } from "@/models/Lead";
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle } from "lucide-react";

export function LeadStatusBadge({ status }: { status: LeadStatus | string }) {
  const config: Record<
    string,
    { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "bronze" }
  > = {
    NEW: { label: "New", variant: "info" },
    QUALIFYING: { label: "Qualifying", variant: "warning" },
    QUALIFIED: { label: "Qualified", variant: "success" },
    CONTACTED: { label: "Contacted", variant: "default" },
    MEETING_BOOKED: { label: "Meeting Booked", variant: "bronze" },
    PROPOSAL: { label: "Proposal", variant: "bronze" },
    WON: { label: "Won", variant: "success" },
    LOST: { label: "Lost", variant: "danger" },
    NURTURING: { label: "Nurturing", variant: "default" },
  };

  const item = config[status] || { label: status, variant: "default" };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: LeadPriority | string }) {
  const config: Record<
    string,
    { label: string; variant: "danger" | "warning" | "default" }
  > = {
    HIGH: { label: "High", variant: "danger" },
    MEDIUM: { label: "Medium", variant: "warning" },
    LOW: { label: "Low", variant: "default" },
  };

  const item = config[priority] || { label: priority, variant: "default" };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function AutomationStatusBadge({ status }: { status: AutomationStatus | string }) {
  switch (status) {
    case "SUCCESS":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#246E47]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#246E47]" />
          <span>Success</span>
        </span>
      );
    case "RUNNING":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1D4ED8]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1D4ED8]" />
          <span>Running</span>
        </span>
      );
    case "RETRYING":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B45309]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B45309]" />
          <span>Retrying</span>
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
          <span>Failed</span>
        </span>
      );
    case "PARTIAL":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B45309]">
          <AlertCircle className="w-3.5 h-3.5 text-[#B45309]" />
          <span>Partial</span>
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C867B]">
          <Clock className="w-3.5 h-3.5 text-[#8C867B]" />
          <span>Pending</span>
        </span>
      );
  }
}
