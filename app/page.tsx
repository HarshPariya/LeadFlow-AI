"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Workflow,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Database,
  Cpu,
  Boxes,
  ShieldCheck,
  Zap,
  Activity,
  BarChart3,
  Send,
  Users,
  Menu,
  X,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { label: "How It Works", href: "how-it-works" },
    { label: "Automation Flow", href: "workflow" },
    { label: "Integrations", href: "integrations" },
    { label: "Architecture", href: "architecture" },
    { label: "Security", href: "security" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F8F5] text-[#1C1B18] scroll-smooth">
      {/* 1. Responsive Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#ECE7DE] bg-[#FFFFFF]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8D5B28] text-white shadow-xs">
              <Workflow className="w-5 h-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#1C1B18]">
              LeadFlow AI
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#5C5850]">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={`#${item.href}`}
                onClick={(e) => scrollToSection(e, item.href)}
                className="hover:text-[#8D5B28] transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button variant="primary" size="sm">
                Continue with Google
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[#5C5850] hover:bg-[#F3EFE7] focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#ECE7DE] bg-white px-5 py-4 shadow-lg animate-fade-in">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={`#${item.href}`}
                  onClick={(e) => scrollToSection(e, item.href)}
                  className="flex items-center justify-between py-2 text-xs font-semibold text-[#5C5850] hover:text-[#8D5B28] border-b border-[#F3EFE7]"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C867B]" />
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Continue with Google
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-16 md:pt-20 md:pb-24 border-b border-[#ECE7DE]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9D2C4] bg-[#FFFFFF] px-3.5 py-1 text-xs font-semibold text-[#8D5B28] shadow-2xs mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Sales Operations & CRM Orchestration</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1C1B18] max-w-4xl mx-auto leading-tight">
            Intelligent CRM & Sales Automation
          </h1>

          <p className="mt-5 text-sm sm:text-base md:text-lg text-[#5C5850] max-w-2xl mx-auto leading-relaxed">
            Capture leads, qualify them with AI, synchronize CRM records, route
            high-priority opportunities, and automate follow-ups from one
            intelligent workflow platform.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
                Continue with Google
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, "how-it-works")}
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore How It Works
              </Button>
            </a>
          </div>

          {/* Interactive Pipeline Diagram Preview */}
          <div id="workflow" className="scroll-mt-24 mt-12 rounded-2xl border border-[#D9D2C4] bg-[#FFFFFF] p-5 sm:p-6 shadow-md text-left">
            <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E5DFCD]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E5DFCD]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E5DFCD]" />
                <span className="ml-2 text-xs font-medium text-[#8C867B]">
                  LeadFlow Canonical Lifecycle Engine
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#246E47] bg-[#EEF7F2] px-2 py-0.5 rounded">
                Pipeline Synchronized
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
              <div className="rounded-lg border border-[#ECE7DE] bg-[#FAF8F5] p-3">
                <div className="font-bold text-[#1C1B18]">1. Lead Inbound</div>
                <div className="text-[11px] text-[#5C5850] mt-1">Web Form / API</div>
              </div>
              <div className="rounded-lg border border-[#ECE7DE] bg-[#FAF8F5] p-3">
                <div className="font-bold text-[#1C1B18]">2. Deduplication</div>
                <div className="text-[11px] text-[#5C5850] mt-1">Email Normalizer</div>
              </div>
              <div className="rounded-lg border border-[#E5C9A8] bg-[#F6EDE3] p-3">
                <div className="font-bold text-[#8D5B28]">3. AI Scoring</div>
                <div className="text-[11px] text-[#8D5B28] mt-1">Groq Llama / Qwen</div>
              </div>
              <div className="rounded-lg border border-[#ECE7DE] bg-[#FAF8F5] p-3">
                <div className="font-bold text-[#1C1B18]">4. Twenty CRM</div>
                <div className="text-[11px] text-[#5C5850] mt-1">Person & Company</div>
              </div>
              <div className="rounded-lg border border-[#ECE7DE] bg-[#FAF8F5] p-3">
                <div className="font-bold text-[#1C1B18]">5. Zapier Flow</div>
                <div className="text-[11px] text-[#5C5850] mt-1">Cross-App Webhook</div>
              </div>
              <div className="rounded-lg border border-[#C6E7D2] bg-[#EEF7F2] p-3">
                <div className="font-bold text-[#246E47]">6. Multi-Channel</div>
                <div className="text-[11px] text-[#246E47] mt-1">Gmail Multi-Path Routing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Problem & Solution (How It Works) */}
      <section id="how-it-works" className="scroll-mt-24 py-16 md:py-20 border-b border-[#ECE7DE] bg-[#FFFFFF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8D5B28]">
              Automated Sales Operations
            </span>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#1C1B18]">
              How LeadFlow AI Replaces Manual Sales Tasks
            </h2>
            <p className="mt-2 text-xs md:text-sm text-[#5C5850]">
              From the instant a buyer submits a form to the CRM deal creation and Gmail alert.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* The Problem */}
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2]/40 p-6 sm:p-8">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B91C1C] mb-2">
                The Manual Bottleneck
              </div>
              <h3 className="text-xl font-bold text-[#1C1B18]">
                Manual Lead Qualification Slows Down High-Value Revenue
              </h3>
              <ul className="mt-5 space-y-3.5 text-xs text-[#5C5850]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#B91C1C] font-bold">✕</span>
                  <span>
                    Sales reps spend 4+ hours daily manually reading contact forms and copying details into CRMs.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#B91C1C] font-bold">✕</span>
                  <span>
                    Duplicate records pollute pipelines, creating conflicting sales conversations and missed deals.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#B91C1C] font-bold">✕</span>
                  <span>
                    High-priority ₹10,00,000+ enterprise inquiries wait hours before receiving a response, losing to fast competitors.
                  </span>
                </li>
              </ul>
            </div>

            {/* The Solution */}
            <div className="rounded-xl border border-[#C6E7D2] bg-[#EEF7F2]/50 p-6 sm:p-8">
              <div className="text-xs font-bold uppercase tracking-wider text-[#246E47] mb-2">
                The LeadFlow AI Solution
              </div>
              <h3 className="text-xl font-bold text-[#1C1B18]">
                Real-Time AI Intelligence with Automated CRM Sync
              </h3>
              <ul className="mt-5 space-y-3.5 text-xs text-[#2E2B25]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#246E47] shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant AI Scoring:</strong> Evaluates commercial budget, urgency, and decision-maker seniority within seconds.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#246E47] shrink-0 mt-0.5" />
                  <span>
                    <strong>Native Twenty CRM Sync:</strong> Idempotently creates or updates Person and Company records via REST adapters.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#246E47] shrink-0 mt-0.5" />
                  <span>
                    <strong>Intelligent Routing:</strong> Fires conditional Gmail alerts for high-priority leads and schedules automated CRM tasks.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Integrations Section */}
      <section id="integrations" className="scroll-mt-24 py-16 md:py-20 border-b border-[#ECE7DE] bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8D5B28]">
            Connected Ecosystem
          </span>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#1C1B18]">
            Enterprise Integration Grid
          </h2>
          <p className="mt-2 text-xs md:text-sm text-[#5C5850] max-w-xl mx-auto">
            Seamlessly linked to your modern stack with REST APIs and webhook listeners.
          </p>

          <div className="mt-10 grid sm:grid-cols-3 gap-6 text-left">
            <div className="rounded-xl border border-[#ECE7DE] bg-white p-6 shadow-xs hover:border-[#8D5B28] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDE3] text-[#8D5B28] font-bold">
                  AI
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1B18]">Groq Cloud AI</h3>
                  <span className="text-[11px] text-emerald-600 font-semibold">Live & Active</span>
                </div>
              </div>
              <p className="text-xs text-[#5C5850] leading-relaxed">
                Ultra-fast reasoning models score every inbound prospect on budget, authority, need, and timeline.
              </p>
            </div>

            <div className="rounded-xl border border-[#ECE7DE] bg-white p-6 shadow-xs hover:border-[#8D5B28] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF8F5] text-[#1C1B18] font-bold border border-[#ECE7DE]">
                  20
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1B18]">Twenty CRM</h3>
                  <span className="text-[11px] text-emerald-600 font-semibold">Live & Active</span>
                </div>
              </div>
              <p className="text-xs text-[#5C5850] leading-relaxed">
                Open-source CRM synchronization creating Persons, Companies, and Opportunities without manual data entry.
              </p>
            </div>

            <div className="rounded-xl border border-[#ECE7DE] bg-white p-6 shadow-xs hover:border-[#8D5B28] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2EB] text-[#FF4F00] font-bold">
                  _
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1B18]">Zapier Automation</h3>
                  <span className="text-[11px] text-emerald-600 font-semibold">Live & Active</span>
                </div>
              </div>
              <p className="text-xs text-[#5C5850] leading-relaxed">
                Catch hook webhooks dispatch lead payloads to conditional Zapier Paths, Gmail outreach, and custom operational flows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. End-To-End Architecture Section */}
      <section id="architecture" className="scroll-mt-24 py-16 md:py-20 border-b border-[#ECE7DE] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8D5B28]">
            Full-Stack Technology
          </span>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#1C1B18]">
            Engineered For Scale and Reliability
          </h2>
          <p className="mt-2 text-xs md:text-sm text-[#5C5850] max-w-xl mx-auto">
            A production-ready stack combining MongoDB Atlas with Next.js 15 App Router.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F5] p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDE3] text-[#8D5B28] mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1B18]">1. Lead Capture & DB</h3>
              <p className="mt-2 text-xs text-[#5C5850] leading-relaxed">
                Structured Next.js API captures incoming prospects, normalizes emails, and enforces duplicate prevention in MongoDB.
              </p>
            </div>

            <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F5] p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDE3] text-[#8D5B28] mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1B18]">2. Groq AI Qualification</h3>
              <p className="mt-2 text-xs text-[#5C5850] leading-relaxed">
                Server-side AI models analyze requirements, generate structured 0-100 scores, and provide sales recommendations.
              </p>
            </div>

            <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F5] p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDE3] text-[#8D5B28] mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1B18]">3. Twenty CRM Adapter</h3>
              <p className="mt-2 text-xs text-[#5C5850] leading-relaxed">
                Synchronizes internal leads into Twenty Persons, Companies, and Opportunities with verified idempotent REST mappings.
              </p>
            </div>

            <div className="rounded-xl border border-[#ECE7DE] bg-[#FAF8F5] p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F6EDE3] text-[#8D5B28] mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1B18]">4. Zapier Webhooks</h3>
              <p className="mt-2 text-xs text-[#5C5850] leading-relaxed">
                Dispatches outbound event payloads and listens for authenticated status callbacks with replay protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Security Section */}
      <section id="security" className="scroll-mt-24 py-16 md:py-20 border-b border-[#ECE7DE] bg-[#FAF8F5]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center gap-8 rounded-2xl border border-[#D9D2C4] bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F6EDE3] text-[#8D5B28]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1C1B18]">
                Enterprise Security & Webhook Hardening
              </h3>
              <p className="mt-2 text-xs text-[#5C5850] leading-relaxed">
                LeadFlow AI protects every inbound and outbound interface. All Zapier status callbacks require Bearer secret headers, unique event IDs prevent replay attacks, rate limiting guards endpoints, and passwords are encrypted with 12-round bcrypt salt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action (CTA) */}
      <section className="py-16 md:py-20 text-center bg-white border-t border-[#ECE7DE]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1C1B18] md:text-4xl">
            Ready to Automate Your Sales Pipeline?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#5C5850] max-w-xl mx-auto">
            Capture leads, qualify them with AI, synchronize CRM records, and automate follow-ups from one secure workspace.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
                Continue with Google
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-[#ECE7DE] bg-[#FAF8F5] py-8 text-xs text-[#8C867B]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-[#8D5B28]" />
            <span className="font-bold text-[#1C1B18]">LeadFlow AI</span>
            <span>— Intelligent CRM & Sales Automation Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#1C1B18] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#1C1B18] transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-[#1C1B18] transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
