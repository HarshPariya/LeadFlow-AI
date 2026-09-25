"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Building2, Globe, Users, Briefcase, Mail, Phone } from "lucide-react";

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<{ company: any; leads: any[]; opportunities: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/companies/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.data) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!data?.company) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs">
          Company not found.{" "}
          <Link href="/companies" className="text-[#8D5B28] underline">
            Return to companies
          </Link>
        </div>
      </AppShell>
    );
  }

  const { company, leads, opportunities } = data;

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C5850] hover:text-[#1C1B18]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Companies
        </Link>

        {/* Company Header */}
        <div className="rounded-xl border border-[#ECE7DE] bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6EDE3] text-[#8D5B28] font-bold text-lg">
              {company.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1C1B18]">{company.name}</h1>
              <p className="text-xs text-[#5C5850] mt-0.5">
                {company.industry || "General Industry"} · {company.country || "Global"} · {company.size || "11-50"} employees
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column: Contacts & Deals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Associated Leads */}
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5850] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8D5B28]" />
              Associated Contacts ({leads.length})
            </h3>
            {leads.length === 0 ? (
              <p className="text-xs text-[#8C867B] italic">No contacts registered for this account.</p>
            ) : (
              <div className="divide-y divide-[#ECE7DE]">
                {leads.map((l) => (
                  <div key={l._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <Link href={`/leads/${l._id}`} className="font-semibold text-[#1C1B18] hover:underline">
                        {l.firstName} {l.lastName}
                      </Link>
                      <div className="text-[11px] text-[#8C867B]">{l.email}</div>
                    </div>
                    <span className="text-[11px] text-[#5C5850]">{l.jobTitle || l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Associated Deals */}
          <div className="rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C5850] mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#8D5B28]" />
              Commercial Opportunities ({opportunities.length})
            </h3>
            {opportunities.length === 0 ? (
              <p className="text-xs text-[#8C867B] italic">No deals created for this account.</p>
            ) : (
              <div className="divide-y divide-[#ECE7DE]">
                {opportunities.map((o) => (
                  <div key={o._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#1C1B18]">{o.name}</div>
                      <div className="text-[11px] text-[#8C867B]">Stage: {o.stage}</div>
                    </div>
                    <div className="text-right font-bold text-[#8D5B28]">
                      {formatCurrency(o.value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
