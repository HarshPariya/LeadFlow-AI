# LeadFlow AI — Architecture & System Design

**Platform:** LeadFlow AI — Intelligent CRM & Sales Automation Platform  
**Target Architecture:** Next.js Full-Stack App Router + MongoDB Atlas + Groq AI + Twenty CRM Workflow + Zapier Paths & Gmail Automation

---

## 1. High-Level Architecture Overview

LeadFlow AI serves as the centralized sales control center and intelligence layer. It captures inbound leads, performs duplicate checks and persistence in MongoDB, qualifies prospects via Groq Llama 3.3 with deterministic priority classification, and simultaneously dispatches a single normalized canonical automation event to **Zapier** and **Twenty CRM**.

```mermaid
flowchart TD
    User([Inbound Prospect / Form]) -->|Submits Lead| Web[LeadFlow AI Web App]
    Web -->|Next.js App Router| API[LeadFlow Backend API]
    
    subgraph Data & AI Qualification
        API -->|Validate & Deduplicate| Mongo[(MongoDB / Atlas)]
        API -->|AI Qualification| Groq[Groq Cloud LLM\nllama-3.3-70b-versatile]
        Groq -->|Structured JSON Score| API
        API -->|Deterministic Priority Mapping| Priority[Score: 80-100 -> HIGH\nScore: 50-79 -> MEDIUM\nScore: 0-49 -> LOW]
    end
    
    subgraph Canonical Event Dispatch
        Priority -->|Canonical Automation Event| Dispatcher[Dual Event Dispatcher]
        Dispatcher -->|POST Canonical Payload| Zapier[Zapier Catch Hook]
        Dispatcher -->|POST Canonical Payload| Twenty[Twenty CRM Workflow Webhook]
    end
    
    subgraph Zapier Conditional Routing
        Zapier --> Filter[Filter: event == lead.qualified]
        Filter --> Paths[Paths by Zapier]
        Paths -->|Path A: HIGH| GmailHigh[Gmail: Urgent Sales Alert + Customer Ack]
        Paths -->|Path B: MEDIUM| GmailMed[Gmail: Customer Follow-up & Scheduling]
        Paths -->|Path C: LOW| GmailLow[Gmail: Nurture & Educational Resources]
    end
    
    subgraph Twenty CRM Native Workflow
        Twenty --> UpsertPerson[Upsert Person by Email]
        UpsertPerson --> UpsertComp[Upsert Company by Name]
        UpsertComp --> OppLogic{Priority Branching}
        OppLogic -->|HIGH| OppHigh[Create Opp: Stage DISCOVERY + 24h Task]
        OppLogic -->|MEDIUM| OppMed[Create Opp: Stage QUALIFIED + 48h Task]
        OppLogic -->|LOW| OppLow[Create Nurture Task: 5 Days, No Opp]
        OppHigh --> Callback[HTTP Request Callback]
        OppMed --> Callback
        OppLow --> Callback
        Callback -->|POST /api/webhooks/twenty/status| API
        API -->|Update CRM IDs & Activity Logs| Mongo
    end
```

---

## 2. Inbound Lead Processing & Lifecycle Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Lead as Prospect / API Client
    participant App as LeadFlow Next.js Backend
    participant DB as MongoDB Atlas
    participant AI as Groq Llama 3.3
    participant Zap as Zapier Catch Hook
    participant Gmail as Gmail Service
    participant Twenty as Twenty CRM Workflow

    Lead->>App: POST /api/leads
    App->>DB: Check Duplicate (Email Normalization)
    alt Duplicate Found
        App->>DB: Update Existing Prospect Record
    else Unique Lead
        App->>DB: Create New Prospect Record
    end
    
    App->>AI: Qualify Lead (Prompts + System Rules)
    AI-->>App: Structured Output (Score 0-100, Summary, Category, Signals)
    App->>App: Deterministic Priority Calculation (HIGH: 80-100, MED: 50-79, LOW: 0-49)
    App->>DB: Save Qualification State
    
    App->>App: Generate Canonical Event (lead.qualified)
    
    par Outbound to Zapier
        App->>Zap: POST Canonical Event Payload
        Zap->>Zap: Filter & Evaluate Paths (HIGH / MEDIUM / LOW)
        Zap->>Gmail: Send Gmail Notifications
    and Outbound to Twenty CRM
        App->>Twenty: POST Canonical Event Payload
        Twenty->>Twenty: Upsert Person & Company
        Twenty->>Twenty: Create/Update Opportunity & Follow-up Task
        Twenty->>App: POST /api/webhooks/twenty/status (HTTP Callback)
        App->>DB: Save Twenty Person ID, Company ID, Opp ID, Task ID
    end
    
    App-->>Lead: Return 201 Created with Full Qualification & Automation State
```

---

## 3. Strict Separation of Responsibilities

To avoid duplicate records, split-brain states, and conflicting priorities:

1. **LeadFlow AI Backend owns:**
   - User authentication and authorization.
   - Core data persistence and validation.
   - Groq AI prompt execution and response schema validation.
   - Deterministic final priority calculation (`HIGH`, `MEDIUM`, `LOW`).
   - Unique event generation and audit log tracking.
   - Targeted manual retry triggers.

2. **Zapier owns:**
   - Multi-path conditional routing based on the authoritative `priority` field.
   - Gmail communications (Internal sales alerts, customer confirmations, follow-up emails, nurture emails).
   - *(Note: Zapier does NOT perform CRM record upsert, ensuring zero duplication).*

3. **Twenty CRM owns:**
   - CRM entity management (`Person`, `Company`, `Opportunity`, `Task`).
   - Pipeline stages and sales task due date calculations.
   - Final status confirmation via secure HTTP webhook callback.

---

## 4. Webhook Idempotency & Replay Protection

1. Every outbound event payload carries a unique `eventId` (`evt_<timestamp>_<hash>`).
2. Both Zapier and Twenty retain this `eventId` during all execution steps.
3. Inbound callbacks to `POST /api/webhooks/twenty/status` require:
   - `x-webhook-secret: <WEBHOOK_SECRET>` header.
   - Validated JSON payload conforming to `twentyStatusWebhookSchema`.
4. The backend checks `ProcessedWebhookEvent` in MongoDB before processing. If an `eventId` has already been recorded, the request returns HTTP 200 with status `IGNORED_DUPLICATE` to ensure idempotency.
