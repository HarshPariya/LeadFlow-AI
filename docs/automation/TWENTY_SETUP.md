# Twenty CRM Setup & Workflow Automation Guide

This guide provides step-by-step instructions to configure **Twenty CRM** (the open-source modern CRM) to receive qualified lead events directly from **LeadFlow AI**, upsert CRM records, manage deals & tasks, and report execution status back to LeadFlow AI.

---

## 1. Overview & Architecture

In the new LeadFlow AI production architecture, CRM synchronization is handled exclusively by **Twenty CRM**:

```
LeadFlow AI (Backend)
        │
        ▼ (POST Canonical Event)
Twenty CRM Workflow Webhook
        │
        ▼
   Upsert Person
        │
        ▼
   Upsert Company
        │
        ▼
   Filter / Priority Check
   ├── HIGH Priority   ──> Create Opportunity (Stage: DISCOVERY) + 24h Task
   ├── MEDIUM Priority ──> Create Opportunity (Stage: QUALIFIED) + 48h Task
   └── LOW Priority    ──> Create Nurture Task (Due 5 Days, No Opportunity)
        │
        ▼
   HTTP Callback Request
        │
        ▼ (POST /api/webhooks/twenty/status)
LeadFlow AI Status & Audit Logs
```

---

## 2. Supported Objects & Fields in Twenty CRM

Inspect your Twenty CRM workspace (e.g. `https://<your-workspace>.twenty.com`). Twenty CRM provides native support for:

- **People**
- **Companies**
- **Opportunities**
- **Tasks**
- **Notes**
- **Workflows**

*(Note: Twenty does not have a separate native "Lead" object; prospective contacts are managed as `People` associated with `Companies` and `Opportunities`).*

### A. Person Object Fields

| Field in Twenty | Type | Description |
| --- | --- | --- |
| `name.firstName` | Text | Lead's first name |
| `name.lastName` | Text | Lead's last name |
| `emails.primaryEmail` | Email | Unique identifier for deduplication/upsert |
| `phones.primaryPhone` | Text | Primary contact number |
| `jobTitle` | Text | Professional title (e.g. CTO, VP) |
| `city` | Text | Location / Country |
| `companyId` | Relation | Linked Company record ID |
| *Custom fields (optional):* | | `leadflowLeadId`, `leadScore`, `leadPriority`, `leadStatus`, `leadSource`, `aiCategory`, `aiSummary`, `recommendedAction`, `automationStatus` |

### B. Company Object Fields

| Field in Twenty | Type | Description |
| --- | --- | --- |
| `name` | Text | Company name (primary identifier) |
| `domainName` | Text | Clean domain (e.g. `abctechnologies.com`) |
| `employees` | Number | Approximate team size |
| `address.addressCountry` | Text | Country |
| `industry` | Text | Industry category |
| `website` | URL | Full company website URL |

### C. Opportunity Object Fields

| Field in Twenty | Type | Description |
| --- | --- | --- |
| `name` | Text | Opportunity title (e.g. `"Acme Corp — Inbound Deal"`) |
| `amount.amountMicros` | Number | Budget in micros: `value * 1,000,000` |
| `amount.currencyCode` | Text | `"USD"` |
| `stage` | Select | Stage based on priority: `"DISCOVERY"` (HIGH) or `"NEW"`/`"QUALIFIED"` (MEDIUM) |
| `closeDate` | Date | Expected closing date |
| `companyId` | Relation | Linked Company ID |
| `pointOfContactId` | Relation | Linked Person ID |

### D. Task Object Fields

| Field in Twenty | Type | Description |
| --- | --- | --- |
| `title` | Text | Actionable task summary |
| `body` | Text | Task details, AI summary, and recommendations |
| `status` | Select | `"TODO"` |
| `dueAt` | Date/Time | Deadline (24 hours for HIGH, 48 hours for MEDIUM, 5 days for LOW) |
| `targetableId` | Relation | ID of the Person or Opportunity |

---

## 3. Creating the Twenty CRM Workflow

### Step 1: Create a New Workflow in Twenty

1. Open your Twenty CRM dashboard.
2. In the left navigation menu, click **Workflows** (`/objects/workflows`).
3. Click **+ New Workflow**.
4. Name the workflow: `LeadFlow AI — CRM Ingestion & Opportunity Routing`.

### Step 2: Configure Webhook Trigger

1. In the workflow builder, select **Webhook Trigger** as the start node.
2. Twenty will generate a unique Webhook URL (e.g. `https://api.twenty.com/workflows/hooks/...`).
3. Copy this URL and save it into your LeadFlow AI `.env` file:

   ```env
   TWENTY_WORKFLOW_WEBHOOK_URL=https://api.twenty.com/workflows/hooks/...
   ```

### Step 3: Upsert Person

1. Add an action node: **Upsert Record** (or **Search / Create Record**).
2. **Object:** `Person`.
3. **Match By:** `emails.primaryEmail` equals `{{trigger.lead.email}}`.
4. **Fields to Set / Update:**
   - First Name: `{{trigger.lead.firstName}}`
   - Last Name: `{{trigger.lead.lastName}}`
   - Primary Email: `{{trigger.lead.email}}`
   - Primary Phone: `{{trigger.lead.phone}}`
   - Job Title: `{{trigger.lead.jobTitle}}`

### Step 4: Upsert Company

1. Add an action node: **Upsert Record**.
2. **Object:** `Company`.
3. **Match By:** `name` equals `{{trigger.lead.company}}`.
4. **Fields to Set / Update:**
   - Name: `{{trigger.lead.company}}`
   - Industry: `{{trigger.lead.industry}}`
5. Link Person to Company: Set `companyId` on the Person record to the Upserted Company's ID.

### Step 5: Conditional Branching & Opportunity Logic

Add a **Branch / Filter** node based on `{{trigger.qualification.priority}}`:

- **Branch A (Priority == "HIGH"):**
  1. **Create Opportunity:**
     - Name: `{{trigger.lead.company}} — Enterprise Deal`
     - Amount (Micros): `{{trigger.lead.budget}}` * 1000000
     - Stage: `DISCOVERY`
     - Company: Upserted Company ID
     - Point of Contact: Upserted Person ID
  2. **Create Task:**
     - Title: `Urgent Follow-Up: {{trigger.lead.firstName}} {{trigger.lead.lastName}}`
     - Body: `Requirement: {{trigger.lead.requirement}}\nRecommended Action: {{trigger.qualification.recommendedAction}}`
     - Status: `TODO`
     - Due Date: `+24 hours`

- **Branch B (Priority == "MEDIUM"):**
  1. **Create Opportunity:**
     - Name: `{{trigger.lead.company}} — Sales Deal`
     - Amount (Micros): `{{trigger.lead.budget}}` * 1000000
     - Stage: `QUALIFIED`
     - Company: Upserted Company ID
     - Point of Contact: Upserted Person ID
  2. **Create Task:**
     - Title: `Follow up with {{trigger.lead.firstName}} {{trigger.lead.lastName}}`
     - Status: `TODO`
     - Due Date: `+48 hours`

- **Branch C (Priority == "LOW"):**
  1. *Skip Opportunity creation* (keeps CRM pipeline focused on qualified pipeline).
  2. **Create Task:**
     - Title: `Nurture Check: {{trigger.lead.firstName}} {{trigger.lead.lastName}}`
     - Status: `TODO`
     - Due Date: `+5 days`

### Step 6: HTTP Request Callback to LeadFlow AI

1. Add a final **HTTP Request** action node at the end of each branch (or unified after):
2. **Method:** `POST`
3. **URL:** `https://<YOUR_APP_DOMAIN>/api/webhooks/twenty/status`
4. **Headers:**
   - `Content-Type: application/json`
   - `x-webhook-secret: <YOUR_WEBHOOK_SECRET>`
5. **Request Body:**

   ```json
   {
     "event": "crm.automation.completed",
     "eventId": "{{trigger.eventId}}",
     "leadId": "{{trigger.lead.id}}",
     "status": "SUCCESS",
     "personId": "{{step_person.id}}",
     "companyId": "{{step_company.id}}",
     "opportunityId": "{{step_opp.id}}",
     "taskId": "{{step_task.id}}",
     "timestamp": "{{$isoTimestamp}}"
   }
   ```

---

## 4. Testing & Verification

### Step 1: Test Connection in LeadFlow AI

1. Navigate to **Integrations** (`/integrations`).
2. Locate the **Twenty CRM** card.
3. Click **Test Connection**. A verified status confirms that the REST API and token credentials are functional.

### Step 2: End-to-End Test Payload

Submit a test lead via the LeadFlow AI UI at `/leads` or send a POST request to `/api/leads`:

```json
{
  "firstName": "Elena",
  "lastName": "Rostova",
  "email": "elena.rostova@acme.com",
  "company": "Acme Technologies",
  "jobTitle": "VP of Architecture",
  "requirement": "Enterprise CRM and sales automation platform",
  "budget": 120000,
  "timeline": "30 days",
  "industry": "Technology",
  "source": "website"
}
```

### Step 3: Verify Records in Twenty CRM

1. Go to **People**: Verify `Elena Rostova` is created or updated.
2. Go to **Companies**: Verify `Acme Technologies` is created or updated.
3. Go to **Opportunities**: Verify an Opportunity in the `DISCOVERY` stage is linked to Acme Technologies.
4. Go to **Tasks**: Verify a task is scheduled due within 24 hours.

### Step 4: Verify Callback in LeadFlow AI

1. Open the lead detail page in LeadFlow AI at `/leads/<leadId>`.
2. Check the **Automation Timeline**:
   - `Lead Created` -> `AI Qualified` -> `Twenty CRM Sync Started` -> `Twenty CRM Sync Completed` -> `Opportunity Created` -> `Task Created`.
3. Check the **Twenty Person ID**, **Company ID**, **Opportunity ID**, and **Task ID** badges.

---

## 5. Activating the Workflow

1. In the Twenty CRM workflow editor, toggle the workflow status from **Draft** to **Active**.
2. All subsequent qualified leads from LeadFlow AI will automatically flow into Twenty CRM in real time without human intervention!
