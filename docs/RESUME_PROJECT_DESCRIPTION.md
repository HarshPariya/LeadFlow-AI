# LeadFlow AI — Resume & Portfolio Highlights

Use the bullets and descriptions below for your resume, LinkedIn project section, or portfolio. All statements are grounded strictly in the production codebase implemented.

---

## 1. Professional Resume Project Summary

**LeadFlow AI — Intelligent CRM & Sales Automation Platform**  
*Full-Stack Engineer, AI Automation Architect*  
*Tech Stack:* Next.js 15 (App Router), TypeScript, React 19, MongoDB, Mongoose, Groq Cloud (Llama 3.3), Twenty CRM, Zapier Webhooks, Tailwind CSS, Vitest.

### Core Achievements & Bullet Points

* **Engineered Autonomous Inbound Pipeline:** Architected an end-to-end sales qualification engine that ingests leads, runs strict email normalization/deduplication, and executes multi-step routing under 500ms latency.
* **Integrated LLM-Powered Qualification with Resilient Fallback:** Integrated Groq Cloud (Llama 3.3 70B) with server-side Zod schema validation, generating 0–100 commercial readiness scores, buying signals, and executive briefings with automatic fallback to deterministic scoring.
* **Built Bidirectional Twenty CRM REST Adapter:** Designed an idempotent integration layer mapping internal prospect and organization documents into Twenty CRM `Person`, `Company`, `Opportunity`, and `Task` objects.
* **Hardened Cross-App Webhooks with Idempotency:** Implemented outbound Zapier triggers and an inbound callback receiver (`POST /api/webhooks/zapier/status`) secured via Bearer secret validation and replay-attack protection utilizing unique event IDs.
* **Constructed Multi-View Sales Operations Interface:** Created a Light Beige enterprise dashboard featuring 8 real-time KPIs, SVG pipeline progress charts, a 7-stage drag-and-drop Opportunity Kanban board, and an immutable audit activity stream.
* **Automated Quality & CI/CD Pipeline:** Authored automated Vitest test suites covering deterministic scoring engines, entity mappers, and Zod contracts; configured GitHub Actions CI verifying typecheck, tests, and production container builds.

---

## 2. Technical Interview Talking Points

1. **How did you prevent duplicate leads in the pipeline?**
   > *"We implemented a multi-stage deduplication check. Upon submission, emails are normalized to lowercase trimmed strings and indexed in MongoDB. If a matching active prospect exists, the system automatically runs an upsert update and logs a `LEAD_UPDATED` audit record instead of generating redundant leads."*

2. **How did you handle AI service timeouts or rate limits?**
   > *"We implemented a 2-attempt retry loop with exponential backoff on transient HTTP 429 and 5xx errors. If the LLM remains unreachable, the pipeline gracefully falls back to our deterministic weighted rule engine (`lib/scoring/`) evaluating budget strength, urgency keywords, and decision-maker seniority, ensuring the sales workflow never stalls."*

3. **How is webhook security and idempotency enforced?**
   > *"Incoming Zapier callbacks require an `Authorization: Bearer <secret>` header. Every event carries a unique `eventId` that is checked and recorded in a `ProcessedWebhookEvent` collection. Any duplicate delivery is immediately acknowledged with HTTP 200 `IGNORED_DUPLICATE` without duplicating tasks or opportunities."*
