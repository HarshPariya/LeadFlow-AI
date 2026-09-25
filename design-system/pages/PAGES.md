# LeadFlow AI — Page Design System Specifications

## 1. Landing Page (`/`)

- **Hero**: Clean typographic statement with warm beige badge `AI-Powered CRM Automation`. High-contrast CTA buttons: `Start Building` (Primary Bronze) and `View Workflow` (Secondary Outline).
- **Interactive Visual**: SVG/CSS Flow diagram showing `LeadFlow API` -> `MongoDB` -> `Groq AI` -> `Zapier` & `Twenty CRM` -> `Gmail Notifications`.
- **Feature Cards**: 3-column grid with subtle 1px border `#ECE7DE`, warm hover elevation, Lucide icons in bronze container.
- **Metrics Section**: 4-column counter with label and description.

## 2. Dashboard (`/dashboard`)

- **Header**: Live greeting, date, and `Simulated / Live Mode` indicator pill.
- **KPI Metrics Grid**: 10 production cards (Total Leads, New Leads, Qualified Leads, High Priority, Medium Priority, Low Priority, Open Opportunities, Pending Tasks, Automation Runs, Automation Success Rate).
- **Charts Row**:
  - Lead Volume over time (SVG Bar/Area chart)
  - Lead Priority Distribution (Radial/Segment breakdown)
  - Pipeline Value by Stage
  - Lead Sources Breakdown
- **Activity & Recent Leads**: Dual-column layout showing the latest automated leads and audit events.

## 3. Leads Management (`/leads` & `/leads/[id]`)

- **Filter Bar**: Search by text, Status dropdown, Priority filter, Score slider/threshold, Date range, and Clear filters button.
- **Action Bar**: "New Lead" primary button, "Demo Lead" secondary button (one-click instant test), "Export" button.
- **Data Table**: Checkbox, Lead Name + avatar initial, Email, Company, Status badge, Priority badge, AI Score ring/pill (0-100), Automation status, Action menu.
- **Detail View (`/leads/[id]`)**:
  - Left 70%: Tabs (Overview, Contact & Details, AI Insights, Opportunities, Tasks, Activity Timeline).
  - Right 30% Sticky Context Panel: Lead Score ring, Priority indicator, Owner, Twenty Sync status with "Sync Now" button, Zapier Automation status with targeted retry controls (Retry Zapier, Retry Twenty, Retry AI, Retry Full Automation).

## 4. Companies (`/companies` & `/companies/[id]`)

- List of companies with industry tags, company size, associated contacts count, active deals count, and Twenty CRM sync link.

## 5. Opportunities (`/opportunities`)

- Dual-view toggle: **Kanban Board** & **Table View**.
- Stages: `NEW`, `QUALIFIED`, `DISCOVERY`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`.
- Kanban cards display Deal Name, Company, Value in USD ($), Stage probability %, and Assignee avatar.

## 6. Tasks (`/tasks`)

- Segmented views: `All`, `Overdue`, `Today`, `Upcoming`, `Completed`.
- Checkbox toggle for instant completion with strike-through animation and activity log generation.

## 7. Automations (`/automations`)

- 7 core platform automations:
  1. Lead Qualification (Groq AI)
  2. CRM Synchronization (Twenty CRM)
  3. High Priority Routing (Zapier Path A)
  4. Medium Priority Routing (Zapier Path B)
  5. Low Priority Nurture (Zapier Path C)
  6. Customer Email (Gmail)
  7. CRM Task Creation (Twenty Tasks)
- Execution stats: Runs, Success Rate %, Average Duration (ms).
- Visual Timeline drawer showing step-by-step audit runs with collapsible payload inspection.

## 8. Integrations (`/integrations`)

- Grid of 5 service cards: MongoDB, Groq AI, Twenty CRM, Zapier, Gmail.
- Status badges: `CONNECTED` (Green), `CONFIGURED` (Blue), `SIMULATED / MOCK` (Amber), `NOT CONFIGURED` (Muted Gray).
- "Test Connection" button on each card triggering real or mock validation with latency check.

## 9. Activity Log (`/activity`)

- Chronological timeline with filterable event types: `LEAD_CREATED`, `AI_QUALIFICATION_COMPLETED`, `ZAPIER_TRIGGERED`, `ZAPIER_PATH_HIGH`, `ZAPIER_PATH_MEDIUM`, `ZAPIER_PATH_LOW`, `GMAIL_SENT`, `TWENTY_SYNC_STARTED`, `TWENTY_SYNC_COMPLETED`, `OPPORTUNITY_CREATED`, `TASK_CREATED`.
