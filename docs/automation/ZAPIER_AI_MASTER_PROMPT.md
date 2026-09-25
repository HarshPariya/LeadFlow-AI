# Zapier AI Master Prompt — Autonomous Workflow Builder

> **Instructions for User:**  
> Copy and paste the entire prompt below directly into **Zapier Central**, **Zapier AI Workflow Builder**, or follow it step-by-step in the Zapier editor.  
> This prompt creates the **LeadFlow AI — Lead Qualification & Email Automation** Zap.  
> **Important:** This workflow uses **Gmail** for all communications. **Slack is not used.** CRM data sync is handled separately and directly by Twenty CRM Workflow to avoid duplicate records.

---

```text
Create a Zap named:

LeadFlow AI — Lead Qualification & Email Automation

==================================================
OVERVIEW & ARCHITECTURE
==================================================
This Zapier workflow connects to LeadFlow AI.
LeadFlow AI qualifies inbound leads using Groq AI, determines an authoritative priority (HIGH, MEDIUM, or LOW), and sends a normalized webhook payload to Zapier.

Zapier's single responsibility is to:
1. Receive the qualified lead event via Webhook Catch Hook.
2. Filter to ensure the event is "lead.qualified".
3. Route conditionally using Paths into exactly 3 branches:
   - Path A: HIGH Priority
   - Path B: MEDIUM Priority
   - Path C: LOW Priority
4. Send professional notifications and customer acknowledgements using Gmail.

DO NOT use Slack.
DO NOT use Email by Zapier (use Gmail).
DO NOT perform Twenty CRM synchronization inside Zapier (Twenty CRM has its own native workflow webhook).

==================================================
STEP-BY-STEP ZAP SPECIFICATION
==================================================

### STEP 1: TRIGGER
- App: Webhooks by Zapier
- Event: Catch Hook
- Webhook URL: (Copy this Catch Hook URL into LeadFlow AI as ZAPIER_LEAD_WEBHOOK_URL)
- Pick off a Child Key: (Leave empty to capture the entire payload)

### STEP 2: FILTER / GUARD
- App: Filter by Zapier
- Only continue if:
  1. "event" (Text) Exactly matches "lead.qualified"

### STEP 3: PATHS BY ZAPIER
Create exactly 3 paths: Path A, Path B, and Path C.

--------------------------------------------------
#### PATH A: HIGH PRIORITY
--------------------------------------------------
1. Path Rules / Condition:
   - "priority" (Text) Exactly matches "HIGH"
   (Alternative fallback if using score: "score" (Number) Greater than 79)

2. Action 1: Gmail — Send Internal High Priority Notification
   - App: Gmail
   - Event: Send Email
   - To: [SALES_NOTIFICATION_EMAIL] (e.g. sales@yourcompany.com)
   - Subject: [HIGH PRIORITY LEAD] {{firstName}} {{lastName}} — {{company}}
   - Body Type: Plain or HTML
   - Body:
A high-priority lead has been qualified by LeadFlow AI.

Lead Details:
- Name: {{firstName}} {{lastName}}
- Email: {{email}}
- Phone: {{phone}}
- Company: {{company}}
- Job Title: {{jobTitle}}
- Requirement: {{requirement}}
- Budget: ${{budget}}
- Timeline: {{timeline}}
- Industry: {{industry}}
- Source: {{source}}

AI Qualification:
- AI Score: {{score}} / 100
- Priority: {{priority}}
- Category: {{category}}
- AI Summary: {{summary}}
- Recommended Action: {{recommendedAction}}

Please review and reach out immediately within 24 hours.

3. Action 2: Gmail — Send Customer Acknowledgement
   - App: Gmail
   - Event: Send Email
   - To: {{email}}
   - Subject: Your LeadFlow AI inquiry has been received
   - Body:
Dear {{firstName}},

Thank you for reaching out to us regarding your requirement: "{{requirement}}".

We have received your project details and our enterprise team is currently reviewing your specifications. An account executive will contact you shortly to schedule an initial discovery discussion.

Best regards,
The LeadFlow AI Solutions Team

--------------------------------------------------
#### PATH B: MEDIUM PRIORITY
--------------------------------------------------
1. Path Rules / Condition:
   - "priority" (Text) Exactly matches "MEDIUM"
   (Alternative fallback: "score" (Number) Between 50 and 79)

2. Action 1: Gmail — Send Customer Follow-Up
   - App: Gmail
   - Event: Send Email
   - To: {{email}}
   - Subject: Thanks for contacting us — next steps
   - Body:
Hi {{firstName}},

Thank you for contacting us regarding your inquiry.

We have received your details for {{company}} and would love to learn more about how we can support your goals. You can schedule a 15-minute introductory call with our team at your convenience, or reply directly to this email with any additional requirements.

Looking forward to speaking with you!

Best regards,
LeadFlow AI Team

3. Action 2 (Optional): Gmail — Send Internal Sales Notification
   - App: Gmail
   - Event: Send Email
   - To: [SALES_NOTIFICATION_EMAIL]
   - Subject: [MEDIUM PRIORITY LEAD] {{firstName}} {{lastName}} — {{company}}
   - Body:
A medium-priority lead has been received.

- Prospect: {{firstName}} {{lastName}} ({{email}})
- Company: {{company}}
- Budget: ${{budget}}
- AI Score: {{score}}
- Priority: {{priority}}
- Summary: {{summary}}

--------------------------------------------------
#### PATH C: LOW PRIORITY
--------------------------------------------------
1. Path Rules / Condition:
   - "priority" (Text) Exactly matches "LOW"
   (Alternative fallback: "score" (Number) Less than 50)

2. Action 1: Gmail — Send Nurture Email
   - App: Gmail
   - Event: Send Email
   - To: {{email}}
   - Subject: Thanks for your interest in LeadFlow AI
   - Body:
Hi {{firstName}},

Thank you for your interest in LeadFlow AI!

We have received your inquiry. To help you get started and explore what is possible, please feel free to review our documentation, customer case studies, and resources on our website.

If you have specific questions or upcoming requirements, simply reply to this email anytime.

Warm regards,
LeadFlow AI Team

==================================================
CANONICAL EVENT PAYLOAD & FIELD MAPPINGS
==================================================

LeadFlow AI sends both top-level flattened fields (for simple Zapier mapping) and nested objects:

Top-level fields available in Zapier:
- event: "lead.qualified"
- eventId: unique event identifier (e.g. "evt_1727188900_a1b2c3d4")
- leadId: database lead ID (e.g. "65f01234567890abcdef1234")
- firstName: Lead first name (e.g. "Rahul")
- lastName: Lead last name (e.g. "Sharma")
- email: Lead email address (e.g. "rahul@example.com")
- phone: Lead phone number (e.g. "+91 98765 43210")
- company: Lead company name (e.g. "ABC Technologies")
- jobTitle: Job title (e.g. "CTO")
- requirement: Stated business requirement (e.g. "AI customer support automation")
- budget: Numerical budget (e.g. 200000)
- timeline: Timeline (e.g. "30 days")
- industry: Industry (e.g. "Technology")
- source: Lead acquisition source (e.g. "website")
- score: AI qualification score 0-100 (e.g. 92)
- priority: "HIGH" | "MEDIUM" | "LOW"
- category: Lead category (e.g. "AI Automation")
- summary: AI qualification summary
- recommendedAction: Recommended next steps
- timestamp: ISO-8601 timestamp

==================================================
TEST PAYLOADS (TEST ALL 3 BRANCHES INDEPENDENTLY)
==================================================

IMPORTANT: To test all 3 Paths, send each test payload to your Catch Hook URL individually. A Zapier Path only executes when its specific condition is met!

### TEST 1: HIGH PRIORITY (Score: 92, Priority: HIGH)
{
  "event": "lead.qualified",
  "eventId": "test_high_001",
  "timestamp": "2026-09-24T12:00:00.000Z",
  "leadId": "lead_test_high_123",
  "firstName": "Rahul",
  "lastName": "Sharma",
  "email": "rahul.sharma@example.com",
  "phone": "+91 98765 43210",
  "company": "ABC Technologies",
  "jobTitle": "CTO",
  "requirement": "AI customer support automation for 100,000 monthly active users",
  "budget": 200000,
  "timeline": "30 days",
  "industry": "Technology",
  "source": "website",
  "score": 92,
  "priority": "HIGH",
  "category": "AI Automation",
  "summary": "High-intent enterprise CTO seeking comprehensive support automation with $200k budget and immediate 30-day timeline.",
  "recommendedAction": "Schedule executive discovery call within 24 hours.",
  "lead": {
    "id": "lead_test_high_123",
    "firstName": "Rahul",
    "lastName": "Sharma",
    "email": "rahul.sharma@example.com",
    "phone": "+91 98765 43210",
    "company": "ABC Technologies",
    "jobTitle": "CTO",
    "requirement": "AI customer support automation for 100,000 monthly active users",
    "budget": 200000,
    "timeline": "30 days",
    "industry": "Technology",
    "source": "website"
  },
  "qualification": {
    "score": 92,
    "priority": "HIGH",
    "category": "AI Automation",
    "summary": "High-intent enterprise CTO seeking comprehensive support automation with $200k budget and immediate 30-day timeline.",
    "recommendedAction": "Schedule executive discovery call within 24 hours.",
    "signals": ["Clear business requirement", "High budget", "Short timeline", "Executive role"]
  }
}

### TEST 2: MEDIUM PRIORITY (Score: 65, Priority: MEDIUM)
{
  "event": "lead.qualified",
  "eventId": "test_med_002",
  "timestamp": "2026-09-24T12:05:00.000Z",
  "leadId": "lead_test_med_456",
  "firstName": "Priya",
  "lastName": "Patel",
  "email": "priya.patel@growthscale.io",
  "phone": "+1 415 555 2671",
  "company": "GrowthScale Inc",
  "jobTitle": "Head of Operations",
  "requirement": "Evaluating CRM automation tools for sales follow-ups",
  "budget": 45000,
  "timeline": "60 days",
  "industry": "SaaS",
  "source": "webinar",
  "score": 65,
  "priority": "MEDIUM",
  "category": "Sales Operations",
  "summary": "Mid-market company exploring sales follow-up automation with standard budget.",
  "recommendedAction": "Send standard product deck and offer demo scheduling link.",
  "lead": {
    "id": "lead_test_med_456",
    "firstName": "Priya",
    "lastName": "Patel",
    "email": "priya.patel@growthscale.io",
    "phone": "+1 415 555 2671",
    "company": "GrowthScale Inc",
    "jobTitle": "Head of Operations",
    "requirement": "Evaluating CRM automation tools for sales follow-ups",
    "budget": 45000,
    "timeline": "60 days",
    "industry": "SaaS",
    "source": "webinar"
  },
  "qualification": {
    "score": 65,
    "priority": "MEDIUM",
    "category": "Sales Operations",
    "summary": "Mid-market company exploring sales follow-up automation with standard budget.",
    "recommendedAction": "Send standard product deck and offer demo scheduling link.",
    "signals": ["Established SaaS business", "Moderate budget", "Standard procurement timeline"]
  }
}

### TEST 3: LOW PRIORITY (Score: 25, Priority: LOW)
{
  "event": "lead.qualified",
  "eventId": "test_low_003",
  "timestamp": "2026-09-24T12:10:00.000Z",
  "leadId": "lead_test_low_789",
  "firstName": "Alex",
  "lastName": "Miller",
  "email": "alex.miller@freemail.test",
  "phone": "+1 555 0199",
  "company": "Solo Consulting",
  "jobTitle": "Freelancer",
  "requirement": "Looking for free AI automation ideas for small blog",
  "budget": 500,
  "timeline": "Exploring / No timeline",
  "industry": "Media",
  "source": "blog",
  "score": 25,
  "priority": "LOW",
  "category": "General Inquiry",
  "summary": "Freelance inquiry with minimal budget and exploratory timeline.",
  "recommendedAction": "Add to educational newsletter and nurture drip sequence.",
  "lead": {
    "id": "lead_test_low_789",
    "firstName": "Alex",
    "lastName": "Miller",
    "email": "alex.miller@freemail.test",
    "phone": "+1 555 0199",
    "company": "Solo Consulting",
    "jobTitle": "Freelancer",
    "requirement": "Looking for free AI automation ideas for small blog",
    "budget": 500,
    "timeline": "Exploring / No timeline",
    "industry": "Media",
    "source": "blog"
  },
  "qualification": {
    "score": 25,
    "priority": "LOW",
    "category": "General Inquiry",
    "summary": "Freelance inquiry with minimal budget and exploratory timeline.",
    "recommendedAction": "Add to educational newsletter and nurture drip sequence.",
    "signals": ["Low budget", "Individual freelancer", "No active project commitment"]
  }
}
```
