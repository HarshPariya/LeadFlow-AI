import React from "react";
import Link from "next/link";
import { ArrowLeft, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
            <h1 className="text-2xl font-bold text-[#1C1B18]">Privacy Policy</h1>
          </div>

          <div className="space-y-4 text-xs text-[#5C5850] leading-relaxed">
            <p>
              Last Updated: <strong>September 2026</strong>
            </p>
            <p>
              LeadFlow AI (“Platform”, “we”, “our”) provides intelligent CRM and sales automation infrastructure. This Privacy Policy details how prospect data, CRM synchronization records, and audit events are captured, processed, and secured.
            </p>

            <h2 className="text-sm font-bold text-[#1C1B18] pt-3">1. Information We Collect</h2>
            <p>
              We collect prospect contact details (names, verified emails, phone numbers, job titles), company metadata, and stated project requirements submitted through web forms or API endpoints.
            </p>

            <h2 className="text-sm font-bold text-[#1C1B18] pt-3">2. Processing & AI Qualification</h2>
            <p>
              Lead data is analyzed server-side via Groq AI (Llama 3.3) solely for generating commercial scoring and sales routing recommendations. Sensitive internal API keys and webhook secrets are strictly redacted from diagnostic logs.
            </p>

            <h2 className="text-sm font-bold text-[#1C1B18] pt-3">3. External Synchronizations</h2>
            <p>
              When enabled, prospect records are synchronized with Twenty CRM and Zapier via authenticated REST and webhook protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
