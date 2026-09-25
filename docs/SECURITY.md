# LeadFlow AI — Security Architecture & Guidelines

LeadFlow AI is engineered according to enterprise-grade B2B security practices, ensuring that customer prospect data, CRM keys, and automated workflow triggers remain strictly confidential and protected.

---

## 1. Secrets & Credentials Isolation

* **Server-Only Secrets:** Critical variables (`GROQ_API_KEY`, `TWENTY_API_KEY`, `AUTH_SECRET`, `ZAPIER_LEAD_WEBHOOK_URL`, `TWENTY_WORKFLOW_WEBHOOK_URL`, `WEBHOOK_SECRET`, `INTEGRATION_ENCRYPTION_KEY`) are only accessible in server-side Next.js route handlers and server runtime contexts.
* **No Client Leakage:** No private keys or webhook URLs are prefixed with `NEXT_PUBLIC_`, ensuring they are never bundled into client JavaScript.
* **Redacted Logging:** The centralized logger (`lib/logging/index.ts`) automatically sanitizes any payload key containing `password`, `token`, `secret`, `authorization`, `groq_api_key`, `twenty_api_key`, or `api_key` with `[REDACTED]`.

---

## 2. Authentication & Session Security

* **Password Encryption:** Passwords are hashed using `bcryptjs` with 12 computational rounds. Plaintext passwords are never saved.
* **JWT Session Cookies:** Authenticated sessions use signed JSON Web Tokens stored in HTTP-Only, `SameSite=Lax` cookies with `Secure` flags enforced in production.
* **Route Protection:** Next.js middleware guards all operational pages (`/dashboard`, `/leads`, `/companies`, `/opportunities`, `/tasks`, `/automations`, `/activity`, `/integrations`, `/settings`). Unauthenticated requests are immediately redirected to `/login?redirect=...`.

---

## 3. Webhook Hardening & Idempotency

* **Shared Secret Validation:** Inbound callbacks to `POST /api/webhooks/twenty/status` and `POST /api/webhooks/zapier/status` must present a matching secret via the `x-webhook-secret` header or `Authorization: Bearer <token>`.
* **Replay Attack Prevention:** Every inbound event must include a unique `eventId`. The platform registers each `eventId` in the `ProcessedWebhookEvent` collection.
* **Duplicate Detection:** Duplicate events are acknowledged with HTTP 200 `IGNORED_DUPLICATE` to ensure external services do not cause double opportunity or task creations.

---

## 4. Rate Limiting

Public authentication and submission endpoints are shielded with sliding-window rate limiters:

* Login: 15 attempts / minute / IP
* Register: 10 attempts / minute / IP
* Inbound Lead Ingestion: 30 submissions / minute / IP
Requests exceeding thresholds receive standard HTTP 429 `RATE_LIMITED` responses with retry headers.
