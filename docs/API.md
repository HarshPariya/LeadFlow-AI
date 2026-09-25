# LeadFlow AI — API Reference & Contract

Base URL: `http://localhost:3000` (or your deployed production URL)  
Response Format: JSON (`Content-Type: application/json`)

---

## 1. Standard Response Formats

### Success Response (HTTP 200 / 201)

```json
{
  "success": true,
  "data": {}
}
```

### Error Response (HTTP 4xx / 5xx)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | RATE_LIMITED | INTERNAL_ERROR",
    "message": "Human readable explanation of the error",
    "details": null
  }
}
```

---

## 2. Authentication Endpoints

### Register User

`POST /api/auth/register`

```json
{
  "name": "Alex Vance",
  "email": "alex@company.com",
  "password": "Password123!",
  "role": "OWNER"
}
```

### Login User

`POST /api/auth/login`

```json
{
  "email": "alex@company.com",
  "password": "Password123!"
}
```

### Logout User

`POST /api/auth/logout`

### Get Current User Profile

`GET /api/auth/me`

---

## 3. Leads Endpoints

### List Leads

`GET /api/leads?page=1&limit=20&search=marcus&status=QUALIFIED&priority=HIGH`

### Create Lead (Automatic Pipeline Trigger)

`POST /api/leads`

```json
{
  "firstName": "Marcus",
  "lastName": "Sterling",
  "email": "marcus@apexlogistics.io",
  "phone": "+1 (415) 890-1122",
  "company": "Apex Logistics Global",
  "jobTitle": "VP Operations",
  "requirement": "Need CRM integration for enterprise shipments.",
  "budget": 120000,
  "timeline": "30 days",
  "source": "website"
}
```

### Get Single Lead

`GET /api/leads/:id`

### Update Lead

`PATCH /api/leads/:id`

### Archive Lead

`DELETE /api/leads/:id`

### Re-evaluate AI Qualification

`POST /api/leads/:id/qualify`

### Synchronize to Twenty CRM

`POST /api/leads/:id/sync`

### Retry Automation Pipeline

`POST /api/leads/:id/retry`

---

## 4. Webhooks & Integrations

### Twenty CRM Workflow Status Callback

`POST /api/webhooks/twenty/status`  
Headers: `x-webhook-secret: <WEBHOOK_SECRET>`

```json
{
  "event": "crm.automation.completed",
  "eventId": "evt_1727188900_a1b2c3d4",
  "leadId": "65f01234567890abcdef1234",
  "status": "SUCCESS",
  "personId": "twenty_person_123",
  "companyId": "twenty_comp_456",
  "opportunityId": "twenty_opp_789",
  "taskId": "twenty_task_012",
  "timestamp": "2026-09-24T12:00:00.000Z"
}
```

### Zapier Status Callback

`POST /api/webhooks/zapier/status`  
Headers: `Authorization: Bearer <WEBHOOK_SECRET>`

```json
{
  "eventId": "zap_evt_1029384756",
  "status": "SUCCESS",
  "leadId": "65f01234567890abcdef1234",
  "automation": "LeadFlow-Zapier-Sync",
  "message": "Gmail customer acknowledgement sent; high-priority notification delivered to sales.",
  "zapierExecutionId": "zap_exec_98765"
}
```

### Integration Health Check

`GET /api/integrations/health`
Monitors live connectivity for MongoDB, Groq, Twenty CRM, Zapier, and Gmail.
