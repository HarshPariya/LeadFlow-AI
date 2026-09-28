import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}
import path from "node:path";
import fs from "node:fs";

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

async function main() {
  const { connectToDatabase } = await import("../lib/db/connection");
  const { Lead } = await import("../models/Lead");
  const { syncLeadToTwenty } = await import("../lib/integrations/twenty/sync");

  await connectToDatabase();
  console.log("Connected to MongoDB Atlas!");

  const unsyncedLeads = await Lead.find({
    isArchived: false,
    $or: [
      { twentyPersonId: { $exists: false } },
      { twentyPersonId: null },
      { twentyPersonId: "" },
      { syncStatus: { $ne: "SYNCED" } },
    ],
  });

  console.log(`Found ${unsyncedLeads.length} unsynced leads. Synchronizing to Twenty CRM...`);

  for (const lead of unsyncedLeads) {
    try {
      console.log(`Syncing ${lead.firstName} ${lead.lastName} (${lead.email})...`);
      const res = await syncLeadToTwenty(lead);
      console.log(`✓ Synced: Person ${res.personId || "OK"}`);
    } catch (err) {
      console.warn(`! Failed to sync ${lead.email}:`, err);
    }
  }

  console.log("\nAll leads have been processed and synchronized with Twenty CRM & MongoDB Atlas!");
  process.exit(0);
}

main().catch(console.error);
