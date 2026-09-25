# LeadFlow AI — Webhook Contracts & Specifications

This document defines the canonical schemas for outbound event dispatch and inbound status callbacks between **LeadFlow AI**, **Zapier**, and **Twenty CRM**.

---

## 1. Outbound Canonical Automation Event: `lead.qualified`

**Dispatched From:** LeadFlow AI Backend  
**Trigger:** Lead created/updated, deduplicated in MongoDB, and qualified deterministically by Groq AI  
**Destinations:**

1. **Zapier Catch Hook URL** (`ZAPIER_LEAD_WEBHOOK_URL`)
2. **Twenty CRM Workflow Webhook URL** (`TWENTY_WORKFLOW_WEBHOOK_URL`)  
**HTTP Method:** `POST`  
**Content-Type:** `application/json`

### Canonical Payload Schema (JSON)

```json
{
  "event": "lead.qualified",
  "eventId": "evt_1727188900_a1b2c3d4",
  "timestamp": "2026-09-24T12:00:00.000Z",
  "leadId": "65f01234567890abcdef1234",
  "firstName": "Rahul",
  "lastName": "Sharma",
  "email": "rahul.sharma@example.com",
  "phone": "+91 98765 43210",
  "company": "ABC Technologies",
  "jobTitle": "CTO",
  "requirement": "AI customer support automation for 100k users",
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
    "id": "65f01234567890abcdef1234",
    "firstName": "Rahul",
    "lastName": "Sharma",
    "email": "rahul.sharma@example.com",
    "phone": "+91 98765 43210",
    "company": "ABC Technologies",
    "jobTitle": "CTO",
    "requirement": "AI customer support automation for 100k users",
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
    "signals": [
      "Clear business requirement",
      "High budget",
      "Short timeline",
      "Executive decision-maker"
    ]
  }
}
```

---

## 2. Inbound Twenty CRM Callback Webhook

**Dispatched From:** Twenty CRM Native Workflow (HTTP Request Node)  
**Target:** `POST /api/webhooks/twenty/status`  
**Authentication:** Pass `x-webhook-secret` header or `secret` query parameter matching `WEBHOOK_SECRET`.

### Success Callback Payload

```json
{
  "event": "crm.automation.completed",
  "eventId": "evt_1727188900_a1b2c3d4",
  "leadId": "65f01234567890abcdef1234",
  "status": "SUCCESS",
  "personId": "twenty_person_991823",
  "companyId": "twenty_company_554129",
  "opportunityId": "twenty_opp_772104",
  "taskId": "twenty_task_332190",
  "timestamp": "2026-09-24T12:01:15.000Z"
}
```

### Failure Callback Payload

```json
{
  "event": "crm.automation.failed",
  "eventId": "evt_1727188900_a1b2c3d4",
  "leadId": "65f01234567890abcdef1234",
  "status": "FAILED",
  "errorCode": "TWENTY_PERSON_UPSERT_FAILED",
  "message": "Invalid email formatting on CRM Person record",
  "timestamp": "2026-09-24T12:01:15.000Z"
}
```

### Response Codes

- `200 OK`: Status successfully processed and stored in MongoDB with audit log created.
- `200 OK (DUPLICATE)`: Idempotency check identified this `eventId` was already processed; ignored safely without duplicating records.
- `401 Unauthorized`: Invalid or missing webhook secret.
- `422 Unprocessable`: Schema validation failure.

---

## 3. Inbound Zapier Callback Webhook (Optional)

**Dispatched From:** Zapier Custom Request Action  
**Target:** `POST /api/webhooks/zapier/status`  
**Authentication:** `Authorization: Bearer <WEBHOOK_SECRET>`

### Payload

```json
{
  "eventId": "evt_1727188900_a1b2c3d4",
  "status": "SUCCESS",
  "leadId": "65f01234567890abcdef1234",
  "automation": "LeadFlow-Zapier-Sync",
  "message": "Gmail customer acknowledgement sent; high-priority notification delivered to sales.",
  "zapierExecutionId": "zap_exec_987654321"
}
```
