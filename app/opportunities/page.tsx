"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Briefcase,
  Plus,
  LayoutGrid,
  List,
  Search,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const STAGES = [
  "NEW",
  "QUALIFIED",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalOpportunities: 0, totalPipelineValue: 0, wonValue: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [mobileActiveStage, setMobileActiveStage] = useState<string>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    primaryContact: "",
    value: "",
    stage: "NEW",
    probability: 20,
    expectedCloseDate: "",
    owner: "Sales Team",
    notes: "",
  });

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search });
      const res = await fetch(`/api/opportunities?${q.toString()}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setOpportunities(data.data.opportunities || []);
        if (data.data.metrics) setMetrics(data.data.metrics);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleStageChange = async (oppId: string, newStage: string) => {
    try {
      await fetch(`/api/opportunities/${oppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      fetchOpportunities();
    } catch {
      // ignore
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: formData.value ? Number(formData.value) : 0,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          companyName: "",
          primaryContact: "",
          value: "",
          stage: "NEW",
          probability: 20,
          expectedCloseDate: "",
          owner: "Sales Team",
          notes: "",
        });
        fetchOpportunities();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE7DE] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1B18]">
              Deals & Opportunities Pipeline
            </h1>
            <p className="text-xs text-[#5C5850] mt-1">
              Track commercial deals across pipeline stages with Twenty CRM synchronization
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-[#D9D2C4] bg-[#FAF8F5] p-0.5 text-xs">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${viewMode === "kanban"
                  ? "bg-white text-[#8D5B28] shadow-2xs"
                  : "text-[#5C5850] hover:text-[#1C1B18]"
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${viewMode === "table"
                  ? "bg-white text-[#8D5B28] shadow-2xs"
                  : "text-[#5C5850] hover:text-[#1C1B18]"
                  }`}
              >
                <List className="w-3.5 h-3.5" />
                Table
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Pipeline Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5850]">
              Total Active Deals
            </span>
            <div className="text-2xl font-bold text-[#1C1B18] mt-1">
              {metrics.totalOpportunities}
            </div>
          </div>
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5850]">
              Total Pipeline Value
            </span>
            <div className="text-2xl font-bold text-[#8D5B28] mt-1">
              {formatCurrency(metrics.totalPipelineValue)}
            </div>
          </div>
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5850]">
              Closed Won Revenue
            </span>
            <div className="text-2xl font-bold text-[#246E47] mt-1">
              {formatCurrency(metrics.wonValue)}
            </div>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <EmptyState
            title="No opportunities in pipeline"
            description="Create your first commercial opportunity or qualify an inbound lead to generate one."
            actionLabel="Add Deal"
            onAction={() => setIsModalOpen(true)}
          />
        ) : viewMode === "kanban" ? (
          <div>
            {/* ── MOBILE VIEW: STAGE SELECTOR TABS & STACKED CARDS (<md) ── */}
            <div className="md:hidden space-y-4">
              <div className="overflow-x-auto pb-2 -mx-1 px-1 flex gap-1.5 scrollbar-none">
                <button
                  onClick={() => setMobileActiveStage("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${mobileActiveStage === "ALL"
                    ? "bg-[#8D5B28] text-white"
                    : "bg-white border border-[#D9D2C4] text-[#5C5850]"
                    }`}
                >
                  All Stages ({opportunities.length})
                </button>
                {STAGES.map((s) => {
                  const count = opportunities.filter((o) => o.stage === s).length;
                  return (
                    <button
                      key={s}
                      onClick={() => setMobileActiveStage(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${mobileActiveStage === s
                        ? "bg-[#8D5B28] text-white"
                        : "bg-white border border-[#D9D2C4] text-[#5C5850]"
                        }`}
                    >
                      {s} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Mobile Deal Cards */}
              <div className="space-y-3">
                {opportunities
                  .filter((o) => mobileActiveStage === "ALL" || o.stage === mobileActiveStage)
                  .map((opp) => (
                    <div
                      key={opp._id}
                      className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-[#1C1B18]">{opp.name}</div>
                          <div className="text-xs text-[#5C5850]">{opp.companyName}</div>
                        </div>
                        <span className="rounded-md bg-[#FAF8F5] border border-[#ECE7DE] px-2 py-0.5 text-[10px] font-bold text-[#8D5B28]">
                          {opp.stage}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#ECE7DE]">
                        <div>
                          <span className="text-[10px] uppercase text-[#8C867B]">Value</span>
                          <div className="font-bold text-sm text-[#8D5B28]">
                            {formatCurrency(opp.value)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-[#8C867B]">Probability</span>
                          <div className="text-xs font-semibold text-[#1C1B18]">
                            {opp.probability}% win
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#ECE7DE] flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#5C5850] truncate">
                          Owner: {opp.owner || "Sales Team"}
                        </span>
                        <select
                          value={opp.stage}
                          onChange={(e) => handleStageChange(opp._id, e.target.value)}
                          aria-label={`Move stage for ${opp.name}`}
                          className="text-[11px] rounded-lg border border-[#D9D2C4] bg-[#FAF8F5] py-1 px-2 text-[#1C1B18]"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              Move: {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* ── DESKTOP & TABLET VIEW: CLEAN HORIZONTAL SCROLL PIPELINE (md+) ── */}
            <div className="hidden md:flex gap-3.5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
              {STAGES.map((stage) => {
                const stageOpps = opportunities.filter((o) => o.stage === stage);
                const stageTotal = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);

                return (
                  <div
                    key={stage}
                    className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F5]/80 p-3 min-w-[260px] max-w-[280px] shrink-0 flex flex-col justify-between"
                  >
                    <div>
                      {/* Stage Header */}
                      <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#1C1B18]">{stage}</span>
                          <span className="rounded-full bg-[#EAE4D8] px-1.5 py-0.2 text-[10px] font-bold text-[#5C5850]">
                            {stageOpps.length}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#8D5B28]">
                          {formatCurrency(stageTotal)}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="space-y-2.5">
                        {stageOpps.map((opp) => (
                          <div
                            key={opp._id}
                            className="rounded-lg border border-[#ECE7DE] bg-white p-3 shadow-2xs hover:border-[#D9D2C4] transition-all space-y-2 text-xs"
                          >
                            <div className="font-bold text-[#1C1B18] line-clamp-2 leading-snug">
                              {opp.name}
                            </div>
                            <div className="text-[11px] text-[#5C5850] truncate">
                              {opp.companyName}
                            </div>
                            <div className="flex items-center justify-between font-bold text-[#8D5B28] text-sm pt-1 border-t border-[#ECE7DE]/50">
                              <span>{formatCurrency(opp.value)}</span>
                              <span className="text-[10px] text-[#8C867B] font-normal">
                                {opp.probability}% win
                              </span>
                            </div>

                            {/* Quick Stage Mover */}
                            <div className="pt-1">
                              <select
                                value={opp.stage}
                                onChange={(e) => handleStageChange(opp._id, e.target.value)}
                                aria-label={`Move stage for ${opp.name}`}
                                className="w-full text-[10px] rounded border border-[#ECE7DE] bg-[#FAF8F5] py-1 px-1.5 text-[#5C5850] cursor-pointer"
                              >
                                {STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    Move to {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="rounded-xl border border-[#ECE7DE] bg-white shadow-2xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECE7DE] bg-[#F3EFE7]/70 text-[#5C5850] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Deal Name</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Primary Contact</th>
                  <th className="py-3 px-3">Value (INR ₹)</th>
                  <th className="py-3 px-3">Stage</th>
                  <th className="py-3 px-3">Win Probability</th>
                  <th className="py-3 px-3">Close Date</th>
                  <th className="py-3 px-3">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7DE]">
                {opportunities.map((opp) => (
                  <tr key={opp._id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#1C1B18]">{opp.name}</td>
                    <td className="py-3 px-3 text-[#5C5850]">{opp.companyName}</td>
                    <td className="py-3 px-3 text-[#5C5850]">{opp.primaryContact}</td>
                    <td className="py-3 px-3 font-bold text-[#8D5B28]">{formatCurrency(opp.value)}</td>
                    <td className="py-3 px-3">
                      <select
                        value={opp.stage}
                        onChange={(e) => handleStageChange(opp._id, e.target.value)}
                        aria-label={`Move stage for ${opp.name}`}
                        className="rounded border border-[#D9D2C4] bg-white px-2 py-1 text-xs text-[#1C1B18]"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-[#5C5850]">{opp.probability}%</td>
                    <td className="py-3 px-3 text-[#8C867B]">{formatDate(opp.expectedCloseDate)}</td>
                    <td className="py-3 px-3 text-[#5C5850]">{opp.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Opportunity Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Commercial Opportunity"
          description="Opens a deal in LeadFlow pipeline and maps to Twenty CRM Opportunity object."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateOpportunity} className="space-y-4">
            <Input
              label="Opportunity Name *"
              required
              placeholder="Enterprise Routing Engine"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                required
                placeholder="Apex Logistics Global"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
              <Input
                label="Primary Contact *"
                required
                placeholder="Marcus Sterling"
                value={formData.primaryContact}
                onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Deal Value (INR ₹) *"
                type="number"
                required
                placeholder="75000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
              <Select
                label="Pipeline Stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                options={STAGES.map((s) => ({ label: s, value: s }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Win Probability (%)"
                type="number"
                min="0"
                max="100"
                placeholder="50"
                value={formData.probability.toString()}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) || 0 })}
              />
              <Input
                label="Expected Close Date"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
            </div>

            <Input
              label="Deal Owner"
              placeholder="Sales Representative / Team"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            />

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-[#ECE7DE]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="w-full sm:w-auto">
                Create Opportunity
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
