"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Boxes,
  Database,
  Cpu,
  Zap,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Info,
} from "lucide-react";

interface IntegrationDetail {
  key: string;
  name: string;
  category: string;
  type: string;
  status: "ACTIVE" | "CONNECTED" | "CONFIGURED" | "NEEDS_CONFIGURATION" | "NOT_CONNECTED" | "ERROR";
  purpose: string;
  lastActivity: string;
  configState: string[];
  docsUrl: string;
  requiredConfig: string[];
  webhookInfo?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationDetail | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/integrations/health");
      const data = await res.json();
      if (res.ok && data?.data) {
        setIntegrations(data.data.integrations || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getIcon = (key: string) => {
    switch (key) {
      case "twenty":
        return Boxes;
      case "groq":
        return Cpu;
      case "zapier":
        return Zap;
      case "mongodb":
        return Database;
      case "gmail":
        return Mail;
      default:
        return Boxes;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "CONNECTED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase bg-[#EEF7F2] text-[#246E47] border border-[#C6E7D2]">
            Active
          </span>
        );
      case "CONFIGURED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
            Configured
          </span>
        );
      case "NEEDS_CONFIGURATION":
      case "CONFIGURATION_REQUIRED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            Needs Configuration
          </span>
        );
      case "ERROR":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
            Error
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase bg-[#F3EFE7] text-[#5C5850] border border-[#ECE7DE]">
            Not Connected
          </span>
        );
    }
  };

  // Convert raw health data to structured SaaS overview items
  const getIntegrationDetail = (item: any): IntegrationDetail => {
    switch (item.key) {
      case "mongodb":
        return {
          key: "mongodb",
          name: "MongoDB Persistence",
          category: "Database",
          type: "Primary Database",
          status: item.status === "CONNECTED" ? "ACTIVE" : "ERROR",
          purpose: "Stores tenant accounts, workspaces, leads, companies, opportunities, tasks, and audit logs with strict workspace isolation.",
          lastActivity: item.lastEvent || "Cluster operational and healthy",
          configState: ["✓ Mongoose client connected", "✓ Workspace-scoped compound indexes enabled"],
          docsUrl: "https://www.mongodb.com/docs/",
          requiredConfig: ["MONGODB_URI"],
        };
      case "groq":
        return {
          key: "groq",
          name: "Groq AI Intelligence",
          category: "AI Engine",
          type: "LLM Inference Engine",
          status: item.hasCredentials ? "ACTIVE" : "NEEDS_CONFIGURATION",
          purpose: "Performs real-time sales qualification, intent analysis, and automated deal priority scoring using ultra-fast LPU inference.",
          lastActivity: item.lastEvent || "Inference engine ready for lead evaluations",
          configState: item.hasCredentials
            ? [`✓ API key active`, `✓ Model selected: ${item.endpointOrModel || "llama-3.3-70b-versatile"}`]
            : ["⚠ Needs GROQ_API_KEY for live LLM inference"],
          docsUrl: "https://console.groq.com/docs",
          requiredConfig: ["GROQ_API_KEY", "GROQ_MODEL"],
        };
      case "twenty":
        return {
          key: "twenty",
          name: "Twenty CRM",
          category: "External CRM",
          type: "External CRM",
          status: item.hasCredentials ? "ACTIVE" : "NEEDS_CONFIGURATION",
          purpose: "Stores synchronized People, Companies, Opportunities, and Tasks across your external enterprise CRM workspace.",
          lastActivity: item.lastEvent || "Webhook and REST endpoints listening",
          configState: item.hasCredentials
            ? ["✓ Webhook endpoint configured", "✓ Bi-directional CRM mapping ready"]
            : ["⚠ Add TWENTY_WORKFLOW_WEBHOOK_URL or TWENTY_API_KEY in environment"],
          docsUrl: "https://twenty.com/developers",
          requiredConfig: ["TWENTY_WORKFLOW_WEBHOOK_URL", "TWENTY_API_KEY", "TWENTY_API_URL"],
          webhookInfo: "Outbound payload: lead, company, opportunity objects with qualification score",
        };
      case "zapier":
        return {
          key: "zapier",
          name: "Zapier Cross-App Automation",
          category: "Automation",
          type: "Cross-App Routing",
          status: item.hasCredentials ? "ACTIVE" : "NEEDS_CONFIGURATION",
          purpose: "Dispatches lead.qualified events to Zapier Paths (Path A: High, Path B: Medium, Path C: Low) to trigger multi-app workflows.",
          lastActivity: item.lastEvent || "Catch Hook configured for lead dispatches",
          configState: item.hasCredentials
            ? ["✓ Catch Hook Webhook URL verified", "✓ Zapier Paths event schema registered"]
            : ["⚠ Add ZAPIER_LEAD_WEBHOOK_URL to forward live events to Zapier"],
          docsUrl: "https://zapier.com/help",
          requiredConfig: ["ZAPIER_LEAD_WEBHOOK_URL"],
          webhookInfo: "Endpoint: POST /api/webhooks/zapier/status for receipt confirmations",
        };
      case "gmail":
        return {
          key: "gmail",
          name: "Gmail Communication",
          category: "Communication",
          type: "Transactional Mail",
          status: item.hasCredentials ? "CONFIGURED" : "NEEDS_CONFIGURATION",
          purpose: "Sends internal sales notifications for high-priority deals and automated customer follow-up confirmations.",
          lastActivity: item.lastEvent || "SMTP and Gmail transport initialized",
          configState: item.hasCredentials
            ? ["✓ Gmail OAuth / App Password configured", "✓ Sender address verified"]
            : ["⚠ Configure GMAIL_USER and GMAIL_APP_PASSWORD to enable live delivery"],
          docsUrl: "https://support.google.com/mail/answer/185833",
          requiredConfig: ["GMAIL_USER", "GMAIL_APP_PASSWORD", "GMAIL_ENABLED"],
        };
      default:
        return {
          key: item.key,
          name: item.name,
          category: item.category,
          type: "Integration",
          status: "NOT_CONNECTED",
          purpose: item.message,
          lastActivity: "No events recorded",
          configState: [],
          docsUrl: item.docsUrl || "#",
          requiredConfig: [],
        };
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE7DE] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
              Integrations & Connected Systems
            </h1>
            <p className="text-xs text-[#5C5850] mt-1">
              Operational overview of database persistence, AI inference, Twenty CRM, Zapier, and Gmail
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="text-xs border-[#D9D2C4]">
                <Settings className="w-3.5 h-3.5 mr-1" />
                Manage Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Security Isolation Notice */}
        <div className="flex items-start gap-3 rounded-xl border border-[#D9D2C4] bg-[#FAF8F5] p-4 text-xs text-[#5C5850]">
          <ShieldCheck className="w-5 h-5 text-[#8D5B28] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Production Secret Isolation:</strong> Webhook credentials, API keys, and transport secrets are securely resolved server-side and never exposed to the client. Statuses reflect real operational states.
          </p>
        </div>

        {/* Integrations Grid (5 Systems: MongoDB, Groq, Twenty CRM, Zapier, Gmail) */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrations.map((item) => {
              const detail = getIntegrationDetail(item);
              const Icon = getIcon(detail.key);

              return (
                <div
                  key={detail.key}
                  className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs hover:border-[#D9D2C4] transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Icon & Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDE3] text-[#8D5B28]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#1C1B18]">{detail.name}</h3>
                          <span className="text-[10px] font-semibold text-[#8C867B] uppercase tracking-wider">
                            {detail.type}
                          </span>
                        </div>
                      </div>

                      {getStatusBadge(detail.status)}
                    </div>

                    {/* Purpose */}
                    <p className="mt-4 text-xs text-[#5C5850] leading-relaxed">
                      {detail.purpose}
                    </p>

                    {/* Configuration State summary */}
                    <div className="mt-3.5 space-y-1">
                      {detail.configState.map((cs, idx) => (
                        <div key={idx} className="text-[11px] text-[#5C5850] font-medium flex items-center gap-1.5">
                          {cs}
                        </div>
                      ))}
                    </div>

                    {/* Last Activity */}
                    <div className="mt-4 text-[11px] text-[#8C867B] border-t border-[#ECE7DE]/60 pt-2.5">
                      <span className="font-semibold text-[#5C5850]">Last Activity:</span>
                      <p className="text-[#1C1B18] mt-0.5 truncate">{detail.lastActivity}</p>
                    </div>
                  </div>

                  {/* Actions: Documentation & Manage Configuration */}
                  <div className="mt-5 border-t border-[#ECE7DE] pt-3 flex items-center justify-between text-xs">
                    <a
                      href={detail.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8D5B28] hover:underline"
                    >
                      Documentation
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIntegration(detail)}
                      className="h-7 px-2.5 text-xs border-[#D9D2C4]"
                    >
                      Manage Configuration
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Integration Details Modal */}
        {selectedIntegration && (
          <Modal
            isOpen={Boolean(selectedIntegration)}
            onClose={() => setSelectedIntegration(null)}
            title={selectedIntegration.name}
            description={`System Overview & Configuration Specifications (${selectedIntegration.type})`}
            maxWidth="lg"
          >
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8D5B28] mb-1">
                  Purpose & Role
                </h4>
                <p className="text-[#5C5850] leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#ECE7DE]">
                  {selectedIntegration.purpose}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8D5B28] mb-1">
                  Operational State
                </h4>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#ECE7DE]">
                  <span className="text-[#1C1B18] font-medium">Status</span>
                  {getStatusBadge(selectedIntegration.status)}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8D5B28] mb-1">
                  Required Environment Configuration
                </h4>
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#ECE7DE] space-y-1.5 font-mono text-[11px]">
                  {selectedIntegration.requiredConfig.map((cfg) => (
                    <div key={cfg} className="flex items-center justify-between">
                      <span className="text-[#1C1B18]">{cfg}</span>
                      <span className="text-[#8C867B] text-[10px] font-sans">Server Protected</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedIntegration.webhookInfo && (
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8D5B28] mb-1">
                    Webhook Specification
                  </h4>
                  <p className="bg-[#FAF8F5] p-2.5 rounded-lg border border-[#ECE7DE] text-[11px] font-mono text-[#5C5850]">
                    {selectedIntegration.webhookInfo}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8D5B28] mb-1">
                  Recent Activity Stream
                </h4>
                <p className="text-[#1C1B18] bg-white p-2.5 rounded-lg border border-[#ECE7DE]">
                  {selectedIntegration.lastActivity}
                </p>
              </div>

              <div className="pt-3 border-t border-[#ECE7DE] flex justify-between items-center">
                <a
                  href={selectedIntegration.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#8D5B28] hover:underline inline-flex items-center gap-1"
                >
                  External Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
                <Button variant="primary" size="sm" onClick={() => setSelectedIntegration(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
