"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Users,
  Briefcase,
  Globe,
} from "lucide-react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    size: "11-50",
    country: "",
    contactEmail: "",
    phone: "",
    notes: "",
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, industry });
      const res = await fetch(`/api/companies?${q.toString()}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setCompanies(data.data.companies || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [industry]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          website: "",
          industry: "",
          size: "11-50",
          country: "",
          contactEmail: "",
          phone: "",
          notes: "",
        });
        fetchCompanies();
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
              Companies & Accounts
            </h1>
            <p className="text-xs text-[#5C5850] mt-1">
              Organization accounts synchronized with Twenty CRM
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Company
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white p-4 shadow-2xs">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[#8C867B]" />
              <input
                type="text"
                placeholder="Search companies by name or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#D9D2C4] bg-[#FAF8F5] pl-8 pr-3 text-xs text-[#1C1B18] placeholder:text-[#8C867B] focus-ring focus:bg-white transition-all"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
              Search
            </Button>
          </form>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            title="No companies found"
            description="Add your first company account or seed the demo CRM database."
            actionLabel="Add Company"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((comp) => (
              <div
                key={comp._id}
                className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs hover:border-[#D9D2C4] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDE3] text-[#8D5B28] font-bold text-sm">
                        {comp.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/companies/${comp._id}`}
                          className="font-bold text-sm text-[#1C1B18] hover:text-[#8D5B28] hover:underline"
                        >
                          {comp.name}
                        </Link>
                        <div className="text-[11px] text-[#8C867B]">
                          {comp.industry || "General Industry"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-[#5C5850]">
                    {comp.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#8C867B]" />
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8D5B28] hover:underline truncate"
                        >
                          {comp.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span>Size: {comp.size || "11-50"} employees</span>
                      <span>{comp.country || "Global"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#ECE7DE] pt-3 flex items-center justify-between text-xs text-[#5C5850]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-[#1C1B18]">
                      <Users className="w-3 h-3 text-[#8D5B28]" />
                      {comp.leadCount || 0} Leads
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[#1C1B18]">
                      <Briefcase className="w-3 h-3 text-[#8D5B28]" />
                      {comp.oppCount || 0} Deals
                    </span>
                  </div>

                  <Link
                    href={`/companies/${comp._id}`}
                    className="text-[11px] font-semibold text-[#8D5B28] hover:underline"
                  >
                    View Account →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Company Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Company"
          description="Registers an organization account and prepares Twenty CRM synchronization."
        >
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <Input
              label="Company Name *"
              required
              placeholder="Acme Corp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Website URL"
              type="url"
              placeholder="https://acmecorp.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Industry"
                placeholder="Technology"
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

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-[#ECE7DE]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="w-full sm:w-auto">
                Save Company
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
