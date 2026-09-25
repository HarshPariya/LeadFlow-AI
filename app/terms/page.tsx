import React from "react";
import Link from "next/link";
import { ArrowLeft, Workflow } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1C1B18] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8D5B28] mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Homepage
        </Link>

        <div className="rounded-xl border border-[#ECE7DE] bg-white p-8 md:p-12 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8D5B28] text-white">
              <Workflow className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-[#1C1B18]">Terms of Service</h1>
          </div>

          <div className="space-y-4 text-xs text-[#5C5850] leading-relaxed">
            <p>
              Last Updated: <strong>September 2026</strong>
            </p>
            <p>
              By accessing or using LeadFlow AI, you agree to comply with and be bound by these Terms of Service.
            </p>

            <h2 className="text-sm font-bold text-[#1C1B18] pt-3">1. Use of Services</h2>
            <p>
              You agree to use LeadFlow AI solely for legitimate B2B CRM and sales automation activities. You may not dispatch unsolicited spam, illegal payloads, or attempt unauthorized penetration testing.
            </p>

            <h2 className="text-sm font-bold text-[#1C1B18] pt-3">2. API & Webhook Usage</h2>
            <p>
              Outbound webhooks to Zapier and inbound status callbacks are subject to rate limiting and authentication verification.
            </p>

            <h2 className="text-sm font-bold text-[#1C1B18] pt-3">3. External Integrations</h2>
            <p>
              Connections to third-party services like Twenty CRM and Zapier depend on valid credentials supplied by the tenant administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
