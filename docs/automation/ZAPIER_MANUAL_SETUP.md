# Zapier Automation — Manual Step-by-Step Configuration Guide

This guide provides the exact configuration required to create the **LeadFlow AI — Lead Qualification & Email Automation** Zap.

---

## 1. New Production Architecture Summary

```text
LeadFlow AI (Backend)
       ↓
POST Canonical Event (lead.qualified)
       ↓
Webhooks by Zapier (Catch Hook)
       ↓
Filter: event == "lead.qualified"
       ↓
Paths by Zapier (Branch by "priority")
  ├── PATH A: HIGH Priority (priority == "HIGH")
  │     ├── Gmail: Send Internal High-Priority Alert to Sales Team
  │     └── Gmail: Send Customer Acknowledgement Email
  ├── PATH B: MEDIUM Priority (priority == "MEDIUM")
  │     ├── Gmail: Send Customer Follow-Up & Scheduling Email
  │     └── Gmail (Optional): Send Internal Lead Summary
  └── PATH C: LOW Priority (priority == "LOW")
        └── Gmail: Send Nurture Resources Email
```

> **Architectural Separation Note:**  
> In the new architecture, **CRM synchronization is handled directly by Twenty CRM's native workflow webhook**, NOT inside Zapier. This prevents duplicate Person/Company creation and keeps Zapier focused entirely on multi-path email automation.  
> **Slack is completely removed.** All notifications use Gmail.

---

## 2. Step-by-Step Configuration in Zapier

### Step 1: Webhook Trigger (Catch Hook)

1. **App:** `Webhooks by Zapier`
2. **Event:** `Catch Hook`
3. **Trigger Setup:**
   - Leave the **Pick off a Child Key** field blank so Zapier captures both the top-level flattened fields and the nested objects.
   - Zapier generates a webhook URL:  
     `https://hooks.zapier.com/hooks/catch/xxxxxx/yyyyyy/`
4. **Configure in LeadFlow AI:**
   - Copy this URL into your `.env` file:

     ```env
     ZAPIER_LEAD_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxxx/yyyyyy/
     ```

5. **Test Trigger in Zapier:**
   - Submit a test lead in LeadFlow AI or use curl to post the **HIGH Test Payload** below.
   - In Zapier, click **Test trigger** to verify data is captured.

---

### Step 2: Filter by Zapier (Guard)

1. **App:** `Filter by Zapier`
2. **Only continue if...**
   - Field: `event`
   - Condition: `(Text) Exactly matches`
   - Value: `lead.qualified`

---

### Step 3: Paths by Zapier (Conditional Routing)

Add a **Paths by Zapier** step with 3 distinct paths:

#### PATH A: HIGH Priority

1. **Path Rules:**
   - Field: `priority`
   - Condition: `(Text) Exactly matches`
   - Value: `HIGH`
   *(Optional numeric fallback: `score` (Number) Greater than 79)*

2. **Action 4A.1 (Internal High-Priority Gmail Notification):**
   - **App:** `Gmail`
   - **Event:** `Send Email`
   - **To:** Enter your sales notification email (e.g. `sales@yourcompany.com`)
   - **Subject:** `[HIGH PRIORITY LEAD] {{firstName}} {{lastName}} — {{company}}`
   - **Body:**

     ```text
     A high-priority lead has been qualified by LeadFlow AI.

     Prospect Information:
     - Name: {{firstName}} {{lastName}}
     - Email: {{email}}
     - Phone: {{phone}}
     - Company: {{company}}
     - Job Title: {{jobTitle}}
     - Requirement: {{requirement}}
     - Budget: ${{budget}}
     - Timeline: {{timeline}}

     AI Qualification Assessment:
     - AI Score: {{score}} / 100
     - Priority: {{priority}}
     - Category: {{category}}
     - Summary: {{summary}}
     - Recommended Action: {{recommendedAction}}

     Action Required: Reach out within 24 hours.
     ```

3. **Action 4A.2 (Customer Acknowledgement Email):**
   - **App:** `Gmail`
   - **Event:** `Send Email`
   - **To:** `{{email}}`
   - **Subject:** `Your LeadFlow AI inquiry has been received`
   - **Body:**

     ```text
     Dear {{firstName}},

     Thank you for contacting us regarding your requirement: "{{requirement}}".

     Our enterprise solutions team has received your project details and is currently reviewing your specifications. An account executive will reach out shortly to schedule an initial discovery call.

     Best regards,
     The LeadFlow AI Solutions Team
     ```

---

#### PATH B: MEDIUM Priority

1. **Path Rules:**
   - Field: `priority`
   - Condition: `(Text) Exactly matches`
   - Value: `MEDIUM`
   *(Optional numeric fallback: `score` (Number) Between 50 and 79)*

2. **Action 4B.1 (Customer Follow-Up Email):**
   - **App:** `Gmail`
   - **Event:** `Send Email`
   - **To:** `{{email}}`
   - **Subject:** `Thanks for contacting us — next steps for {{company}}`
   - **Body:**

     ```text
     Hi {{firstName}},

     Thank you for your interest in LeadFlow AI!

     We have reviewed your inquiry regarding {{requirement}} for {{company}}. We'd love to learn more about your goals and demonstrate how LeadFlow AI can help.

     Please reply directly to this email or let us know a convenient time to connect this week.

     Best regards,
     The LeadFlow AI Team
     ```

3. **Action 4B.2 (Optional Internal Sales Notice):**
   - **App:** `Gmail`
   - **Event:** `Send Email`
   - **To:** Enter your sales notification email
   - **Subject:** `[MEDIUM PRIORITY LEAD] {{firstName}} {{lastName}} — {{company}}`

---

#### PATH C: LOW Priority

1. **Path Rules:**
   - Field: `priority`
   - Condition: `(Text) Exactly matches`
   - Value: `LOW`
   *(Optional numeric fallback: `score` (Number) Less than 50)*

2. **Action 4C.1 (Nurture Resource Email):**
   - **App:** `Gmail`
   - **Event:** `Send Email`
   - **To:** `{{email}}`
   - **Subject:** `Thanks for your interest in LeadFlow AI`
   - **Body:**

     ```text
     Hi {{firstName}},

     Thank you for reaching out to LeadFlow AI!

     To help you explore what's possible, feel free to check out our product overview, documentation, and guides on our website.

     If you have any questions or new requirements down the road, don't hesitate to reach back out.

     Warm regards,
     The LeadFlow AI Team
     ```

---

## 3. Very Important: Testing All 3 Paths Separately

> **Why previous paths showed "did not run as rule conditions were not met":**  
> In Zapier, a Path branch only runs when its condition is satisfied. Testing with a single payload will only satisfy **one** branch. To test all three branches in Zapier:

1. **Test Path A (HIGH):**  
   Send the **HIGH Test Payload** below to your Catch Hook. In Zapier, load this request in Step 1, then open Path A and click **Test step** (it will pass!).
2. **Test Path B (MEDIUM):**  
   Send the **MEDIUM Test Payload** below to your Catch Hook. In Zapier, re-test Step 1 to select this new request, then open Path B and click **Test step** (it will pass!).
3. **Test Path C (LOW):**  
   Send the **LOW Test Payload** below to your Catch Hook. In Zapier, select this request, open Path C and click **Test step** (it will pass!).

### Test Fixtures

#### HIGH Test Fixture (score: 92, priority: "HIGH")

```json
{
  "event": "lead.qualified",
  "eventId": "test_high_001",
  "firstName": "Rahul",
  "lastName": "Sharma",
  "email": "rahul.sharma@example.com",
  "company": "ABC Technologies",
  "jobTitle": "CTO",
  "requirement": "AI customer support automation",
  "budget": 200000,
  "timeline": "30 days",
  "industry": "Technology",
  "source": "website",
  "score": 92,
  "priority": "HIGH",
  "category": "AI Automation",
  "summary": "High-intent enterprise inquiry with immediate budget.",
  "recommendedAction": "Schedule discovery call within 24h.",
  "lead": {
    "id": "lead_high_123",
    "firstName": "Rahul",
    "lastName": "Sharma",
    "email": "rahul.sharma@example.com",
    "company": "ABC Technologies"
  },
  "qualification": {
    "score": 92,
    "priority": "HIGH"
  }
}
```

#### MEDIUM Test Fixture (score: 65, priority: "MEDIUM")

```json
{
  "event": "lead.qualified",
  "eventId": "test_med_002",
  "firstName": "Priya",
  "lastName": "Patel",
  "email": "priya.patel@growthscale.io",
  "company": "GrowthScale Inc",
  "jobTitle": "Head of Operations",
  "requirement": "Evaluating CRM automation tools",
  "budget": 45000,
  "timeline": "60 days",
  "industry": "SaaS",
  "source": "webinar",
  "score": 65,
  "priority": "MEDIUM",
  "category": "Sales Operations",
  "summary": "Mid-market company exploring CRM automation.",
  "recommendedAction": "Send product deck and demo link.",
  "lead": {
    "id": "lead_med_456",
    "firstName": "Priya",
    "lastName": "Patel",
    "email": "priya.patel@growthscale.io",
    "company": "GrowthScale Inc"
  },
  "qualification": {
    "score": 65,
    "priority": "MEDIUM"
  }
}
```

#### LOW Test Fixture (score: 25, priority: "LOW")

```json
{
  "event": "lead.qualified",
  "eventId": "test_low_003",
  "firstName": "Alex",
  "lastName": "Miller",
  "email": "alex.miller@freemail.test",
  "company": "Solo Consulting",
  "jobTitle": "Freelancer",
  "requirement": "Looking for free AI automation ideas",
  "budget": 500,
  "timeline": "Exploring",
  "industry": "Media",
  "source": "blog",
  "score": 25,
  "priority": "LOW",
  "category": "General Inquiry",
  "summary": "Freelance inquiry with minimal budget.",
  "recommendedAction": "Add to educational newsletter.",
  "lead": {
    "id": "lead_low_789",
    "firstName": "Alex",
    "lastName": "Miller",
    "email": "alex.miller@freemail.test",
    "company": "Solo Consulting"
  },
  "qualification": {
    "score": 25,
    "priority": "LOW"
  }
}
```
