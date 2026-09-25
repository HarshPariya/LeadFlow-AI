# LeadFlow AI — Testing Guide

LeadFlow AI utilizes **Vitest** for fast unit and integration testing.

---

## 1. Running Tests Locally

### Run All Unit & Integration Tests

```bash
npm run test
```

### Run Tests in Watch Mode (Interactive)

```bash
npm run test:watch
```

### Typecheck Project Without Emitting Files

```bash
npm run typecheck
```

---

## 2. Test Suites Overview

### A. Deterministic Scoring (`tests/unit/scoring.test.ts`)

Validates that our scoring engine correctly computes weighted factors:

- Commercial Budget (0 - 100)
- Requirement Clarity & High-Intent Keywords (0 - 100)
- Urgency / Timeline Indicators (0 - 100)
- Seniority & Decision Maker Role (0 - 100)
- Source Confidence

### B. Validation Schemas (`tests/unit/validation.test.ts`)

Ensures strict Zod validation for:

- Inbound prospect form payloads (`leadCreateSchema`)
- AI structured qualification contracts (`aiQualificationSchema`)
- Webhook callback schemas (`zapierStatusWebhookSchema`)

### C. Twenty CRM Mappings (`tests/unit/twenty-mapper.test.ts`)

Tests bidirectional data mappings:

- Lead -> Twenty Person (`name.firstName`, `emails.primaryEmail`, `companyId`)
- Company -> Twenty Company (`domainName`, employee brackets)
- Opportunity -> Twenty Opportunity (USD conversion to micros)
- Task -> Twenty Task (status normalizations)
