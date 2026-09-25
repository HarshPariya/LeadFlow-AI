"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Copy, Check, Shield, User, Building, Mail } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.user) setUser(data.data.user);
        if (data?.data?.workspace) setWorkspace(data.data.workspace);
      })
      .catch(() => { });
  }, []);

  const webhookCallbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/zapier/status`
      : "https://your-domain.com/api/webhooks/zapier/status";

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookCallbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in max-w-4xl">
        {/* Header */}
        <div className="border-b border-[#ECE7DE] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
            Workspace & Account Settings
          </h1>
          <p className="text-xs text-[#5C5850] mt-1">
            Manage your Google authenticated profile, private workspace, and webhook integration endpoints
          </p>
        </div>

        {/* Google Account Profile Card */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-3">
            {!avatarError && (user?.avatarUrl || user?.avatar) ? (
              <img
                src={user.avatarUrl || user.avatar}
                alt={user.name || "User Avatar"}
                className="h-14 w-14 rounded-full border border-[#D9D2C4] object-cover shrink-0"
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-[#8D5B28] text-white flex items-center justify-center font-bold text-lg border border-[#E5C9A8] shadow-xs shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-[#1C1B18]">{user?.name || "Authenticated User"}</h2>
              <p className="text-xs text-[#5C5850] flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-[#8D5B28]" />
                <span>{user?.email || "harshpariya195@gmail.com"}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase bg-[#EEF7F2] text-[#246E47] border border-[#C6E7D2] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#246E47]"></span>
                  Google SSO Active
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase bg-[#F6EDE3] text-[#8D5B28] border border-[#E5C9A8]">
                  Role: {user?.role || "OWNER"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs border-t border-[#ECE7DE] pt-4">
            <div>
              <label className="text-[#8C867B] font-semibold">Display Name</label>
              <div className="font-semibold text-[#1C1B18] mt-1">
                {user?.name || "Harsh Pariya"}
              </div>
            </div>
            <div>
              <label className="text-[#8C867B] font-semibold">Google Account Email</label>
              <div className="font-semibold text-[#1C1B18] mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#8D5B28]" />
                {user?.email || "harshpariya195@gmail.com"}
              </div>
            </div>
            <div>
              <label className="text-[#8C867B] font-semibold">Private Workspace</label>
              <div className="font-semibold text-[#1C1B18] mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#8D5B28]" />
                {workspace?.name || user?.workspace?.name || "Personal Workspace"}
              </div>
            </div>
            <div>
              <label className="text-[#8C867B] font-semibold">Workspace Identifier</label>
              <div className="font-mono text-[11px] text-[#5C5850] mt-1 truncate">
                {workspace?.id || user?.workspace?.id || "ws_default"}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Multi-Tenant Isolation */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#8D5B28]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#5C5850]">
              Security & Workspace Data Isolation
            </h2>
          </div>
          <p className="text-xs text-[#5C5850] leading-relaxed">
            All CRM leads, companies, deals, tasks, and activity records in this workspace are strictly scoped to your private tenant identifier. Cross-tenant queries are blocked at both database index and authorization middleware layers.
          </p>
          <div className="text-[11px] text-[#8C867B] bg-[#FAF8F5] p-3 rounded-lg border border-[#ECE7DE]">
            Authentication is secured via Google OAuth 2.0 with session tokens encrypted in HTTP-only, SameSite cookies.
          </div>
        </div>

        {/* Webhooks Contract Card */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#5C5850]">
              Inbound Webhook Callback URL
            </h2>
            <p className="text-xs text-[#5C5850] mt-1">
              Provide this exact endpoint URL in your Zapier or external CRM workflow to report back execution status:
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookCallbackUrl}
              className="h-9 flex-1 rounded-lg border border-[#D9D2C4] bg-[#FAF8F5] px-3 font-mono text-xs text-[#1C1B18]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-9 px-3 text-xs border-[#D9D2C4]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-[#246E47]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy URL
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-[#FAF8F5] p-3 text-[11px] text-[#5C5850] border border-[#ECE7DE]">
            <strong>Authentication Header:</strong> Include <code>Authorization: Bearer &lt;ZAPIER_STATUS_WEBHOOK_SECRET&gt;</code> in your webhook step.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
