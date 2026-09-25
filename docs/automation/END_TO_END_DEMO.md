# LeadFlow AI — End-to-End Walkthrough & Demo Script

**Estimated Duration:** 5 – 8 minutes  
**Goal:** Demonstrate the complete autonomous lifecycle from inbound prospect submission to Groq AI qualification, deterministic priority routing, Zapier email automation, and Twenty CRM synchronization.

---

## Pre-Demo Preparation

1. Ensure the app is running locally via `npm run dev` or deployed on Vercel / Render.
2. Ensure MongoDB and Google OAuth variables are configured in `.env`.

---

## Step-by-Step Demonstration Sequence

### Step 1: Login & Workspace Overview (1 minute)

- Navigate to `/login`.
- Click **"Continue with Google"** to authenticate securely.
- On first login, your private User and Workspace are automatically provisioned.
- Highlight the **Operational Dashboard**:
  - Show the 10 production KPIs: Total Leads, New Leads, Qualified Leads, High Priority, Medium Priority, Low Priority, Open Opportunities, Pending Tasks, Automation Runs, and Automation Success Rate.
  - Point out the **AI Priority Distribution** and **Pipeline Stage Breakdown**.

### Step 2: Inbound Lead Creation & Deduplication (1.5 minutes)

- Navigate to **Leads** (`/leads`).
- Click **"New Lead"** (or click **"Simulate Inbound Lead"**).
- Enter an enterprise prospect:
  - Name: `Rahul Sharma`
  - Email: `rahul.sharma@abctech.com`
  - Company: `ABC Technologies`
  - Job Title: `CTO`
  - Budget: `$200,000`
  - Timeline: `30 days`
  - Requirement: `"Need automated CRM routing and sales pipeline automation for 100,000 monthly inquiries."`
- Click **"Create Lead & Run Automation"**.

### Step 3: Real-Time AI Qualification & Score Inspection (1.5 minutes)

- Open Rahul Sharma's detail view (`/leads/[id]`).
- Show the **AI Qualification** card:
  - **Score:** 92 / 100
  - **Priority:** **HIGH** (Deterministic mapping: 80–100 = HIGH).
  - **Category:** Enterprise AI & Sales Automation.
  - **Summary:** High-intent enterprise CTO seeking comprehensive support automation with $200k budget and immediate 30-day timeline.
  - **Recommended Action:** "Schedule an executive discovery call within 24 hours."

### Step 4: Zapier Automation & Conditional Email Routing (1.5 minutes)

- Inspect the **Zapier Automation** timeline on the Lead Detail page:
  - `Zapier Catch Hook Triggered` (Dispatched canonical event payload with `priority: "HIGH"` and `score: 92`).
  - `Zapier Path HIGH Routed`: Matches Path A rule (`priority Exactly matches HIGH`).
  - `Gmail Notifications Sent`:
    1. Internal Urgent Alert sent to `SALES_NOTIFICATION_EMAIL` with full AI briefing.
    2. Professional Customer Acknowledgement sent to `rahul.sharma@abctech.com`.

### Step 5: Twenty CRM Synchronization & Deal Creation (1.5 minutes)

- Point out the **Twenty CRM Integration** card on the Lead Detail page:
  - Dispatched canonical event to Twenty CRM Workflow Webhook.
  - Twenty Workflow upserts `Person` and `Company`.
  - Condition check: Since Priority is `HIGH`, Twenty automatically creates an `Opportunity` in stage `DISCOVERY` valued at `$200,000`.
  - Follow-up task scheduled in Twenty due within 24 hours.
  - Twenty sends HTTP callback to `POST /api/webhooks/twenty/status`, updating LeadFlow AI with live CRM entity IDs:
    - Twenty Person ID: `twenty_person_xxx`
    - Twenty Company ID: `twenty_comp_xxx`
    - Opportunity ID: `twenty_opp_xxx`
    - Task ID: `twenty_task_xxx`

### Step 6: Platform Audit Log & Resilience (1 minute)

- Navigate to **Activity Log** (`/activity`).
- Filter by entity `lead` to show the complete immutable audit trail:
  - `LEAD_CREATED` -> `AI_QUALIFICATION_COMPLETED` -> `ZAPIER_TRIGGERED` -> `ZAPIER_PATH_HIGH` -> `GMAIL_SENT` -> `TWENTY_SYNC_STARTED` -> `TWENTY_SYNC_COMPLETED` -> `OPPORTUNITY_CREATED` -> `TASK_CREATED`.
- Showcase the **Targeted Retry Controls** on the Lead Detail page (`Retry Zapier`, `Retry Twenty`, `Retry AI`, `Retry Full Automation`) demonstrating idempotency (no duplicate records).
- Conclude by viewing the **Integrations Health** page (`/integrations`), showing live connection monitoring for MongoDB, Groq, Twenty CRM, Zapier, and Gmail without exposing credentials.
