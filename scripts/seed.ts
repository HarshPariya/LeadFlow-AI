import dns from "node:dns";
import path from "node:path";
import fs from "node:fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Company } from "../models/Company";
import { Lead } from "../models/Lead";
import { Opportunity } from "../models/Opportunity";
import { Task } from "../models/Task";
import { ActivityLog } from "../models/ActivityLog";
import { AutomationRun } from "../models/AutomationRun";

// Ensure DNS resolves MongoDB Atlas SRV records reliably on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in restricted environments
}

// Automatically load .env.local or .env if process.env.MONGODB_URI is not set
function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.resolve(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}
loadLocalEnv();

let rawUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/leadflow-ai";
// Ensure database name is included for MongoDB Atlas URI
if (rawUri.startsWith("mongodb+srv://") && !rawUri.includes(".mongodb.net/")) {
  rawUri = rawUri.replace(".mongodb.net", ".mongodb.net/leadflow-ai?retryWrites=true&w=majority");
}
const MONGODB_URI = rawUri;

export async function runSeed() {
  console.log("🌱 Starting LeadFlow AI Seed Script...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Lead.deleteMany({}),
    Opportunity.deleteMany({}),
    Task.deleteMany({}),
    ActivityLog.deleteMany({}),
    AutomationRun.deleteMany({}),
  ]);
  console.log("Cleared existing data.");

  // 1. Seed Users (Demo Owner & Sales Admin)
  const passwordHash = await bcrypt.hash("LeadFlowDemo2026!", 12);
  const adminUser = await User.create({
    name: "Alex Vance",
    email: "admin@leadflow.ai",
    passwordHash,
    role: "OWNER",
  });
  const salesUser = await User.create({
    name: "Elena Rostova",
    email: "elena@leadflow.ai",
    passwordHash,
    role: "ADMIN",
  });
  console.log("✓ Seeded 2 Users (admin@leadflow.ai / LeadFlowDemo2026!)");

  // 2. Seed 3 Companies
  const companies = await Company.create([
    {
      name: "Apex Logistics Global",
      website: "https://apexlogistics.io",
      industry: "Supply Chain & Logistics",
      size: "201-500",
      country: "United States",
      contactEmail: "ops@apexlogistics.io",
      phone: "+1 (415) 890-1122",
      owner: "Alex Vance",
      twentyCompanyId: "twenty_comp_apex_demo",
    },
    {
      name: "Synthetix Health AI",
      website: "https://synthetixhealth.com",
      industry: "Healthcare & MedTech",
      size: "51-200",
      country: "Canada",
      contactEmail: "contact@synthetixhealth.com",
      phone: "+1 (647) 555-0199",
      owner: "Elena Rostova",
      twentyCompanyId: "twenty_comp_synthetix_demo",
    },
    {
      name: "Nordic Commerce Group",
      website: "https://nordiccommerce.se",
      industry: "E-Commerce & Retail",
      size: "500+",
      country: "Sweden",
      contactEmail: "procurement@nordiccommerce.se",
      phone: "+46 8 123 4567",
      owner: "Alex Vance",
      twentyCompanyId: "twenty_comp_nordic_demo",
    },
  ]);
  console.log("✓ Seeded 3 Companies");

  // 3. Seed 8 Leads
  const leadsData = [
    {
      firstName: "Marcus",
      lastName: "Sterling",
      email: "marcus.sterling@apexlogistics.io",
      phone: "+1 (415) 890-1122",
      company: "Apex Logistics Global",
      companyId: companies[0]._id,
      jobTitle: "VP of Global Operations",
      source: "website",
      requirement:
        "We handle 40,000 international shipments monthly. Need automated CRM routing to synchronize carrier status, qualify high-value freight leads, and trigger Gmail notifications to regional brokers.",
      budget: 120000,
      timeline: "30 days (ASAP)",
      industry: "Supply Chain & Logistics",
      country: "United States",
      status: "QUALIFIED" as const,
      priority: "HIGH" as const,
      aiScore: 94,
      aiCategory: "Enterprise Logistics CRM & Sales Automation",
      aiSummary:
        "Marcus Sterling is an executive operations leader seeking complete CRM synchronization and automated broker routing for high-volume freight contracts.",
      aiReasoning:
        "High budget ($120k), immediate 30-day timeline, clear executive decision maker, and mission-critical automation need.",
      aiRecommendedAction: "Conduct executive technical architecture review and map freight dispatch webhooks.",
      aiSignals: ["High enterprise budget ($120k)", "Urgent 30-day deployment", "Executive decision maker (VP)"],
      aiModel: "llama-3.3-70b-versatile",
      aiQualifiedAt: new Date(Date.now() - 3600000 * 2),
      twentyPersonId: "twenty_person_marcus_demo",
      twentyCompanyId: "twenty_comp_apex_demo",
      syncStatus: "SYNCED" as const,
      automationStatus: "SUCCESS" as const,
      owner: "Alex Vance",
    },
    {
      firstName: "Dr. Evelyn",
      lastName: "Chen",
      email: "evelyn.chen@synthetixhealth.com",
      phone: "+1 (647) 555-0199",
      company: "Synthetix Health AI",
      companyId: companies[1]._id,
      jobTitle: "Chief Technology Officer",
      source: "referral",
      requirement:
        "Developing clinical workflow AI. Need automated lead intake from hospital pilot programs directly into Twenty CRM with strict HIPAA compliance considerations.",
      budget: 85000,
      timeline: "60 days",
      industry: "Healthcare & MedTech",
      country: "Canada",
      status: "MEETING_BOOKED" as const,
      priority: "HIGH" as const,
      aiScore: 89,
      aiCategory: "Healthcare AI & Clinical Pipeline",
      aiSummary:
        "CTO Dr. Evelyn Chen requires automated hospital pilot lead intake synchronized to CRM with enterprise compliance.",
      aiReasoning:
        "Strong commercial budget ($85k), verified technical fit, and urgent expansion across hospital networks.",
      aiRecommendedAction: "Host technical deep-dive regarding Zapier webhooks and Twenty CRM data schema.",
      aiSignals: ["Executive buyer (CTO)", "Significant budget ($85k)", "High-intent referral"],
      aiModel: "llama-3.3-70b-versatile",
      aiQualifiedAt: new Date(Date.now() - 3600000 * 5),
      twentyPersonId: "twenty_person_evelyn_demo",
      twentyCompanyId: "twenty_comp_synthetix_demo",
      syncStatus: "SYNCED" as const,
      automationStatus: "SUCCESS" as const,
      owner: "Elena Rostova",
    },
    {
      firstName: "Henrik",
      lastName: "Lindqvist",
      email: "henrik.l@nordiccommerce.se",
      phone: "+46 8 123 4567",
      company: "Nordic Commerce Group",
      companyId: companies[2]._id,
      jobTitle: "Head of Omnichannel Sales",
      source: "website",
      requirement:
        "Seeking to automate supplier onboarding and B2B vendor inquiries. Want leads from our partner portal to automatically flow into Twenty CRM with score-based routing.",
      budget: 65000,
      timeline: "45 days",
      industry: "E-Commerce & Retail",
      country: "Sweden",
      status: "PROPOSAL" as const,
      priority: "HIGH" as const,
      aiScore: 86,
      aiCategory: "B2B E-Commerce Automation",
      aiSummary:
        "Henrik Lindqvist leads European omnichannel sales aiming to automate supplier intake and dealer partner onboarding.",
      aiReasoning:
        "Commercial budget ($65k), established international enterprise, and clear integration architecture.",
      aiRecommendedAction: "Send customized solution proposal with Zapier webhook contract.",
      aiSignals: ["Clear operational scope", "Commercial budget ($65k)", "Enterprise scale (500+ employees)"],
      aiModel: "llama-3.3-70b-versatile",
      aiQualifiedAt: new Date(Date.now() - 3600000 * 8),
      twentyPersonId: "twenty_person_henrik_demo",
      twentyCompanyId: "twenty_comp_nordic_demo",
      syncStatus: "SYNCED" as const,
      automationStatus: "SUCCESS" as const,
      owner: "Alex Vance",
    },
    {
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "sarah.j@cloudscale.io",
      phone: "+1 (206) 555-0144",
      company: "CloudScale Systems",
      jobTitle: "Director of Demand Generation",
      source: "google_ad",
      requirement:
        "Need a reliable Zapier trigger that captures website demo form fills, qualifies with AI, and notifies our sales Gmail inbox within 30 seconds.",
      budget: 35000,
      timeline: "Immediately",
      industry: "SaaS & Cloud Infrastructure",
      country: "United States",
      status: "CONTACTED" as const,
      priority: "MEDIUM" as const,
      aiScore: 74,
      aiCategory: "Mid-Market Sales Pipeline Automation",
      aiSummary:
        "Sarah Jenkins is focused on sub-minute lead response times using AI qualification and Gmail notifications.",
      aiReasoning:
        "Moderate budget ($35k), high urgency for inbound speed to lead, Director-level sponsor.",
      aiRecommendedAction: "Demonstrate live webhook test and instant Gmail notification latency.",
      aiSignals: ["Speed-to-lead focus", "Moderate budget ($35k)", "Urgent implementation"],
      aiModel: "llama-3.3-70b-versatile",
      aiQualifiedAt: new Date(Date.now() - 3600000 * 12),
      syncStatus: "SYNCED" as const,
      automationStatus: "SUCCESS" as const,
      owner: "Elena Rostova",
    },
    {
      firstName: "Carlos",
      lastName: "Mendez",
      email: "carlos@mendezlegal.com",
      phone: "+1 (305) 555-0812",
      company: "Mendez & Partners Legal",
      jobTitle: "Managing Partner",
      source: "website",
      requirement:
        "Looking to screen incoming client case inquiries. High value commercial litigation cases should go directly to partners, others to paralegals.",
      budget: 25000,
      timeline: "60 days",
      industry: "Legal Services",
      country: "United States",
      status: "QUALIFYING" as const,
      priority: "MEDIUM" as const,
      aiScore: 68,
      aiCategory: "Professional Services Intake",
      aiSummary:
        "Managing partner seeks case value screening and partner routing for litigation inquiries.",
      aiReasoning:
        "Solid business intent, boutique law firm budget ($25k), clear routing requirements.",
      aiRecommendedAction: "Provide intake criteria demo and case qualification workflow preview.",
      aiSignals: ["Partner buyer", "Clear routing rules", "Standard boutique budget"],
      aiModel: "llama-3.3-70b-versatile",
      aiQualifiedAt: new Date(Date.now() - 3600000 * 16),
      syncStatus: "SYNCED" as const,
      automationStatus: "SUCCESS" as const,
      owner: "Alex Vance",
    },
    {
      firstName: "Devon",
      lastName: "Rishi",
      email: "devon@hyperfin.tech",
      company: "HyperFin Capital",
      jobTitle: "Growth Lead",
      source: "linkedin",
      requirement:
        "Evaluating CRM tools for a team of 8 SDRs. Need automated scoring to identify Series A startups applying for venture debt.",
      budget: 18000,
      timeline: "90 days",
      industry: "Fintech & Venture Capital",
      country: "United Kingdom",
      status: "NEW" as const,
      priority: "MEDIUM" as const,
      aiScore: 58,
      aiCategory: "Fintech SDR Automation",
      aiSummary:
        "Devon Rishi is exploring automated scoring solutions for venture debt applicant qualification.",
      aiReasoning:
        "Early exploration stage, 90-day purchase horizon, reasonable startup budget.",
      aiRecommendedAction: "Enroll in nurture email sequence and invite to quarterly product webinar.",
      aiSignals: ["Startup stage", "Evaluation phase", "Small team scope"],
      aiModel: "llama-3.3-70b-versatile",
      aiQualifiedAt: new Date(Date.now() - 3600000 * 20),
      syncStatus: "NOT_SYNCED" as const,
      automationStatus: "PENDING" as const,
      owner: "Elena Rostova",
    },
    {
      firstName: "Amina",
      lastName: "Diallo",
      email: "amina@solardesign.co",
      company: "SolarDesign Studio",
      jobTitle: "Founder",
      source: "website",
      requirement:
        "Freelance architectural studio receiving 5 inquiries a week. Need simple email response automation.",
      budget: 3500,
      timeline: "Whenever convenient",
      industry: "Architecture & Design",
      country: "France",
      status: "NURTURING" as const,
      priority: "LOW" as const,
      aiScore: 32,
      aiCategory: "SMB Micro-Business",
      aiSummary: "Independent architect seeking basic inquiry autoresponder.",
      aiReasoning: "Low budget ($3.5k), low inquiry volume, non-enterprise scope.",
      aiRecommendedAction: "Provide standard self-service setup guide and docs.",
      aiSignals: ["Low budget (<$5k)", "Low volume", "No enterprise requirement"],
      aiModel: "llama-3.3-70b-versatile",
      aiQualifiedAt: new Date(Date.now() - 3600000 * 24),
      syncStatus: "NOT_SYNCED" as const,
      automationStatus: "SUCCESS" as const,
      owner: "Unassigned",
    },
    {
      firstName: "Kevin",
      lastName: "Zhao",
      email: "kevin.zhao.test@gmail.com",
      company: "Personal Project",
      jobTitle: "Student / Developer",
      source: "website",
      requirement: "Testing how the AI qualification behaves for a university coursework project.",
      budget: 0,
      timeline: "None",
      industry: "Education",
      country: "United States",
      status: "LOST" as const,
      priority: "LOW" as const,
      aiScore: 12,
      aiCategory: "Non-Commercial / Student Test",
      aiSummary: "Student inquiry exploring AI scoring behavior for coursework.",
      aiReasoning: "Zero budget, non-commercial intent, academic trial.",
      aiRecommendedAction: "Archive lead and exclude from commercial pipeline reporting.",
      aiSignals: ["Zero budget", "Non-commercial intent", "Academic testing"],
      aiModel: "llama-3.3-70b-versatile",
      aiQualifiedAt: new Date(Date.now() - 3600000 * 28),
      syncStatus: "NOT_SYNCED" as const,
      automationStatus: "SUCCESS" as const,
      owner: "Unassigned",
    },
  ];

  const leads = await Lead.create(leadsData);
  console.log(`✓ Seeded ${leads.length} Leads`);

  // 4. Seed 5 Opportunities
  const opportunities = await Opportunity.create([
    {
      name: "Apex Logistics — Global Freight Routing Engine",
      companyName: "Apex Logistics Global",
      companyId: companies[0]._id,
      leadId: leads[0]._id,
      primaryContact: "Marcus Sterling",
      value: 120000,
      stage: "PROPOSAL",
      probability: 75,
      expectedCloseDate: new Date(Date.now() + 25 * 86400000),
      owner: "Alex Vance",
      twentyOpportunityId: "twenty_opp_apex_demo",
    },
    {
      name: "Synthetix Health — Hospital Pilot Intake System",
      companyName: "Synthetix Health AI",
      companyId: companies[1]._id,
      leadId: leads[1]._id,
      primaryContact: "Dr. Evelyn Chen",
      value: 85000,
      stage: "DISCOVERY",
      probability: 50,
      expectedCloseDate: new Date(Date.now() + 45 * 86400000),
      owner: "Elena Rostova",
      twentyOpportunityId: "twenty_opp_synthetix_demo",
    },
    {
      name: "Nordic Commerce — Supplier B2B Intake Hub",
      companyName: "Nordic Commerce Group",
      companyId: companies[2]._id,
      leadId: leads[2]._id,
      primaryContact: "Henrik Lindqvist",
      value: 65000,
      stage: "NEGOTIATION",
      probability: 85,
      expectedCloseDate: new Date(Date.now() + 15 * 86400000),
      owner: "Alex Vance",
      twentyOpportunityId: "twenty_opp_nordic_demo",
    },
    {
      name: "CloudScale — Inbound Fast-Response Engine",
      companyName: "CloudScale Systems",
      leadId: leads[3]._id,
      primaryContact: "Sarah Jenkins",
      value: 35000,
      stage: "QUALIFIED",
      probability: 40,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000),
      owner: "Elena Rostova",
    },
    {
      name: "Mendez Legal — Case Value Screening Pipeline",
      companyName: "Mendez & Partners Legal",
      leadId: leads[4]._id,
      primaryContact: "Carlos Mendez",
      value: 25000,
      stage: "NEW",
      probability: 20,
      expectedCloseDate: new Date(Date.now() + 60 * 86400000),
      owner: "Alex Vance",
    },
  ]);
  console.log(`✓ Seeded ${opportunities.length} Opportunities`);

  // 5. Seed 8 Tasks
  const now = new Date();
  const tasks = await Task.create([
    {
      title: "Schedule technical architecture review with Marcus Sterling",
      description: "Review freight dispatch webhook volume and SLA requirements.",
      leadId: leads[0]._id,
      leadName: "Marcus Sterling",
      companyName: "Apex Logistics Global",
      opportunityId: opportunities[0]._id,
      priority: "HIGH",
      dueDate: new Date(now.getTime() + 86400000), // Tomorrow
      status: "TODO",
      assignee: "Alex Vance",
    },
    {
      title: "Send customized security & compliance brief to Dr. Evelyn Chen",
      description: "Provide HIPAA data handling guarantees and data sovereignty docs.",
      leadId: leads[1]._id,
      leadName: "Dr. Evelyn Chen",
      companyName: "Synthetix Health AI",
      opportunityId: opportunities[1]._id,
      priority: "HIGH",
      dueDate: new Date(now.getTime() + 2 * 86400000),
      status: "IN_PROGRESS",
      assignee: "Elena Rostova",
    },
    {
      title: "Deliver revised contract proposal to Henrik Lindqvist",
      description: "Incorporate volume pricing tier for 500+ vendor threshold.",
      leadId: leads[2]._id,
      leadName: "Henrik Lindqvist",
      companyName: "Nordic Commerce Group",
      opportunityId: opportunities[2]._id,
      priority: "HIGH",
      dueDate: new Date(now.getTime() - 86400000), // Overdue
      status: "TODO",
      assignee: "Alex Vance",
    },
    {
      title: "Configure live Gmail notification test for CloudScale demo",
      description: "Set up test webhook receiver to prove <30s response time.",
      leadId: leads[3]._id,
      leadName: "Sarah Jenkins",
      companyName: "CloudScale Systems",
      opportunityId: opportunities[3]._id,
      priority: "MEDIUM",
      dueDate: new Date(now.getTime() + 3 * 86400000),
      status: "TODO",
      assignee: "Elena Rostova",
    },
    {
      title: "Conduct intake workflow preview with Carlos Mendez",
      description: "Walkthrough partner litigation routing rules.",
      leadId: leads[4]._id,
      leadName: "Carlos Mendez",
      companyName: "Mendez & Partners Legal",
      opportunityId: opportunities[4]._id,
      priority: "MEDIUM",
      dueDate: new Date(now.getTime() + 5 * 86400000),
      status: "TODO",
      assignee: "Alex Vance",
    },
    {
      title: "Send quarterly product roadmap to Devon Rishi",
      description: "Follow up with venture debt applicant scoring template.",
      leadId: leads[5]._id,
      leadName: "Devon Rishi",
      companyName: "HyperFin Capital",
      priority: "LOW",
      dueDate: new Date(now.getTime() + 14 * 86400000),
      status: "TODO",
      assignee: "Elena Rostova",
    },
    {
      title: "Verify Twenty CRM custom fields for freight objects",
      description: "Ensure person custom field mapping matches LeadFlow webhook output.",
      priority: "MEDIUM",
      dueDate: new Date(now.getTime() - 2 * 86400000),
      status: "COMPLETED",
      assignee: "Alex Vance",
    },
    {
      title: "Review Zapier status webhook callback logs",
      description: "Verify retry count and error handling under transient HTTP 500s.",
      priority: "LOW",
      dueDate: new Date(now.getTime() - 4 * 86400000),
      status: "COMPLETED",
      assignee: "Elena Rostova",
    },
  ]);
  console.log(`✓ Seeded ${tasks.length} Tasks`);

  // 6. Seed Activity Logs
  const activities = [
    {
      timestamp: new Date(Date.now() - 3600000 * 2),
      user: "System",
      source: "website",
      eventType: "LEAD_CREATED" as const,
      entityType: "lead" as const,
      entityId: leads[0]._id.toString(),
      status: "SUCCESS" as const,
      message: "Inbound prospect submitted: Marcus Sterling (Apex Logistics Global)",
      metadata: { budget: 120000, company: "Apex Logistics Global" },
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 2 + 5000),
      user: "System",
      source: "groq",
      eventType: "AI_QUALIFICATION_COMPLETED" as const,
      entityType: "lead" as const,
      entityId: leads[0]._id.toString(),
      status: "SUCCESS" as const,
      message: "AI scored prospect 94/100 (HIGH priority) using llama-3.3-70b-versatile",
      metadata: { score: 94, priority: "HIGH" },
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 2 + 12000),
      user: "System",
      source: "twenty",
      eventType: "TWENTY_SYNC_COMPLETED" as const,
      entityType: "lead" as const,
      entityId: leads[0]._id.toString(),
      status: "SUCCESS" as const,
      message: "Synchronized prospect to Twenty CRM Person (twenty_person_marcus_demo)",
      metadata: { twentyPersonId: "twenty_person_marcus_demo" },
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 2 + 18000),
      user: "System",
      source: "zapier",
      eventType: "GMAIL_SENT" as const,
      entityType: "lead" as const,
      entityId: leads[0]._id.toString(),
      status: "SUCCESS" as const,
      message: "Gmail sales notification dispatched for high-priority lead: Marcus Sterling",
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 5),
      user: "System",
      source: "website",
      eventType: "LEAD_CREATED" as const,
      entityType: "lead" as const,
      entityId: leads[1]._id.toString(),
      status: "SUCCESS" as const,
      message: "New prospect registered: Dr. Evelyn Chen (Synthetix Health AI)",
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 5 + 6000),
      user: "System",
      source: "groq",
      eventType: "AI_QUALIFICATION_COMPLETED" as const,
      entityType: "lead" as const,
      entityId: leads[1]._id.toString(),
      status: "SUCCESS" as const,
      message: "AI scored prospect 89/100 (HIGH priority)",
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 8),
      user: "Alex Vance",
      source: "website",
      eventType: "OPPORTUNITY_CREATED" as const,
      entityType: "opportunity" as const,
      entityId: opportunities[2]._id.toString(),
      status: "SUCCESS" as const,
      message: "Commercial deal created: Nordic Commerce — Supplier B2B Intake Hub ($65,000)",
    },
  ];
  await ActivityLog.create(activities);
  console.log(`✓ Seeded ${activities.length} Activity Logs`);

  // 7. Seed Automation Runs
  const automationRuns = [
    {
      leadId: leads[0]._id,
      leadName: "Marcus Sterling",
      leadEmail: "marcus.sterling@apexlogistics.io",
      workflowName: "Inbound Lead Qualification & CRM Sync",
      status: "SUCCESS" as const,
      triggerSource: "website",
      durationMs: 460,
      twentyPersonId: "twenty_person_marcus_demo",
      zapierExecutionId: "zap_run_apex_109283",
      steps: [
        { name: "Lead Submission", status: "SUCCESS" as const, durationMs: 12 },
        { name: "Validation & Deduplication", status: "SUCCESS" as const, durationMs: 18 },
        { name: "AI Qualification", status: "SUCCESS" as const, durationMs: 210, outputSummary: "Scored 94/100 (HIGH)" },
        { name: "Twenty CRM Sync", status: "SUCCESS" as const, durationMs: 95, outputSummary: "Person synced" },
        { name: "High Priority Routing (Gmail + Task + Deal)", status: "SUCCESS" as const, durationMs: 50 },
        { name: "Zapier Cross-App Automation Trigger", status: "SUCCESS" as const, durationMs: 75 },
      ],
    },
    {
      leadId: leads[1]._id,
      leadName: "Dr. Evelyn Chen",
      leadEmail: "evelyn.chen@synthetixhealth.com",
      workflowName: "Inbound Lead Qualification & CRM Sync",
      status: "SUCCESS" as const,
      triggerSource: "referral",
      durationMs: 415,
      twentyPersonId: "twenty_person_evelyn_demo",
      zapierExecutionId: "zap_run_synthetix_98214",
      steps: [
        { name: "Lead Submission", status: "SUCCESS" as const, durationMs: 10 },
        { name: "Validation & Deduplication", status: "SUCCESS" as const, durationMs: 14 },
        { name: "AI Qualification", status: "SUCCESS" as const, durationMs: 195, outputSummary: "Scored 89/100 (HIGH)" },
        { name: "Twenty CRM Sync", status: "SUCCESS" as const, durationMs: 88 },
        { name: "High Priority Routing (Gmail + Task)", status: "SUCCESS" as const, durationMs: 42 },
        { name: "Zapier Cross-App Automation Trigger", status: "SUCCESS" as const, durationMs: 66 },
      ],
    },
    {
      leadId: leads[3]._id,
      leadName: "Sarah Jenkins",
      leadEmail: "sarah.j@cloudscale.io",
      workflowName: "Inbound Lead Qualification & CRM Sync",
      status: "SUCCESS" as const,
      triggerSource: "google_ad",
      durationMs: 380,
      steps: [
        { name: "Lead Submission", status: "SUCCESS" as const, durationMs: 11 },
        { name: "Validation & Deduplication", status: "SUCCESS" as const, durationMs: 15 },
        { name: "AI Qualification", status: "SUCCESS" as const, durationMs: 180, outputSummary: "Scored 74/100 (MEDIUM)" },
        { name: "Medium Priority Routing (Email + Task)", status: "SUCCESS" as const, durationMs: 35 },
        { name: "Zapier Cross-App Automation Trigger", status: "SUCCESS" as const, durationMs: 60 },
      ],
    },
  ];
  await AutomationRun.create(automationRuns);
  console.log(`✓ Seeded ${automationRuns.length} Automation Runs`);

  console.log("🎉 LeadFlow AI Database Successfully Seeded!");
}

// Allow direct CLI execution: `npx tsx scripts/seed.ts`
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
