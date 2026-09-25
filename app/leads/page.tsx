"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { ScoreBadge } from "@/components/ui/score-badge";
import {
  LeadStatusBadge,
  PriorityBadge,
  AutomationStatusBadge,
} from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Trash2,
  Users,
  CheckCircle,
} from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [source, setSource] = useState("ALL");

  // Lead creation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    source: "website",
    requirement: "",
    budget: "",
    timeline: "30 days",
    industry: "",
    country: "",
    notes: "",
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
        status,
        priority,
        source,
      });

      const res = await fetch(`/api/leads?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setLeads(data.data.leads || []);
        setTotal(data.data.pagination?.total || 0);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, status, priority, source]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? Number(formData.budget) : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to create lead");
      }

      const createdLead = data?.data?.lead;
      if (createdLead) {
        // Instantly prepend to leads state so it appears immediately on the page
        setLeads((prev) => [createdLead, ...prev.filter((l) => l._id !== createdLead._id)]);
        setTotal((prev) => prev + 1);
      }

      setIsModalOpen(false);
      // Reset active filters so new lead is not filtered out
      setStatus("ALL");
      setPriority("ALL");
      setSource("ALL");
      setSearch("");
      setPage(1);

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        source: "website",
        requirement: "",
        budget: "",
        timeline: "30 days",
        industry: "",
        country: "",
        notes: "",
      });

      // Synchronize in background
      fetchLeads();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error creating lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncTwenty = async (leadId: string) => {
    try {
      await fetch(`/api/leads/${leadId}/sync`, { method: "POST" });
      fetchLeads();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to archive this lead?")) return;
    try {
      await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      fetchLeads();
    } catch {
      // ignore
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE7DE] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
              Inbound Leads Management
            </h1>
            <p className="text-xs text-[#5C5850] mt-1">
              Capture, qualify with AI, synchronize CRM records, and trigger Zapier workflows
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register Inbound Prospect
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[#8C867B]" />
              <input
                type="text"
                placeholder="Search by name, email, company, or requirement..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#D9D2C4] bg-[#FAF8F5] pl-8 pr-3 text-xs text-[#1C1B18] placeholder:text-[#8C867B] focus-ring focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-[#D9D2C4] bg-white px-3 text-xs text-[#1C1B18] focus-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="QUALIFYING">Qualifying</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="CONTACTED">Contacted</option>
                <option value="MEETING_BOOKED">Meeting Booked</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>

              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-[#D9D2C4] bg-white px-3 text-xs text-[#1C1B18] focus-ring"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-[#D9D2C4] bg-white px-3 text-xs text-[#1C1B18] focus-ring"
              >
                <option value="ALL">All Sources</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="google_ad">Google Ad</option>
                <option value="linkedin">LinkedIn</option>
              </select>

              <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
                Filter
              </Button>
            </div>
          </form>
        </div>

        {/* Data Table / Card List */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <EmptyState
              title="No leads found"
              description="No leads match your current criteria. Register your first lead to begin the AI qualification and CRM automation pipeline."
              actionLabel="Register Inbound Prospect"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <>
              {/* ── DESKTOP TABLE (md+) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#ECE7DE] bg-[#F3EFE7]/70 text-[#5C5850] font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Name / Contact</th>
                      <th className="py-3 px-3">Company</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Priority</th>
                      <th className="py-3 px-3">AI Score</th>
                      <th className="py-3 px-3">Source</th>
                      <th className="py-3 px-3">Twenty CRM</th>
                      <th className="py-3 px-3">Zapier Sync</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE7DE]">
                    {leads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#1C1B18]">
                          <Link
                            href={`/leads/${lead._id}`}
                            className="hover:text-[#8D5B28] hover:underline"
                          >
                            {lead.firstName} {lead.lastName}
                          </Link>
                          <div className="text-[11px] text-[#8C867B] font-normal truncate max-w-[180px]">
                            {lead.email}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#5C5850]">
                          {lead.company || "Independent"}
                          {lead.jobTitle && (
                            <div className="text-[10px] text-[#8C867B]">{lead.jobTitle}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <LeadStatusBadge status={lead.status} />
                        </td>
                        <td className="py-3 px-3">
                          <PriorityBadge priority={lead.priority} />
                        </td>
                        <td className="py-3 px-3">
                          <ScoreBadge score={lead.aiScore} size="sm" />
                        </td>
                        <td className="py-3 px-3 capitalize text-[#5C5850]">
                          {lead.source?.replace("_", " ")}
                        </td>
                        <td className="py-3 px-3">
                          {lead.twentyPersonId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#246E47]">
                              <CheckCircle className="w-3 h-3" />
                              Synced
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSyncTwenty(lead._id)}
                              className="text-[11px] font-semibold text-[#8D5B28] hover:underline cursor-pointer"
                            >
                              Sync Now
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <AutomationStatusBadge status={lead.automationStatus} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/leads/${lead._id}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                View
                              </Button>
                            </Link>
                            <button
                              onClick={() => handleDelete(lead._id)}
                              className="p-1.5 text-[#8C867B] hover:text-[#B91C1C] rounded transition-colors focus-ring cursor-pointer"
                              title="Archive lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── MOBILE CARD LIST (< md) ── */}
              <div className="md:hidden divide-y divide-[#ECE7DE]">
                {leads.map((lead) => (
                  <div key={lead._id} className="p-4 hover:bg-[#FAF8F5] transition-colors">
                    {/* Row 1: Name + Actions */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <Link
                          href={`/leads/${lead._id}`}
                          className="text-sm font-semibold text-[#1C1B18] hover:text-[#8D5B28] hover:underline block truncate"
                        >
                          {lead.firstName} {lead.lastName}
                        </Link>
                        <div className="text-xs text-[#8C867B] truncate">{lead.email}</div>
                        {lead.company && (
                          <div className="text-xs text-[#5C5850] mt-0.5 truncate">
                            {lead.company}{lead.jobTitle ? ` · ${lead.jobTitle}` : ""}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href={`/leads/${lead._id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                            View
                          </Button>
                        </Link>
                        <button
                          onClick={() => handleDelete(lead._id)}
                          className="p-1.5 text-[#8C867B] hover:text-[#B91C1C] rounded transition-colors cursor-pointer"
                          title="Archive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Row 2: Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <LeadStatusBadge status={lead.status} />
                      <PriorityBadge priority={lead.priority} />
                      <ScoreBadge score={lead.aiScore} size="sm" />
                      <AutomationStatusBadge status={lead.automationStatus} />
                      {!lead.twentyPersonId && (
                        <button
                          onClick={() => handleSyncTwenty(lead._id)}
                          className="text-[11px] font-semibold text-[#8D5B28] underline underline-offset-2 cursor-pointer"
                        >
                          Sync CRM
                        </button>
                      )}
                      {lead.twentyPersonId && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#246E47]">
                          <CheckCircle className="w-3 h-3" /> CRM Synced
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={15}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </>
          )}
        </div>

        {/* Create Lead Modal Dialog */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register Inbound Prospect"
          description="Enters LeadFlow's automated pipeline: validation, AI scoring, CRM sync, and Zapier routing."
          maxWidth="xl"
        >
          {formError && (
            <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C]">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateLead} className="space-y-5">
            {/* SECTION 1: CONTACT */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#8D5B28] border-b border-[#ECE7DE] pb-1">
                Contact
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="First Name *"
                  required
                  placeholder="Rahul"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <Input
                  label="Last Name *"
                  required
                  placeholder="Sharma"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Work Email *"
                  type="email"
                  required
                  placeholder="rahul@abctech.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* SECTION 2: COMPANY */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#8D5B28] border-b border-[#ECE7DE] pb-1">
                Company
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Company"
                  placeholder="ABC Technologies"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
                <Input
                  label="Job Title"
                  placeholder="VP of Engineering"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Industry"
                  placeholder="SaaS / FinTech / Healthcare"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
                <Input
                  label="Country"
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            {/* SECTION 3: REQUIREMENT */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#8D5B28] border-b border-[#ECE7DE] pb-1">
                Requirement
              </div>
              <Textarea
                label="Requirement / Project Need *"
                required
                placeholder="Describe the prospect's requirements, automation scope, integrations needed..."
                rows={3}
                value={formData.requirement}
                onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Budget (INR ₹)"
                  type="number"
                  placeholder="50000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
                <Input
                  label="Timeline"
                  placeholder="30 days / ASAP"
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                />
              </div>
            </div>

            {/* SECTION 4: SOURCE */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#8D5B28] border-b border-[#ECE7DE] pb-1">
                Source
              </div>
              <Select
                label="Lead Source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                options={[
                  { label: "Website Form", value: "website" },
                  { label: "Partner Referral", value: "referral" },
                  { label: "Google Ad Campaign", value: "google_ad" },
                  { label: "LinkedIn Inbound", value: "linkedin" },
                ]}
              />
            </div>

            {/* SECTION 5: NOTES */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#8D5B28] border-b border-[#ECE7DE] pb-1">
                Notes
              </div>
              <Textarea
                label="Additional Notes"
                rows={2}
                placeholder="Any special handling notes, context, or sales rep tags..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Responsive Actions Footer */}
            <div className="sticky bottom-0 bg-white pt-4 pb-1 border-t border-[#ECE7DE] flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
              >
                Create Lead
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
