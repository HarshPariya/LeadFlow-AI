# LeadFlow AI — Production Deployment Guide

This guide covers deploying LeadFlow AI to **Vercel** (Frontend / Serverless Full-Stack) and **Render** (Node / Docker Backend Service), paired with **MongoDB Atlas**, **Groq Cloud**, **Twenty CRM**, and **Zapier**.

---

## 1. Prerequisites Checklist

- [ ] A GitHub repository containing the LeadFlow AI codebase.
- [ ] A MongoDB Atlas cluster connection string (`mongodb+srv://...`).
- [ ] A Groq Cloud API key from [https://console.groq.com/keys](https://console.groq.com/keys).
- [ ] A Twenty CRM instance (Cloud at [https://twenty.com](https://twenty.com) or self-hosted) with a Workflow Webhook URL.
- [ ] A Zapier account with a Catch Hook Webhook URL.
- [ ] A designated sales notification email for urgent alerts.

---

## 2. Deploying to Vercel (Recommended Full-Stack Next.js)

1. **Import Repository:**
   - Log into [Vercel](https://vercel.com) and click **Add New > Project**.
   - Select your `LeadFlow AI` repository.

2. **Configure Environment Variables:**
   Add the following variables in the Vercel project settings:

   ```env
   NODE_ENV=production
   INTEGRATION_MODE=live
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/leadflow-ai?retryWrites=true&w=majority
   AUTH_SECRET=<generate-with-openssl-rand-base64-32>
   GROQ_API_KEY=gsk_...
   GROQ_MODEL=llama-3.3-70b-versatile
   ZAPIER_LEAD_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
   TWENTY_WORKFLOW_WEBHOOK_URL=https://api.twenty.com/workflows/hooks/...
   TWENTY_API_URL=https://api.twenty.com
   TWENTY_API_KEY=twenty_api_...
   GMAIL_ENABLED=true
   SALES_NOTIFICATION_EMAIL=sales@yourcompany.com
   WEBHOOK_SECRET=<random-secret-token>
   INTEGRATION_ENCRYPTION_KEY=<32-char-random-key>
   ```

3. **Deploy:** Click **Deploy**. Vercel will build the Next.js App Router application and output your live production URL (e.g. `https://leadflow-ai.vercel.app`).

---

## 3. Deploying to Render (Backend Web Service / Docker)

1. **Create Web Service on Render:**
   - Go to [dashboard.render.com](https://dashboard.render.com) and click **New > Web Service**.
   - Connect your GitHub repository.

2. **Select Runtime:**
   - **Option A (Node Runtime):**
     - Build Command: `npm install && npm run build`
     - Start Command: `npm run start`
   - **Option B (Docker Runtime):**
     - Render will automatically detect the provided `Dockerfile`.

3. **Set Environment Variables:**
   - Enter all variables from `.env.example` in the **Environment** tab.
   - Set `NEXT_PUBLIC_APP_URL` to your Render service URL (e.g. `https://leadflow-ai.onrender.com`).

4. **Blueprint (Optional):** You can also use the included `render.yaml` file by choosing **New > Blueprint**.

---

## 4. Production Webhook Configuration

> [!IMPORTANT]
> Never use `http://localhost:3000` for live Zapier or external CRM webhooks. External servers cannot resolve your local machine.

In Twenty CRM and Zapier, configure your webhook callback endpoints:

### Twenty CRM Workflow HTTP Callback

- **URL:** `https://your-production-domain.com/api/webhooks/twenty/status`
- **Header:** `x-webhook-secret: <YOUR_WEBHOOK_SECRET>`

### Zapier Status Callback (Optional)

- **URL:** `https://your-production-domain.com/api/webhooks/zapier/status`
- **Header:** `Authorization: Bearer <YOUR_WEBHOOK_SECRET>`
