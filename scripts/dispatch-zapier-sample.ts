import path from "node:path";
import fs from "node:fs";

// Automatically load .env.local or .env
for (const filename of [".env.local", ".env"]) {
  const filePath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

import { mapLeadToCanonicalEvent } from "../lib/integrations/zapier/mapper";

async function main() {
  const webhookUrl = process.env.ZAPIER_LEAD_WEBHOOK_URL || "https://hooks.zapier.com/hooks/catch/28949066/4mybl5w/";
  console.log(`\nDispatching complete canonical test record to Zapier Catch Hook:\n${webhookUrl}\n`);

  const priorities = [
    {
      priority: "HIGH" as const,
      firstName: "Alexander",
      lastName: "Wright",
      company: "Enterprise Corp",
      email: "leadflowai.notifier@gmail.com",
      budget: 750000,
      score: 94,
    },
    {
      priority: "MEDIUM" as const,
      firstName: "Priya",
      lastName: "Sharma",
      company: "Apex Tech Labs",
      email: "leadflowai.notifier@gmail.com",
      budget: 250000,
      score: 72,
    },
    {
      priority: "LOW" as const,
      firstName: "Rahul",
      lastName: "Verma",
      company: "Verma Digital",
      email: "leadflowai.notifier@gmail.com",
      budget: 45000,
      score: 48,
    },
  ];

  for (const item of priorities) {
    const mockLead = {
      _id: `67450a1b2c3d4e5f6071829${item.priority === "HIGH" ? "a" : item.priority === "MEDIUM" ? "b" : "c"}`,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      phone: "+91 98765 43210",
      company: item.company,
      jobTitle: "Decision Maker",
      requirement: `Seeking LeadFlow AI qualification & automation for ${item.company}.`,
      budget: item.budget,
      priority: item.priority,
      aiScore: item.score,
      aiCategory: "Enterprise Automation",
      aiSummary: `${item.priority} intent buyer seeking sales pipeline automation.`,
      aiRecommendedAction: item.priority === "HIGH" ? "Schedule architecture call within 2 hours." : item.priority === "MEDIUM" ? "Send detailed demo recording and follow up in 24 hours." : "Add to automated nurture campaign.",
      aiSignals: ["Valid contact", "Budget confirmed"],
      timeline: "1-3 months",
      industry: "Technology",
      source: "website",
      status: "QUALIFIED" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const payload = mapLeadToCanonicalEvent(mockLead as any, {
      developerEmail: process.env.SALES_NOTIFICATION_EMAIL || "leadflow.ai.notifier@gmail.com",
    });

    console.log(`\nDispatching [${item.priority}] test record (${item.firstName} - ${item.company})...`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.text();
    console.log(`Status: ${response.status} -> ${result}`);
  }

  console.log("\nAll 3 priority sample records (HIGH, MEDIUM, LOW) dispatched successfully!");
}

main().catch((err) => {
  console.error("Error dispatching Zapier sample:", err);
  process.exit(1);
});
